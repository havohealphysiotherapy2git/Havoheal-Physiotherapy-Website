# Backup and recovery

Booking records contain personal data and are the operational record of the
business. Losing them means missed appointments and a data-protection incident.

---

## What needs backing up

| Asset | Where it lives | Backup method |
| --- | --- | --- |
| **Booking data** | PostgreSQL | Automated provider backups + periodic manual dumps |
| **Application code** | Git | The repository, pushed to a remote |
| **Environment secrets** | Hosting platform | A password manager (never a file in the repo) |
| **Email records** | Email provider | Provider retention; export if needed |
| **DNS configuration** | Registrar | Screenshot or export the zone file |

Only the first genuinely cannot be recreated.

---

## Database backups

### Automated (set this up before launch)

Every managed provider offers automated backups. Configure:

- **Frequency:** daily at minimum. Point-in-time recovery if the plan includes it.
- **Retention:** 30 days is a sensible minimum for a booking system.
- **Region:** the same UK/EU region as the database.

| Provider | Where |
| --- | --- |
| Neon | Project → Settings → point-in-time restore window |
| Supabase | Project → Database → Backups |
| Railway | Service → Settings → Backups |
| AWS RDS | Automated backups + snapshot retention |

### Manual dump

Take one before any risky migration, and monthly as an off-provider copy:

```bash
pg_dump "$DATABASE_URL" --format=custom --file="havoheal-$(date +%Y-%m-%d).dump"
```

Store it encrypted and access-controlled. **A database dump is a file full of
patients' names, addresses, phone numbers and messages** — treat it accordingly:

- Never in the repository, a shared drive or an email attachment
- Encrypted at rest
- Deleted on a schedule that matches your retention policy

---

## Restoring

### Full restore

```bash
# 1. Create a fresh, empty database
createdb havoheal_restore

# 2. Restore the dump
pg_restore --dbname="postgresql://user:pass@host:5432/havoheal_restore" \
           --clean --if-exists havoheal-2026-08-06.dump

# 3. Verify before switching anything over
psql "$RESTORE_URL" -c "SELECT COUNT(*), MIN(\"createdAt\"), MAX(\"createdAt\") FROM \"Booking\";"
psql "$RESTORE_URL" -c "SELECT indexname FROM pg_indexes WHERE tablename = 'Booking';"

# 4. Point DATABASE_URL at the restored database and redeploy
```

**After a restore, confirm `Booking_reference_key` and
`Booking_idempotencyKey_key` are present.** Those keep booking references unique
and stop a repeated submission creating a duplicate.

`Booking_live_slot_unique` should **not** exist — it was dropped deliberately so
several patients can request the same time. If a restore from an old backup
brings it back, re-apply
`20260807120000_allow_concurrent_slot_bookings`, or bookings will start failing
whenever two patients want the same slot.

### Restoring a single booking

Deleting or overwriting one record does not justify a full restore. Restore the
dump to a scratch database, find the row, and copy the values across manually.

---

## Test your restore

**An untested backup is not a backup.** Do this once before launch and then every
six months:

1. Take a fresh dump of production.
2. Restore it to a throwaway database.
3. Point a local dev instance at the restored copy.
4. Confirm: bookings appear in the admin list, the audit trail is intact, and the
   partial unique index exists.
5. Record the date and the time it took.
6. Destroy the throwaway database and delete the dump.

Knowing your recovery takes twenty minutes is worth far more than assuming it
will work.

---

## Recovery objectives

For a business of this size, sensible targets:

| Objective | Target | Meaning |
| --- | --- | --- |
| **RPO** (recovery point) | 24 hours | At most one day of bookings could be lost |
| **RTO** (recovery time) | 4 hours | Back online within half a working day |

If those are not acceptable, move to a provider plan with point-in-time recovery
(RPO measured in minutes).

**If bookings are lost:** the acknowledgement emails are a secondary record. The
business notification email for every booking contains the full details, so the
notification mailbox is an informal backup of last resort. That is a reason to
keep it, not a substitute for real backups.

---

## Incident response

If you suspect a data breach — unauthorised access, a leaked dump, a compromised
admin account:

1. **Contain.** Rotate `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` and
   `BOOKING_CONFIRMATION_SECRET` immediately; rotating the session secret signs
   everyone out. Rotate the database credentials. Revoke the email API key.
2. **Assess.** What data, how many people, over what period.
3. **Record.** Keep a written timeline from the moment you noticed. You will need
   it.
4. **Report.** Under UK GDPR, a reportable personal data breach must be reported
   to the ICO **within 72 hours** of becoming aware of it:
   <https://ico.org.uk/for-organisations/report-a-breach/>
5. **Notify affected people** if there is a high risk to their rights and
   freedoms — promptly, in plain language, saying what happened and what to do.
6. **Fix and review.** Close the root cause, then review what let it happen.

Keep the ICO breach-reporting link and your adviser's contact details somewhere
you can find them under pressure — not only in this file.

---

## Data retention and deletion

The Privacy Policy commits to retention periods (currently set in
`src/config/legal.ts`). Backups must respect them too: a booking deleted from the
live database still exists in every backup taken before the deletion.

Practical approach:

- Keep backup retention (e.g. 30 days) shorter than any data retention period, so
  deleted records age out of backups naturally.
- If someone exercises their right to erasure, delete from the live database
  immediately and record that the data will persist in backups until they expire.
  That is an accepted position under UK GDPR, provided it is documented and the
  backups are not used to restore the deleted record.
- Document the process — and who is responsible for it — before launch.
