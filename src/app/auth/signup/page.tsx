'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Gift } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import FormField from '../components/FormField';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    referralKey: searchParams.get('ref') ?? ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not create your account.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Create your account" subtitle="Start earning with Optinex Africa today.">
      {form.referralKey && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-brand-50 px-3.5 py-3 text-xs text-brand-700">
          <Gift size={16} className="shrink-0 text-brand-500" />
          <span>
            Signing up with referral code <span className="font-semibold">{form.referralKey}</span>.
          </span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Full Name" required value={form.fullName} onChange={onChange('fullName')} placeholder="Ada Eze" />
        <FormField label="Email" type="email" required value={form.email} onChange={onChange('email')} placeholder="you@example.com" />
        <FormField label="Username" required value={form.username} onChange={onChange('username')} placeholder="ada_eze" />
        <FormField label="Password" isPassword required value={form.password} onChange={onChange('password')} placeholder="At least 6 characters" />
        <FormField
          label="Referral Key (optional)"
          value={form.referralKey}
          onChange={onChange('referralKey')}
          placeholder="e.g. optinex-a3f9k2"
        />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{' '}
        <Link href="/auth/signin" className="font-semibold text-brand-500">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}