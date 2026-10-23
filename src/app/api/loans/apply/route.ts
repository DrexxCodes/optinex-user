import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';
import { fetchBanks, resolveBankAccount } from '@/lib/paystack';
import { getLoanBlock, LOAN_BLOCK_MESSAGES, type LoanBlockCode } from '@/lib/loans/eligibility';
import { MAX_LOAN_AMOUNT, MIN_LOAN_AMOUNT } from '@/lib/loans/config';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  const accountNumber = String(body.accountNumber ?? '');
  const bankCode = String(body.bankCode ?? '');

  if (!Number.isInteger(amount) || amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) {
    return NextResponse.json(
      { error: `Enter a whole-naira amount between ₦${MIN_LOAN_AMOUNT.toLocaleString()} and ₦${MAX_LOAN_AMOUNT.toLocaleString()}.` },
      { status: 400 }
    );
  }
  if (!/^\d{10}$/.test(accountNumber) || !bankCode) {
    return NextResponse.json({ error: 'Select a bank and enter a valid 10-digit account number.' }, { status: 400 });
  }

  // The account name and bank name are always (re)resolved here, server-side,
  // straight from Paystack — never trusted from the client — so what the admin
  // sees is exactly the account holder Paystack verified.
  const [banks, resolved] = await Promise.all([fetchBanks(), resolveBankAccount(accountNumber, bankCode)]);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const bank = banks?.find((b) => b.code === bankCode);
  if (!bank) return NextResponse.json({ error: 'That bank is not supported.' }, { status: 400 });

  const userRef = adminDb.collection('users').doc(session.uid);
  const loanRef = adminDb.collection('loans').doc();
  const reference = generateReference();

  try {
    await adminDb.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error('USER_NOT_FOUND');
      const user = userSnap.data()!;

      const block = await getLoanBlock(session.uid, user, tx);
      if (block) throw new Error(block);

      // One pending application per user. `pendingLoanId` on the user doc is
      // the lock: it's set here and cleared by the admin app the moment the
      // application leaves "pending". Because it's a single document read in
      // a transaction, two simultaneous submits can't both get through. We
      // double-check the loan itself so a stale pointer can never lock a user
      // out for good.
      if (user.pendingLoanId) {
        const existing = await tx.get(adminDb.collection('loans').doc(user.pendingLoanId));
        if (existing.exists && existing.data()?.status === 'pending') throw new Error('PENDING_EXISTS');
      }

      tx.create(loanRef, {
        uid: session.uid,
        fullName: user.fullName ?? '',
        username: user.username ?? '',
        amount,
        bankAccount: {
          accountNumber,
          bankCode,
          bankName: bank.name,
          accountName: resolved.accountName
        },
        status: 'pending',
        reference,
        createdAt: FieldValue.serverTimestamp(),
        statusChangedAt: FieldValue.serverTimestamp()
      });

      // Immutable timeline entry #1. Doc id == stage, written with create(),
      // so it can only ever be written once and is never updated or deleted
      // by any code path in either app.
      tx.create(loanRef.collection('timeline').doc('pending'), {
        status: 'pending',
        seq: 0,
        by: 'user',
        actorUid: session.uid,
        at: FieldValue.serverTimestamp()
      });

      tx.set(userRef, { pendingLoanId: loanRef.id }, { merge: true });
    });
  } catch (err: any) {
    const messages: Record<string, string> = {
      ...LOAN_BLOCK_MESSAGES,
      PENDING_EXISTS: 'You already have a pending loan application. Wait for it to be reviewed before applying again.'
    };
    const known = err?.message in messages;
    if (!known) console.error('[loans/apply]', err);
    return NextResponse.json(
      { error: known ? messages[err.message as LoanBlockCode | 'PENDING_EXISTS'] : 'Could not submit your loan application.' },
      { status: known ? 400 : 500 }
    );
  }

  await logAnalyticsEvent('loan_requested', amount).catch((e) => console.error('[loans/apply] analytics', e));
  return NextResponse.json({ ok: true, reference, loanId: loanRef.id });
}
