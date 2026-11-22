#!/usr/bin/env bash
# Checks the live website: pages load, HTTPS is forced, security headers are present, private files are blocked.
set -u
fail=0
check() { code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$1"); echo "$code $1"; [ "$code" = "$2" ] || { echo "::error::Expected $2 for $1, got $code"; fail=1; }; }
check https://destinyglobals.com/ 200
check https://destinyglobals.com/scholarships/ 200
check https://destinyglobals.com/tools/visa-money/ 200
check https://destinyglobals.com/sitemap-index.xml 200
check https://destinyglobals.com/robots.txt 200
check https://destinyglobals.com/llms.txt 200
check https://destinyglobals.com/.well-known/security.txt 200
check https://destinyglobals.com/.deploy-state-site.json 403
check https://destinyglobals.com/wp-login.php 410
check http://destinyglobals.com/ 301
check https://www.destinyglobals.com/ 301
h=$(curl -sI --max-time 30 https://destinyglobals.com/)
echo "$h"
for name in content-security-policy strict-transport-security x-content-type-options x-frame-options referrer-policy; do
  echo "$h" | grep -qi "^$name:" || { echo "::error::Missing header $name"; fail=1; }
done
echo "search subdomain: $(curl -s -o /dev/null -w '%{http_code}' --max-time 30 https://search.destinyglobals.com/)"
# Tell Bing, Yandex, Seznam and other IndexNow search engines about the main pages (free; Bing also powers several AI assistants).
if [ "$fail" = 0 ] && [ "${INDEXNOW:-0}" = 1 ]; then
  KEY=$(ls public/*.txt | xargs -n1 basename | grep -E '^[0-9a-f]{32}\.txt$' | head -1 | sed 's/\.txt$//')
  urls=$(curl -s --max-time 30 https://destinyglobals.com/sitemap-0.xml | grep -o '<loc>[^<]*</loc>' | sed 's#</\?loc>##g' | grep -v '/universities/' | head -9000)
  n=$(echo "$urls" | grep -c .)
  json=$(printf '%s\n' "$urls" | python3 -c 'import sys,json;u=[l.strip() for l in sys.stdin if l.strip()];print(json.dumps({"host":"destinyglobals.com","key":sys.argv[1],"keyLocation":"https://destinyglobals.com/"+sys.argv[1]+".txt","urlList":u}))' "$KEY")
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 -H 'Content-Type: application/json; charset=utf-8' -d "$json" https://api.indexnow.org/indexnow)
  echo "IndexNow: submitted $n URLs, response $code"
fi
exit $fail
