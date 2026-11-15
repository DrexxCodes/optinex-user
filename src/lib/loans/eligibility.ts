import { getDistinctActivePackageCount, MIN_DISTINCT_PACKAGES } from '@/lib/withdrawal/eligibility';

export type LoanBlockCode = 'UPGRADE_REQUIRED' | 'PACKAGE_REQUIRED' | 'MORE_PACKAGES_REQUIRED';
export type LoanBlock = { code: LoanBlockCode; message: string };

/**
 * Loan gatekeeper — same rules as withdrawal (upgraded account + at least
 * MIN_DISTINCT_PACKAGES *different* active packages) but with messages that
 * tell the user exactly what to do next, in order:
 *   1. not upgraded               -> upgrade first
 *   2. upgraded, no active package -> you need at least 2 packages
 *   3. upgraded, 1 active package  -> add one more package
 * No "enabled date" or payout-method requirement.
 *
 * Returns the first failing rule, or null.
 */
export async function getLoanBlock(uid: string, accountTier: string | null | undefined): Promise<LoanBlock | null> {
  if (accountTier !== 'upgraded') {
    return { code: 'UPGRADE_REQUIRED', message: 'You need to upgrade your account first before you can apply for a loan.' };
  }

  const count = await getDistinctActivePackageCount(uid);
  if (count >= MIN_DISTINCT_PACKAGES) return null;

  if (count === 0) {
    return { code: 'PACKAGE_REQUIRED', message: `You need at least ${MIN_DISTINCT_PACKAGES} active packages to apply for a loan.` };
  }

  const remaining = MIN_DISTINCT_PACKAGES - count;
  return {
    code: 'MORE_PACKAGES_REQUIRED',
    message: `You have ${count} active package${count === 1 ? '' : 's'}. Add ${remaining === 1 ? 'one more package' : `${remaining} more packages`} to apply for a loan.`
  };
}
