# Deployment guide

How to get the Havoheal Physiotherapy UK LTD website into production, apply database
migrations safely, and roll back if something goes wrong.

---

## 1. Choose a database

Any managed PostgreSQL 14+ service works. Pick a **UK or EU region** so personal
data stays close to home and the transfer section of the Privacy Policy stays
simple.

| Provider | Notes |
| --- | --- |
| Neon | Serverless Postgres, generous free tier, London region available |
| Supabase | Postgres plus a dashboard; London region available |
| Railway | Simple, good for small workloads |
| AWS RDS | Most control, most operational overhead |

Whichever you pick, make sure the connection string enforces TLS:

```
postgresql://user:password@host:5432/havoheal?sslmode=require
```

---

## 2. Deploy to Vercel (recommended)

1. **Push to GitHub.** Confirm `.env` is not in the repository:
   ```bash
   git ls-files | grep -E "^\.env$" && echo "STOP — .env is tracked"
   ```
2. **Import the project** at <https://vercel.com/new>. Next.js is detected
   automatically; leave the build command as `npm run build`.
3. **Add environment variables** (Project → Settings → Environment Variables) for
   both Production and Preview. Use every key in `.env.example`. Generate the
   three secrets with:
   ```bash
   npm run admin:hash -- "a-long-random-password"
   ```
4. **Set the region** to London (`lhr1`) under Settings → Functions, so server
   rendering happens near your database and your visitors.
5. **Deploy.**
6. **Apply migrations** against the production database:
   ```bash
   DATABASE_URL="<production-url>" npm run db:deploy
   ```
7. **Verify slot uniqueness is not enforced**, so several patients can request
   the same time:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'Booking';
   -- Booking_live_slot_unique must NOT be listed (dropped in
   -- 20260807120000_allow_concurrent_slot_bookings).
   -- Booking_reference_key and Booking_idempotencyKey_key must still be there.
   ```
8. **Add the domain** (see README §15) and set `NEXT_PUBLIC_SITE_URL` to the
   final HTTPS origin, then redeploy so canonicals are correct.

### Preview deployments

Preview builds should **never** point at the production database. Give them their
own `DATABASE_URL` and keep `EMAIL_PROVIDER="console"` so no real email is sent
from a preview.

---

## 3. Self-hosting (Node or Docker)

```bash
npm ci
npm run build
npm run db:deploy
npm run start    # listens on PORT, default 3000
```

Run it behind a reverse proxy (nginx, Caddy) that terminates TLS. The
application already sends HSTS, CSP and the other security headers, so the proxy
should pass them through rather than replacing them.

Minimal Dockerfile:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
USER app
EXPOSE 3000
CMD ["npm", "run", "start"]
```

> On a single self-hosted instance the in-memory rate limiter is effective. If
> you scale to several instances, put a rate limit in front (Cloudflare, or your
> proxy) or swap the store in `src/lib/rate-limit.ts` for Redis.

---

## 4. Migration strategy

| Situation | Command |
| --- | --- |
| New migration during development | `npm run db:migrate` |
| Schema change that must preserve the partial index | `npx prisma migrate dev --create-only`, review the SQL, then `npm run db:migrate` |
| Deploying to production | `npm run db:deploy` |
| Inspecting data | `npm run db:studio` |

**Always** run `db:deploy` *before* or *as part of* the release that needs the
new columns, and prefer additive changes (new nullable columns) so an old
instance can keep serving during the rollout.

Never run `prisma migrate reset` against production — it drops all data.

---

## 5. Post-deployment verification

Run through this every time you deploy something non-trivial:

```bash
# 1. The site responds and is indexable
curl -sI https://havohealphysiotherapy.co.uk | head -n 20
curl -s  https://havohealphysiotherapy.co.uk/robots.txt
curl -s  https://havohealphysiotherapy.co.uk/sitemap.xml | head -n 20

# 2. Security headers are present
curl -sI https://havohealphysiotherapy.co.uk | grep -iE "content-security|strict-transport|x-frame|x-content-type"

# 3. A missing page really returns 404
curl -sI https://havohealphysiotherapy.co.uk/nope | head -n 1

# 4. Admin is not reachable when signed out
curl -sI https://havohealphysiotherapy.co.uk/admin/bookings/export | head -n 1   # expect 404
```

Then, in a browser:

1. Submit a real booking request end to end.
2. Confirm the acknowledgement email arrives and the business notification
   arrives at `BOOKING_NOTIFICATION_EMAIL`.
3. Confirm the confirmation page shows the reference and that the URL contains
   **no** booking details.
4. Sign in to `/admin/bookings`, find the booking, confirm it, and check the
   audit trail records who did it and when.
5. Cancel the test booking so the slot is released.

You can also run the database-free end-to-end suite against production:

```bash
PLAYWRIGHT_BASE_URL=https://havohealphysiotherapy.co.uk npx playwright test tests/e2e/site.spec.ts
```

---

## 6. Rollback

**Application:** in Vercel, Deployments → the previous good deployment →
"Promote to Production". Self-hosted: redeploy the previous image or tag.

**Database:** migrations are forward-only by design. If a migration causes a
problem:

1. Stop writes if data integrity is at risk.
2. Restore from the most recent backup (see
   [`backup-and-recovery.md`](backup-and-recovery.md)).
3. Write a new corrective migration rather than editing an applied one.

Never edit a migration that has already run in production.

---

## 7. Monitoring

At minimum:

- **Uptime:** a check every 5 minutes on `/` and `/book-appointment`.
- **Error tracking:** Vercel's runtime logs, or add Sentry if you want alerting.
  If you add Sentry, remember to scrub personal data before sending events.
- **Email delivery:** watch the Resend dashboard for bounces; a bounced
  acknowledgement means a customer thinks they have booked and has heard nothing.
- **Booking volume:** a sudden drop to zero usually means a broken form, not a
  quiet week. Check `/book-appointment` manually if bookings stop.
