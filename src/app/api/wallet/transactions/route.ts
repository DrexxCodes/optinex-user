import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { listWalletTransactions } from '@/lib/db/walletTransactions';

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 50);
  const cursor = searchParams.get('cursor'); // id of the last transaction from the previous page

  return NextResponse.json(await listWalletTransactions(session.uid, limit, cursor));
}
