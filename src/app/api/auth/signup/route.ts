import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAnalyticsEvent } from '@/lib/analytics';
import { isUniqueViolation } from '@/lib/db/format';
import { redis, REFERRAL_LEADERBOARD_KEY, REFERRAL_WEEKLY_LEADERBOARD_KEY, REFERRAL_LEADERBOARD_NAMES_KEY } from '@/lib/redis';

const REFERRAL_BONUS = 2000;

// Creates the account only — the browser then signs in with Supabase Auth (see
// lib/auth/clientAuth.ts) so the session is established from the user's own IP.
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

    const [emailHit, usernameHit] = await Promise.all([
      supabaseAdmin.from('profiles').select('id').eq('email', normalizedEmail).limit(1),
      supabaseAdmin.from('profiles').select('id').eq('username', normalizedUsername).limit(1)
    ]);
    if (emailHit.data?.length) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    if (usernameHit.data?.length) return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });

    // 1) Supabase Auth account (email pre-confirmed — there's no email-verification step in this product).
    const created = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { username: normalizedUsername, full_name: fullName }
    });
    if (created.error || !created.data.user) {
      const msg = created.error?.message ?? '';
      if (/already|registered|exists/i.test(msg)) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      console.error('[signup] createUser', created.error);
      return NextResponse.json({ error: 'Something went wrong creating your account.' }, { status: 500 });
    }
    const authUser = created.data.user;

    // 2) Profile + referral bonus, atomically, in one Postgres function.
    const { data: result, error: profileError } = await supabaseAdmin.rpc('create_profile', {
      p_id: authUser.id,
      p_full_name: fullName,
      p_email: normalizedEmail,
      p_username: normalizedUsername,
      p_referral_key: referralKey ? String(referralKey) : null,
      p_bonus: REFERRAL_BONUS
    });

    if (profileError) {
      // Roll the auth account back so the email isn't left orphaned.
      await supabaseAdmin.auth.admin.deleteUser(authUser.id).catch(() => {});
      if (isUniqueViolation(profileError, 'profiles_username_key')) {
        return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
      }
      if (isUniqueViolation(profileError, 'profiles_email_key')) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      console.error('[signup] create_profile', profileError);
      return NextResponse.json({ error: 'Something went wrong creating your account.' }, { status: 500 });
    }

    const referrerId: string | null = result?.referrer_id ?? null;

    if (referrerId) {
      await logAnalyticsEvent('referral_bonus', REFERRAL_BONUS).catch((e) => console.error('[signup] analytics', e));

      // Cache-only leaderboard bump — a Redis hiccup must never fail the signup itself.
      try {
        await redis.zincrby(REFERRAL_LEADERBOARD_KEY, 1, referrerId);
        await redis.zincrby(REFERRAL_WEEKLY_LEADERBOARD_KEY, 1, referrerId);
        await redis.hset(REFERRAL_LEADERBOARD_NAMES_KEY, {
          [referrerId]: JSON.stringify({
            fullName: result?.referrer_full_name ?? 'Incossify user',
            username: result?.referrer_username ?? ''
          })
        });
      } catch (err) {
        console.error('[signup] referral leaderboard update failed:', err);
      }
    }

    await logAnalyticsEvent('signup').catch((e) => console.error('[signup] analytics', e));

    return NextResponse.json({
      user: { uid: authUser.id, fullName, email: normalizedEmail, username: normalizedUsername }
    });
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Something went wrong creating your account.' }, { status: 500 });
  }
}
