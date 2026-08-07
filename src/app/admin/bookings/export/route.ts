import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';

import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { bookingStatuses, type BookingStatus } from '@/config/booking';

/**
 * CSV export of bookings, filtered exactly like the admin list.
 *
 * Authentication is checked server-side on every request. Unauthenticated
 * callers get a 404 rather than a 401, so the endpoint does not advertise that
 * it exists.
 */
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return new NextResponse('Not found', { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const query = (params.get('q') ?? '').trim();
  const statusParam = params.get('status');
  const status = bookingStatuses.includes(statusParam as BookingStatus)
    ? (statusParam as BookingStatus)
    : undefined;
  const from = params.get('from')?.trim() || undefined;
  const to = params.get('to')?.trim() || undefined;

  const where: Prisma.BookingWhereInput = {
    ...(status ? { status } : {}),
    ...(from || to
      ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
    ...(query
      ? {
          OR: [
            { reference: { contains: query, mode: 'insensitive' } },
            { fullName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
            { postcode: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    take: 5000,
  });

  const headers = [
    'Reference',
    'Status',
    'Date',
    'Start',
    'End',
    'Duration (minutes)',
    'Price (GBP)',
    'Full name',
    'Phone',
    'Email',
    'Postcode',
    'Address',
    'Important message',
    'Staff notes',
    'Created (UTC)',
    'Confirmed (UTC)',
    'Cancelled (UTC)',
    'Completed (UTC)',
  ];

  const rows = bookings.map((booking) => [
    booking.reference,
    booking.status,
    booking.date,
    booking.startTime,
    booking.endTime,
    String(booking.durationMinutes),
    (booking.priceInPence / 100).toFixed(2),
    booking.fullName,
    booking.phone,
    booking.email,
    booking.postcode,
    booking.address,
    booking.importantMessage ?? '',
    booking.staffNotes ?? '',
    booking.createdAt.toISOString(),
    booking.confirmedAt?.toISOString() ?? '',
    booking.cancelledAt?.toISOString() ?? '',
    booking.completedAt?.toISOString() ?? '',
  ]);

  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  const filename = `havoheal-bookings-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(`﻿${csv}`, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

/**
 * Escapes a CSV field.
 *
 * Values starting with =, +, - or @ are prefixed with a single quote so that a
 * spreadsheet cannot interpret customer-supplied text as a formula (CSV
 * injection), which matters because this export contains free-text fields.
 */
function escapeCsv(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}
