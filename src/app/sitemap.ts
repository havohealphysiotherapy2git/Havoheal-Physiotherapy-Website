import type { MetadataRoute } from 'next';
import { pageRegistry, absoluteUrl } from '@/lib/seo';

/**
 * XML sitemap, generated from the single page registry in src/lib/seo.ts.
 * Pages cannot drift out of the sitemap because there is only one list.
 *
 * Deliberately excluded: /booking-confirmed (noindex, per-visitor) and
 * everything under /admin (private).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return pageRegistry.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
