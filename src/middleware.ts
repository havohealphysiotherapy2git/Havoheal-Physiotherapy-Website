import { NextResponse, type NextRequest } from 'next/server';

/**
 * Content Security Policy with a per-request nonce.
 *
 * Why a nonce rather than a static policy: Next.js emits inline scripts for the
 * streaming payload, so a policy without a nonce would have to allow
 * 'unsafe-inline' for scripts — which is barely a policy at all. The nonce is
 * placed on the request headers so Next.js applies it to its own script tags,
 * and on the response so browsers enforce it.
 *
 * TRADE-OFF: reading the nonce opts pages into dynamic rendering. These pages
 * do no data fetching, so the cost is a render per request rather than a
 * database round trip, and the security benefit is real. See README.
 */

const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|webmanifest|woff2?)$/;

export function middleware(request: NextRequest) {
  if (PUBLIC_FILE.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  // Only widen connect-src/script-src when an analytics provider is configured.
  const analyticsScript = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL;
  const analyticsOrigin = analyticsScript
    ? (() => {
        try {
          return new URL(analyticsScript).origin;
        } catch {
          return '';
        }
      })()
    : '';

  const turnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    ? ' https://challenges.cloudflare.com'
    : '';

  const csp = [
    `default-src 'self'`,
    // 'strict-dynamic' lets nonce-approved scripts load their own chunks while
    // ignoring host allowlists in supporting browsers.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:${
      isDev ? " 'unsafe-eval'" : ''
    }${analyticsOrigin ? ` ${analyticsOrigin}` : ''}${turnstile}`,
    // Inline styles are required by Next.js and Framer Motion. Style injection
    // is a far lower risk than script injection, which stays nonce-locked.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self'${analyticsOrigin ? ` ${analyticsOrigin}` : ''}${turnstile}`,
    `frame-src 'self'${turnstile}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `manifest-src 'self'`,
    `worker-src 'self' blob:`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except Next.js internals and static assets, which do not
     * execute scripts and are covered by the static headers in next.config.mjs.
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
