import { test, expect } from '@playwright/test';

/**
 * Site-wide checks: SEO essentials, accessibility affordances and the
 * conversion actions that must never break.
 *
 * These do not touch the database, so they pass without one.
 */

const INDEXABLE_PAGES = [
  '/',
  '/physiotherapy',
  '/conditions-we-support',
  '/areas-we-cover',
  '/birmingham-physiotherapy',
  '/physiotherapy-pricing',
  '/about',
  '/faqs',
  '/contact',
  '/privacy-policy',
  '/cookie-policy',
  '/terms-and-conditions',
  '/booking-and-cancellation-policy',
  '/accessibility-statement',
  '/sitemap',
];

test.describe('SEO', () => {
  for (const path of INDEXABLE_PAGES) {
    test(`${path} has complete, unique metadata and exactly one H1`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      const title = await page.title();
      expect(title.length).toBeGreaterThan(15);

      const description = await page
        .locator('meta[name="description"]')
        .getAttribute('content');
      expect(description, `${path} needs a meta description`).toBeTruthy();
      expect(description!.length).toBeGreaterThan(60);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, `${path} needs a canonical URL`).toBeTruthy();

      await expect(page.locator('h1')).toHaveCount(1);

      // No accidental noindex on a page that should rank.
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(robots ?? '').not.toContain('noindex');

      // Open Graph essentials.
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    });
  }

  test('publishes valid organisation and website structured data', async ({ page }) => {
    await page.goto('/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);

    const graph = blocks.flatMap((block) => {
      const parsed = JSON.parse(block) as { '@graph'?: unknown[] };
      return parsed['@graph'] ?? [];
    }) as Record<string, unknown>[];

    const types = graph.map((node) => node['@type']);
    expect(types).toContain('Organization');
    expect(types).toContain('WebSite');
    expect(types).toContain('Service');
    expect(types).toContain('FAQPage');

    // Nothing unverifiable may be published.
    expect(types).not.toContain('AggregateRating');
    expect(types).not.toContain('Review');
    expect(types).not.toContain('Physician');
    expect(types).not.toContain('MedicalClinic');

    const organisation = graph.find((node) => node['@type'] === 'Organization');
    const address = organisation?.address as Record<string, string> | undefined;
    // The registered office is London; Birmingham appears only as areaServed.
    expect(address?.addressLocality).toBe('London');
    expect(address?.name).toMatch(/registered office/i);
    expect(JSON.stringify(organisation?.areaServed)).toContain('Birmingham');

    // The correct legal name, display name and official email are published.
    expect(organisation?.legalName).toBe('Havoheal Physiotherapy UK LTD');
    expect(organisation?.name).toBe('Havoheal Physiotherapy');
    expect(organisation?.email).toBe('bookings@havohealphysiotherapy.co.uk');
    expect(JSON.stringify(organisation?.contactPoint)).toContain(
      'bookings@havohealphysiotherapy.co.uk',
    );

    // The service is described as home-visit, with all booking channels.
    const service = graph.find((node) => node['@type'] === 'Service');
    expect(service?.serviceType).toBe('Home-visit physiotherapy');
    const channels = JSON.stringify(service?.availableChannel);
    expect(channels).toContain('Online booking');
    expect(channels).toContain('Telephone booking');
    expect(channels).toContain('WhatsApp booking');
  });

  test('no page still carries the superseded company name', async ({ page }) => {
    for (const path of INDEXABLE_PAGES) {
      await page.goto(path);
      const body = await page.locator('body').innerText();
      expect(body, `${path} must not mention the old name`).not.toContain(
        'Havoheal Healthcare',
      );
      const html = await page.content();
      expect(html, `${path} must not contain an obsolete email`).not.toMatch(
        /hello@havohealphysiotherapy|info@havohealphysiotherapy|example@example\.com/i,
      );

      /**
       * A webmail sign-in URL must never appear on a public page — it is a
       * mailbox-management link, not a customer contact route.
       *
       * Naming the mailbox provider in the Privacy Policy processor list is a
       * different thing entirely, and is required for transparency, so this
       * checks for links rather than for the vendor's name.
       */
      const webmailLinks = await page
        .locator('a[href*="webmail"], a[href*="titan.email"], a[href*="mail.titan"]')
        .count();
      expect(webmailLinks, `${path} must not link to webmail`).toBe(0);
      expect(html, `${path} must not embed a webmail sign-in URL`).not.toMatch(
        /https?:\/\/[^"']*(webmail|titan\.email)[^"']*/i,
      );
    }
  });

  test('serves robots.txt and sitemap.xml', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    const robotsBody = await robots.text();
    expect(robotsBody).toContain('Sitemap:');
    expect(robotsBody).toContain('Disallow: /admin');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toContain('<urlset');
    expect(sitemapBody).toContain('/book-appointment');
    // Private pages must never be listed.
    expect(sitemapBody).not.toContain('/booking-confirmed');
    expect(sitemapBody).not.toContain('/admin');
  });

  test('returns a real 404 with a helpful page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { level: 1, name: /could not find that page/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Book a £75 home visit/i })).toBeVisible();
  });

  test('redirects legacy paths to their canonical pages', async ({ page }) => {
    await page.goto('/book');
    expect(new URL(page.url()).pathname).toBe('/book-appointment');

    await page.goto('/faq');
    expect(new URL(page.url()).pathname).toBe('/faqs');
  });
});

test.describe('Accessibility', () => {
  test('a skip link is the first focusable element', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toHaveText(/Skip to main content/i);

    await focused.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('the mobile drawer manages focus correctly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const trigger = page.getByRole('button', { name: 'Open menu' });
    await trigger.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Menu' })).toBeVisible();

    // Escape closes it and focus returns to the trigger.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('every image and decorative graphic is handled correctly', async ({ page }) => {
    await page.goto('/');

    // Every SVG must either be hidden from assistive technology — directly or
    // via an aria-hidden ancestor, which removes the whole subtree from the
    // accessibility tree — or carry an accessible name.
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll('svg')]
        .filter((svg) => !svg.closest('[aria-hidden="true"]'))
        .filter((svg) => !svg.getAttribute('aria-label') && !svg.getAttribute('aria-labelledby'))
        .map((svg) => svg.getAttribute('class') ?? 'unnamed svg'),
    );
    expect(unnamed, 'every SVG must be hidden or named').toEqual([]);

    // Any <img> must carry an alt attribute (empty is valid when decorative).
    const images = page.locator('img');
    for (let i = 0; i < (await images.count()); i += 1) {
      expect(await images.nth(i).getAttribute('alt')).not.toBeNull();
    }
  });

  test('the emergency notice appears where people need it', async ({ page }) => {
    await page.goto('/book-appointment');
    await expect(page.getByText(/not for medical emergencies/i).first()).toBeVisible();
    await expect(page.getByText(/Call 999/i).first()).toBeVisible();
  });
});

test.describe('Conversion actions', () => {
  test('call and WhatsApp links are correct site-wide', async ({ page }) => {
    await page.goto('/');

    const telLinks = page.locator('a[href^="tel:"]');
    expect(await telLinks.count()).toBeGreaterThan(0);
    for (let i = 0; i < (await telLinks.count()); i += 1) {
      expect(await telLinks.nth(i).getAttribute('href')).toBe('tel:+447469334067');
    }

    const waLinks = page.locator('a[href*="wa.me"]');
    expect(await waLinks.count()).toBeGreaterThan(0);
    for (let i = 0; i < (await waLinks.count()); i += 1) {
      const href = await waLinks.nth(i).getAttribute('href');
      expect(href).toContain('wa.me/447469334067');
      expect(href).toContain('text=');
      // External links must be safe.
      expect(await waLinks.nth(i).getAttribute('rel')).toContain('noopener');
    }
  });

  test('the sticky mobile action bar is present on content pages only', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/');
    const bar = page.getByRole('navigation', { name: 'Quick actions' });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole('link', { name: 'Call' })).toBeVisible();
    await expect(bar.getByRole('link', { name: 'WhatsApp' })).toBeVisible();
    await expect(bar.getByRole('link', { name: 'Book Home Visit' })).toBeVisible();

    // Hidden on the booking page so it cannot cover the form controls.
    await page.goto('/book-appointment');
    await expect(bar).toBeHidden();
  });

  test('the price and duration are stated on every commercial page', async ({ page }) => {
    for (const path of ['/', '/physiotherapy', '/physiotherapy-pricing', '/birmingham-physiotherapy']) {
      await page.goto(path);
      await expect(page.getByText('£75').first()).toBeVisible();
      await expect(page.getByText(/45[- ]minute/i).first()).toBeVisible();
    }
  });

  test('every key page communicates the home-visit service', async ({ page }) => {
    const pages = [
      '/',
      '/physiotherapy',
      '/physiotherapy-pricing',
      '/birmingham-physiotherapy',
      '/areas-we-cover',
      '/book-appointment',
      '/about',
      '/contact',
      '/faqs',
    ];

    for (const path of pages) {
      await page.goto(path);
      const body = await page.locator('body').innerText();
      expect(body, `${path} should make the home-visit service clear`).toMatch(
        /home visit|home-visit|at your home|in your own home|we come to you|mobile physiotherap/i,
      );
    }
  });

  test('the official email is reachable from the footer and contact page', async ({ page }) => {
    await page.goto('/');
    const footerEmail = page
      .locator('footer a[href="mailto:bookings@havohealphysiotherapy.co.uk"]')
      .first();
    await expect(footerEmail).toBeVisible();
    await expect(footerEmail).toHaveText('bookings@havohealphysiotherapy.co.uk');

    await page.goto('/contact');
    await expect(
      page.locator('a[href^="mailto:bookings@havohealphysiotherapy.co.uk"]').first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Email Havoheal/i })).toBeVisible();
  });

  test('the footer separates the registered office from the service area', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(
      footer.getByText('Havoheal Physiotherapy UK LTD', { exact: true }),
    ).toBeVisible();
    await expect(footer.getByText(/124.128 City Road/).first()).toBeVisible();
    await expect(footer.getByText(/Company number: 17089677/).first()).toBeVisible();
    // Appears more than once by design — in the intro and beside the address.
    await expect(footer.getByText(/home-visit physiotherapy across/i).first()).toBeVisible();
    await expect(
      footer.getByText(/not presented as a Birmingham clinic/i).first(),
    ).toBeVisible();
  });

  test('the postcode checker gives an indicative answer without over-promising', async ({
    page,
  }) => {
    await page.goto('/');

    const input = page.locator('#postcode-checker-input');
    await input.scrollIntoViewIfNeeded();
    await input.fill('B15 2TT');
    await page.getByRole('button', { name: /Check postcode/i }).first().click();

    const result = page.getByText(/looks like it is in the area we travel to/i);
    await expect(result).toBeVisible();
    // Even a match must not be presented as a confirmation.
    await expect(page.getByText(/indication, not a confirmation/i)).toBeVisible();

    await input.fill('M1 1AE');
    await page.getByRole('button', { name: /Check postcode/i }).first().click();
    await expect(page.getByText(/not sure about that postcode/i)).toBeVisible();
  });
});

test.describe('Security headers', () => {
  test('sends a nonce-based CSP and the core protective headers', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();

    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain('nonce-');
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy']).toContain("object-src 'none'");

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
    // The framework version must not be advertised.
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('the admin area is not reachable without authentication', async ({ page }) => {
    await page.goto('/admin/bookings');
    // Either the sign-in page or the setup-required page — never booking data.
    expect(page.url()).toMatch(/\/admin\/(login|setup-required)/);
    await expect(page.getByText(/Playwright Test User/i)).toHaveCount(0);
  });

  test('the CSV export is not reachable without authentication', async ({ request }) => {
    const response = await request.get('/admin/bookings/export');
    expect(response.status()).toBe(404);
  });
});
