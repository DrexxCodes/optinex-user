import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

// Proxies Paystack's bank list so the secret key never reaches the client.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const res = await fetch('https://api.paystack.co/bank?country=nigeria', {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    next: { revalidate: 60 * 60 * 24 } // bank list barely changes — cache a day
  });

  if (!res.ok) return NextResponse.json({ error: 'Could not load bank list.' }, { status: 502 });

  const data = await res.json();

  // Paystack's list can contain multiple entries sharing the same `code`
  // (e.g. a NUBAN bank and a mobile-money product with the same institution
  // code). Keep the first occurrence of each code so the client never
  // receives duplicates — this was surfacing as a React "duplicate key"
  // warning in the bank <select>.
  const seen = new Set<string>();
  const banks: { code: string; name: string }[] = [];
  for (const b of data.data ?? []) {
    if (!b.code || seen.has(b.code)) continue;
    seen.add(b.code);
    banks.push({ code: b.code, name: b.name });
  }

  return NextResponse.json({ banks });
}
