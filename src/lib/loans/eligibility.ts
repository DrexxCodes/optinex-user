import type { DocumentData, Transaction } from 'firebase-admin/firestore';
import { getDistinctActivePackageCount, MIN_DISTINCT_PACKAGES } from '@/lib/withdrawal/eligibility';

export type LoanBlockCode = 'UPGRADE_REQUIRED' | 'PACKAGE_REQUIRED' | 'MULTIPLE_PACKAGES_REQUIRED';

export const LOAN_BLOCK_MESSAGES: Record<LoanBlockCode, string> = {
  UPGRADE_REQUIRED: 'You must upgrade your account to apply for a loan.',
  PACKAGE_REQUIRED: 'A paid package is required before you can apply for a loan.',
  MULTIPLE_PACKAGES_REQUIRED: `You need at least ${MIN_DISTINCT_PACKAGES} different active packages before you can apply for a loan.`
};

/**
 * Loan gatekeeper — mirrors the withdrawal rules (upgraded account, a paid
 * package, and at least MIN_DISTINCT_PACKAGES *different* active packages)
 * but intentionally has no "enabled date" or payout-method requirement.
 *
 * Pass `tx` when calling from inside a Firestore transaction so the package
 * count is read atomically with the write; omit it for the read-only status
 * route. Returns the first failing rule, or null when the user is eligible.
 */
export async function getLoanBlock(uid: string, user: DocumentData, tx?: Transaction): Promise<LoanBlockCode | null> {
  const isUpgraded = user.accountTier === 'upgraded';
  const hasPaidPackage = !!user.packageStatus && user.packageStatus !== 'Free' && user.packageStatus !== 'pending verification';

  if (!isUpgraded) return 'UPGRADE_REQUIRED';
  if (!hasPaidPackage) return 'PACKAGE_REQUIRED';

  const distinct = await getDistinctActivePackageCount(uid, tx);
  if (distinct < MIN_DISTINCT_PACKAGES) return 'MULTIPLE_PACKAGES_REQUIRED';

  return null;
}
