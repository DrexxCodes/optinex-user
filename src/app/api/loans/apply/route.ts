import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';
import { fetchBanks, resolveBankAccount } from '@/lib/paystack';
import { getLoanBlock } from '@/lib/loans/eligibility';
import { validateLoanInput } from '@/lib/loans/validation';
import { rateLimit, tooManyRequests } from '@/lib/rateLimit';

const BLOCK_PREFIX = 'BLOCK:';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  // 5 submissions per hour per user — plenty for honest retries, and caps
  // how many Paystack lookups a single account can trigger through this route.
  const limit = await rateLimit('loan-apply', session.uid, 5, 60 * 60);
  if (!limit.allowed) return tooManyRequests(limit.retryAfter, 'You have submitted too many loan applications. Please try again later.');

  const body = await req.json().catch(() => ({}));
  const parsed = validateLoanInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;

  // The account name and bank name are always (re)resolved here, server-side,
  // straight from Paystack — never trusted from the client.
  const [banks, resolved] = await Promise.all([fetchBanks(), resolveBankAccount(input.accountNumber, input.bankCode)]);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const bank = banks?.find((b) => b.code === input.bankCode);
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
      if (block) throw new Error(BLOCK_PREFIX + block.message);

      // One pending application per user. `pendingLoanId` on the user doc is
      // the lock: set here, cleared by the admin app the moment the
      // application leaves "pending". We double-check the loan itself so a
      // stale pointer can never lock a user out for good.
      if (user.pendingLoanId) {
        const existing = await tx.get(adminDb.collection('loans').doc(user.pendingLoanId));
        if (existing.exists && existing.data()?.status === 'pending') throw new Error('PENDING_EXISTS');
      }

      tx.create(loanRef, {
        uid: session.uid,
        // Name and email always come from the account, never from the request.
        fullName: user.fullName ?? '',
        username: user.username ?? '',
        applicant: {
          fullName: user.fullName ?? '',
          email: user.email ?? '',
          phone: input.phone,
          address: input.address,
          occupation: input.occupation
        },
        nextOfKin: { name: input.nextOfKinName, phone: input.nextOfKinPhone },
        reason: input.reason,
        amount: input.amount,
        bankAccount: {
          accountNumber: input.accountNumber,
          bankCode: input.bankCode,
          bankName: bank.name,
          accountName: resolved.accountName
        },
        status: 'pending',
        reference,
        createdAt: FieldValue.serverTimestamp(),
        statusChangedAt: FieldValue.serverTimestamp()
      });

      // Immutable timeline entry #1 (doc id == stage, written with create()).
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
    const msg: string = err?.message ?? '';
    if (msg.startsWith(BLOCK_PREFIX)) return NextResponse.json({ error: msg.slice(BLOCK_PREFIX.length) }, { status: 400 });
    if (msg === 'PENDING_EXISTS') {
      return NextResponse.json(
        { error: 'You already have a pending loan application. Wait for it to be reviewed before applying again.' },
        { status: 400 }
      );
    }
    console.error('[loans/apply]', err);
    return NextResponse.json({ error: 'Could not submit your loan application.' }, { status: 500 });
  }

  await logAnalyticsEvent('loan_requested', input.amount).catch((e) => console.error('[loans/apply] analytics', e));
  return NextResponse.json({ ok: true, reference, loanId: loanRef.id });
}
