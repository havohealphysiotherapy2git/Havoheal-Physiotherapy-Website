'use client';

import { clientEnv } from '@/lib/env';

/**
 * Privacy-conscious analytics abstraction.
 *
 * Design rules:
 *  - Nothing is loaded and no event is sent unless BOTH an analytics provider
 *    is configured AND the visitor has given consent.
 *  - Events carry no personal data: no names, emails, phone numbers, postcodes
 *    or message content ever leave the browser through this module.
 *  - If no provider is configured (the default), every call is a no-op and no
 *    cookie banner is shown at all.
 */

export const analyticsEvents = [
  'click_to_call',
  'click_to_whatsapp',
  'begin_booking',
  'select_date',
  'select_time',
  'complete_booking_step',
  'submit_booking',
  'booking_success',
  'booking_failure',
  'contact_form_submission',
] as const;

export type AnalyticsEvent = (typeof analyticsEvents)[number];

/** Only non-identifying, low-cardinality values are permitted. */
export type AnalyticsProps = Record<string, string | number | boolean>;

export const CONSENT_COOKIE = 'havoheal_consent';

type PlausibleFn = (event: string, options?: { props?: AnalyticsProps }) => void;
type UmamiApi = { track: (event: string, props?: AnalyticsProps) => void };

declare global {
  interface Window {
    plausible?: PlausibleFn;
    umami?: UmamiApi;
  }
}

export function isAnalyticsConfigured(): boolean {
  const provider = clientEnv.NEXT_PUBLIC_ANALYTICS_PROVIDER;
  return provider !== undefined && provider !== 'none';
}

export function getConsent(): 'granted' | 'denied' | 'unset' {
  if (typeof document === 'undefined') return 'unset';
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return 'unset';
  return match.endsWith('granted') ? 'granted' : 'denied';
}

export function setConsent(value: 'granted' | 'denied'): void {
  if (typeof document === 'undefined') return;
  const oneYear = 365 * 24 * 60 * 60;
  // SameSite=Lax and Secure; this cookie holds a preference, never an identifier.
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${oneYear}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent('havoheal:consent', { detail: value }));
}

/**
 * Records an event. Silently does nothing when analytics is unconfigured or
 * consent has not been granted — callers never need to check first.
 */
export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (typeof window === 'undefined') return;
  if (!isAnalyticsConfigured()) return;
  if (getConsent() !== 'granted') return;

  try {
    switch (clientEnv.NEXT_PUBLIC_ANALYTICS_PROVIDER) {
      case 'plausible':
        window.plausible?.(event, props ? { props } : undefined);
        break;
      case 'umami':
        window.umami?.track(event, props);
        break;
      default:
        break;
    }
  } catch {
    // Analytics must never break a booking. Failures are swallowed on purpose.
  }
}
