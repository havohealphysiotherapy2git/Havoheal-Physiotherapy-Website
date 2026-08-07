import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

/** The admin area is never indexed and never linked from public navigation. */
export const metadata: Metadata = {
  title: 'Admin | Havoheal Physiotherapy UK LTD',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <Link href="/admin/bookings" className="flex items-center gap-2 font-semibold text-ink">
            <ShieldCheck className="size-5 text-brand-700" aria-hidden="true" />
            Booking admin
          </Link>
          <p className="text-sm text-ink-muted">
            Contains personal data — do not share this screen.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
