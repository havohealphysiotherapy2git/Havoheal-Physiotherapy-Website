import { redirect } from 'next/navigation';
import { isAdminConfigured } from '@/lib/env';
import { getAdminSession } from '@/lib/admin-auth';
import { AdminLoginForm } from '@/app/admin/login/login-form';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  if (!isAdminConfigured()) redirect('/admin/setup-required');

  const session = await getAdminSession();
  if (session) redirect('/admin/bookings');

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-card sm:p-8">
        <h1 className="text-2xl">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          This area contains customer personal data. Sign in with the admin account configured
          for this deployment.
        </p>
        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
