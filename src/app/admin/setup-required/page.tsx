import { Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Shown when the admin environment variables are not configured.
 *
 * Production admin access stays disabled until every required secret is set —
 * there is deliberately no fallback account and no bypass.
 */
export default function AdminSetupRequiredPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-brand-800">
          <Lock className="size-6" aria-hidden="true" />
        </span>

        <h1 className="mt-5 text-2xl">Admin access is not configured</h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          The booking admin is disabled on this deployment because the required secrets are not
          set. This is intentional: the admin area is never served with a default password or a
          client-side-only check.
        </p>

        <h2 className="mt-7 text-lg">To enable it</h2>
        <ol className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
          <li>
            <strong className="text-ink">1.</strong> Generate a password hash:
            <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
              <code>npm run admin:hash -- &quot;your-long-random-password&quot;</code>
            </pre>
          </li>
          <li>
            <strong className="text-ink">2.</strong> Set these environment variables on the
            hosting platform (never in the repository):
            <ul className="mt-2 space-y-1 pl-4">
              <li>
                <code className="rounded bg-slate-100 px-1.5 py-0.5">ADMIN_EMAIL</code>
              </li>
              <li>
                <code className="rounded bg-slate-100 px-1.5 py-0.5">ADMIN_PASSWORD_HASH</code>
              </li>
              <li>
                <code className="rounded bg-slate-100 px-1.5 py-0.5">ADMIN_SESSION_SECRET</code>{' '}
                (32+ random characters)
              </li>
            </ul>
          </li>
          <li>
            <strong className="text-ink">3.</strong> Redeploy, then sign in at{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5">/admin/login</code>.
          </li>
        </ol>

        <p className="mt-6 text-sm text-ink-muted">
          Full instructions are in the README under &ldquo;Admin access&rdquo;.
        </p>
      </div>
    </div>
  );
}
