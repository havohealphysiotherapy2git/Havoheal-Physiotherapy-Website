import Link from 'next/link';
import { Phone, MessageCircle, MapPin, Building2, Mail } from 'lucide-react';
import {
  company,
  emergencyNotice,
  extraNav,
  legalNav,
  mailtoHref,
  mainNav,
  registeredOffice,
  registeredOfficeNotice,
  telHref,
  whatsappHref,
} from '@/config/site';
import { priceAndDurationLabel } from '@/config/booking';
import { Logomark, WaveDivider } from '@/components/graphics/decor';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-ink text-slate-300 on-dark">
      <WaveDivider fill="#ffffff" flip className="text-white" />

      <div className="container pb-12 pt-14">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Identity */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <Logomark className="size-11" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-xl font-semibold text-white">Havoheal</span>
                <span className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-brand-300">
                  Physiotherapy
                </span>
              </span>
            </div>

            <p className="mt-4 max-w-sm leading-relaxed text-slate-400">
              {priceAndDurationLabel}. Providing home-visit physiotherapy across{' '}
              {company.primaryServiceArea}. Book online, by phone, email or on WhatsApp.
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <p className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden="true" />
                <a
                  href={telHref}
                  className="font-semibold text-white underline decoration-brand-400/50 underline-offset-4 hover:decoration-brand-300"
                >
                  {company.phoneDisplay}
                </a>
              </p>
              <p className="flex items-start gap-3">
                <MessageCircle
                  className="mt-0.5 size-4 shrink-0 text-brand-300"
                  aria-hidden="true"
                />
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white underline decoration-brand-400/50 underline-offset-4 hover:decoration-brand-300"
                >
                  WhatsApp {company.phoneDisplay}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
              <p className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden="true" />
                <a
                  href={mailtoHref}
                  className="break-all font-semibold text-white underline decoration-brand-400/50 underline-offset-4 hover:decoration-brand-300"
                >
                  {company.email}
                </a>
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer" className="lg:col-span-5">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-300">
                  Explore
                </h2>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {mainNav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="inline-block py-1 text-slate-300 transition hover:text-white hover:underline underline-offset-4"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-300">
                  Booking and policies
                </h2>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {extraNav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="inline-block py-1 text-slate-300 transition hover:text-white hover:underline underline-offset-4"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  {legalNav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="inline-block py-1 text-slate-300 transition hover:text-white hover:underline underline-offset-4"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </nav>

          {/* Company details */}
          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-300">
              Company details
            </h2>
            <address className="mt-4 space-y-4 text-sm not-italic leading-relaxed text-slate-400">
              <p className="flex items-start gap-3">
                <Building2 className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span>
                  <span className="block font-semibold text-slate-200">{company.legalName}</span>
                  Registered office: {registeredOffice.line1}, {registeredOffice.city},{' '}
                  {registeredOffice.region}, {registeredOffice.postcode}
                  <span className="mt-1 block">Company number: {company.companyNumber}</span>
                </span>
              </p>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span>
                  Providing home-visit physiotherapy across {company.primaryServiceArea}
                </span>
              </p>
            </address>

            <p className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-slate-400">
              {registeredOfficeNotice}
            </p>
          </div>
        </div>

        <p className="mt-10 rounded-2xl border border-coral-400/30 bg-coral-500/10 p-4 text-sm font-medium text-coral-100">
          {emergencyNotice}
        </p>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {company.legalName}. All rights reserved.
          </p>
          <p>
            Website information is general and is not a substitute for personalised medical
            advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
