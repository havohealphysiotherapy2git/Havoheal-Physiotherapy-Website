/**
 * Automated SEO audit.
 *
 * Runs as part of `npm run verify` and in CI. Checks that are cheap to automate
 * and expensive to notice by eye:
 *
 *   - every registered page has a matching route file (no 404s in the sitemap)
 *   - every route file is registered (no orphan pages missing from the sitemap)
 *   - no duplicate titles or meta descriptions
 *   - titles and descriptions are present and a sensible length
 *   - every page renders exactly one <h1>
 *   - internal links point at real routes (no broken internal links)
 *   - no accidental `noindex` on a page that should rank
 *
 * Exits non-zero when anything fails, so a broken link cannot ship silently.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pageRegistry } from '../src/lib/seo';

const APP_DIR = path.join(process.cwd(), 'src', 'app');

type Problem = { level: 'error' | 'warning'; message: string };
const problems: Problem[] = [];

const error = (message: string) => problems.push({ level: 'error', message });
const warn = (message: string) => problems.push({ level: 'warning', message });

/** Routes that exist deliberately but are not in the public registry. */
const NON_REGISTRY_ROUTES = new Set([
  '/booking-confirmed',
  '/admin',
  '/admin/login',
  '/admin/bookings',
  '/admin/bookings/[id]',
  '/admin/setup-required',
]);

function routeFileFor(routePath: string): string {
  const segments = routePath === '/' ? [] : routePath.slice(1).split('/');
  return path.join(APP_DIR, ...segments, 'page.tsx');
}

/** Walks the app directory and returns every route that has a page.tsx. */
function collectRoutes(dir: string, prefix = ''): string[] {
  const routes: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      if (entry.name === 'page.tsx') routes.push(prefix === '' ? '/' : prefix);
      continue;
    }
    // Route groups "(name)" do not appear in the URL.
    const segment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
    routes.push(...collectRoutes(path.join(dir, entry.name), `${prefix}${segment}`));
  }
  return routes;
}

// ---------------------------------------------------------------------------
// 1. Registry ↔ filesystem
// ---------------------------------------------------------------------------
const actualRoutes = collectRoutes(APP_DIR);
const registeredPaths = new Set(pageRegistry.map((page) => page.path));

for (const page of pageRegistry) {
  if (!fs.existsSync(routeFileFor(page.path))) {
    error(`Registered page "${page.path}" has no route file at ${routeFileFor(page.path)}`);
  }
}

for (const route of actualRoutes) {
  if (!registeredPaths.has(route) && !NON_REGISTRY_ROUTES.has(route)) {
    error(
      `Route "${route}" exists but is not in pageRegistry, so it is missing from sitemap.xml and the HTML sitemap.`,
    );
  }
}

// ---------------------------------------------------------------------------
// 2. Metadata quality
// ---------------------------------------------------------------------------
const seenTitles = new Map<string, string>();
const seenDescriptions = new Map<string, string>();

for (const page of pageRegistry) {
  if (!page.title?.trim()) error(`"${page.path}" has no title.`);
  if (!page.description?.trim()) error(`"${page.path}" has no meta description.`);

  const duplicateTitle = seenTitles.get(page.title);
  if (duplicateTitle) {
    error(`Duplicate title on "${page.path}" and "${duplicateTitle}": "${page.title}"`);
  }
  seenTitles.set(page.title, page.path);

  const duplicateDescription = seenDescriptions.get(page.description);
  if (duplicateDescription) {
    error(
      `Duplicate meta description on "${page.path}" and "${duplicateDescription}".`,
    );
  }
  seenDescriptions.set(page.description, page.path);

  if (page.title.length > 65) {
    warn(`Title on "${page.path}" is ${page.title.length} characters and may be truncated.`);
  }
  if (page.title.length < 15) {
    warn(`Title on "${page.path}" is very short (${page.title.length} characters).`);
  }
  if (page.description.length > 165) {
    warn(
      `Meta description on "${page.path}" is ${page.description.length} characters and may be truncated.`,
    );
  }
  if (page.description.length < 70) {
    warn(
      `Meta description on "${page.path}" is short (${page.description.length} characters).`,
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Source checks: one H1, no stray noindex, no broken internal links
// ---------------------------------------------------------------------------
const internalLinkPattern = /href=(?:"|\{")(\/[a-z0-9\-/#?=.]*)(?:"|"\})/gi;
const validRoutes = new Set<string>([...actualRoutes, ...NON_REGISTRY_ROUTES]);
// Static files and generated routes that are served but have no page.tsx.
const staticTargets = new Set([
  '/sitemap.xml',
  '/robots.txt',
  '/favicon.svg',
  '/site.webmanifest',
  '/admin/bookings/export',
]);

for (const page of pageRegistry) {
  const file = routeFileFor(page.path);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');

  // H1 count: a page uses either a literal <h1>, the shared PageHeader, or
  // LegalPage (which renders a PageHeader internally). Each contributes one.
  const literalH1 = (source.match(/<h1[\s>]/g) ?? []).length;
  const headerComponents = (source.match(/<(PageHeader|LegalPage)\b/g) ?? []).length;
  const h1Count = literalH1 + headerComponents;

  if (h1Count === 0) error(`"${page.path}" does not render an H1.`);
  if (h1Count > 1) error(`"${page.path}" renders ${h1Count} H1 elements; there must be exactly one.`);

  if (/noindex/i.test(source) && page.priority > 0.2) {
    error(`"${page.path}" appears to set noindex but is a page that should rank.`);
  }

  for (const match of source.matchAll(internalLinkPattern)) {
    const target = (match[1] ?? '').split('#')[0]?.split('?')[0] ?? '';
    if (target === '' || target === '/') continue;
    const normalised = target.endsWith('/') ? target.slice(0, -1) : target;
    if (staticTargets.has(normalised)) continue;
    if (!validRoutes.has(normalised)) {
      error(`Broken internal link on "${page.path}": ${target}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const errors = problems.filter((problem) => problem.level === 'error');
const warnings = problems.filter((problem) => problem.level === 'warning');

console.info(`\nSEO audit — ${pageRegistry.length} registered pages, ${actualRoutes.length} routes\n`);

for (const warning of warnings) console.warn(`  WARNING  ${warning.message}`);
for (const problem of errors) console.error(`  ERROR    ${problem.message}`);

if (errors.length === 0 && warnings.length === 0) {
  console.info('  All checks passed.\n');
} else {
  console.info(`\n  ${errors.length} error(s), ${warnings.length} warning(s).\n`);
}

process.exit(errors.length > 0 ? 1 : 0);
