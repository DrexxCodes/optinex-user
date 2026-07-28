import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { signAccessToken } from '@/lib/auth/jwt';
import { accessCookieOptions, refreshCookieOptions, ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/session';
import { logAnalyticsEvent } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, username, password, referralKey } = await req.json();

    if (!fullName || !email || !username || !password) {
      return NextResponse.json({ error: 'Full name, email, username, and password are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim().toLowerCase();

    const usersRef = adminDb.collection('users');
    const [emailSnap, usernameSnap] = await Promise.all([
      usersRef.where('email', '==', normalizedEmail).limit(1).get(),
      usersRef.where('username', '==', normalizedUsername).limit(1).get()
    ]);

    if (!emailSnap.empty) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    if (!usernameSnap.empty) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
    }

    // Optional referral key: must match another user's own referral key.
    // Keys look like `optinex-a3f9k2` — compare lowercased/trimmed rather
    // than the old uppercase-hex assumption.
    let referredBy: string | null = null;
    if (referralKey) {
      const referrerSnap = await usersRef.where('referralKey', '==', String(referralKey).trim().toLowerCase()).limit(1).get();
      if (!referrerSnap.empty) referredBy = referrerSnap.docs[0].id;
    }

    const REFERRAL_BONUS = 100;
    const passwordHash = await bcrypt.hash(password, 10);

    const userRef = usersRef.doc();
    const batch = adminDb.batch();

    batch.set(userRef, {
      fullName,
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      walletAmount: 0,
      packageStatus: 'Free',
      packageId: null,
      packageExpiresAt: null,
      payoutMethod: null,
      admin: false,
      referralKey: null, // generated on demand from the Referral page
      referralEarnings: 0,
      referredBy,
      accountTier: 'standard',
      upgradeStatus: 'none',
      avatarSeed: normalizedEmail,
      createdAt: FieldValue.serverTimestamp()
    });

    // Referral bonus: ₦100 to the referrer's wallet, credited the moment the
    // referred account is created (not gated on the new user doing anything
    // else). Recorded as a normal wallet transaction so it shows up in the
    // referrer's activity feed like any other credit.
    if (referredBy) {
      const referrerRef = usersRef.doc(referredBy);
      batch.set(referrerRef, { walletAmount: FieldValue.increment(REFERRAL_BONUS), referralEarnings: FieldValue.increment(REFERRAL_BONUS) }, { merge: true });
      batch.set(referrerRef.collection('walletTransactions').doc(), {
        txnType: 'credit',
        txnName: 'Referral bonus',
        amount: REFERRAL_BONUS,
        txnRef: `@${normalizedUsername} joined`,
        timestamp: FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    if (referredBy) await logAnalyticsEvent('referral_bonus', REFERRAL_BONUS);

    await logAnalyticsEvent('signup');

    const deviceId = randomBytes(8).toString('hex');
    const refreshToken = randomBytes(48).toString('hex');
    const refreshHash = await bcrypt.hash(refreshToken, 10);

    await userRef.collection('refreshTokens').doc(deviceId).set({
      hash: refreshHash,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    });

    const accessToken = await signAccessToken({
      uid: userRef.id,
      email: normalizedEmail,
      username: normalizedUsername,
      deviceId
    });

    const res = NextResponse.json({
      user: { uid: userRef.id, fullName, email: normalizedEmail, username: normalizedUsername }
    });
    res.cookies.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
    res.cookies.set(REFRESH_COOKIE, `${userRef.id}.${deviceId}.${refreshToken}`, refreshCookieOptions());
    return res;
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Something went wrong creating your account.' }, { status: 500 });
  }
}
