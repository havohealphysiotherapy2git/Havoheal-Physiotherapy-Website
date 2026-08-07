import type { MetadataRoute } from 'next';
import { absoluteUrl, getSiteUrl } from '@/lib/seo';

/**
 * robots.txt.
 *
 * Private and per-visitor routes are disallowed. Nothing that should rank is
 * blocked here — pages that must stay out of the index carry a noindex robots
 * directive instead, which is the reliable signal.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/booking-confirmed', '/api/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: getSiteUrl(),
  };
}
