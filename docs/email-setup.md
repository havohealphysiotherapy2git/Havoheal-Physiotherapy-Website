# Email setup — sending domain, DNS and delivery

The booking system sends two emails per submission:

| Email | To | From | Reply-to |
| --- | --- | --- | --- |
| **Customer acknowledgement** | the address entered in the booking form | `Havoheal Physiotherapy <bookings@havohealphysiotherapy.co.uk>` | `bookings@havohealphysiotherapy.co.uk` |
| **Business notification** | `bookings@havohealphysiotherapy.co.uk` | the same From address | the **customer's** address, so replying reaches them directly |

Both are configured through environment variables — no address is hard-coded in
the application, and no user input can influence the sender or recipient.

---

## 1. The mailbox and the sender are two different things

This trips people up, so it is worth stating plainly:

> **Owning the Titan mailbox for `bookings@havohealphysiotherapy.co.uk` does not
> authorise Resend — or any other transactional provider — to send email as that
> address.**

- **Titan** receives and stores mail sent *to* the address. That is governed by
  your **MX** records.
- **Resend** sends mail *from* the address on the application's behalf. That is
  governed by **SPF** and **DKIM** records.

They coexist. Adding Resend's sending records does **not** break Titan, and you
should **not** remove or modify your existing Titan MX records unless Titan
itself tells you to.

---

## 2. Verify the domain with Resend

1. Sign in at <https://resend.com> → **Domains** → **Add Domain**.
2. Enter `havohealphysiotherapy.co.uk`.
3. Resend generates DNS records. Add them at your DNS provider exactly as shown:

| Type | Typical host | Purpose |
| --- | --- | --- |
| `TXT` | `resend._domainkey` (or as shown) | **DKIM** — cryptographically signs your mail |
| `TXT` | `send` or the root `@` | **SPF** — authorises Resend's servers to send |
| `MX` | `send` (subdomain only) | Bounce handling — does **not** affect your Titan inbox |

4. Wait for propagation (usually minutes, occasionally up to 24 hours) and press
   **Verify** in Resend.
5. Create an API key (**API Keys** → **Create**) with send permission only, and
   set it as `RESEND_API_KEY` on your hosting platform. Never commit it.

---

## 3. SPF — do not create a second record

**A domain may have only one SPF TXT record.** Two records is a misconfiguration
that causes SPF to fail outright, which will send your booking emails to spam.

If Titan already added an SPF record, you will have something like:

```
v=spf1 include:spf.titan.email ~all
```

Do **not** add a second record. **Merge** the new sender into the existing one:

```
v=spf1 include:spf.titan.email include:_spf.resend.com ~all
```

Rules when merging:

- Exactly one `v=spf1` record for the domain.
- One `include:` per authorised sender.
- The record ends with a single `~all` (soft fail) or `-all` (hard fail).
- Keep the total under 10 DNS lookups — each `include:` counts.

Check the result with:

```bash
dig +short TXT havohealphysiotherapy.co.uk
```

Exactly one line should begin `v=spf1`.

---

## 4. DKIM

Add the `TXT` record Resend gives you verbatim — the value is a public key and
is easy to truncate by accident when copying. Verify with:

```bash
dig +short TXT resend._domainkey.havohealphysiotherapy.co.uk
```

Titan may also publish its own DKIM key on a different selector. That is fine:
unlike SPF, multiple DKIM records on different selectors are normal and expected.

---

## 5. DMARC

DMARC tells receiving servers what to do when SPF and DKIM fail, and gives you
reports. Start in monitoring mode:

```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:bookings@havohealphysiotherapy.co.uk; fo=1
```

After a couple of weeks of clean reports, tighten it:

```
v=DMARC1; p=quarantine; pct=100; rua=mailto:bookings@havohealphysiotherapy.co.uk
```

Do not start at `p=reject`. If SPF or DKIM is even slightly wrong, legitimate
booking acknowledgements will silently disappear.

---

## 6. Environment variables

```bash
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_..."                                    # never commit
BOOKING_FROM_EMAIL="Havoheal Physiotherapy <bookings@havohealphysiotherapy.co.uk>"
BOOKING_REPLY_TO_EMAIL="bookings@havohealphysiotherapy.co.uk"
BOOKING_NOTIFICATION_EMAIL="bookings@havohealphysiotherapy.co.uk"
```

`src/lib/env.ts` validates these at runtime and refuses to run with
`EMAIL_PROVIDER="resend"` unless the API key, the From address and the
notification recipient are all present.

In development and CI, leave `EMAIL_PROVIDER="console"`. Emails are logged with
the recipient masked and no body, so nothing real is ever sent by accident.

---

## 7. Pre-launch verification checklist

- [ ] Resend shows the domain as **Verified**
- [ ] `dig +short TXT havohealphysiotherapy.co.uk` returns exactly **one** SPF record
- [ ] That record includes both Titan and Resend
- [ ] DKIM record resolves at the selector Resend specified
- [ ] DMARC record exists at `_dmarc` (start with `p=none`)
- [ ] Titan **MX** records are unchanged and mail to the address still arrives
- [ ] A test booking produces an acknowledgement in the customer's inbox
- [ ] The same booking produces a notification at `bookings@havohealphysiotherapy.co.uk`
- [ ] Replying to the notification reaches the **customer**
- [ ] Replying to the acknowledgement reaches **bookings@**
- [ ] Neither email lands in spam (test Gmail, Outlook and one Apple address)
- [ ] Subject lines contain no name, address or health information
- [ ] The acknowledgement shows only the postcode, not the full address

Check the headers of a delivered message (in Gmail: **Show original**). You want:

```
SPF:   PASS
DKIM:  PASS
DMARC: PASS
```

---

## 8. Delivery failures

Email is sent **after** the booking is committed to the database, so a provider
outage can never lose a booking.

Each booking records what happened:

| Column | Meaning |
| --- | --- |
| `customerEmailStatus` | `PENDING` / `SENT` / `FAILED` / `SKIPPED` |
| `businessEmailStatus` | same, for the internal notification |
| `customerEmailSentAt`, `businessEmailSentAt` | delivery timestamps |
| `emailLastErrorCode` | a short code such as `provider_unreachable` — never a raw provider payload, which could contain personal data |
| `emailRetryCount` | incremented on each failure |

`SKIPPED` means the console provider was in use, not that anything went wrong.

**What the customer sees.** If the acknowledgement fails, the booking still
succeeds and the confirmation page says so, with a support message pointing at
`bookings@havohealphysiotherapy.co.uk`. No API error, credential or stack trace
is ever shown.

### Retrying

`getBookingsWithFailedEmail()` in `src/lib/bookings.ts` returns live bookings
whose email failed. There is no automatic retry job yet. To add one:

1. Create a route handler, e.g. `src/app/api/cron/retry-emails/route.ts`.
2. Protect it with a shared secret in an `Authorization` header — it must not be
   publicly callable.
3. Call `getBookingsWithFailedEmail()`, re-send via the same builders, and call
   `recordEmailOutcome()` for each.
4. Cap `emailRetryCount` (three attempts is plenty) so a permanently bad address
   is not retried forever.
5. Schedule it every 15 minutes (Vercel Cron or your platform's scheduler).

Until that exists, check for failures manually: any booking with
`customerEmailStatus = 'FAILED'` needs a phone call.

---

## 9. Privacy notes

- The **subject line** of both emails contains only the booking reference and,
  for the business copy, the date and time. Never a name, address or symptom —
  subject lines are visible on lock screens and in notification previews.
- The **customer acknowledgement** deliberately omits the full address and the
  free-text message. It shows the postcode only.
- The **business notification** contains the full address because the team needs
  it to attend. It is marked "do not forward outside the business".
- All customer-entered content is HTML-escaped before it enters an email body.
- The sender, reply-to and recipient are never derived from user input, and
  control characters are rejected before any value reaches a header — so the
  form cannot be used for email header injection.
