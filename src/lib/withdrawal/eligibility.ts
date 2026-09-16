import { adminDb } from '@/lib/firebase/admin';
import type { Transaction } from 'firebase-admin/firestore';

// A user must have held at least this many *different* packages (by packageId)
// before they're allowed to withdraw — not just re-upped the same one twice.
export const MIN_DISTINCT_PACKAGES = 2;

/**
 * Counts the distinct packageIds among a user's active investments.
 * Pass `tx` when calling from inside a Firestore transaction (e.g. the
 * withdrawal request route, so the read is part of the same atomic check);
 * omit it for a plain read (e.g. the read-only status route).
 */
export async function getDistinctActivePackageCount(uid: string, tx?: Transaction): Promise<number> {
  const query = adminDb.collection('investments').where('uid', '==', uid).where('status', '==', 'active');
  const snap = tx ? await tx.get(query) : await query.get();

  const packageIds = new Set<string>();
  snap.docs.forEach((doc) => {
    const packageId = doc.data().packageId;
    if (packageId) packageIds.add(packageId);
  });

  return packageIds.size;
}
