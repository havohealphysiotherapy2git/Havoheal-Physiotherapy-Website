'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, MessageCircle, CalendarCheck } from 'lucide-react';
import { telHref, whatsappHref } from '@/config/site';
import { track } from '@/lib/analytics';

/**
 * Persistent mobile conversion bar: Call, WhatsApp, Book Online.
 *
 * Hidden on the booking page itself, where it would compete with the form's own
 * controls and cover the submit button on small screens.
 */
export function MobileActionBar() {
  const pathname = usePathname();
  if (pathname.startsWith('/book-appointment') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <nav aria-label="Quick actions" className="grid grid-cols-3 gap-px bg-slate-200">
        <a
          href={telHref}
          onClick={() => track('click_to_call', { location: 'mobile_bar' })}
          className="flex min-h-[60px] flex-col items-center justify-center gap-1 bg-white px-2 py-2 text-xs font-semibold text-brand-900 transition active:bg-brand-50"
        >
          <Phone className="size-5 text-brand-700" aria-hidden="true" />
          Call
        </a>
        <a
          href={whatsappHref()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('click_to_whatsapp', { location: 'mobile_bar' })}
          className="flex min-h-[60px] flex-col items-center justify-center gap-1 bg-white px-2 py-2 text-xs font-semibold text-[#0b6242] transition active:bg-emerald-50"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          WhatsApp
        </a>
        <Link
          href="/book-appointment"
          onClick={() => track('begin_booking', { location: 'mobile_bar' })}
          className="flex min-h-[60px] flex-col items-center justify-center gap-1 bg-gradient-to-br from-brand-600 to-brand-800 px-2 py-2 text-center text-[0.68rem] font-semibold leading-tight text-white transition active:from-brand-700 active:to-brand-900"
        >
          <CalendarCheck className="size-5" aria-hidden="true" />
          Book Home Visit
        </Link>
      </nav>
    </div>
  );
}
