'use client';

type AuthResult = { ok: true; redirectTo: string } | { ok: false; error: string };

// Credentials go to optinex-backend, which checks them, sets the httpOnly session cookies, and runs the
// post-login work (analytics + investment catch-up) in the same request. The browser never talks to the
// auth provider directly.
export async function signInRequest(email: string, password: string): Promise<AuthResult> {
  const res = await fetch('/api/auth/signin', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error ?? 'Invalid email or password.' };
  return { ok: true, redirectTo: '/dashboard' };
}

export type SignUpInput = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  referralKey: string;
};

// The backend creates the account (atomic profile + referral bonus) and signs the user in. If that last step
// hiccups the account still exists — `signedIn` is false and we send them to the sign-in page.
export async function signUpRequest(form: SignUpInput): Promise<AuthResult> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error ?? 'Could not create your account.' };
  return { ok: true, redirectTo: data.signedIn ? '/dashboard' : '/auth/signin' };
}
