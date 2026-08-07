# SEO launch checklist

Technical and on-page SEO tasks, in the order they should be done.

> **A note on expectations.** Nobody can guarantee a ranking position, and any
> agency that does is not being straight with you. What this checklist does is
> remove every technical obstacle and give the site the strongest legitimate
> foundation to compete on. Rankings then come from relevance, local signals,
> genuine reviews and time.

---

## Already implemented in the codebase

- [x] Unique title and meta description on every indexable page
- [x] Canonical URL on every page, generated from one origin setting
- [x] Open Graph and Twitter card metadata, with a generated social image
- [x] `sitemap.xml`, generated from a single page registry
- [x] `robots.txt`, referencing the sitemap and disallowing private routes
- [x] Clean, semantic, keyword-relevant URLs (no IDs, no query strings)
- [x] Breadcrumbs on every inner page, plus `BreadcrumbList` structured data
- [x] Exactly one `<h1>` per page, with a logical heading hierarchy below it
- [x] Internal linking between related pages (services ↔ areas ↔ pricing ↔ book)
- [x] `Organization`, `WebSite`, `WebPage`, `Service`, `FAQPage`, `ContactPage`
      and `BreadcrumbList` JSON-LD
- [x] Server-rendered HTML — content is in the initial response, not built by JS
- [x] A real 404 status on the custom 404 page
- [x] Permanent redirects from likely legacy paths (`/book`, `/faq`, `/pricing`…)
- [x] Automated audit (`npm run seo:audit`) for duplicate titles, missing
      metadata, pages without an H1, broken internal links and orphan pages
- [x] Mobile-first responsive layout, fast fonts, no third-party scripts

### Deliberately **not** implemented

- `AggregateRating` / `Review` schema — there are no verified reviews
- `Physician` / `MedicalClinic` schema — no verified practitioner or premises
- `LocalBusiness` with a Birmingham address — there is no Birmingham address
- Any claim of accreditation, membership or years of experience

Adding any of these without evidence risks a manual action and, for healthcare,
a regulatory complaint. Add them the day you can evidence them, and not before.

---

## Launch sequence

### Before the domain goes live

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin, no trailing slash.
- [ ] Decide on apex versus `www` and redirect one to the other permanently.
- [ ] Run `npm run seo:audit` — it must pass with no errors.
- [ ] Run `npx playwright test tests/e2e/site.spec.ts` — metadata, structured
      data, sitemap, robots and 404 status are all asserted there.
- [ ] Confirm no page carries an accidental `noindex` (the audit checks this).
- [ ] Check every page in a mobile viewport.

### On launch day

- [ ] Confirm `https://havohealphysiotherapy.co.uk/robots.txt` loads and
      references the sitemap.
- [ ] Confirm `https://havohealphysiotherapy.co.uk/sitemap.xml` lists all 16
      indexable pages and excludes `/booking-confirmed` and `/admin`.
- [ ] Validate the structured data:
      - <https://search.google.com/test/rich-results>
      - <https://validator.schema.org/>
- [ ] Test the Open Graph image with an actual share on WhatsApp and LinkedIn.
- [ ] Run Lighthouse on mobile for the homepage and the booking page. Target 90+
      in Performance, Accessibility, Best Practices and SEO.

### First week

- [ ] Set up Google Search Console (Domain property, DNS verification).
- [ ] Submit the sitemap.
- [ ] Request indexing for `/`, `/birmingham-physiotherapy`, `/book-appointment`
      and `/physiotherapy-pricing`.
- [ ] Set up Bing Webmaster Tools (import from Search Console).
- [ ] Create the Google Business Profile as a **service-area business** — see
      [`local-seo-guide.md`](local-seo-guide.md).
- [ ] Check Search Console's Page indexing report for unexpected exclusions.

### First month

- [ ] Review Search Console **Performance** for the queries you are already
      appearing for, and note gaps.
- [ ] Check **Core Web Vitals** in Search Console once field data appears.
- [ ] Publish the first two articles from
      [`content-calendar.md`](content-calendar.md).
- [ ] Begin the citation-building work in the local SEO guide.
- [ ] Start the outreach in [`ethical-backlink-plan.md`](ethical-backlink-plan.md).

---

## Keyword map

One primary intent per page. Do not target the same term on two pages — that is
how sites cannibalise their own rankings.

The service is **home-visit physiotherapy**, so the keyword strategy targets
home-visit intent rather than clinic intent. That is both more accurate and less
competitive than the generic "physiotherapy Birmingham" head term.

| Page | Primary intent | Supporting terms |
| --- | --- | --- |
| `/` | home physiotherapy Birmingham | physiotherapy at home Birmingham, physiotherapy at your doorstep Birmingham, at-home physiotherapy Birmingham |
| `/birmingham-physiotherapy` | home visit physiotherapist Birmingham | mobile physiotherapist Birmingham, physiotherapist who comes to your home Birmingham, private home physiotherapy Birmingham |
| `/physiotherapy` | home-visit physiotherapy explained | what happens during a home physiotherapy appointment, 45-minute home physiotherapy appointment, home physiotherapy preparation |
| `/physiotherapy-pricing` | home physiotherapy pricing Birmingham | £75 home physiotherapy appointment, is travel included physiotherapy, mobile physiotherapy cost |
| `/book-appointment` | book home physiotherapy Birmingham | physiotherapy home visits Birmingham, book mobile physiotherapist |
| `/conditions-we-support` | when to consider physiotherapy | home mobility assessment Birmingham, home physiotherapy for older adults Birmingham |
| `/areas-we-cover` | home physiotherapy coverage West Midlands | home physiotherapy Wolverhampton, mobile physiotherapist Walsall, home visit physiotherapy Dudley, physiotherapy at home Solihull |
| `/faqs` | home physiotherapy questions | do you provide physiotherapy at home, physiotherapy without travelling to a clinic |
| `/about` | Havoheal Physiotherapy UK LTD | brand terms |

### Location variations

Create these naturally, and only when there is something specific to say about
the town — never as templated doorway pages. Wording that fits: *home
physiotherapy Wolverhampton*, *mobile physiotherapist Walsall*, *home visit
physiotherapy Dudley*, *physiotherapy at home West Bromwich*, *home physiotherapy
Solihull*, *mobile physiotherapy Sutton Coldfield*, *home visit physiotherapist
Cannock*, *physiotherapy at home Lichfield*, *home physiotherapy Stourbridge*,
*mobile physiotherapy Halesowen*.

`areaPhrases` in `src/config/areas.ts` holds a natural phrase per town so these
appear as varied human copy rather than one repeated exact-match string.

### Terms that must not be used unless they become true

- **"physiotherapy clinic Birmingham"** — there is no clinic. Using it would be
  both a ranking mismatch and a misrepresentation.
- **"NHS physiotherapy"** — only with an actual NHS relationship.
- **"same day physiotherapy"** — only if same-day visits are genuinely offered.
- **"we cover all Birmingham postcodes"** — coverage is subject to postcode and
  appointment availability, and a content guardrail test blocks this claim.

### Keyword-stuffing guardrails

Write for the person reading, not the algorithm. The content guardrail tests in
`tests/unit/content.test.ts` will fail the build on outcome guarantees, invented
review scores and unverified credentials — but they cannot detect awkward,
over-optimised prose. Read new copy aloud; if it sounds like it was written for a
search engine, rewrite it.

---

## Ongoing measurement

Monthly, record:

| Metric | Where | Why |
| --- | --- | --- |
| Impressions and clicks for "physiotherapy Birmingham" and variants | Search Console | Visibility trend |
| Average position for the keyword map above | Search Console | Progress per page |
| Pages indexed vs submitted | Search Console | Technical health |
| Core Web Vitals (LCP, INP, CLS) | Search Console / PageSpeed | Real-user performance |
| Google Business Profile calls, direction requests, website clicks | GBP Insights | Local performance |
| Booking form starts vs completions | Analytics (if enabled) or database | Conversion health |
| Bookings by source | Ask on the phone: "how did you find us?" | The most reliable attribution you will get |

If bookings drop suddenly, check the booking form first and the rankings second.
A broken form looks exactly like an algorithm update in the numbers.
