# Security checklist

Everything below is either **implemented** in this codebase or is an
**operational task** the business owner must complete. Work through the
operational items before launch.

---

## Implemented in the application

### Input handling

- [x] **Server-side validation of everything.** Every submission is re-parsed on
      the server with the same Zod schema the browser used
      (`src/lib/validation.ts`). Client-side validation is treated purely as a UX
      convenience and is never trusted.
- [x] **Slot rules re-checked server-side.** A crafted request cannot widen
      opening hours, book a closed day, choose a non-existent slot, or bypass the
      minimum notice period — `checkSlotBookable()` runs again in the action.
- [x] **Input sanitisation.** Control characters are stripped, whitespace is
      collapsed, postcodes and phone numbers are normalised, and every field has
      a maximum length.
- [x] **Mass assignment prevented.** Admin actions accept a fixed enum plus
      explicitly named fields. No caller-supplied object is ever spread into a
      Prisma `update`.
- [x] **SQL injection prevented.** All database access is through Prisma, which
      parameterises every query. There is no raw SQL in the application.
- [x] **CSV injection prevented.** Fields beginning `=`, `+`, `-` or `@` are
      prefixed with a quote in the export, so a spreadsheet cannot execute
      customer-supplied text as a formula.

### Request protection

- [x] **CSRF protection.** Writes go through Next.js Server Actions, which
      enforce same-origin and use unforgeable action IDs.
- [x] **Rate limiting.** Booking and contact: 5 per 15 minutes. Availability
      lookups: 60 per minute. Admin sign-in: 5 per 15 minutes
      (`src/lib/rate-limit.ts`).
- [x] **Honeypot.** An off-screen field, hidden from assistive technology and
      removed from the tab order, that people never fill in. Any value rejects
      the submission with a deliberately vague message.
- [x] **Optional CAPTCHA.** Cloudflare Turnstile is verified server-side when
      configured, and **fails closed** — if verification errors, the submission
      is rejected rather than allowed through.
- [x] **Idempotency.** Each form session generates one key. Repeat submissions
      with the same key return the original booking instead of creating a second
      one, so double-clicking or a retried request cannot double-book.

### Data integrity

- [x] **Transactional availability re-check** immediately before insert.
- [x] **Capacity enforced in a transaction when configured** — with
      `maxBookingsPerSlot` set to a number, the count is taken and checked
      inside the same transaction as the insert. With the default `null` there
      is no limit and no check: several patients may request the same time,
      which is intended for a service that dispatches multiple physiotherapists.
- [x] **Booking references** use an unambiguous alphabet and are checked for
      collisions with a bounded retry.

### Transport and headers

- [x] **Content Security Policy** with a per-request nonce and `strict-dynamic`
      (`src/middleware.ts`). Scripts execute only with the nonce.
- [x] **HSTS** — `max-age=63072000; includeSubDomains; preload`.
- [x] **X-Frame-Options: DENY** and `frame-ancestors 'none'` — clickjacking.
- [x] **X-Content-Type-Options: nosniff**.
- [x] **Referrer-Policy: strict-origin-when-cross-origin**.
- [x] **Permissions-Policy** — camera, microphone, geolocation, payment and USB
      all disabled.
- [x] **Cross-Origin-Opener-Policy: same-origin**.
- [x] **`X-Powered-By` removed** — the framework version is not advertised.
- [x] **`rel="noopener noreferrer"`** on every external link.

### Secrets, sessions and access control

- [x] **No secrets in the repository.** `.env` is git-ignored; `.env.example`
      contains placeholders only.
- [x] **Environment validation** with clear, aggregated error messages
      (`src/lib/env.ts`).
- [x] **Admin passwords are never stored** — only a scrypt hash with a
      per-password salt, compared in constant time.
- [x] **Admin sessions** are HMAC-signed, expiring (8 hours), httpOnly,
      SameSite=Lax and Secure in production.
- [x] **Server-side authorisation.** Every admin page and action calls
      `requireAdmin()` on the server. There is no client-only check to bypass.
- [x] **Admin disabled unless fully configured.** No default account, no
      fallback, no bypass.
- [x] **No account enumeration.** Sign-in failures return one generic message,
      and both the email and password checks always run.
- [x] **The CSV export returns 404 when signed out**, so it does not advertise
      its existence.

### Privacy by design

- [x] **Booking references are never in a URL.** The confirmation page reads a
      signed, httpOnly, two-hour cookie, so booking details never reach browser
      history, referrer headers, analytics paths or access logs.
- [x] **No raw IP addresses stored.** Only a salted hash, used for abuse
      investigation and rate limiting.
- [x] **Logs contain no personal or medical data.** Booking errors log the slot
      and error class only; the email logger masks recipients and never logs a
      body.
- [x] **Email subject lines carry no health information**, names or addresses.
- [x] **The acknowledgement email omits the address and the customer's message**
      — those stay in the booking record.
- [x] **Staff notes are a separate column** from the customer's own message, so
      internal commentary can never be mistaken for what the customer wrote.
- [x] **Analytics is off by default**, and nothing loads before consent.
- [x] **Consent is never pre-ticked** and never restored from a saved draft.

---

## Operational tasks before launch

### Secrets

- [ ] Generate `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` and
      `BOOKING_CONFIRMATION_SECRET` with `npm run admin:hash`.
- [ ] Set them on the hosting platform, never in the repository.
- [ ] Use a password of at least 20 random characters for the admin account.
- [ ] Store the plaintext admin password in a password manager, not in a file.
- [ ] Set a calendar reminder to rotate secrets every 12 months, and immediately
      if anyone with access leaves.

### Infrastructure

- [ ] Force HTTPS; confirm HTTP redirects.
- [ ] Confirm the database connection uses `sslmode=require`.
- [ ] Restrict database network access to the application (IP allowlist or
      private networking) where the provider supports it.
- [ ] Confirm the database is in a UK or EU region.
- [ ] Enable automated database backups (see `backup-and-recovery.md`).
- [ ] Enable MFA on the hosting, database, DNS, domain registrar and email
      provider accounts.
- [ ] If running more than one instance, add an edge rate limit or move the
      limiter to Redis.

### Email

- [ ] Verify the sending domain with the email provider.
- [ ] Add SPF, DKIM and DMARC DNS records.
- [ ] Send a test booking and confirm both emails arrive and are not marked spam.
- [ ] Confirm `BOOKING_NOTIFICATION_EMAIL` is a mailbox somebody actually
      monitors — an unmonitored inbox means missed appointments.

### Data protection

- [ ] Have the Privacy Policy, Cookie Policy, Terms and Booking Policy reviewed
      by a qualified adviser and complete every placeholder.
- [ ] Confirm the retention periods in `src/config/legal.ts`.
- [ ] Record the actual processors (host, database, email) and their regions in
      the Privacy Policy.
- [ ] Put written data-processing terms in place with each processor.
- [ ] Confirm whether ICO registration is required for your processing, and
      register if so.
- [ ] Document the process for handling a subject access request or a deletion
      request, and who is responsible.
- [ ] Agree what to do if the "important message" field ever receives detailed
      health information despite the warning — it should be moved into the
      clinical record and removed from the booking record.

### Ongoing

- [ ] Run `npm audit` monthly and before each release; patch high and critical
      findings promptly.
- [ ] Enable Dependabot (or equivalent) for dependency updates.
- [ ] Keep Next.js and Prisma current — both ship security fixes.
- [ ] Review admin access quarterly.
- [ ] Test a database restore at least once (an untested backup is not a backup).
- [ ] Re-run `npm run verify` and the e2e suite before every release.

---

## Known limitations, stated honestly

1. **The rate limiter is per-instance.** In memory, so on a serverless platform
   each instance has its own counters. It stops casual abuse and accidental
   double-submits; it is not a global guarantee. Add an edge rate limit for that.
2. **Forwarded IP headers can be spoofed** if the app is not behind a trusted
   proxy. They are therefore used only for rate limiting and hashed
   fingerprints, never for authorisation.
3. **`style-src` allows `'unsafe-inline'`.** Next.js and Framer Motion require
   it. Scripts remain nonce-locked, which is where the real risk sits.
4. **There is one admin account.** That suits a single-operator business. If more
   than one person needs access, add a users table with per-user credentials
   rather than sharing a password.
5. **No independent penetration test has been carried out.** Consider one before
   handling significant volumes of personal data.
