-- Allow several patients to request the same date and start time.
--
-- WHY: the business dispatches multiple physiotherapists, so a slot is not a
-- single exclusive resource. The partial unique index created in the initial
-- migration enforced one live booking per (date, startTime), which is the wrong
-- model for a capacity-based service and would reject a second patient at 10:00.
--
-- Per-slot limits are now a configuration concern
-- (`bookingConfig.maxBookingsPerSlot`), enforced inside the insert transaction
-- when a number is set. It is deliberately NOT a database constraint, because
-- the limit is a business setting that changes with staffing rather than a
-- data-integrity invariant.
--
-- Nothing else is relaxed: the unique constraints on "reference" and
-- "idempotencyKey" remain, so booking references stay unique and a repeated
-- submission still cannot create a duplicate booking.

DROP INDEX IF EXISTS "Booking_live_slot_unique";

-- The plain (non-unique) lookup index on the same columns is retained: it is
-- what makes the capacity count and the admin day view fast.
-- ("Booking_date_startTime_idx" was created in the initial migration.)
