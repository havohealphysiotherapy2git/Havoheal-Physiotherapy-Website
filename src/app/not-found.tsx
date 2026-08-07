import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, CalendarCheck, Phone, Search } from 'lucide-react';

import { siteConfig, telHref, mainNav } from '@/config/site';
import { priceLabel } from '@/config/booking';
import { Button } from '@/components/ui/button';
import { GradientBlob, MovementArcs } from '@/components/graphics/decor';

export const metadata: Metadata = {
  title: 'Page not found | Havoheal Physiotherapy',
  description:
    'The page you were looking for could not be found. Book a 45-minute home physiotherapy visit, or call us on +44 7469 334067.',
  robots: { index: false, follow: true },
};

/**
 * Custom 404. Next.js serves this with a genuine 404 status code, so search
 * engines treat it correctly rather than as a soft 404.
 */
export default function NotFound() {
  return (
    <section className="relative overflow-hidden layered-bg">
      <GradientBlob className="absolute -left-32 -top-32 h-[30rem] w-[30rem] opacity-45" />
      <MovementArcs className="absolute -bottom-20 right-0 h-80 w-80 opacity-20" />

      <div className="container relative py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mx-auto">Error 404</p>

          <h1 className="mt-6 text-4xl sm:text-5xl">We could not find that page</h1>

          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            The page may have been moved or the address may have a typo in it. Nothing is wrong
            with your booking — if you have already submitted a request, it is safe.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/book-appointment">
                <CalendarCheck aria-hidden="true" />
                Book a {priceLabel} home visit
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/">
                <Home aria-hidden="true" />
                Go to the homepage
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-ink-muted">
            Or call us on{' '}
            <a
              href={telHref}
              className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
            >
              {siteConfig.contact.phoneDisplay}
            </a>
          </p>
        </div>

        <nav
          aria-label="Popular pages"
          className="mx-auto mt-14 max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"
        >
          <h2 className="flex items-center gap-2 text-xl">
            <Search className="size-5 text-brand-700" aria-hidden="true" />
            Try one of these instead
          </h2>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-900"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/sitemap"
                className="block rounded-xl px-3 py-2.5 font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-900"
              >
                Full sitemap
              </Link>
            </li>
          </ul>
        </nav>

        <p className="mt-8 text-center text-sm text-ink-muted">
          <Phone className="mr-1 inline size-4 align-text-bottom" aria-hidden="true" />
          In an emergency call 999, or use NHS 111 when appropriate.
        </p>
      </div>
    </section>
  );
}
