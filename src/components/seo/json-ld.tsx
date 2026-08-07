import { headers } from 'next/headers';

/**
 * Renders a JSON-LD block.
 *
 * The nonce issued by middleware is applied so the block satisfies the site's
 * Content Security Policy. Google's structured-data guidance recommends exactly
 * this when a nonce-based CSP is in force.
 */
export async function JsonLd({ data }: { data: string }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      /**
       * Browsers blank the `nonce` content attribute once the document is
       * parsed, so the client reads "" where the server sent a value. That is
       * the browser's nonce-hiding behaviour, not a genuine difference, so the
       * hydration warning is suppressed here rather than by dropping the nonce.
       */
      suppressHydrationWarning
      // The payload is produced by JSON.stringify in src/lib/structured-data.ts
      // from typed, internally-controlled values — no user input reaches it.
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
}
