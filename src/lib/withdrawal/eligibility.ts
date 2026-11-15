import { supabaseAdmin } from '@/lib/supabase/admin';

// A user must have held at least this many *different* packages (by package id) before they're
// allowed to withdraw — not just re-upped the same one twice.
export const MIN_DISTINCT_PACKAGES = 2;

/** Counts the distinct package ids among a user's active investments. */
export async function getDistinctActivePackageCount(uid: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('distinct_active_package_count', { p_user: uid });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}
