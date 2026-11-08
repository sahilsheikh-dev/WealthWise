import type { AppData } from '../../domain/types';
import { mockAppData } from '../../mock/data';

export function makeV9Fixture(data: AppData = mockAppData): unknown {
  const budgetPlan = data.budgetPlan === null
    ? null
    : (() => {
      const { sections: _sections, items, ...rest } = data.budgetPlan;
      return {
        ...rest,
        lines: items.map((item) => ({
          category: item.name,
          mode: item.mode,
          value: item.value,
          ...(item.dueDay === undefined ? {} : { dueDay: item.dueDay }),
        })),
      };
    })();
  return {
    ...data,
    budgetPlan,
    monthBudgets: data.monthBudgets?.map(({ sections: _sections, items, ...rest }) => ({
      ...rest,
      lines: items.map((item) => ({
        category: item.name,
        planned: item.value,
        ...(item.dueDay === undefined ? {} : { dueDay: item.dueDay }),
      })),
    })),
  };
}
