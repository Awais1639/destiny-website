# Live university lookup (Cloudflare Worker)

Powers "Check live on the official website" in the Ask Destiny assistant.

1. Works out which university a question is about from `src/universities.json` — about 12,000 universities and their
   official websites (our own directory + the MIT-licensed Hipo university-domains-list). **Only these websites are
   ever read**, so the service cannot be used as an open proxy.
2. Reads up to 4 pages of that university's website (robots.txt respected, user agent
   `DestinyGlobalAssistant/1.0`), choosing links about fees, admission, English requirements and programmes.
3. A free Workers AI model answers only from those pages, with the page links. Answers are cached for 3 days (KV).
4. Limits: 10 questions per minute per visitor; Cloudflare's free 10,000 neurons a day (roughly 100+ answers).
   When the daily allowance is used up, visitors get the official links instead.

Deploy: `.github/workflows/worker.yml` (needs the `CLOUDFLARE_API_TOKEN` repository secret).
Then set `assistantApi` in `src/config/site.ts` to `https://destiny-ask.destinyglobalsolution.workers.dev`.

Optional: a free Tavily key (1,000 searches a month) helps find the exact page — add it as a Worker secret
`TAVILY_API_KEY` (Cloudflare dashboard → Workers → destiny-ask → Settings → Variables and secrets).

Local test: `npx wrangler dev -c wrangler.test.toml --local` (uses a fake AI and a local test site).
Update the university list: `node scripts/build-worker-universities.mjs`.
