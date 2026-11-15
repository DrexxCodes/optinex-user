'use client';

// Browser Supabase client. Used ONLY for Supabase Auth (sign-in / session refresh) so those
// calls come from each user's own IP — Supabase rate-limits auth endpoints per IP, and routing
// every sign-in through our server would funnel them all through one address.
// No table data is ever read from the browser (RLS denies it); data goes through /api/*.
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './env';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return client;
}
