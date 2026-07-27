import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

// Admin-created packages: price, duration, and details. Every account starts
// on the implicit `Free` tier which never appears here.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const snap = await adminDb.collection('packages').where('active', '==', true).orderBy('price', 'asc').get();
  return NextResponse.json({
    packages: snap.docs.map((d) => {
      const p = d.data();
      return { id: d.id, name: p.name, price: p.price, duration: p.duration, details: p.details ?? [] };
    })
  });
}
