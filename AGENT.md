# Weekly scholarship check — runbook for the checking agent

This file tells the weekly agent (a scheduled Claude task that runs every Monday) exactly how to check
every scholarship on destinyglobals.com against its **official** website and publish the corrections.
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
   official URLs and the values currently on the site (29+ scholarships, 36 Italian regional grant
   agencies, Erasmus Mundus intake updates).
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

   **`src/data/universities-europe.json`** — Nordic & Baltic university directory (country rules + institution
   lists). Check each country's `rules.deadlines` against its official portal (listed in `sources`); when a new
   application round is published, replace past dates with the new ones and set the country's `checked` date.
   Never add an ownership label, fee or score that the official source does not state.

6. Run `npm run build`. It runs all validators (`scripts/validate-*.mjs`). **If it fails, fix the data you
   changed** (or revert that item) until it passes. Never push a failing build.
7. Write the weekly report to `reports/weekly/YYYY-MM-DD.md`:
   - **Changed** — item, what changed (old → new), official source URL.
   - **Now open / closing within 30 days** — so the team can promote them.
   - **Checked, no change** — count, plus the list.
   - **Needs a human** — anything unclear, unreachable or contradictory, with the reason.
8. Commit with a clear message (e.g. `Weekly check 2027-01-04: 3 deadlines updated`) and push to `main`.
   The Deploy workflow publishes the site in a few minutes. If nothing changed, still commit the report.
9. Finish with a short summary for the owner: what changed, what is open now, what needs a human.

## Where the official links are

Every record lists its official sources in the data itself (`urls.sources` in scholarships, `sources` and
`links` in regional agencies). `scripts/data/weekly-checklist.json` collects them all in one place.
