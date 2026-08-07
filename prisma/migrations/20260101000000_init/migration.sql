-- Havoheal Physiotherapy UK LTD — initial schema.
--
-- NOTE: editing an applied migration changes its checksum, and `prisma migrate
-- deploy` will refuse to run against a database that already applied the old
-- file. This is a comment-only change made before any database existed. If you
-- have already migrated a database from an earlier copy of this repository, run
-- `prisma migrate resolve --applied 20260101000000_init` there once.

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priceInPence" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "importantMessage" TEXT,
    "consentPrivacy" BOOLEAN NOT NULL,
    "consentPolicy" BOOLEAN NOT NULL,
    "consentContact" BOOLEAN NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "staffNotes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rescheduledFrom" TEXT,
    "idempotencyKey" TEXT,
    "requestFingerprint" TEXT,
    "acknowledgementEmailSentAt" TIMESTAMP(3),
    "notificationEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "consentContact" BOOLEAN NOT NULL,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");
CREATE INDEX "Booking_date_startTime_idx" ON "Booking"("date", "startTime");
CREATE INDEX "Booking_startsAt_idx" ON "Booking"("startsAt");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_email_idx" ON "Booking"("email");
CREATE INDEX "BookingEvent_bookingId_createdAt_idx" ON "BookingEvent"("bookingId", "createdAt");
CREATE UNIQUE INDEX "BlockedDate_date_key" ON "BlockedDate"("date");
CREATE UNIQUE INDEX "ContactMessage_reference_key" ON "ContactMessage"("reference");
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- DOUBLE-BOOKING GUARD
-- ---------------------------------------------------------------------------
-- A partial unique index: at most one LIVE booking per date + start time.
-- Cancelled bookings are excluded, so cancelling an appointment releases the
-- slot for someone else. Prisma cannot express partial indexes in
-- schema.prisma, so this constraint is intentionally SQL-only. When you change
-- the schema later, always use `prisma migrate dev --create-only` and confirm
-- the generated SQL does not drop this index.
CREATE UNIQUE INDEX "Booking_live_slot_unique"
    ON "Booking" ("date", "startTime")
    WHERE "status" IN ('PENDING', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED');
