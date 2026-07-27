import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';

// Thin API wrapper around the shared reference generator, in case a client
// surface ever needs a reference without the write happening server-side
// (e.g. pre-filling a manual bank transfer narration).
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });
  return NextResponse.json({ reference: generateReference() });
}
