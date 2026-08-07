# Havoheal Physiotherapy UK LTD — Home-Visit Physiotherapy Website

Production-ready booking website for **Havoheal Physiotherapy UK LTD**, offering
45-minute **home-visit** physiotherapy appointments at a fixed £75 across
**Birmingham and surrounding areas**.

This is a mobile service: a physiotherapy professional travels to the customer's
own home. There is no clinic, and the London registered office is never presented
as one.

Built with Next.js 15 (App Router), TypeScript in strict mode, Tailwind CSS,
Prisma + PostgreSQL, React Hook Form + Zod, and Server Actions.

> **Before launch:** work through [`docs/pre-launch-checklist.md`](docs/pre-launch-checklist.md).
> Several pages contain clearly-marked placeholders that only the business owner
> can fill in, and the legal templates need review by a qualified adviser.

---

## Table of contents

1. [Project architecture](#1-project-architecture)
2. [Local installation](#2-local-installation)
3. [Environment setup](#3-environment-setup)
4. [Database setup](#4-database-setup)
5. [Running migrations](#5-running-migrations)
6. [Running tests](#6-running-tests)
7. [Building for production](#7-building-for-production)
8. [Deployment](#8-deployment)
9. [Configuring email](#9-configuring-email)
10. [Configuring booking availability](#10-configuring-booking-availability)
11. [Changing price and appointment duration](#11-changing-price-and-appointment-duration)
12. [Adding or blocking dates](#12-adding-or-blocking-dates)
13. [Editing service areas](#13-editing-service-areas)
14. [Managing SEO metadata](#14-managing-seo-metadata)
15. [Connecting the domain](#15-connecting-the-domain)
16. [Submitting the sitemap to search engines](#16-submitting-the-sitemap-to-search-engines)
17. [Google Search Console](#17-google-search-console)
18. [Bing Webmaster Tools](#18-bing-webmaster-tools)
19. [Google Business Profile](#19-google-business-profile)
20. [Security and privacy steps required before launch](#20-security-and-privacy-steps-required-before-launch)
21. [Admin access](#21-admin-access)
22. [Security checklist](#22-security-checklist)

---

## 1. Project architecture

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout: fonts, header, footer, JSON-LD
│   ├── page.tsx                # Homepage
│   ├── globals.css             # Design system (Tailwind layers)
│   ├── actions/                # Server Actions — the only write paths
│   │   ├── booking.ts          #   submit a booking, look up availability
│   │   ├── contact.ts          #   contact form
│   │   └── admin.ts            #   sign in, confirm/cancel/reschedule/note
│   ├── admin/                  # Protected booking management
│   ├── book-appointment/       # Multi-step booking form (the key page)
│   ├── booking-confirmed/      # Confirmation, read from a signed cookie
│   ├── <content pages>/        # Physiotherapy, areas, pricing, FAQs, legal…
│   ├── sitemap.ts              # sitemap.xml, generated from the page registry
│   ├── robots.ts               # robots.txt
│   ├── opengraph-image.tsx     # Social image, generated at build time
│   └── not-found.tsx           # Custom 404 (real 404 status)
├── components/
│   ├── ui/                     # Button, Card, form fields, accordion
│   ├── layout/                 # Header, footer, mobile bar, page header
│   ├── booking/                # Booking form, date picker, slot picker
│   ├── sections/               # Reusable page sections and notices
│   ├── graphics/               # Original decorative SVGs
│   └── admin/                  # Admin-only components
├── config/                     # ⭐ EVERYTHING THE OWNER EDITS LIVES HERE
│   ├── site.ts                 #   `company` — the single source of truth for
│                               #   the legal name, email, phone and address
│   ├── booking.ts              #   hours, slot length, price, working days
│   ├── areas.ts                #   service coverage areas
│   ├── services.ts             #   service categories, trust points, pricing
│   ├── conditions.ts           #   conditions we support
│   ├── faqs.ts                 #   FAQs (also published as FAQPage schema)
│   └── legal.ts                #   retention periods, processors, review notice
├── lib/
│   ├── slots.ts                # Slot generation + availability (pure, tested)
│   ├── bookings.ts             # Booking data access + optional slot capacity
│   ├── validation.ts           # Zod schemas shared by client and server
│   ├── seo.ts                  # Metadata builders + the page registry
│   ├── structured-data.ts      # JSON-LD builders
│   ├── email/                  # Provider abstraction + branded templates
│   ├── admin-auth.ts           # scrypt passwords, signed sessions
│   ├── rate-limit.ts           # Fixed-window rate limiting
│   └── signed-value.ts         # HMAC-signed cookie values
├── middleware.ts               # Per-request nonce + Content Security Policy
prisma/
├── schema.prisma               # Database schema
├── migrations/                 # SQL migrations
└── seed.ts                     # Development seed data
scripts/
├── seo-audit.ts                # Automated SEO checks (runs in `npm run verify`)
└── hash-admin-password.ts      # Generates ADMIN_PASSWORD_HASH
tests/
├── unit/                       # Vitest: slots, validation, content guardrails
└── e2e/                        # Playwright: booking flow, SEO, a11y, security
docs/                           # Deployment, SEO, backlinks, security, backups
```

### Key architectural decisions

| Decision | Why |
| --- | --- |
| **All availability derives from `src/config/booking.ts`** | Slot times are never hard-coded. Change the config and the UI, the server validation and the database all follow. |
| **Server Actions rather than public API routes** | Next.js gives Server Actions same-origin enforcement and unforgeable action IDs, so CSRF protection is built in, and the booking payload never needs a public endpoint. |
| **Capacity-based slots, not exclusive ones** | The business dispatches several physiotherapists, so one patient requesting 10:00 never stops another. `maxBookingsPerSlot` (default `null` = unlimited) is the single switch; when set to a number it is enforced in the UI and again inside the insert transaction. There is deliberately no unique constraint on (date, startTime) — staffing capacity is a business setting, not a data-integrity invariant. |
| **Booking reference in a signed cookie, never a URL** | Keeps booking details out of browser history, referrer headers, analytics paths and access logs. |
| **Nonce-based CSP from middleware** | The strictest policy that still allows Next.js's inline streaming scripts. It opts pages into dynamic rendering — an accepted trade-off, see [Performance](#performance-notes). |
| **Editable content in typed TS files, not a CMS** | The owner edits one file; TypeScript catches mistakes at build time; there is no CMS to host, secure, patch or pay for. |
| **One `company` object for the business identity** | The legal name, display name, email, phone and registered address exist once, in `src/config/site.ts`. Renaming the company is a one-line change, not a search-and-replace across 40 files. |
| **`travelIncludedInPrice` is `null` until confirmed** | The site makes no claim about travel cost either way until the owner sets it. A tri-state flag is better than a plausible guess on a page customers rely on. |
| **Email failure never fails a booking** | Email is sent after the database commit. A delivery failure is recorded on the booking and surfaced as a support message — the appointment request is not lost. |
| **Analytics disabled by default** | No third-party script, no cookie banner and nothing to consent to until a provider is deliberately configured. |

---

## 2. Local installation

**Requirements:** Node.js 20+ and a PostgreSQL 14+ database.

```bash
npm install
```

If your npm blocks install scripts (npm 11+), approve the ones this project needs:

```bash
npm approve-scripts prisma @prisma/client @prisma/engines sharp esbuild unrs-resolver
```

Then generate the Prisma client and start the dev server:

```bash
npm run db:generate
npm run dev
```

The site runs at <http://localhost:3000>.

---

## 3. Environment setup

Copy the example file and fill it in:

```bash
cp .env.example .env
```

Every variable is documented inline in `.env.example`. Validation lives in
`src/lib/env.ts` and reports **all** problems at once with actionable messages.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical origin for canonicals, sitemap, OG tags |
| `EMAIL_PROVIDER` | Yes | `console` (logs only) or `resend` (sends) |
| `RESEND_API_KEY`, `EMAIL_FROM` | If `resend` | Email credentials and verified From address |
| `BOOKING_NOTIFICATION_EMAIL` | Recommended | Where new booking requests are sent |
| `BOOKING_CONFIRMATION_SECRET` | Production | Signs the confirmation cookie (32+ chars) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` | For admin | Admin stays disabled until all three are set |
| `TURNSTILE_*` | Optional | Cloudflare Turnstile bot protection |
| `NEXT_PUBLIC_ANALYTICS_*` | Optional | Consent-gated analytics |
| `ADDRESS_LOOKUP_*` | Optional | Postcode/address lookup provider |

**Never commit `.env`.** It is already in `.gitignore`.

---

## 4. Database setup

Any PostgreSQL 14+ database works — Neon, Supabase, Railway, RDS or local.

```bash
# local example
createdb havoheal
```

Set `DATABASE_URL` in `.env`, then apply the schema (next section).

---

## 5. Running migrations

```bash
npm run db:migrate     # development: creates/apples migrations
npm run db:deploy      # production: applies existing migrations only
npm run db:seed        # optional: sample bookings for local development
npm run db:studio      # browse the data
```

> **Note on slot uniqueness.** The initial migration created a partial unique
> index (`Booking_live_slot_unique`) enforcing one live booking per date and
> start time. Migration `20260807120000_allow_concurrent_slot_bookings` **drops
> it**, because the business sends out several physiotherapists and a slot is
> not an exclusive resource. Any per-slot limit is now the configuration setting
> `maxBookingsPerSlot`, enforced in the insert transaction.
>
> The unique constraints on `reference` and `idempotencyKey` are untouched, so
> references stay unique and a repeated submission still cannot create a
> duplicate booking.

---

## 6. Running tests

```bash
npm run typecheck      # TypeScript, strict mode
npm run lint           # ESLint (next/core-web-vitals + TypeScript)
npm run test           # Vitest unit tests
npm run seo:audit      # Automated SEO checks
npm run verify         # All of the above in one command
npm run test:e2e       # Playwright end-to-end tests
```

**Unit tests** (`tests/unit`) cover slot generation and every availability rule
(including the 18:30 boundary and BST/GMT conversion), validation and
normalisation, rate limiting, signed cookies, and **content guardrails** — a
suite that fails the build if forbidden marketing language (guaranteed outcomes,
review scores, unverified credentials, "our clinic") is ever introduced.

**End-to-end tests** (`tests/e2e`):

- `booking-flow.spec.ts` — the full three-step booking, validation errors, state
  preservation across steps. **Requires a reachable database.**
- `site.spec.ts` — metadata and canonicals on every indexable page, structured
  data (and the absence of unverifiable schema types), sitemap and robots, real
  404 status, redirects, skip link, mobile drawer focus management, tel/WhatsApp
  links, security headers, and that admin routes are unreachable when signed out.
  **No database needed.**

Install browsers once before the first e2e run:

```bash
npx playwright install --with-deps
```

---

## 7. Building for production

```bash
npm run build          # runs `prisma generate` then `next build`
npm run start
```

The build does not need a live database — page data is not fetched at build time.

---

## 8. Deployment

Full instructions, including a Vercel walkthrough and a self-hosted Node/Docker
option, are in [`docs/deployment.md`](docs/deployment.md).

Short version for Vercel:

1. Push the repository to GitHub.
2. Import it in Vercel; the framework preset is detected automatically.
3. Add every environment variable from `.env.example` (Production + Preview).
4. Set the build command to `npm run build` (already the default).
5. Deploy, then run `npm run db:deploy` against the production database.
6. Add the custom domain (see §15).

---

## 9. Configuring email

Email goes through an abstraction in `src/lib/email/provider.ts`; the application
never calls a vendor SDK directly.

**Development / CI:** `EMAIL_PROVIDER="console"` — logs a redacted summary
(recipient masked, no message body) and sends nothing.

**Production with Resend:**

1. Create an account at <https://resend.com> and add `havohealphysiotherapy.co.uk`.
2. Add the DKIM and SPF DNS records Resend gives you, and wait for verification.
3. Set:
   ```
   EMAIL_PROVIDER="resend"
   RESEND_API_KEY="re_..."
   BOOKING_FROM_EMAIL="Havoheal Physiotherapy <bookings@havohealphysiotherapy.co.uk>"
   BOOKING_REPLY_TO_EMAIL="bookings@havohealphysiotherapy.co.uk"
   BOOKING_NOTIFICATION_EMAIL="bookings@havohealphysiotherapy.co.uk"
   ```
4. Submit a test booking and confirm both emails arrive.

> ⚠️ **Owning the Titan mailbox does not authorise Resend to send as that
> address.** Receiving mail is governed by your MX records; sending is governed
> by SPF and DKIM. Both coexist — do not remove your Titan MX records, and never
> create a second SPF record. Merge senders into one:
> `v=spf1 include:spf.titan.email include:_spf.resend.com ~all`
>
> Full instructions, including DMARC and a deliverability checklist:
> [`docs/email-setup.md`](docs/email-setup.md).

**To use a different provider,** add a case to `sendEmail()` in
`src/lib/email/provider.ts`. Nothing else changes.

Templates live in `src/lib/email/templates.ts`. They are inline-CSS,
single-column and image-free, and subject lines deliberately contain **no**
health information, names or addresses.

---

## 10. Configuring booking availability

Everything is in **`src/config/booking.ts`**:

```ts
openingTime: '08:00',
closingTime: '19:00',
slotDurationMinutes: 45,
slotGapMinutes: 0,
latestAppointmentMustEndByClosing: true,
workingDays: [1, 2, 3, 4, 5, 6],   // 0 = Sunday
bookingHorizonDays: 60,
minimumNoticeHours: 4,
```

### The 19:00 boundary — read this

Start times step by 45 minutes from 08:00: `08:00, 08:45, 09:30, 10:15, 11:00,
11:45, 12:30, 13:15, 14:00, 14:45, 15:30, 16:15, 17:00, 17:45, (18:30)`.

With `latestAppointmentMustEndByClosing: true` (the default), an appointment may
not finish after 19:00, so **18:30 is not offered** (it would end at 19:15) and
the last bookable slot is **17:45–18:30**.

If the business confirms appointments may finish after 19:00, set the flag to
`false` and 18:30–19:15 becomes the final slot. This is the single switch that
controls it; there is no other place to change.

Slots are generated programmatically by `generateSlots()` in `src/lib/slots.ts`
and are covered by unit tests.

---

## 11. Changing price and appointment duration

In `src/config/booking.ts`:

```ts
priceInPence: 7500,          // £75 — integers avoid rounding errors
slotDurationMinutes: 45,
```

Changing either updates the whole site: headings, buttons, the booking form,
emails, `Offer` structured data and the FAQs that reference them.

**Note:** existing bookings keep the price and duration recorded at the time they
were made (`priceInPence` and `durationMinutes` columns), so historic records
stay accurate.

After changing the price, also review the FAQ answers in `src/config/faqs.ts` and
the copy in `src/config/services.ts`, which mention £75 in prose. The unit test
`tests/unit/content.test.ts` will fail if they fall out of sync.

---

## 12. Adding or blocking dates

**Working days** — `workingDays` in `src/config/booking.ts` (0 = Sunday).

**One-off closures (code):**

```ts
blockedDates: ['2026-12-25', '2026-12-26', '2027-01-01'],
```

**One-off closures (no deploy):** insert a row into the `BlockedDate` table via
`npm run db:studio`. Database-blocked dates are checked on submission, so a date
blocked after someone opened the form is still rejected.

**Booking horizon** — `bookingHorizonDays` (default 60).
**Lead time** — `minimumNoticeHours` (default 4).

---

## 13. Editing service areas

**`src/config/areas.ts`**:

- `areaGroups` — the grouped lists shown on *Areas We Cover*.
- `headlineAreas` — the principal towns, also published as `areaServed` in
  structured data.
- `coverageCallout` — the "not sure whether we cover your address?" text.

A unit test checks that every headline town appears in a group, so the two lists
cannot drift apart.

> Areas are places we **serve**, never clinic locations. Do not add an address
> here, and do not describe the London registered office as a clinic — a content
> guardrail test enforces this.

---

## 14. Managing SEO metadata

Every indexable page is declared once in `pageRegistry` in **`src/lib/seo.ts`**,
with its title, meta description, sitemap priority and change frequency. That
single list drives:

- page metadata (via `metadataFor('/path')`),
- `sitemap.xml`,
- the HTML sitemap page,
- the automated audit in `npm run seo:audit`.

**To add a page:** create the route, add an entry to `pageRegistry`, then export
`export const metadata = metadataFor('/your-path')`. The audit fails if a route
exists without a registry entry (an orphan page) or a registry entry without a
route (a 404 in the sitemap).

The audit also checks for duplicate titles and descriptions, missing or
badly-sized metadata, pages with zero or multiple `<h1>` elements, accidental
`noindex`, and broken internal links.

---

## 15. Connecting the domain

1. In your host (Vercel: Project → Settings → Domains) add
   `havohealphysiotherapy.co.uk` and `www.havohealphysiotherapy.co.uk`.
2. At your DNS provider add the records the host gives you (usually an `A`
   record for the apex and a `CNAME` for `www`).
3. Choose one canonical host — the apex is configured here — and redirect the
   other to it. Vercel does this automatically once you set the primary domain.
4. Set `NEXT_PUBLIC_SITE_URL="https://havohealphysiotherapy.co.uk"` (no trailing
   slash) and redeploy, so canonicals, the sitemap and OG tags all match.
5. Confirm HTTPS is active and HTTP redirects to HTTPS.

---

## 16. Submitting the sitemap to search engines

The sitemap is generated at `https://havohealphysiotherapy.co.uk/sitemap.xml`
and is referenced from `robots.txt`.

- **Google:** Search Console → Sitemaps → enter `sitemap.xml` → Submit.
- **Bing:** Webmaster Tools → Sitemaps → Submit sitemap.

Re-submit whenever you add a page (or just wait — the sitemap is regenerated on
every deploy).

---

## 17. Google Search Console

1. Go to <https://search.google.com/search-console> and add a **Domain**
   property for `havohealphysiotherapy.co.uk`.
2. Verify with the DNS TXT record it provides.
3. Submit the sitemap (§16).
4. Use **URL Inspection → Request indexing** for the homepage, the Birmingham
   page and the booking page.
5. Check **Page indexing** after a week for anything excluded unexpectedly.

Full launch sequence: [`docs/seo-launch-checklist.md`](docs/seo-launch-checklist.md).

---

## 18. Bing Webmaster Tools

1. Go to <https://www.bing.com/webmasters>.
2. Sign in and choose **Import from Google Search Console** (fastest) or add and
   verify the site manually.
3. Submit the sitemap.
4. Bing data also feeds other surfaces, so this is worth doing.

---

## 19. Google Business Profile

Havoheal Physiotherapy UK LTD is a **service-area business**: it serves Birmingham and the
surrounding towns but has no public clinic address, and the registered office is
in London.

Set it up as a service-area business — **not** with a Birmingham address you
cannot substantiate — and hide the address. Step-by-step guidance, including
category selection, NAP consistency and review requests, is in
[`docs/local-seo-guide.md`](docs/local-seo-guide.md).

---

## 20. Security and privacy steps required before launch

1. Generate real secrets (`npm run admin:hash` prints all three) and set them on
   the host, never in the repository.
2. Set `EMAIL_PROVIDER="resend"` with a verified sending domain.
3. Apply migrations to the production database (`npm run db:deploy`) and confirm
   the slot-uniqueness index is **gone**, so several patients can request the
   same time (this should return no rows):
   ```sql
   SELECT indexname FROM pg_indexes WHERE indexname = 'Booking_live_slot_unique';
   ```
4. Confirm the database enforces TLS (`?sslmode=require`).
5. Have the legal templates reviewed and complete every placeholder in the
   Privacy, Cookie, Terms and Booking policies.
6. Confirm the retention periods in `src/config/legal.ts`.
7. Decide on analytics. If enabled, confirm the consent banner appears and that
   nothing loads before consent.
8. Consider enabling Turnstile for extra bot protection.
9. Work through [`docs/security-checklist.md`](docs/security-checklist.md).
10. Set up backups — [`docs/backup-and-recovery.md`](docs/backup-and-recovery.md).

---

## 21. Admin access

The admin area at `/admin/bookings` provides: a filterable, searchable booking
list; per-booking detail with the full audit trail; confirm, cancel, reschedule
and complete actions; an internal notes field kept separate from anything the
customer wrote; and CSV export.

**It is disabled until configured.** There is no default account and no bypass;
visiting `/admin` without configuration shows setup instructions.

```bash
npm run admin:hash -- "a-long-random-password-you-generated"
```

That prints `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` and
`BOOKING_CONFIRMATION_SECRET`. Set those plus `ADMIN_EMAIL` on your host and
redeploy.

Passwords are stored only as scrypt hashes with a per-password salt and compared
in constant time. Sessions are HMAC-signed, expiring, httpOnly, SameSite=Lax and
Secure. Every admin page and action re-checks the session **on the server**.

---

## 22. Security checklist

The full checklist is in
[`docs/security-checklist.md`](docs/security-checklist.md). Summary of what is
already implemented:

- [x] Server-side validation of every submission with shared Zod schemas
- [x] CSRF protection via Server Actions (same-origin + unforgeable action IDs)
- [x] Rate limiting on booking, contact, availability and admin sign-in
- [x] Honeypot field plus optional Cloudflare Turnstile
- [x] Nonce-based Content Security Policy with `strict-dynamic`
- [x] HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy
- [x] Input sanitisation (control characters stripped, whitespace collapsed)
- [x] SQL injection prevented by Prisma's parameterised queries
- [x] Environment variable validation with clear failures
- [x] No secrets in the repository
- [x] Safe error messages — no stack traces or internals shown to visitors
- [x] Audit logs that never contain medical or personal data
- [x] Secure, httpOnly, SameSite cookies
- [x] Idempotent booking submission (repeat clicks cannot double-book)
- [x] Transactional capacity enforcement when `maxBookingsPerSlot` is set
- [x] Mass assignment prevented (fixed action enum, no object spreading)
- [x] CSV injection prevented in the export
- [x] Admin disabled until fully configured

---

## Performance notes

- **Fonts** are self-hosted by `next/font` — no third-party font request, and
  fallback metrics are adjusted automatically so there is no layout shift.
- **Shared JS is ~103 kB**; the heaviest page (the booking form) is ~155 kB
  first-load.
- **No third-party scripts** ship by default. Analytics only loads after consent.
- **All imagery is inline SVG** generated in the project — no image requests, no
  layout shift, and it scales perfectly on any display.
- **Trade-off:** the nonce-based CSP means pages are server-rendered per request
  rather than statically cached. They perform no data fetching, so this is a
  render rather than a database round trip. If you would rather have static
  caching, replace the middleware CSP with a static policy in `next.config.mjs` —
  but that requires `'unsafe-inline'` for scripts, which materially weakens XSS
  protection. The stricter option was chosen deliberately.

---

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/deployment.md`](docs/deployment.md) | Vercel and self-hosted deployment, migrations, rollback |
| [`docs/email-setup.md`](docs/email-setup.md) | Sending domain, SPF/DKIM/DMARC, delivery failures and retries |
| [`docs/pre-launch-checklist.md`](docs/pre-launch-checklist.md) | Everything the owner must confirm before going live |
| [`docs/security-checklist.md`](docs/security-checklist.md) | Full security review checklist |
| [`docs/seo-launch-checklist.md`](docs/seo-launch-checklist.md) | Technical SEO launch sequence |
| [`docs/local-seo-guide.md`](docs/local-seo-guide.md) | Google Business Profile, citations, reviews |
| [`docs/ethical-backlink-plan.md`](docs/ethical-backlink-plan.md) | White-hat link acquisition with outreach templates |
| [`docs/content-calendar.md`](docs/content-calendar.md) | Editorial calendar and medical content standards |
| [`docs/backup-and-recovery.md`](docs/backup-and-recovery.md) | Backups, restore drills, incident response |

---

## Licence and content notes

All copy, structured data and graphics in this repository were written for
Havoheal Physiotherapy UK LTD. The site deliberately contains **no** testimonials, review
scores, trust badges, awards, accreditations, staff qualifications, years of
experience or clinic addresses, because none have been supplied and verified.
Placeholders marked in the UI show exactly where the owner should add them once
they can be evidenced.
