import type { PolicyKind } from './types';

export const GENERIC_INSURANCE_CATEGORY = 'Insurance premium';

type TypedCoverPolicyType = 'term-life' | 'health' | 'motor' | 'home';
const TYPED_POLICY_KINDS: readonly TypedCoverPolicyType[] = ['term-life', 'health', 'motor', 'home'];

export const POLICY_COVER_CATEGORIES: Record<TypedCoverPolicyType, string> = {
  'term-life': 'Term life premium',
  health: 'Health premium',
  motor: 'Motor premium',
  home: 'Home premium',
};

export const INSURANCE_BUDGET_CATEGORIES = [
  'Insurance',
  GENERIC_INSURANCE_CATEGORY,
  ...Object.values(POLICY_COVER_CATEGORIES),
] as const;

export function policyPremiumCategory(kind: PolicyKind): string {
  return kind === 'term-life' || kind === 'health' || kind === 'motor' || kind === 'home'
    ? POLICY_COVER_CATEGORIES[kind]
    : GENERIC_INSURANCE_CATEGORY;
}

export function isInsuranceBudgetCategory(category: string): boolean {
  return (INSURANCE_BUDGET_CATEGORIES as readonly string[]).includes(category);
}

export function coverTypeForPremiumCategory(category: string): TypedCoverPolicyType | undefined {
  return TYPED_POLICY_KINDS.find((type) => POLICY_COVER_CATEGORIES[type] === category);
}
