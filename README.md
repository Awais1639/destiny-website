# Destiny Global Opportunities — website

The scholarship discovery and consultancy website for **Destiny Global Solutions Limited**.

**Tagline:** *Discover Opportunities. Unlock Your Future.*

This is a **static website**. There is no server, no database, no paid service and no API key. It builds into plain HTML/CSS/JS files that can be hosted for free.

---

## 1. What's inside

| Area | Route | Notes |
|---|---|---|
| Home | `/` | Hero search, deadlines, featured scholarships, two application routes, destinations, FAQ |
| Scholarship Explorer | `/scholarships/` | Working search, filters (status, country, degree, funding, subject, provider, deadline), sort, load-more, shareable URLs, mobile filter drawer |
| Scholarship details | `/scholarships/[slug]/` | All fields, "Not specified by the official source" where missing, sources, last-verified date, share buttons |
| Assistance form | `/scholarships/[slug]/assistance/` | Scholarship-specific consultancy inquiry |
| Compare schemes | `/scholarships/compare/` | Comparison table of major schemes. All named schemes (Erasmus Mundus, CSC, MEXT…) are sub-headings of Scholarships in the menu (`src/data/schemes.ts`). Old `/programs/` and `/erasmus-mundus/…` addresses redirect. |
| Universities | `/universities/`, `/universities/italy/`, `/universities/italy/[university]/`, `/universities/italy/[university]/[programme]/` | Every English-taught degree programme in Italy from official Ministry (MUR) data, searchable by level, subject, region, university type and language; each programme has an official link and an assistance form |
| Erasmus Mundus finder | `/scholarships/erasmus-mundus/`, `/scholarships/erasmus-mundus/[slug]/` | All 218 programmes from the official EACEA catalogue: search, subject filters, a page per programme with its official website, EU project page, checked intake dates (where verified) and an assistance form |
| Countries | `/countries/`, `/countries/[slug]/` | 13 destinations backed by real content |
| Services | `/services/`, `/services/[slug]/` | 10 consultancy services with inquiry forms |
| Guides | `/guides/`, `/guides/[slug]/` | 10 practical guides |
| About, Contact | `/about/`, `/contact/` | |
| Saved list | `/saved/` | Bookmarks stored only in the visitor's browser |
| Legal & trust | `/privacy-policy/`, `/terms/`, `/disclaimer/`, `/scholarship-verification/` | Editable drafts — have them reviewed |
| SEO | `/sitemap-index.xml`, `/robots.txt` | Generated automatically |

**Stack:** [Astro](https://astro.build) (static site generator) + TypeScript + hand-written CSS. Fonts (Fraunces, Plus Jakarta Sans) are self-hosted from npm, so no Google requests are made. Icons are inline SVG. Everything is free and open source.

Why Astro instead of a React single-page app: every page (including each scholarship) is pre-rendered as real HTML, which is better for Google, faster on slow phones, and needs no server rewrite rules on any free host.

---

## 2. Run it on your computer

You need **Node.js 18.20 or newer** (free from <https://nodejs.org>, choose the LTS version).

```bash
# 1. open a terminal in this folder, then install dependencies (once)
npm install

# 2. start the development server
npm run dev
# open http://localhost:4321 in your browser — changes appear instantly
```

### Offline / portable copy (every page as an independent file)

```bash
npm run build:portable   # creates dist-portable/
```
`dist-portable/` contains every page as its own HTML file with relative links (for example `countries/japan/index.html`). You can double-click `dist-portable/index.html` to browse the complete site on any computer without a server, put it on a USB stick, or upload it to any host or sub-folder. The file `destiny-website-offline.zip` in the company folder is this version — unzip it and open `index.html`.

## 3. Build the production version

```bash
npm run build      # checks the scholarship data, then builds into the dist/ folder
npm run preview    # preview the built site at http://localhost:4321
```

`npm run build` stops with a clear message if `scholarships.json` has an error (missing field, bad date, malformed URL…).

---

## 4. Configure your contact details (do this first)

Open **`src/config/site.ts`**. Everything business-specific lives there:

- `contact.email` — currently set to the company's registered email from your incorporation summary (`destinyglobalsolution@gmail.com`). Change it if you prefer another inbox.
- `contact.whatsapp` — **empty**. Add your number in international format, digits only (e.g. `923001234567`). WhatsApp buttons appear automatically once it's set.
- `social.*` — paste full URLs for Facebook, Instagram, LinkedIn, YouTube, TikTok, X. Empty ones are hidden.
- `registration.registeredOffice` — add your registered office address (UK law expects company websites to show it alongside the company number).
- `contact.phone`, `officeAddress`, `responseTime` — only fill in if confirmed.

**Logo:** the official company logo is used across the site in several sizes and two colour versions (normal, and a white version for dark backgrounds). The files are in `public/brand/` — to update the logo, replace those PNG files keeping the same names. The site colours are taken from the logo: purple `#32125B` and red `#CC0200` (see the top of `src/styles/global.css`).

---

## 5. Deploy for free

### Recommended: Cloudflare Pages
Free plan, fast global network, free HTTPS, free custom domains (subject to Cloudflare's current terms and limits).

1. Create a free GitHub account and upload this folder as a repository (GitHub Desktop is the easiest way). Do **not** upload `node_modules` or `dist` — `.gitignore` already excludes them.
2. Create a free Cloudflare account → **Workers & Pages → Create → Pages → Connect to Git** → pick the repository.
3. Build settings: Framework preset **Astro**, build command `npm run build`, output directory `dist`.
4. Add an environment variable `SITE_URL` = your final address (e.g. `https://destinyglobals.com`, or the `*.pages.dev` address Cloudflare gives you).
5. Deploy. Every future push to GitHub redeploys automatically.

### Alternative: GitHub Pages
A ready workflow is included at `deploy/github-pages-workflow.yml`.

1. Move it to `.github/workflows/deploy.yml` (create the `.github` and `workflows` folders), then push the repository to GitHub.
2. Repository **Settings → Pages → Source: GitHub Actions**.
3. Settings → Secrets and variables → Actions → **Variables**: add `SITE_URL` (e.g. `https://yourname.github.io`) and, if you are *not* using a custom domain, `SITE_BASE` = `/your-repo-name`.
4. Push to `main`; the site deploys automatically.
5. The same workflow runs **every Monday**: it re-reads the official Erasmus Mundus catalogue, commits any changes and redeploys (which also refreshes Open/Closed badges for the week). You can run it any time from the **Actions** tab → *Run workflow*. On Cloudflare Pages you can run `npm run sync:erasmus` yourself and push.

### Using your existing domain (destinyglobals.com)
Connecting a domain you already own is free on both hosts — you only change DNS records at your domain registrar. **This will replace whatever the domain currently shows**, so back up the existing site first.

- **Cloudflare Pages:** Pages project → Custom domains → add `destinyglobals.com`. For the root domain Cloudflare asks you to move the domain's nameservers to Cloudflare (free plan); for `www` a CNAME record is enough.
- **GitHub Pages:** Settings → Pages → Custom domain. Point the root domain's A records to GitHub's Pages IPs and `www` as a CNAME to `yourname.github.io` (GitHub shows the current values). Then set `SITE_URL=https://destinyglobals.com` and leave `SITE_BASE` empty.

If you don't want to touch the domain yet, use the free `*.pages.dev` or `*.github.io` address.

---

## 6. Limitations of a no-backend website (please read)

- **Inquiry forms do not send or store anything.** They validate in the browser and prepare a message that the visitor sends from **their own email app** (or WhatsApp, once configured). The site says so clearly and never shows a fake "submitted" message. If the visitor has no email app, they can copy the message.
- **No admin dashboard.** Content is edited in files and redeployed (see `CONTENT-GUIDE.md`). This is free and reliable but needs a rebuild for each change.
- **Saved scholarships live only in the visitor's browser** (localStorage) — they don't sync across devices.
- **No newsletter.** A newsletter needs a mailing service; we left it out rather than add a paid or fake one.
- **Statuses update automatically** in the browser using today's date, but new cycles/deadlines must be added by you.
- **Erasmus Mundus deadlines are not "live".** The programme list (names and official links) is refreshed weekly from the official EACEA catalogue, but the catalogue publishes no deadlines or requirements. Each of the 218 programmes publishes those on its own website, in its own layout, so they can't be read automatically and reliably. Intake dates appear only for programmes you have checked by hand (`src/data/erasmus-updates.json`); every other programme says "check the official website" and links straight to it. Nothing is guessed.
- **University programme details are checked by hand.** The Ministry data gives the programme list, degree class, teaching language, city and university website — not requirements, fees or deadlines. Those appear only for programmes and universities you've checked (`src/data/italy-updates.json`); every other page says "check the official website" and links to the university.
- When you later want real form delivery, free options exist (e.g. a Cloudflare Pages Function sending to your email, or a free-tier form service) — each has its own limits and privacy implications, so update the privacy policy if you add one.

---

## 7. Project structure

```
src/
  config/site.ts           ← contact details, socials, brand wording (edit me)
  data/scholarships.json   ← all scholarship records (single source of truth)
  data/countries.ts        ← destination pages
  data/services.ts         ← consultancy services
  data/guides.ts           ← guide articles
  data/taxonomy.ts         ← labels for degrees, subjects, funding, statuses
  lib/scholarships.ts      ← search, filter, sort, status, related, funding helpers
  lib/data.ts              ← data loading, URL + mailto/WhatsApp builders
  components/              ← Header, Footer, Logo, ScholarshipCard, InquiryForm…
  pages/                   ← one file per route
  styles/global.css        ← design system (colours, type, spacing, components)
scripts/validate-data.mjs  ← data checker (runs before every build)
public/                    ← favicon, social image, (your logo)
```

Design tokens (colours, fonts, spacing) are CSS variables at the top of `src/styles/global.css`.

## 8. Quality checks performed

Before delivery the production build was run and an automated browser test suite exercised: search, every filter type, sorting, load-more, empty state, URL-shareable filters, all 14 detail pages' official-apply buttons (correct official URL, new tab, `rel="noopener"`), assistance links, form validation, the "not sent yet" message, mailto prefill, hidden WhatsApp when unconfigured, saving/clearing bookmarks, mobile menu and filter drawer, and all internal links. All pages were checked at phone and desktop widths for horizontal overflow and console errors. External official links were checked when the data was researched (18 Oct 2026) but providers change URLs — re-check them during updates.

Licences: Astro (MIT), Fontsource fonts (SIL Open Font License), icon shapes in the style of Lucide (ISC). Illustrations and logo are original to this project.

## Automatic weekly updates and publishing

- **Publishing:** every push to `main` builds the site and uploads it to Hostinger (`.github/workflows/deploy.yml`).
  It uses the upload-only FTP account `u535784529.githubdeploy`; its password is the repository secret `FTP_PASSWORD`.
- **Weekly check:** a scheduled Claude task runs every Monday, follows `AGENT.md`, verifies every scholarship
  against its official website, updates the data files, writes a report in `reports/weekly/` and pushes.
- Between checks, Open / Closing soon / Closed badges update by themselves in visitors' browsers from the
  deadlines in the data.

## Course finder (`/find/`)

One search over every course (Italian English-taught degrees + Erasmus Mundus), scholarship, Italian regional grant,
university and destination. The index is built from the existing data files at build time (`src/lib/finder.ts`) —
no database. Each course lists the funding that applies to it (scholarships for that country/level/subject and the
regional grant for its university). The homepage search box submits to the finder.

## Blog

- Posts are Markdown files in `src/blog/<slug>.md` (the file name is the web address: `/blog/<slug>/`).
- Pages: `/blog/` (newest first, 12 per page), `/blog/category/<category>/`, `/blog/rss.xml`; the three newest posts also appear on the home page.
- Every post is checked before each build by `scripts/validate-blog.mjs` (title and description length, focus keyword, hashtags, official sources, internal links, at least 600 words, no promised outcomes). Run it alone with `npm run validate:blog`.
- A scheduled Claude task writes and publishes one post every Monday to Saturday by 14:00 Italian time, following `.claude/agents/blog-writer.md`.
- To edit or remove a post yourself: change or delete its file and push to `main`.
