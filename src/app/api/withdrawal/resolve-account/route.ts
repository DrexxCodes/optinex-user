import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

// Resolves an account name for a given account number + bank code before it's saved.
export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { accountNumber, bankCode } = await req.json();
  // console.log('[resolve-account] incoming request', { uid: session.uid, accountNumber, bankCode });

  if (!accountNumber || !bankCode) {
    // console.warn('[resolve-account] rejected — missing accountNumber or bankCode', { accountNumber, bankCode });
    return NextResponse.json({ error: 'Account number and bank are required.' }, { status: 400 });
  }

  const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`;
  // console.log('[resolve-account] calling Paystack', {
  //   url,
  //   hasSecretKey: !!process.env.PAYSTACK_SECRET_KEY,
  //   secretKeyPrefix: process.env.PAYSTACK_SECRET_KEY?.slice(0, 7) // enough to spot "sk_test_" vs "sk_live_" mixups, never logs the full key
  // });

  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });
  } catch (err) {
    // console.error('[resolve-account] network error calling Paystack', err);
    return NextResponse.json({ error: 'Could not reach Paystack. Try again.' }, { status: 502 });
  }

  // console.log('[resolve-account] Paystack response status', res.status, res.statusText);

  // Read the body once as text so we can log it regardless of whether it's
  // valid JSON, then parse it from that same string.
  const rawBody = await res.text();
  // console.log('[resolve-account] Paystack response body', rawBody);

  let data: any = null;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch (err) {
    // console.error('[resolve-account] Paystack response was not valid JSON', err);
  }

  if (!res.ok) {
    // console.error('[resolve-account] Paystack rejected the request', {
    //   status: res.status,
    //   paystackMessage: data?.message,
    //   paystackCode: data?.code,
    //   accountNumber,
    //   bankCode
    // });
    return NextResponse.json(
      { error: data?.message || 'Could not resolve that account. Double-check the details.' },
      { status: 422 }
    );
  }

  // console.log('[resolve-account] resolved successfully', { accountName: data?.data?.account_name });
  return NextResponse.json({ accountName: data.data.account_name });
}
