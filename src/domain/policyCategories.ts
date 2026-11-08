import {
  COVER_POLICY_TYPES,
  type CoverPolicyType,
  type PolicyKind,
} from './types';

export const GENERIC_INSURANCE_CATEGORY = 'Insurance premium';

type TypedCoverPolicyType = Exclude<CoverPolicyType, 'other'>;

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
  const type = COVER_POLICY_TYPES.find((candidate) => candidate === kind);
  return type && type !== 'other'
    ? POLICY_COVER_CATEGORIES[type]
    : GENERIC_INSURANCE_CATEGORY;
}

export function isInsuranceBudgetCategory(category: string): boolean {
  return (INSURANCE_BUDGET_CATEGORIES as readonly string[]).includes(category);
}

export function coverTypeForPremiumCategory(category: string): TypedCoverPolicyType | undefined {
  return COVER_POLICY_TYPES.find((type): type is TypedCoverPolicyType =>
    type !== 'other' && POLICY_COVER_CATEGORIES[type] === category,
  );
}
