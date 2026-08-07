import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, Info, MessageCircle, Phone } from 'lucide-react';
import {
  company,
  emergencyNotice,
  medicalDisclaimer,
  registeredOffice,
  telHref,
  whatsappHref,
} from '@/config/site';
import { coverageCallout } from '@/config/areas';
import { cn } from '@/lib/utils';

/** Emergency notice. High contrast, never dismissible, never a pop-up. */
export function EmergencyNotice({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'rounded-2xl border-2 border-coral-300 bg-coral-50 p-5 text-coral-950',
        className,
      )}
      aria-labelledby="emergency-notice-title"
    >
      <h2
        id="emergency-notice-title"
        className="flex items-center gap-2 text-base font-semibold text-coral-900"
      >
        <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
        In an emergency
      </h2>
      <p className="mt-2 text-sm leading-relaxed">{emergencyNotice}</p>
    </aside>
  );
}

/** General medical disclaimer. */
export function MedicalDisclaimer({ className }: { className?: string }) {
  return (
    <aside
      className={cn('rounded-2xl border border-slate-200 bg-slate-50 p-5', className)}
      aria-labelledby="medical-disclaimer-title"
    >
      <h2
        id="medical-disclaimer-title"
        className="flex items-center gap-2 text-base font-semibold text-ink"
      >
        <Info className="size-5 shrink-0 text-ocean-700" aria-hidden="true" />
        About the information on this website
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{medicalDisclaimer}</p>
    </aside>
  );
}

/** "Not sure whether we cover your address?" callout. */
export function CoverageCallout({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 sm:p-8',
        className,
      )}
    >
      <h2 className="text-xl text-ink sm:text-2xl">{coverageCallout.heading}</h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
        Coverage is subject to postcode and appointment availability. Send us your postcode by
        WhatsApp or call{' '}
        <a
          href={telHref}
          className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
        >
          {company.phoneDisplay}
        </a>{' '}
        to confirm.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a
          href={whatsappHref(
            'Hello Havoheal Physiotherapy, I would like to enquire about booking a home physiotherapy visit. My postcode is:',
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#0f7a52] bg-[#0f7a52] px-5 py-3 font-semibold text-white transition hover:bg-[#0b6242]"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          Check my postcode on WhatsApp
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a
          href={telHref}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-brand-700 bg-white px-5 py-3 font-semibold text-brand-800 transition hover:bg-brand-50"
        >
          <Phone className="size-5" aria-hidden="true" />
          Call {company.phoneDisplay}
        </a>
      </div>
    </div>
  );
}

/** Small reminder that the registered office is not a clinic. */
export function RegisteredOfficeNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-sm leading-relaxed text-ink-muted', className)}>
      {company.legalName} is registered at {registeredOffice.line1}, {registeredOffice.city},{' '}
      {registeredOffice.region}, {registeredOffice.postcode} (company number{' '}
      {company.companyNumber}). That is our registered office address, not a clinic, and it is
      not somewhere customers attend. Appointments are delivered at your own home across
      Birmingham and the surrounding towns — see{' '}
      <Link
        href="/areas-we-cover"
        className="font-medium text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
      >
        our home-visit coverage area
      </Link>
      .
    </p>
  );
}

/** Placeholder marker for facts the business owner must supply. */
export function OwnerPlaceholder({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'rounded-md bg-sand-100 px-1.5 py-0.5 font-medium text-sand-900 ring-1 ring-inset ring-sand-300',
        className,
      )}
    >
      {children}
    </span>
  );
}
