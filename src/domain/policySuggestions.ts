import { coverTypeForPremiumCategory } from './policyCategories';
import type { AppData, Policy, Transaction } from './types';

export function suggestPolicyForTransaction(
  data: AppData,
  transaction: Transaction,
): Policy | null {
  if (transaction.type !== 'expense' || transaction.source !== undefined) return null;
  const type = coverTypeForPremiumCategory(transaction.category);
  if (!type) return null;
  const matches = data.policies.filter((policy) =>
    policy.kind === type && policy.status === 'active',
  );
  const match = matches[0];
  if (!match || matches.length > 1) return null;
  return match;
}
