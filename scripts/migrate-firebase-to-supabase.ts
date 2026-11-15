// One-off, resumable migration: Firestore + Firebase-era Redis keys  ->  Supabase.
//
//   npx tsx scripts/migrate-firebase-to-supabase.ts            # real run
//   npx tsx scripts/migrate-firebase-to-supabase.ts --dry-run  # read + report only, writes nothing
//   npx tsx scripts/migrate-firebase-to-supabase.ts --skip-redis
//
// Required env (put them in a local .env.migration and `export $(cat .env.migration | xargs)`):
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN        (unless --skip-redis)
//
// What it does, in order (every step is idempotent — re-running only copies what's missing):
//   1. Users  -> Supabase Auth accounts (existing bcrypt hashes imported, so NOBODY has to reset a
//      password) + `profiles` rows. A uuid is minted per user; the old Firestore id is kept in
//      `profiles.legacy_id`.
//   2. Per-user subcollections (walletTransactions, checkins, spins, completedTasks), tracked in
//      `migration_state` so a crash/quota stop never duplicates rows.
//   3. Top-level collections (tasks, packages, investments, accountUpgrades, withdrawals, loans +
//      timeline, pushTokens, pushNotifications, transactions, analytics, config, system). Firestore
//      doc ids are preserved as the text primary keys.
//   4. Redis: every leaderboard / referral zset + name hash is re-keyed from old uids to new uuids.
//   5. Verification report (row counts + wallet totals).
//
// FIRESTORE QUOTA: a full read of the database costs reads. If the free daily quota is exhausted
// the script stops cleanly (exit code 2) — just re-run it after the quota resets, or enable the
// Blaze plan for the day (one-off migration costs cents). Progress is never lost.
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, type DocumentData, type Firestore } from 'firebase-admin/firestore';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

const DRY = process.argv.includes('--dry-run');
const SKIP_REDIS = process.argv.includes('--skip-redis');
const CASINO_GAME_IDS = ['brick-slasher', 'reaction-tap', 'stack-tower', 'endless-runner'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ───────────── setup ─────────────
function need(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

initializeApp({
  credential: cert({
    projectId: need('FIREBASE_PROJECT_ID'),
    clientEmail: need('FIREBASE_CLIENT_EMAIL'),
    privateKey: need('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n')
  })
});
const db: Firestore = getFirestore();
const sb: SupabaseClient = createClient(need('NEXT_PUBLIC_SUPABASE_URL'), need('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false }
});

const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ───────────── helpers ─────────────
function ts(v: any): string | null {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'number') return new Date(v).toISOString();
  if (typeof v === 'string') return new Date(v).toISOString();
  return null;
}
const n = (v: any, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** Recursively turns Firestore Timestamps into ISO strings (for config/system docs). */
function plain(v: any): any {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]));
  return v;
}

function quotaGuard(err: any): never {
  if (err?.code === 8 || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(String(err?.message))) {
    console.error('\n⛔ Firestore quota exhausted. Everything copied so far is saved — re-run after the quota resets (or enable Blaze for the day).');
    process.exit(2);
  }
  throw err;
}

async function chunked<T>(rows: T[], size: number, fn: (chunk: T[]) => Promise<void>) {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size));
}

async function pool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    })
  );
}

async function upsert(table: string, rows: Record<string, any>[], onConflict: string) {
  if (!rows.length || DRY) return;
  await chunked(rows, 500, async (chunk) => {
    const { error } = await sb.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  });
}

async function getAll(path: string): Promise<{ id: string; data: DocumentData }[]> {
  try {
    const snap = await db.collection(path).get();
    return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
  } catch (e) {
    return quotaGuard(e);
  }
}

// ───────────── 1. users ─────────────
const idMap = new Map<string, string>(); // firestore uid -> supabase uuid
const profileIds = new Set<string>();

async function migrateUsers() {
  log('Step 1/5 — users');

  const { data: existing } = await sb.from('profiles').select('id, legacy_id').not('legacy_id', 'is', null);
  for (const p of existing ?? []) {
    idMap.set(p.legacy_id, p.id);
    profileIds.add(p.id);
  }
  log(`  ${idMap.size} users already migrated`);

  // Auth accounts that already exist (e.g. a previous run died between auth + profile insert).
  const authByEmail = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    data.users.forEach((u) => u.email && authByEmail.set(u.email.toLowerCase(), u.id));
    if (data.users.length < 1000) break;
  }

  type Pending = { fsId: string; data: DocumentData; uuid: string };
  const pending: Pending[] = [];
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  let scanned = 0;

  for (;;) {
    let q = db.collection('users').orderBy('__name__').limit(500);
    if (last) q = q.startAfter(last);
    let snap;
    try {
      snap = await q.get();
    } catch (e) {
      quotaGuard(e);
    }
    if (snap!.empty) break;
    for (const doc of snap!.docs) {
      scanned++;
      if (idMap.has(doc.id)) continue;
      const data = doc.data();
      if (!data.email || !data.username) {
        log(`  ⚠ skipping user ${doc.id}: missing email/username`);
        continue;
      }
      pending.push({ fsId: doc.id, data, uuid: authByEmail.get(String(data.email).toLowerCase()) ?? randomUUID() });
    }
    last = snap!.docs[snap!.docs.length - 1];
  }
  log(`  scanned ${scanned} users, ${pending.length} to migrate`);
  if (DRY) {
    pending.forEach((p) => idMap.set(p.fsId, p.uuid));
    return;
  }

  // 1a. Supabase Auth accounts — bcrypt hashes imported verbatim.
  const authOk = new Set<string>(); // firestore ids whose auth account exists (profiles need it: FK)
  let created = 0;
  await pool(pending, 8, async (p) => {
    if (!authByEmail.has(String(p.data.email).toLowerCase())) {
      const { error } = await sb.auth.admin.createUser({
        id: p.uuid,
        email: String(p.data.email).toLowerCase(),
        password_hash: p.data.passwordHash, // $2a$/$2b$ bcrypt from bcryptjs — GoTrue verifies it natively
        email_confirm: true,
        user_metadata: { username: p.data.username, full_name: p.data.fullName ?? '' }
      });
      if (error) {
        log(`  ⚠ auth user failed for ${p.data.email}: ${error.message}`);
        return;
      }
    }
    authOk.add(p.fsId);
    created++;
    if (created % 200 === 0) log(`  auth accounts: ${created}/${pending.length}`);
  });

  // 1b. Profiles (referred_by wired in a second pass so insert order never matters).
  const migrating = pending.filter((p) => authOk.has(p.fsId));
  const rows = migrating.map((p) => {
    const u = p.data;
    return {
      id: p.uuid,
      legacy_id: p.fsId,
      full_name: u.fullName ?? '',
      email: String(u.email).toLowerCase(),
      username: String(u.username).toLowerCase(),
      wallet_amount: n(u.walletAmount),
      package_status: u.packageStatus ?? 'Free',
      package_id: u.packageId ?? null,
      package_name: u.packageName ?? null,
      package_started_at: u.packageStartedAt ?? null,
      package_expires_at: u.packageExpiresAt ?? null,
      last_investment_return_at: u.lastInvestmentReturnAt ?? null,
      is_changing_package: !!u.isChangingPackage,
      payout_method: u.payoutMethod ?? null,
      is_admin: u.admin === true,
      referral_key: u.referralKey ?? null,
      referral_earnings: n(u.referralEarnings),
      weekly_referrals: n(u.weeklyReferrals),
      all_time_referrals: n(u.allTimeReferrals),
      account_tier: u.accountTier ?? 'standard',
      upgrade_status: u.upgradeStatus ?? 'none',
      avatar_seed: u.avatarSeed ?? String(u.email).toLowerCase(),
      last_checkin_at: ts(u.lastCheckinAt),
      streak_count: n(u.streakCount),
      spins_used: n(u.spinsUsed),
      spins_date: u.spinsDate ?? null,
      pending_loan_id: u.pendingLoanId ?? null,
      casino_high_scores: u.casinoHighScores ?? {},
      created_at: ts(u.createdAt) ?? new Date().toISOString()
    };
  });
  await chunked(rows, 300, async (chunk) => {
    const { error } = await sb.from('profiles').upsert(chunk, { onConflict: 'id' });
    if (error) throw new Error(`profiles: ${error.message}`);
  });
  migrating.forEach((p) => {
    idMap.set(p.fsId, p.uuid);
    profileIds.add(p.uuid);
  });

  // 1c. referred_by second pass.
  const links = migrating.filter((p) => p.data.referredBy && idMap.has(p.data.referredBy));
  await pool(links, 8, async (p) => {
    await sb.from('profiles').update({ referred_by: idMap.get(p.data.referredBy)! }).eq('id', p.uuid);
  });
  log(`  ✔ ${migrating.length}/${pending.length} profiles inserted, ${links.length} referral links restored`);
}

// ───────────── 2. per-user subcollections ─────────────
async function migrateSubcollections() {
  log('Step 2/5 — per-user subcollections (wallet history, check-ins, spins, completed tasks)');

  const { data: done } = await sb.from('migration_state').select('legacy_user_id, stage');
  const doneSet = new Set((done ?? []).map((d) => `${d.legacy_user_id}:${d.stage}`));

  const stages: {
    stage: string;
    table: string;
    order?: string;
    map: (id: string, d: DocumentData, uid: string) => Record<string, any>;
  }[] = [
    {
      stage: 'wallet',
      table: 'wallet_transactions',
      order: 'timestamp', // inserted oldest -> newest so identity ids follow chronology
      map: (_id, d, uid) => ({
        user_id: uid,
        txn_type: d.txnType ?? 'credit',
        txn_name: d.txnName ?? '',
        amount: n(d.amount),
        txn_ref: d.txnRef ?? null,
        package_id: d.packageId ?? null,
        for_date: d.forDate ?? null,
        created_at: ts(d.timestamp) ?? new Date().toISOString()
      })
    },
    {
      stage: 'checkins',
      table: 'checkins',
      order: 'timestamp',
      map: (_id, d, uid) => ({ user_id: uid, date: d.date ?? '', created_at: ts(d.timestamp) ?? new Date().toISOString() })
    },
    {
      stage: 'spins',
      table: 'spins',
      order: 'timestamp',
      map: (_id, d, uid) => ({ user_id: uid, prize_id: d.prizeId ?? '', amount: n(d.amount), created_at: ts(d.timestamp) ?? new Date().toISOString() })
    },
    {
      stage: 'completed',
      table: 'completed_tasks',
      map: (id, d, uid) => ({ user_id: uid, task_id: id, reward: d.reward ?? null, completed_at: ts(d.completedAt) ?? new Date().toISOString() })
    }
  ];

  const users = [...idMap.entries()];
  let i = 0;
  for (const [fsId, uuid] of users) {
    i++;
    for (const s of stages) {
      if (doneSet.has(`${fsId}:${s.stage}`)) continue;
      let docs: FirebaseFirestore.QueryDocumentSnapshot[];
      try {
        let q: FirebaseFirestore.Query = db.collection('users').doc(fsId).collection(
          s.stage === 'wallet' ? 'walletTransactions' : s.stage === 'completed' ? 'completedTasks' : s.stage
        );
        if (s.order) q = q.orderBy(s.order, 'asc');
        docs = (await q.get()).docs;
      } catch (e) {
        quotaGuard(e);
        return;
      }
      const rows = docs.map((d) => s.map(d.id, d.data(), uuid));
      if (!DRY) {
        await chunked(rows, 1000, async (chunk) => {
          const { error } = await sb.from(s.table).insert(chunk);
          if (error && !(s.table === 'completed_tasks' && error.code === '23505')) throw new Error(`${s.table}: ${error.message}`);
        });
        await sb.from('migration_state').upsert({ legacy_user_id: fsId, stage: s.stage, rows_copied: rows.length });
      }
    }
    if (i % 100 === 0) log(`  users processed: ${i}/${users.length}`);
  }
  log('  ✔ subcollections done');
}

// ───────────── 3. top-level collections ─────────────
async function migrateTopLevel() {
  log('Step 3/5 — top-level collections');
  const uid = (fs: string | undefined) => (fs ? idMap.get(fs) : undefined);

  // tasks / packages
  const tasks = await getAll('tasks');
  await upsert('tasks', tasks.map(({ id, data: d }) => ({
    id, name: d.name ?? '', details: d.details ?? '', button_label: d.buttonLabel ?? '', link: d.link ?? '',
    reward: n(d.reward), active: d.active !== false, created_at: ts(d.createdAt) ?? new Date().toISOString()
  })), 'id');

  const packages = await getAll('packages');
  await upsert('packages', packages.map(({ id, data: d }) => ({
    id, name: d.name ?? '', price: n(d.price), duration: String(d.duration ?? ''), details: Array.isArray(d.details) ? d.details : [],
    active: d.active !== false, created_at: ts(d.createdAt) ?? new Date().toISOString()
  })), 'id');

  // investments / accountUpgrades / withdrawals
  const investments = await getAll('investments');
  await upsert('investments', investments.flatMap(({ id, data: d }) => {
    const user = uid(d.uid);
    if (!user) return [];
    return [{
      id, user_id: user, package_id: d.packageId ?? null, package_name: d.packageName ?? null, amount: n(d.amount),
      receipt_url: d.receiptUrl ?? null, status: d.status ?? 'pending', reference: d.reference ?? null,
      is_package_change: !!d.isPackageChange, previous_package_id: d.previousPackageId ?? null,
      revoked_at: ts(d.revokedAt), revoked_by: uid(d.revokedBy) ?? null, created_at: ts(d.createdAt) ?? new Date().toISOString()
    }];
  }), 'id');

  const upgrades = await getAll('accountUpgrades');
  await upsert('account_upgrades', upgrades.flatMap(({ id, data: d }) => {
    const user = uid(d.uid);
    if (!user) return [];
    return [{
      id, user_id: user, amount: n(d.amount), receipt_url: d.receiptUrl ?? null, status: d.status ?? 'pending',
      reference: d.reference ?? null, revoked_at: ts(d.revokedAt), revoked_by: uid(d.revokedBy) ?? null,
      created_at: ts(d.createdAt) ?? new Date().toISOString()
    }];
  }), 'id');

  const withdrawals = await getAll('withdrawals');
  await upsert('withdrawals', withdrawals.flatMap(({ id, data: d }) => {
    const user = uid(d.uid);
    if (!user) return [];
    return [{
      id, user_id: user, amount: n(d.amount), payout_method: d.payoutMethod ?? null, status: d.status ?? 'pending',
      reference: d.reference ?? null, created_at: ts(d.createdAt) ?? new Date().toISOString()
    }];
  }), 'id');

  // loans + immutable timeline
  const loans = await getAll('loans');
  await upsert('loans', loans.flatMap(({ id, data: d }) => {
    const user = uid(d.uid);
    if (!user) return [];
    return [{
      id, user_id: user, full_name: d.fullName ?? '', username: d.username ?? '', applicant: d.applicant ?? null,
      next_of_kin: d.nextOfKin ?? null, reason: d.reason ?? null, amount: n(d.amount), bank_account: d.bankAccount ?? null,
      status: d.status ?? 'pending', reference: d.reference ?? null,
      created_at: ts(d.createdAt) ?? new Date().toISOString(), status_changed_at: ts(d.statusChangedAt) ?? ts(d.createdAt) ?? new Date().toISOString()
    }];
  }), 'id');
  const loanIds = new Set(loans.filter((l) => uid(l.data.uid)).map((l) => l.id));
  for (const loan of loans) {
    if (!loanIds.has(loan.id)) continue;
    let tl;
    try {
      tl = await db.collection('loans').doc(loan.id).collection('timeline').get();
    } catch (e) {
      quotaGuard(e);
      return;
    }
    await upsert('loan_timeline', tl.docs.map((t) => {
      const d = t.data();
      return { loan_id: loan.id, status: t.id, seq: n(d.seq), by: d.by ?? 'admin', actor_uid: uid(d.actorUid) ?? null, at: ts(d.at) ?? new Date().toISOString() };
    }), 'loan_id,status');
  }

  // push tokens / history
  const tokens = await getAll('pushTokens');
  await upsert('push_tokens', tokens.flatMap(({ id, data: d }) => {
    const user = uid(d.uid);
    return user ? [{ token: d.token ?? id, user_id: user, device_id: d.deviceId ?? null, created_at: d.createdAt ?? null, updated_at: d.updatedAt ?? null }] : [];
  }), 'token');

  const pushes = await getAll('pushNotifications');
  await upsert('push_notifications', pushes.map(({ id, data: d }) => ({
    id, title: d.title ?? '', body: d.body ?? '', link: d.link ?? null, sent_by: d.sentBy ?? null, sent_at: ts(d.sentAt) ?? new Date().toISOString()
  })), 'id');

  // legacy cron transactions
  const legacy = await getAll('transactions');
  if (!DRY && legacy.length) {
    const rows = legacy.flatMap(({ data: d }) => {
      const user = uid(d.uid);
      return user ? [{ user_id: user, type: d.type ?? '', amount: n(d.amount), date: d.date ?? '', status: d.status ?? 'completed', created_at: ts(d.createdAt) ?? new Date().toISOString() }] : [];
    });
    const { count } = await sb.from('legacy_transactions').select('id', { count: 'exact', head: true });
    if (!count) await chunked(rows, 1000, async (c) => { const { error } = await sb.from('legacy_transactions').insert(c); if (error) throw new Error(error.message); });
  }

  // analytics (daily / monthly / yearly). Old docs may hold counts as nested `counts: {}` OR as
  // literal "counts.signup" keys (a Firestore set-merge quirk) — fold both into one counts map.
  for (const period of ['daily', 'monthly', 'yearly'] as const) {
    const entries = await getAll(`analytics/${period}/entries`);
    await upsert('analytics_entries', entries.map(({ id, data: d }) => {
      const counts: Record<string, number> = {};
      for (const [k, v] of Object.entries(d)) {
        if (k.startsWith('counts.') && typeof v === 'number') counts[k.slice(7)] = (counts[k.slice(7)] ?? 0) + v;
      }
      if (d.counts && typeof d.counts === 'object') {
        for (const [k, v] of Object.entries(d.counts)) if (typeof v === 'number') counts[k] = (counts[k] ?? 0) + v;
      }
      return {
        period, period_key: id, counts, total: n(d.total), amount_total: n(d.amountTotal),
        revenue_total: n(d.revenueTotal), revenue_events: n(d.revenueEvents), updated_at: ts(d.updatedAt) ?? new Date().toISOString()
      };
    }), 'period,period_key');
  }

  // config/* and system/* -> config rows
  for (const [collection, keys] of [['config', ['popup', 'bank', 'upgrade', 'withdrawal']], ['system', ['resetLog', 'referralWeekly']]] as const) {
    for (const key of keys) {
      let snap;
      try {
        snap = await db.collection(collection).doc(key).get();
      } catch (e) {
        quotaGuard(e);
        return;
      }
      if (snap!.exists) await upsert('config', [{ key, value: plain(snap!.data()) }], 'key');
    }
  }
  log('  ✔ top-level collections done');
}

// ───────────── 4. redis re-key ─────────────
async function migrateRedis() {
  if (SKIP_REDIS) return log('Step 4/5 — redis skipped');
  log('Step 4/5 — redis (re-keying leaderboards from old uids to new uuids)');
  const redis = new Redis({ url: need('UPSTASH_REDIS_REST_URL'), token: need('UPSTASH_REDIS_REST_TOKEN') });
  const newIds = new Set(idMap.values());
  const resolve = (m: string) => idMap.get(m) ?? (UUID_RE.test(m) && newIds.has(m) ? m : null);

  const zsets = [...CASINO_GAME_IDS.map((g) => `casino:leaderboard:${g}`), 'referral:leaderboard', 'referral:weekly:leaderboard'];
  const hashes = [...CASINO_GAME_IDS.map((g) => `casino:usernames:${g}`), 'referral:names'];

  for (const key of zsets) {
    const flat = (await redis.zrange(key, 0, -1, { withScores: true })) as (string | number)[];
    const members: { score: number; member: string }[] = [];
    let dropped = 0;
    for (let i = 0; i < flat.length; i += 2) {
      const m = resolve(String(flat[i]));
      if (m) members.push({ score: Number(flat[i + 1]), member: m });
      else dropped++;
    }
    if (DRY || (!members.length && !flat.length)) { log(`  ${key}: ${members.length} kept, ${dropped} dropped`); continue; }
    const tmp = `${key}:migrating`;
    await redis.del(tmp);
    if (members.length) {
      await chunked(members, 500, async (c) => { await redis.zadd(tmp, c[0], ...c.slice(1)); });
      await redis.rename(tmp, key);
    } else {
      await redis.del(key);
    }
    log(`  ${key}: ${members.length} kept, ${dropped} dropped`);
  }

  for (const key of hashes) {
    const all = (await redis.hgetall<Record<string, string>>(key)) ?? {};
    const out: Record<string, string> = {};
    for (const [m, v] of Object.entries(all)) {
      const r = resolve(m);
      if (r) out[r] = v;
    }
    if (DRY || !Object.keys(all).length) { log(`  ${key}: ${Object.keys(out).length}/${Object.keys(all).length} entries`); continue; }
    const tmp = `${key}:migrating`;
    await redis.del(tmp);
    if (Object.keys(out).length) { await redis.hset(tmp, out); await redis.rename(tmp, key); } else await redis.del(key);
    log(`  ${key}: ${Object.keys(out).length}/${Object.keys(all).length} entries`);
  }
}

// ───────────── 5. verification ─────────────
async function verify() {
  log('Step 5/5 — verification');
  const cnt = async (t: string) => (await sb.from(t).select('*', { count: 'exact', head: true })).count ?? 0;

  const fsUsers = (await db.collection('users').count().get()).data().count;
  const rows: [string, number | string, number | string][] = [['users', fsUsers, await cnt('profiles')]];
  for (const [fs, table] of [['investments', 'investments'], ['withdrawals', 'withdrawals'], ['accountUpgrades', 'account_upgrades'], ['loans', 'loans'], ['tasks', 'tasks'], ['packages', 'packages']] as const) {
    rows.push([fs, (await db.collection(fs).count().get()).data().count, await cnt(table)]);
  }
  console.table(rows.map(([name, firestore, supabase]) => ({ name, firestore, supabase, match: firestore === supabase ? '✔' : '✘ CHECK' })));

  // Wallet totals: Firestore vs Supabase.
  let fsTotal = 0;
  const snap = await db.collection('users').select('walletAmount').get();
  snap.docs.forEach((d) => (fsTotal += n(d.data().walletAmount)));
  let sbTotal = 0;
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from('profiles').select('wallet_amount').range(from, from + 999);
    (data ?? []).forEach((r) => (sbTotal += Number(r.wallet_amount)));
    if (!data || data.length < 1000) break;
  }
  log(`  wallet total  firestore=${fsTotal.toFixed(2)}  supabase=${sbTotal.toFixed(2)}  ${Math.abs(fsTotal - sbTotal) < 0.01 ? '✔' : '✘ CHECK'}`);
}

(async () => {
  log(DRY ? 'DRY RUN — nothing will be written' : 'LIVE RUN');
  await migrateUsers();
  await migrateSubcollections();
  await migrateTopLevel();
  await migrateRedis();
  if (!DRY) await verify();
  log('Done.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
