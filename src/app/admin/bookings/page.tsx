import Link from 'next/link';
import { Download, LogOut, Search } from 'lucide-react';
import type { Prisma } from '@prisma/client';

import { requireAdmin } from '@/lib/admin-auth';
import { adminLogout } from '@/app/actions/admin';
import { prisma } from '@/lib/prisma';
import { bookingStatusLabels, bookingStatuses, type BookingStatus } from '@/config/booking';
import { formatLongDate } from '@/lib/slots';
import { formatPrice } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/status-badge';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

type SearchParams = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: string;
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const query = (params.q ?? '').trim();
  const status = bookingStatuses.includes(params.status as BookingStatus)
    ? (params.status as BookingStatus)
    : undefined;
  const from = params.from?.trim() || undefined;
  const to = params.to?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  // Prisma parameterises every value, so none of these filters can be used for
  // SQL injection even though they come straight from the query string.
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

  const [bookings, total, statusCounts] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
    prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const exportQuery = new URLSearchParams();
  if (query) exportQuery.set('q', query);
  if (status) exportQuery.set('status', status);
  if (from) exportQuery.set('from', from);
  if (to) exportQuery.set('to', to);

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">Bookings</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {total} {total === 1 ? 'booking' : 'bookings'} matching the current filters.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <a href={`/admin/bookings/export?${exportQuery.toString()}`}>
              <Download aria-hidden="true" />
              Export CSV
            </a>
          </Button>
          <form action={adminLogout}>
            <Button type="submit" size="sm" variant="subtle">
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </div>
      </div>

      {/* Status summary */}
      <ul className="mt-6 flex flex-wrap gap-2">
        {bookingStatuses.map((value) => {
          const count = statusCounts.find((row) => row.status === value)?._count._all ?? 0;
          return (
            <li key={value}>
              <Link
                href={`/admin/bookings?status=${value}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-soft transition hover:border-brand-300 hover:bg-brand-50"
              >
                {bookingStatusLabels[value]}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Filters */}
      <form
        method="get"
        className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <label htmlFor="filter-q" className="block text-sm font-semibold text-ink">
            Search
          </label>
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Reference, name, email, phone or postcode"
            className="mt-1.5 block min-h-[44px] w-full rounded-xl border-2 border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="filter-status" className="block text-sm font-semibold text-ink">
            Status
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={status ?? ''}
            className="mt-1.5 block min-h-[44px] w-full rounded-xl border-2 border-slate-300 px-3 py-2"
          >
            <option value="">All statuses</option>
            {bookingStatuses.map((value) => (
              <option key={value} value={value}>
                {bookingStatusLabels[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-from" className="block text-sm font-semibold text-ink">
            From date
          </label>
          <input
            id="filter-from"
            name="from"
            type="date"
            defaultValue={from ?? ''}
            className="mt-1.5 block min-h-[44px] w-full rounded-xl border-2 border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="filter-to" className="block text-sm font-semibold text-ink">
            To date
          </label>
          <input
            id="filter-to"
            name="to"
            type="date"
            defaultValue={to ?? ''}
            className="mt-1.5 block min-h-[44px] w-full rounded-xl border-2 border-slate-300 px-3 py-2"
          />
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit" size="sm">
            <Search aria-hidden="true" />
            Apply filters
          </Button>
          <Button asChild size="sm" variant="subtle">
            <Link href="/admin/bookings">Clear</Link>
          </Button>
        </div>
      </form>

      {/* Results */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Booking requests, ordered by appointment date
          </caption>
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-50">
              <th scope="col" className="px-4 py-3 font-semibold">
                Reference
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Appointment
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Customer
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Area
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Received
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                  No bookings match these filters.
                </td>
              </tr>
            )}
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
                  >
                    {booking.reference}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="block font-medium">{formatLongDate(booking.date)}</span>
                  <span className="text-ink-muted">
                    {booking.startTime} – {booking.endTime} ·{' '}
                    {formatPrice(booking.priceInPence)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="block font-medium">{booking.fullName}</span>
                  <span className="text-ink-muted">{booking.phone}</span>
                </td>
                <td className="px-4 py-3">{booking.postcode}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {booking.createdAt.toISOString().slice(0, 16).replace('T', ' ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-ink-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild size="sm" variant="secondary">
                <Link href={buildPageHref(params, page - 1)} rel="prev">
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild size="sm" variant="secondary">
                <Link href={buildPageHref(params, page + 1)} rel="next">
                  Next
                </Link>
              </Button>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

function buildPageHref(params: SearchParams, page: number): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  search.set('page', String(page));
  return `/admin/bookings?${search.toString()}`;
}
