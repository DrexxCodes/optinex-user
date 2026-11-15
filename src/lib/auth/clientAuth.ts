'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type AuthResult = { ok: true; redirectTo: string } | { ok: false; error: string };

// Sign-in: Supabase Auth in the browser, then one server call for the post-login work
// (analytics + investment catch-up) that used to live inside /api/auth/signin.
export async function signInRequest(email: string, password: string): Promise<AuthResult> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });

  if (error) {
    if (error.status === 429) return { ok: false, error: 'Too many attempts. Please wait a moment and try again.' };
    if (error.status && error.status >= 500) return { ok: false, error: 'Something went wrong signing you in.' };
    return { ok: false, error: 'Invalid email or password.' };
  }

  await fetch('/api/auth/signin', { method: 'POST', credentials: 'include' }).catch(() => {});
  return { ok: true, redirectTo: '/dashboard' };
}

export type SignUpInput = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  referralKey: string;
};

// Sign-up: the server creates the account (atomic profile + referral bonus), then the browser
// signs in to establish the session.
export async function signUpRequest(form: SignUpInput): Promise<AuthResult> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error ?? 'Could not create your account.' };

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim().toLowerCase(), password: form.password });
  // Account exists either way — if the immediate sign-in hiccups, send them to the sign-in page.
  return { ok: true, redirectTo: error ? '/auth/signin' : '/dashboard' };
}
