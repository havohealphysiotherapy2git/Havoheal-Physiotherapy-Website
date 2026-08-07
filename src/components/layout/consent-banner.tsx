'use client';

import * as React from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Cookie } from 'lucide-react';
import { clientEnv } from '@/lib/env';
import { getConsent, isAnalyticsConfigured, setConsent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';

/**
 * Consent banner and consent-gated analytics loader.
 *
 * Behaviour:
 *  - If no analytics provider is configured, nothing renders and no cookie is
 *    ever set. That is the default for this project.
 *  - The banner is an inline region at the bottom of the page, not a modal. It
 *    does not trap focus, does not block the page and does not cover the mobile
 *    action bar.
 *  - The analytics script is only injected after consent is granted.
 */
export function ConsentBanner() {
  const [consent, setConsentState] = React.useState<'granted' | 'denied' | 'unset'>('unset');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setConsentState(getConsent());
    const onChange = (event: Event) => {
      setConsentState((event as CustomEvent<'granted' | 'denied'>).detail);
    };
    window.addEventListener('havoheal:consent', onChange);
    return () => window.removeEventListener('havoheal:consent', onChange);
  }, []);

  if (!isAnalyticsConfigured()) return null;
  if (!mounted) return null;

  const scriptUrl = clientEnv.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL;
  const domain = clientEnv.NEXT_PUBLIC_ANALYTICS_DOMAIN;

  return (
    <>
      {consent === 'granted' && scriptUrl && (
        <Script
          src={scriptUrl}
          strategy="lazyOnload"
          {...(domain ? { 'data-domain': domain } : {})}
        />
      )}

      {consent === 'unset' && (
        <div
          role="region"
          aria-label="Cookie choices"
          className="fixed inset-x-0 bottom-[4.6rem] z-40 px-4 md:bottom-4"
        >
          <div className="container">
            <div className="glass mx-auto max-w-2xl rounded-2xl p-5 shadow-lift">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <Cookie className="size-5 text-brand-700" aria-hidden="true" />
                Cookies on this website
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                We use essential cookies to make this website work. With your permission we would
                also like to use privacy-friendly analytics cookies to understand which pages are
                useful. Analytics stays switched off unless you choose to allow it. See our{' '}
                <Link
                  href="/cookie-policy"
                  className="font-medium text-brand-800 underline decoration-brand-300 underline-offset-4"
                >
                  Cookie Policy
                </Link>
                .
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button size="sm" onClick={() => setConsent('granted')}>
                  Allow analytics cookies
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConsent('denied')}>
                  Essential cookies only
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
