# Pre-launch checklist — business facts still required

The website is complete and functional, but a number of statements deliberately
remain unwritten because they are facts only the business owner can supply.
Nothing in this list is a placeholder that "looks unfinished" to a visitor — each
one is either an honest omission or a clearly-marked note.

Work through this list before the domain goes live.

---

## 1. Facts that must be confirmed

| # | Item | Where | Why it matters |
| --- | --- | --- | --- |
| 1 | **Does an appointment finish after 19:00?** | `src/config/booking.ts` → `latestAppointmentMustEndByClosing` | Currently `true`, so the last slot is 17:45–18:30. Set to `false` if appointments may run to 19:15, which enables the 18:30 slot. |
| 2 | **Which days do you work?** | `src/config/booking.ts` → `workingDays` | Currently Monday–Saturday. |
| 3 | **A monitored email address** | `src/config/site.ts` → `contact.email`, and `BOOKING_NOTIFICATION_EMAIL` | Currently `bookings@havohealphysiotherapy.co.uk`. If nobody reads it, bookings will be missed. |
| 4 | **What the £75 includes and excludes** | `src/config/services.ts` → `pricingIncludes` / `pricingExcludes` | Every line must be accurate. Remove anything that is not. |
| 5 | **Payment method and timing** | `/physiotherapy-pricing`, `/terms-and-conditions` | Marked as a placeholder on both pages. |
| 6 | **Cancellation notice period and any charge** | `src/config/legal.ts` → `cancellationNoticePeriod`, and the Booking Policy | Currently 24 hours with no charge stated. |
| 7 | **How late arrival is handled** | `/booking-and-cancellation-policy` | Marked as a placeholder. |
| 8 | **Is travel included in the £75?** | `src/config/booking.ts` → `travelIncludedInPrice` | Currently `null`, so the site makes **no claim either way** and says travel is confirmed when we contact you. Set it to `true` or `false` (with `travelChargeNote`) once decided. |
| 8b | **What happens if nobody is home** | `/booking-and-cancellation-policy` | Marked as a placeholder alongside the late-arrival policy. |
| 9 | **Data retention periods** | `src/config/legal.ts` | Currently 7 years for bookings, 24 months for enquiries. Confirm with your adviser. |
| 10 | **Actual hosting, database and email providers, and their regions** | `src/config/legal.ts` → `processors`, and the Privacy Policy | The Privacy Policy currently says "to be confirmed". |

---

## 2. Things deliberately left out

The site contains **none** of the following, because none has been supplied and
verified. Each would be valuable — add them the day you can evidence them.

| Item | Where it would go |
| --- | --- |
| Practitioner names and **HCPC registration numbers** | `/about` (a placeholder box already lists what is needed) |
| **Professional body membership** (e.g. CSP) | `/about`, plus `sameAs` in structured data |
| **Insurance details** | `/about` |
| **Photographs** of the practitioner, equipment and materials | `/about`, homepage, Google Business Profile |
| **Years of experience** and areas of special interest | `/about` |
| **Genuine reviews** | Only after they exist — then `AggregateRating` schema becomes legitimate |
| **Social media profiles** | `src/config/site.ts` → `socialProfiles` (empty; hidden when empty) |
| **Google Business Profile URL** | `src/config/site.ts` → `googleBusinessProfileUrl` |

> ⚠️ Do not add any of these speculatively. Publishing an unverified healthcare
> credential is an advertising-standards and professional-conduct issue, not just
> an SEO one. The unit tests in `tests/unit/content.test.ts` will fail the build
> if forbidden claims are introduced into the content files.

---

## 3. Legal review

All four policy templates carry a visible "requires legal review" notice and must
be reviewed by a qualified adviser:

- [ ] Privacy Policy — especially the **Article 9 condition** for any health data
      and the international transfer section
- [ ] Cookie Policy
- [ ] Terms and Conditions — especially the **liability** clause and **consumer
      cancellation rights** for distance contracts
- [ ] Booking and Cancellation Policy — especially any charge for late
      cancellation

Also confirm:

- [ ] Whether ICO registration is required for your processing
- [ ] That your professional indemnity insurance covers the service as described
- [ ] Who is responsible for handling subject access and erasure requests

Remove the review notice (`showReviewNotice={false}`) from each `LegalPage` once
the review is complete.

---

## 4. Technical setup requiring credentials

| Task | Credential needed |
| --- | --- |
| Production database | `DATABASE_URL` from your provider |
| Live email sending | Resend account, **domain verified with SPF + DKIM**, `RESEND_API_KEY` — see [`email-setup.md`](email-setup.md) |
| Email deliverability | DMARC record at `_dmarc`, and a single merged SPF record covering both Titan and Resend |
| Admin access | `npm run admin:hash` — generates all three secrets |
| Bot protection (optional) | Cloudflare Turnstile site and secret keys |
| Analytics (optional) | Plausible or Umami account |
| Address lookup (optional) | getAddress.io or Ideal Postcodes key |
| Google Search Console | DNS TXT verification |
| Google Business Profile | Video verification |

---

## 5. Final verification

```bash
npm run verify                                  # types, lint, unit tests, SEO audit
npm run build                                   # production build
npx playwright test tests/e2e/site.spec.ts      # no database needed
npx playwright test                             # full suite; needs a database
```

Then, on the live site:

- [ ] Submit a real booking and confirm both emails arrive
- [ ] Confirm the confirmation page shows a reference and the URL contains none
- [ ] Sign in to `/admin/bookings`, confirm the booking, then cancel it
- [ ] Confirm the cancelled slot becomes bookable again
- [ ] Test the tel: and WhatsApp links on a real phone
- [ ] Run Lighthouse on mobile for `/` and `/book-appointment`
- [ ] Read every page on a phone, checking for anything inaccurate

---

## 6. Ongoing owner responsibilities

- Monitor `BOOKING_NOTIFICATION_EMAIL` daily — this is how bookings arrive
- Confirm or reschedule pending bookings promptly; the site promises you will
- Keep opening hours in sync between `src/config/booking.ts` and the Google
  Business Profile
- Add closure dates to `blockedDates` or the `BlockedDate` table **before** the
  dates arrive
- Ask every customer for a review, the same way, every time
- Review the policy pages annually, or whenever your processing changes
- Run `npm audit` monthly and apply security updates
