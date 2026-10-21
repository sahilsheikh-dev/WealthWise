import { INSURANCE_BUDGET_CATEGORIES } from './policyCategories';

export type BudgetGroup = {
  id: 'survival' | 'savings-investments' | 'wants' | 'festival-donations-culture' | 'unexpected-extras' | 'insurance';
  name: string;
  hint: string;
  weight: number;
  categories: readonly string[];
};

export const BUDGET_GROUPS: readonly BudgetGroup[] = [
  {
    id: 'survival',
    name: 'Survival (Needs)',
    hint: 'Essentials: living, rent, utilities, food, transport, family, health, bills, education and EMI.',
    weight: 50,
    categories: ['Living', 'Rent', 'Utilities', 'Food', 'Transport', 'Family', 'Health', 'Bills', 'Education', 'EMI'],
  },
  {
    id: 'savings-investments',
    name: 'Savings and Investments',
    hint: 'Savings and every investment category.',
    weight: 20,
    categories: ['Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit / RD', 'Gold / Silver', 'Other investments'],
  },
  {
    id: 'wants',
    name: 'Wants',
    hint: 'Non-essential or lifestyle spending: subscriptions, personal spending, travel, eating out, online shopping, entertainment and fashion.',
    weight: 15,
    categories: ['Shopping', 'Other', 'Eating out', 'Entertainment', 'Fashion', 'Subscriptions', 'Personal spending', 'Travel'],
  },
  {
    id: 'festival-donations-culture',
    name: 'Festival, Donations, Culture',
    hint: 'Festival, donation, gifts and culture-related spending.',
    weight: 5,
    categories: ['Festival', 'Donation', 'Gifts', 'Culture'],
  },
  {
    id: 'unexpected-extras',
    name: 'Unexpected Extras',
    hint: 'Surprises and emergencies: medical bills, home or vehicle repairs, or sudden gifts.',
    weight: 10,
    categories: ['Unexpected'],
  },
];

const INSURANCE_GROUP: BudgetGroup = {
  id: 'insurance',
  name: 'Insurance',
  hint: 'Insurance premiums and policy cover.',
  weight: 0,
  categories: INSURANCE_BUDGET_CATEGORIES,
};

export function budgetGroupFor(category: string): BudgetGroup | undefined {
  if (INSURANCE_BUDGET_CATEGORIES.some((item) => item.toLowerCase() === category.toLowerCase())) {
    return INSURANCE_GROUP;
  }
  const normalized = category.toLowerCase();
  return BUDGET_GROUPS.find((group) =>
    group.categories.some((item) => item.toLowerCase() === normalized),
  );
}
