'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Phone } from 'lucide-react';

import { siteConfig, telHref, whatsappHref } from '@/config/site';
import { Button } from '@/components/ui/button';

/**
 * Route-level error boundary.
 *
 * Shows a recovery path rather than a stack trace: retry, phone, WhatsApp. The
 * error digest is displayed so a visitor can quote it to us, but no internal
 * error message or stack is ever shown to the public.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Logged server-side by Next.js; this records it in the browser console too
    // during development without exposing details in the UI.
    console.error('[app] route error', { digest: error.digest });
  }, [error]);

  return (
    <section className="section">
      <div className="container">
        <div className="mx-auto max-w-2xl rounded-4xl border border-slate-200 bg-white p-8 shadow-card sm:p-10">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-coral-100 text-coral-700">
            <AlertTriangle className="size-7" aria-hidden="true" />
          </span>

          <h1 className="mt-6 text-3xl">Something went wrong</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Sorry — this page did not load properly. Trying again usually fixes it. If you were
            part-way through a booking, nothing has been lost.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href={telHref}>
                <Phone aria-hidden="true" />
                Call {siteConfig.contact.phoneDisplay}
              </a>
            </Button>
            <Button asChild size="lg" variant="whatsapp">
              <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">
                WhatsApp
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          </div>

          <p className="mt-6 text-sm text-ink-muted">
            You can also return to the{' '}
            <Link
              href="/"
              className="font-medium text-brand-800 underline decoration-brand-300 underline-offset-4"
            >
              homepage
            </Link>{' '}
            or{' '}
            <Link
              href="/book-appointment"
              className="font-medium text-brand-800 underline decoration-brand-300 underline-offset-4"
            >
              start a booking
            </Link>
            .
          </p>

          {error.digest && (
            <p className="mt-4 text-xs text-ink-muted">
              If you contact us, quoting this reference helps: <code>{error.digest}</code>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
