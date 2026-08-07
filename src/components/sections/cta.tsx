'use client';

import Link from 'next/link';
import { Phone, MessageCircle, CalendarCheck, Clock, BadgePoundSterling, House } from 'lucide-react';
import { company, telHref, whatsappHref } from '@/config/site';
import { priceLabel, bookingConfig } from '@/config/booking';
import { Button } from '@/components/ui/button';
import { MovementArcs } from '@/components/graphics/decor';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/** The three booking routes, used in several places on every page type. */
export function BookingActions({
  location,
  className,
  variant = 'default',
  block = false,
}: {
  location: string;
  className?: string;
  variant?: 'default' | 'onDark';
  block?: boolean;
}) {
  const onDark = variant === 'onDark';
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap', className)}>
      <Button asChild size="lg" block={block} variant={onDark ? 'accent' : 'primary'}>
        <Link
          href="/book-appointment"
          onClick={() => track('begin_booking', { location })}
        >
          <CalendarCheck aria-hidden="true" />
          Book a {priceLabel} Home Visit
        </Link>
      </Button>

      <Button asChild size="lg" block={block} variant={onDark ? 'onDark' : 'secondary'}>
        <a href={telHref} onClick={() => track('click_to_call', { location })}>
          <Phone aria-hidden="true" />
          Call to Book
        </a>
      </Button>

      <Button asChild size="lg" block={block} variant={onDark ? 'onDark' : 'whatsapp'}>
        <a
          href={whatsappHref()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('click_to_whatsapp', { location })}
        >
          <MessageCircle aria-hidden="true" />
          Book on WhatsApp
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </Button>
    </div>
  );
}

/** Closing call to action used at the foot of every content page. */
export function FinalCta({
  heading = 'Choose a convenient 45-minute home visit',
  body = 'Pick a date and time that works for you, or speak to someone first. Whichever route you choose, we come to you and the price is the same.',
  location,
}: {
  heading?: string;
  body?: string;
  location: string;
}) {
  return (
    <section className="section">
      <div className="container">
        <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-800 via-brand-900 to-ocean-950 px-6 py-12 shadow-lift on-dark sm:px-10 lg:px-14 lg:py-16">
          <MovementArcs className="absolute -bottom-16 -right-10 h-80 w-80 opacity-25" />

          <div className="relative max-w-2xl">
            <h2 className="text-3xl text-white sm:text-4xl">{heading}</h2>
            <p className="mt-4 text-lg leading-relaxed text-brand-100">{body}</p>

            <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm text-brand-100">
              <div className="flex items-center gap-2">
                <House className="size-4 text-brand-300" aria-hidden="true" />
                <dt className="sr-only">Where</dt>
                <dd>At your home</dd>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-brand-300" aria-hidden="true" />
                <dt className="sr-only">Appointment length</dt>
                <dd>{bookingConfig.slotDurationMinutes} minutes</dd>
              </div>
              <div className="flex items-center gap-2">
                <BadgePoundSterling className="size-4 text-brand-300" aria-hidden="true" />
                <dt className="sr-only">Price</dt>
                <dd>{priceLabel} fixed price</dd>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-brand-300" aria-hidden="true" />
                <dt className="sr-only">Phone and WhatsApp</dt>
                <dd>{company.phoneDisplay}</dd>
              </div>
            </dl>

            <BookingActions location={location} variant="onDark" className="mt-8" />
          </div>
        </div>
      </div>
    </section>
  );
}
