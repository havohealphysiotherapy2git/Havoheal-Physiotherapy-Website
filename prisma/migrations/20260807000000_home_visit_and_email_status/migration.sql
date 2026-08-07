-- Home-visit address detail, customer declarations, and email delivery tracking.

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- AlterTable: optional home-visit address detail
ALTER TABLE "Booking" ADD COLUMN     "addressFlat" TEXT,
                      ADD COLUMN     "addressBuilding" TEXT,
                      ADD COLUMN     "accessInstructions" TEXT,
                      ADD COLUMN     "parkingInformation" TEXT;

-- AlterTable: customer declarations captured at submission
-- Defaults keep existing rows valid; new submissions always set them explicitly.
ALTER TABLE "Booking" ADD COLUMN     "confirmedServiceArea" BOOLEAN NOT NULL DEFAULT false,
                      ADD COLUMN     "confirmedAddressAccurate" BOOLEAN NOT NULL DEFAULT false,
                      ADD COLUMN     "confirmedRequestNotBooking" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: email delivery tracking
ALTER TABLE "Booking" ADD COLUMN     "customerEmailStatus" "EmailStatus" NOT NULL DEFAULT 'PENDING',
                      ADD COLUMN     "businessEmailStatus" "EmailStatus" NOT NULL DEFAULT 'PENDING',
                      ADD COLUMN     "customerEmailSentAt" TIMESTAMP(3),
                      ADD COLUMN     "businessEmailSentAt" TIMESTAMP(3),
                      ADD COLUMN     "emailLastErrorCode" TEXT,
                      ADD COLUMN     "emailRetryCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill: rows that already recorded a send timestamp were delivered.
UPDATE "Booking"
   SET "customerEmailStatus" = 'SENT',
       "customerEmailSentAt" = "acknowledgementEmailSentAt"
 WHERE "acknowledgementEmailSentAt" IS NOT NULL;

UPDATE "Booking"
   SET "businessEmailStatus" = 'SENT',
       "businessEmailSentAt" = "notificationEmailSentAt"
 WHERE "notificationEmailSentAt" IS NOT NULL;

-- The superseded timestamp columns are replaced by the status fields above.
ALTER TABLE "Booking" DROP COLUMN "acknowledgementEmailSentAt",
                      DROP COLUMN "notificationEmailSentAt";

-- Lets the admin area and any retry job find bookings whose email did not send.
CREATE INDEX "Booking_customerEmailStatus_idx" ON "Booking"("customerEmailStatus");
CREATE INDEX "Booking_businessEmailStatus_idx" ON "Booking"("businessEmailStatus");
