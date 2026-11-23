# Weekly check — runbook for the checking agent

> The daily blog (Monday–Saturday, live by 14:00 Italian time) has its own, separate runbook:
> `.claude/agents/blog-writer.md`. Posts live in `src/blog/*.md` and are checked by `scripts/validate-blog.mjs`.

This file tells the weekly agent (a scheduled Claude task that runs every Monday) exactly how to check
everything on destinyglobals.com — scholarships, Italian regional grants, Erasmus Mundus intakes, country
admission rules for 22 countries (17 European + UK, USA, Canada, Australia, New Zealand), Italian university admission rules, programme details from
official national databases, and university links — against the **official** websites, and publish the
corrections.
Pushing to `main` publishes the site automatically (see `.github/workflows/deploy.yml`).

## Ground rules (never break these)

1. **Official sources only.** Use the provider's own website, application portal or official PDF
   (government, university, scholarship body, EU/EACEA). Never use blogs, aggregators or news sites as a
   source. If you only find information on a third-party site, treat it as "not confirmed".
2. **Never invent or guess.** No dates, amounts, URLs or eligibility rules that the official page does not
   state. If something is missing, use `null` (the site shows "Not specified by the official source").
3. **Never assume a previous year's deadline applies.** A new cycle is "confirmed" only when the official
   page publishes the new call or dates.
4. **When in doubt, change nothing** and list the item under "Needs a human" in the report.
5. **If a site cannot be reached** (blocked, down, timeout), keep the existing values, do not update
   `lastChecked`, and list it in the report.
6. Do not delete scholarships. Do not change page design or code. Only edit the data files below.

## Step by step

1. `npm ci`
2. `node scripts/weekly-checklist.mjs` — writes `scripts/data/weekly-checklist.json`: every item with its
   official URLs and the values currently on the site. Item kinds:
   `scholarship` (all), `italy-regional` (all), `erasmus-update` (all), `europe-country-rules` (all 22
   countries), `italy-university` (all Italian universities with details), `italy-university-missing`
   (Italian universities with no details yet), `programme` (the 60 least recently checked of ~3,800
   programmes) and `institution-links` (a rotating slice of 60 of ~1,400 directory universities).
   The programme and institution slices change every week, so everything is covered over time.

   **Order of work (a run may not finish everything — do the most important first):**
   1. Scholarships whose deadline is within 60 days, or whose cycle is `unconfirmed` (new calls appear).
   2. All other scholarships, Italian regional agencies and Erasmus updates.
   3. `europe-country-rules` and `italy-university` items with a date in the past or a "past cycle" label
      (look for the new 2027/28 call), then the rest of them.
   4. `programme` items, then `italy-university-missing`, then `institution-links`.
   Anything you could not reach this week goes in the report under "Not checked this week"; because the
   checklist puts the least recently checked first, it is picked up next Monday.
3. **Erasmus Mundus catalogue:** run `node scripts/sync-erasmus.mjs`. If it fails (network blocked or the
   EU page changed), skip it and note it in the report — the script never damages existing data.
4. For **each item** in the checklist, open the official URL(s) with WebFetch (or WebSearch restricted to
   the official domain to find the current call page) and compare:
   - Is a new cycle/call published? Opening date? Deadline? Is the application currently open?
   - Did the official page change funding amounts, eligibility or the application/portal URL?
5. Update the data file for that item:

   **`src/data/scholarships.json`** (one record per scholarship)
   - `dates.cycle` (e.g. "2027/28"), `dates.cycleConfirmed` (true only if the official page confirms
     the cycle), `dates.opens`, `dates.deadline` (YYYY-MM-DD), `dates.deadlineNote` (time zone, country-
     specific deadlines, "applications close at 12:00 CET", etc.).
   - `statusOverride`:
     - `null` → the site computes Open / Closing soon / Closed / Upcoming automatically from `opens`
       and `deadline`. **Use this whenever an exact official deadline is known.**
     - `"unconfirmed"` → next cycle not announced yet.
     - `"varies"` → deadlines differ by country/university/embassy and there is no single date.
     - `"closed"` → officially closed/suspended with no new date.
   - When a deadline has passed and the official site shows a new cycle, move to the new cycle (new
     dates, `cycleConfirmed: true`). If the new cycle is not announced, set `cycle` to the next cycle,
     `cycleConfirmed: false`, `opens`/`deadline: null`, `statusOverride: "unconfirmed"`, and put the
     previous deadline in `deadlineNote` ("The 2026/27 deadline was 1 March 2026; the 2027/28 call has not
     been announced.").
   - Update `coverage`, `eligibility`, `urls.application`, `urls.info` only if the official page changed.
   - Set `verification.lastChecked` to today's date (YYYY-MM-DD) **only for records you actually checked**
     on the official source. Keep `verification.level` honest (`official` only if every key fact is from
     the official page).

   **`src/data/italy-regional.json`** (Italian regional DSU grants)
   - Each agency has `deadlines` (`{label, date, time, note, apply}`; `apply: true` for application
     deadlines, `false` for documents/lease/housing), `limits`, `amounts`, `international`, `links`,
     `sources`, `checked`.
   - When a new academic-year call (e.g. 2027/28) is published, replace the deadlines with the new ones,
     update `academicYear` at the top of the file once most agencies have published, and set `checked`.

   **`src/data/erasmus-updates.json`** — verified intake dates for individual Erasmus Mundus programmes
   (read `_readme` in the file). Add/update entries only from the programme's own website.

   **`src/data/universities-europe.json`** — university directory for 22 countries (country rules +
   institution lists). Check each country's `rules.deadlines` against its official portal (listed in `sources`); when a new
   application round is published, replace past dates with the new ones and set the country's `checked` date.
   Never add an ownership label, fee or score that the official source does not state.

   **`src/data/italy-updates.json` → `universities`** (key = Italian university slug, as in
   `/universities/italy/<slug>/`) — admission rules from the university's OWN international admissions
   page: `admissionsUrl`, `applicationFee`, `tuition`, `englishRequirement`, `deadlines`
   (`{label, date}` or `{label, text}`), `notes`, `sourceUrl`, `verifiedOn`.
   - When the university publishes the 2027/28 (or later) call, replace the old-cycle deadlines with the
     new ones and drop "(past cycle)" labels. Label every deadline with its academic year.
   - Keep past-cycle dates only while no new call exists, labelled "(past cycle)".
   - For `italy-university-missing` items: search the university's own domain for its international /
     degree-seeking admissions page; add a record only from that official page.
   - Set `verifiedOn` to today only for records you actually checked. Validate with
     `node scripts/validate-italy.mjs`.

   **`src/data/internships.json`** — internship, traineeship and master’s-thesis programmes (`programmes`)
   and official job/thesis portals (`portals`); read `_readme`. For each programme check the official page
   for the next session/call: update `dates.opens`, `dates.deadline` (YYYY-MM-DD), `dates.deadlineNote`,
   `statusOverride` (null when an exact deadline is known; "varies" for rolling/per-vacancy; "unconfirmed"
   when the next cycle is not announced), `stipend`, eligibility and URLs, then set
   `verification.lastChecked`. You may ADD a new programme only from the organisation’s own official page
   (same fields; validate with `node scripts/validate-internships.mjs`). Never copy individual company job
   adverts — link to the official portal instead.

   **`src/data/phd.json`** — funded PhD programmes, doctoral fellowships and PhD positions (`programmes`)
   and official PhD vacancy portals (`portals`). Same rules as internships.json: for each `phd` item check
   the official page for the next call, update `dates`, `statusOverride`, `funding`, eligibility and URLs,
   and set `verification.lastChecked`. PhD scholarships live in scholarships.json and appear on /phd/
   automatically. Validate with `node scripts/validate-phd.mjs`. Never copy individual vacancy adverts.

   **`src/data/postdoc.json`** — postdoctoral fellowships/programmes (`programmes`) and official postdoc
   vacancy portals (`portals`). Same rules as phd.json; for each `postdoc` item check the official page for
   the next call/cut-off, update `dates`, `statusOverride`, `funding`, eligibility and URLs, and set
   `verification.lastChecked`. Validate with `node scripts/validate-postdoc.mjs`.

   **`src/data/fellowships.json`** — fellowships that are not postdoc jobs (leadership, visiting research,
   institutes for advanced study, journalism, startup). Same rules; each item also has `audience`. For each
   `fellowship` item check the official page for the next call, update `dates`/`statusOverride`, and set
   `verification.lastChecked`. Validate with `node scripts/validate-fellowships.mjs`.

   **Fellowship gap search (every week, after the checklist):** these countries on the site have no
   fellowship yet: Russia, Saudi Arabia, United Arab Emirates, Qatar, Malaysia, Thailand,
   Canada, New Zealand, Ireland, Spain, Portugal, Belgium, Poland, Czech Republic, Croatia, Estonia,
   Latvia, Lithuania, Luxembourg, Malta. Spend a little time each week on two or three of
   them (rotate) looking for funded fellowships open to international (ideally Pakistani) applicants —
   leadership, visiting research, advanced study, journalism or startup — on OFFICIAL pages only
   (government, funder, university, institute). Add any you can verify to fellowships.json following
   the rules above, and remove the country from this list. Not found = no change; note it in the report.
   Already ruled out (do not re-add unless revived): Georg Forster (suspended), German Chancellor
   Fellowship (ended), Banting (replaced by CPRA, see postdoc.json), OWSD Early Career (paused),
   Ireland Government of Ireland Postdoctoral (merged into Research Ireland "Empower"), HCAS-RJ (needs a
   Swedish affiliation).

   **`src/data/conferences.json`** — funded conferences, summits and academic meetings (fully funded places,
   travel grants, fee waivers). Same rules; each item also has `event` (start/end/location), `support` and
   `audience`. `dates.deadline` is the deadline for the FUNDED place or grant. For each `conference` item:
   check the organiser's page; when a grant call opens, set `opens`/`deadline` and `statusOverride: null`;
   when an event has ended, move the entry to the next edition (new dates, title year, slug unchanged) only
   if the organiser has announced it — otherwise set `statusOverride: "closed"`. Validate with
   `node scripts/validate-conferences.mjs`.
   **Conference search (every week):** add 2–3 new events that offer funded places or travel grants and are
   run by an ESTABLISHED organiser (UN agency, international scientific union or society, national
   academy/research council, major university, long-running foundation). Prefer events in countries with no
   conference yet. NEVER list paid-registration-only events, organisers you cannot trace to an established
   body, or anything matching the red flags in the "how-to-spot-fake-conferences" guide. Official pages only.
   **Schengen gap list (priority):** Netherlands, Belgium, Spain, Portugal, Hungary, Czech Republic, Finland,
   Sweden, Norway, Denmark, Lithuania, Luxembourg, Malta, Greece, Slovakia, Romania, Bulgaria, Iceland.
   Also re-check each Monday: Young BSF, Alpbach, Dubrovnik Youth Forum, WFD youth delegation, IAP YPL
   (2027 calls not yet out) and the IAF ESL 2027 deadline (call open, deadline only in the Handbook).
   Ruled out (do not add): Oslo Freedom Forum (no grants), tiered "fully funded" youth summits run by
   private centres (e.g. European Youth Summit Madrid, European Youth Assembly Amsterdam, Youth Diplomatic
   Summit Budapest), GLOBSEC YLF (funding not confirmed on an official page).
   **Asia-Pacific / Gulf / Americas gap list:** Indonesia (needs a country page first — candidates: ASEF
   Asia-Europe Youth Summit on S&T Diplomacy, GYA International Conference of Young Scientists, Yogyakarta
   21–25 June 2027 — add only if the official page confirms funded places), Australia and New Zealand (Crawford
   Fund scholarships are for Australians only), Saudi Arabia (Misk Global Forum 2026 cancelled; KAUST conferences
   list no participant funding), China mainland (WLF Young Scientists Forum is nomination-only). Re-check PyCon US
   2027 travel grants (expected to open December) and HKLF 2027 (call expected January).

   **`scripts/data/programme-overrides.json`** — corrections to programmes from the official national
   databases (DAAD for Germany, Study in Czechia, Study in Latvia). Do NOT edit
   `src/data/programmes-europe.json` directly (it is rebuilt). For each `programme` item open the
   programme's official page (`url`/`apply`/`requirementsUrl`, or the national database record in
   `source`) and add an entry keyed by the programme `id`:
   `{"deadlines": "...", "english": "...", "tuition": "...", "_checked": "YYYY-MM-DD", "_source": "<official URL>"}`.
   Include only fields that changed (copy the official wording); to record a check with no change, set
   only `_checked` and `_source`. Then run `python3 scripts/data/build-programmes.py`.

   **`src/data/universities-europe.json` → institutions** — for `institution-links` items, open
   `website` / `programmesUrl` / `profileUrl`. If a link is dead but the official site shows the new
   address, update it; if unclear, list it under "Needs a human". Do not remove institutions.

   Open/closed badges: the site computes "Open / Closing soon / Closed / N days left" automatically from the
   dates in the data, in the visitor's browser and at each build. Your job is to keep the DATES correct and
   to move items to the new cycle when the official source publishes it.

6. Run `npm run build`. It runs all validators (`scripts/validate-*.mjs`). **If it fails, fix the data you
   changed** (or revert that item) until it passes. Never push a failing build.
7. Write the weekly report to `reports/weekly/YYYY-MM-DD.md`:
   - **Changed** — item, what changed (old → new), official source URL.
   - **Now open / closing within 30 days** — so the team can promote them.
   - **Checked, no change** — count, plus the list.
   - **Needs a human** — anything unclear, unreachable or contradictory, with the reason.
   - **Not checked this week** — items you did not reach (they come first next week).
8. Commit with a clear message (e.g. `Weekly check 2027-01-04: 3 deadlines updated`) and push to `main`.
   The Deploy workflow publishes the site in a few minutes. If nothing changed, still commit the report.
9. Finish with a short summary for the owner: what changed, what is open now, what needs a human.

## Where the official links are

Every record lists its official sources in the data itself (`urls.sources` in scholarships, `sources` and
`links` in regional agencies). `scripts/data/weekly-checklist.json` collects them all in one place.

## Refreshing the official lists (monthly, or when a source announces changes)

The institution lists and Australian courses are generated from official files saved in `scripts/data/raw/`:
`uk-ofs-register.xlsx` (OfS Register download), `canada-ircc-dli-list.json` (IRCC DLI JSON),
`australia-teqsa-register.json` (TEQSA National Register), `au-cricos-courses.csv` and
`au-cricos-institutions.csv` (CRICOS on data.gov.au), `us-college-scorecard.json` (College Scorecard API).
If you can download a newer official file, replace it and run `python3 scripts/data/gen_anglo.py` then
`python3 scripts/data/build-programmes.py`. If you cannot reach the source, leave the files as they are and
say so in the report. Country rules for the UK (UCAS/GOV.UK), USA (State Department/ICE), Canada (IRCC),
Australia (Home Affairs) and New Zealand (Immigration NZ) are in `scripts/data/gen_anglo.py` and
`scripts/data/gen_us.py` — edit them there (not in the JSON), then rerun `gen_anglo.py`.


## Tools (/tools/)
- `src/data/eligibility.json` — structured rules for the eligibility checker, one entry per scholarship slug
  (pk: yes | only | no | list; residence; ageMax/ageMin/birthMin; minPct/minCgpa4; work; eng). Derive ONLY from the
  scholarship's verified official requirements. When you add or change a scholarship, add/update its rule here
  (the build fails if a slug is missing). Leave a rule out when the official source does not state it.
- `src/data/visa-funds.json` — official student-visa proof-of-funds amounts (35 countries; unit month|year|formula|varies, optional extra, capOfficial; level partial = check before applying). Re-check
  monthly on the official pages; update `amount` and `checked`. Canada and Australia are marked "partial" until the
  official page itself is confirmed.
- `src/config/site.ts` — `bookingUrl`, `whatsappChannel`, `prices` (owner-supplied; leave empty to hide).

### ECTS calculator
- Credit systems per study country live in `src/data/grade-systems.json` → `credits` (name, perYear, note, official source). EHEA countries (`ehea`) use ECTS 1:1; any other country asks for the university's own yearly load.
- Add a country only with an official source (ministry, regulator or national framework). Formula: credits ÷ credits per full-time year × 60.

## Security and SEO (Nov 2026)
- `public/.htaccess`: HTTPS + bare domain, security headers (HSTS, CSP, nosniff, frame, COOP, permissions), blocks
  hidden/backup files and deploy state files, refuses non-GET methods and common attack patterns, long caching for /_astro/.
  Security headers apply only to destinyglobals.com (env DG_MAIN), never to subdomains such as search.destinyglobals.com.
- CSP: `scripts/postbuild-security.mjs` hashes every inline script after `astro build` and writes the policy into
  dist/.htaccess. NEVER add inline event handlers (onclick=…) — the build fails on purpose; use data attributes + site.ts.
- `scripts/verify-live.sh` runs after every deploy (and by hand: Actions → Verify live site). It also submits the
  main URLs to IndexNow (key file public/da72ff37d853f7ced85a23e02dfcbfa9.txt — keep it).
- Structured data: src/lib/seo.ts (Organization + WebSite on every page); MonetaryGrant (scholarships), Event
  (conferences), Article (guides), Service (services), FAQPage (home). /llms.txt and AI-friendly robots.txt are generated.
- Titles: brand suffix only when the title stays ≤ 62 chars; descriptions clamped to 160 chars in BaseLayout.
- Search Console / Bing verification codes go in src/config/site.ts (googleSiteVerification, bingSiteVerification).
