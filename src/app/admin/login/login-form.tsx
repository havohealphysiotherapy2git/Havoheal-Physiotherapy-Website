'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertTriangle, LogIn, Loader2 } from 'lucide-react';

import { adminLogin, type AdminLoginResult } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Signing in…
        </>
      ) : (
        <>
          <LogIn aria-hidden="true" />
          Sign in
        </>
      )}
    </Button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useActionState<AdminLoginResult | null, FormData>(
    adminLogin,
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.status === 'error' && (
        <div role="alert" className="rounded-2xl border-2 border-coral-500 bg-coral-50 p-4">
          <p className="flex items-start gap-2 text-sm font-medium text-coral-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {state.message}
          </p>
        </div>
      )}

      <TextField
        id="admin-email"
        name="email"
        label="Email address"
        type="email"
        required
        autoComplete="username"
      />

      <TextField
        id="admin-password"
        name="password"
        label="Password"
        type="password"
        required
        autoComplete="current-password"
      />

      <SubmitButton />
    </form>
  );
}
