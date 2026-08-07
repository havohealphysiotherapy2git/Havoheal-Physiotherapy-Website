import { bookingStatusLabels, type BookingStatus } from '@/config/booking';
import { cn } from '@/lib/utils';

/**
 * Status pill. Status is always spelled out in words as well as colour, so it
 * is never communicated by colour alone.
 */
const styles: Record<BookingStatus, string> = {
  PENDING: 'border-sand-300 bg-sand-50 text-sand-900',
  CONFIRMED: 'border-brand-300 bg-brand-50 text-brand-900',
  RESCHEDULED: 'border-ocean-300 bg-ocean-50 text-ocean-900',
  CANCELLED: 'border-coral-300 bg-coral-50 text-coral-900',
  COMPLETED: 'border-slate-300 bg-slate-100 text-slate-800',
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        styles[status],
      )}
    >
      {bookingStatusLabels[status]}
    </span>
  );
}
