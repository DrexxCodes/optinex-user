import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

// Resolves an account name for a given account number + bank code before it's saved.
export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { accountNumber, bankCode } = await req.json();
  if (!accountNumber || !bankCode) {
    return NextResponse.json({ error: 'Account number and bank are required.' }, { status: 400 });
  }

  const res = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Could not resolve that account. Double-check the details.' }, { status: 422 });
  }

  const data = await res.json();
  return NextResponse.json({ accountName: data.data.account_name });
}
