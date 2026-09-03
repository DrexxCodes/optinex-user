import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { signAccessToken } from '@/lib/auth/jwt';
import { accessCookieOptions, refreshCookieOptions, ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/session';
import { logAnalyticsEvent } from '@/lib/analytics';
import { redis, REFERRAL_LEADERBOARD_KEY, REFERRAL_WEEKLY_LEADERBOARD_KEY, REFERRAL_LEADERBOARD_NAMES_KEY } from '@/lib/redis';

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
    // Keys look like `incossify-a3f9k2` — compare lowercased/trimmed rather
    // than the old uppercase-hex assumption.
    let referredBy: string | null = null;
    let referrerData: { fullName?: string; username?: string } | null = null;
    if (referralKey) {
      const referrerSnap = await usersRef.where('referralKey', '==', String(referralKey).trim().toLowerCase()).limit(1).get();
      if (!referrerSnap.empty) {
        referredBy = referrerSnap.docs[0].id;
        const r = referrerSnap.docs[0].data();
        referrerData = { fullName: r.fullName, username: r.username };
      }
    }

    const REFERRAL_BONUS = 2000;
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
      weeklyReferrals: 0, // resets every week from the admin Referrals page
      allTimeReferrals: 0, // never reset — feeds the admin leaderboard's all-time column
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
      batch.set(
        referrerRef,
        {
          walletAmount: FieldValue.increment(REFERRAL_BONUS),
          referralEarnings: FieldValue.increment(REFERRAL_BONUS),
          // Feeds the admin Referrals leaderboard (₦1,000/referral there, independent
          // of the REFERRAL_BONUS actually paid into the wallet above). weeklyReferrals
          // is zeroed by the admin's weekly reset; allTimeReferrals is never touched.
          weeklyReferrals: FieldValue.increment(1),
          allTimeReferrals: FieldValue.increment(1)
        },
        { merge: true }
      );
      batch.set(referrerRef.collection('walletTransactions').doc(), {
        txnType: 'credit',
        txnName: 'Referral bonus',
        amount: REFERRAL_BONUS,
        txnRef: `@${normalizedUsername} joined`,
        timestamp: FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    if (referredBy) {
      await logAnalyticsEvent('referral_bonus', REFERRAL_BONUS);

      // Bump the referrer's score on the referral leaderboard. This is cache-only
      // (not the source of truth — that's the `referredBy` field on each user doc,
      // which /api/referral already counts) so a Redis hiccup here should never
      // block or fail the signup itself.
      try {
        await redis.zincrby(REFERRAL_LEADERBOARD_KEY, 1, referredBy);
        await redis.zincrby(REFERRAL_WEEKLY_LEADERBOARD_KEY, 1, referredBy);
        await redis.hset(REFERRAL_LEADERBOARD_NAMES_KEY, {
          [referredBy]: JSON.stringify({ fullName: referrerData?.fullName ?? 'Incossify user', username: referrerData?.username ?? '' })
        });
      } catch (err) {
        console.error('[signup] referral leaderboard update failed:', err);
      }
    }

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
