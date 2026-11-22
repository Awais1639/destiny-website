#!/usr/bin/env bash
# Checks the live website: pages load, HTTPS is forced, security headers are present, private files are blocked.
set -u
fail=0
check() { code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$1"); echo "$code $1"; [[ "$code" =~ ^($2)$ ]] || { echo "::error::Expected $2 for $1, got $code"; fail=1; }; }
check https://destinyglobals.com/ 200
check https://destinyglobals.com/scholarships/ 200
check https://destinyglobals.com/tools/visa-money/ 200
check https://destinyglobals.com/sitemap-index.xml 200
check https://destinyglobals.com/robots.txt 200
check https://destinyglobals.com/llms.txt 200
check https://destinyglobals.com/.well-known/security.txt 200
check https://destinyglobals.com/.deploy-state-site.json "403|404"
check https://destinyglobals.com/wp-login.php 410
check http://destinyglobals.com/ 301
check https://www.destinyglobals.com/ 301
h=$(curl -sI --max-time 30 https://destinyglobals.com/)
echo "$h"
for name in content-security-policy strict-transport-security x-content-type-options x-frame-options referrer-policy; do
  echo "$h" | grep -qi "^$name:" || { echo "::error::Missing header $name"; fail=1; }
done
# Every inline script in the live pages must be allowed by the CSP (catches scripts injected by the host or a stale policy)
for path in / /scholarships/ /tools/planner/ /universities/italy/; do
  curl -s --max-time 30 -D /tmp/h.txt -o /tmp/p.html "https://destinyglobals.com$path"
  python3 - "$path" <<'PY' || fail=1
import re,hashlib,base64,sys
h=open('/tmp/h.txt').read().lower(); html=open('/tmp/p.html',encoding='utf8').read()
csp=re.search(r'content-security-policy: (.*)',h); csp=csp.group(1) if csp else ''
bad=[b[:60] for a,b in re.findall(r'<script([^>]*)>(.*?)</script>',html,re.S) if 'src=' not in a and 'json' not in a and "'sha256-"+base64.b64encode(hashlib.sha256(b.encode()).digest()).decode().lower()+"'" not in csp]
print(sys.argv[1],'inline scripts not allowed by CSP:',len(bad))
if bad: print('::error::',bad); sys.exit(1)
PY
done
echo "search subdomain: $(curl -s -o /dev/null -w '%{http_code}' --max-time 30 https://search.destinyglobals.com/)"
# Tell Bing, Yandex, Seznam and other IndexNow search engines about the main pages (free; Bing also powers several AI assistants).
if [ "$fail" = 0 ] && [ "${INDEXNOW:-0}" = 1 ]; then
  KEY=$(ls public/*.txt | xargs -n1 basename | grep -E '^[0-9a-f]{32}\.txt$' | head -1 | sed 's/\.txt$//')
  urls=$(curl -s --max-time 30 https://destinyglobals.com/sitemap-0.xml | grep -o '<loc>[^<]*</loc>' | sed 's#</\?loc>##g' | grep -v '/universities/' | head -9000)
  n=$(echo "$urls" | grep -c .)
  json=$(printf '%s\n' "$urls" | python3 -c 'import sys,json;u=[l.strip() for l in sys.stdin if l.strip()];print(json.dumps({"host":"destinyglobals.com","key":sys.argv[1],"keyLocation":"https://destinyglobals.com/"+sys.argv[1]+".txt","urlList":u}))' "$KEY")
  echo "IndexNow key file: $(curl -s --max-time 30 -w ' (HTTP %{http_code}, %{content_type})' "https://destinyglobals.com/$KEY.txt")"
  for api in https://api.indexnow.org/indexnow; do
    code=$(curl -s -o /tmp/in.txt -w '%{http_code}' --max-time 60 -H 'Content-Type: application/json; charset=utf-8' -d "$json" "$api")
    echo "IndexNow ($api): submitted $n URLs, response $code $(head -c 300 /tmp/in.txt)"
  done
fi
exit $fail
