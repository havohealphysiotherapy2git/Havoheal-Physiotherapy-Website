/**
 * Development seed data.
 *
 * Creates a small, obviously-fictional set of bookings so the admin area and
 * the availability logic can be exercised locally. It refuses to run against a
 * production database, and it never invents review scores, testimonials or any
 * other content that could end up on the public site.
 *
 * Run with:  npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import { bookingConfig } from '../src/config/booking';
import { generateSlots, addDays, todayInBusinessTz, businessTimeToUtc } from '../src/lib/slots';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed a production database.');
  }

  const today = todayInBusinessTz();
  const slots = generateSlots();

  // Find the next few working days so the seeded bookings are always in future.
  const workingDays: string[] = [];
  for (let offset = 1; offset <= 30 && workingDays.length < 3; offset += 1) {
    const date = addDays(today, offset);
    const [year, month, day] = date.split('-').map(Number);
    const weekday = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
    if (bookingConfig.workingDays.includes(weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
      workingDays.push(date);
    }
  }

  const samples = [
    {
      reference: 'HH-SEED01',
      status: 'PENDING' as const,
      fullName: 'Sample Booking One',
      email: 'sample.one@example.com',
      phone: '07000000001',
      postcode: 'B15 2TT',
      address: '1 Example Street, Edgbaston',
      addressFlat: null,
      addressBuilding: null,
      accessInstructions: 'Sample data — side gate is unlocked, please knock at the back door.',
      parkingInformation: 'Sample data — parking is available on the driveway.',
      importantMessage: 'Sample data — ground floor flat, no stairs.',
      dateIndex: 0,
      slotIndex: 0,
    },
    {
      reference: 'HH-SEED02',
      status: 'CONFIRMED' as const,
      fullName: 'Sample Booking Two',
      email: 'sample.two@example.com',
      phone: '07000000002',
      postcode: 'WV1 1AA',
      address: '2 Example Road, Wolverhampton',
      addressFlat: 'Flat 4',
      addressBuilding: 'Example House',
      accessInstructions: 'Sample data — buzzer number 4, second floor, lift available.',
      parkingInformation: 'Sample data — permit zone, visitor bays at the rear.',
      importantMessage: null,
      dateIndex: 0,
      slotIndex: 3,
    },
    {
      reference: 'HH-SEED03',
      status: 'CANCELLED' as const,
      fullName: 'Sample Booking Three',
      email: 'sample.three@example.com',
      phone: '07000000003',
      postcode: 'B91 3RX',
      address: '3 Example Avenue, Solihull',
      addressFlat: null,
      addressBuilding: null,
      accessInstructions: 'Sample data — please ring the doorbell twice. Friendly dog indoors.',
      parkingInformation: null,
      importantMessage: null,
      dateIndex: 1,
      slotIndex: 5,
    },
  ];

  for (const sample of samples) {
    const date = workingDays[sample.dateIndex];
    const slot = slots[sample.slotIndex];
    if (!date || !slot) continue;

    await prisma.booking.upsert({
      where: { reference: sample.reference },
      update: {},
      create: {
        reference: sample.reference,
        date,
        startTime: slot.start,
        endTime: slot.end,
        startsAt: businessTimeToUtc(date, slot.start),
        durationMinutes: bookingConfig.slotDurationMinutes,
        priceInPence: bookingConfig.priceInPence,
        fullName: sample.fullName,
        email: sample.email,
        phone: sample.phone,
        postcode: sample.postcode,
        address: sample.address,
        addressFlat: sample.addressFlat,
        addressBuilding: sample.addressBuilding,
        accessInstructions: sample.accessInstructions,
        parkingInformation: sample.parkingInformation,
        importantMessage: sample.importantMessage,
        consentPrivacy: true,
        consentPolicy: true,
        consentContact: true,
        confirmedServiceArea: true,
        confirmedAddressAccurate: true,
        confirmedRequestNotBooking: true,
        consentedAt: new Date(),
        status: sample.status,
        idempotencyKey: `seed-${sample.reference}`,
        events: {
          create: [
            {
              type: 'created',
              actor: 'system',
              detail: 'Seeded sample booking for local development.',
            },
          ],
        },
      },
    });
  }

  // A blocked date example, one month out, so the calendar logic is visible.
  const blocked = addDays(today, 30);
  await prisma.blockedDate.upsert({
    where: { date: blocked },
    update: {},
    create: { date: blocked, reason: 'Seeded example: business closed' },
  });

  const count = await prisma.booking.count();
  console.info(`Seed complete. ${count} bookings in the database.`);
  console.info(`Example blocked date: ${blocked}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
