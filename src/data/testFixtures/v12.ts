import { mockAppData } from '../../mock/data';
import type { BudgetItem } from '../../domain/types';

function withoutFrequency(item: BudgetItem) {
  const { frequency: _frequency, firstDueMonth: _firstDueMonth, ...legacyItem } = item;
  return legacyItem;
}

export function makeV12Fixture() {
  return {
    ...mockAppData,
    budgetPlan: mockAppData.budgetPlan === null
      ? null
      : {
        ...mockAppData.budgetPlan,
        items: mockAppData.budgetPlan.items.map(withoutFrequency),
      },
    monthBudgets: mockAppData.monthBudgets?.map((budget) => ({
      ...budget,
      items: budget.items.map(withoutFrequency),
    })),
  };
}
