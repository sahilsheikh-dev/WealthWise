import { createBackup, parseBackup } from '../backup';
import { emptyAppData } from '../actions';
import {
  applyBudgetPlanToMonth,
  budgetOverview,
  effectiveMonthBudget,
  plannedIncomeOf,
  projectedCashFlow,
} from '../budget';
import { pendingItems } from '../pending';
import { policySummary } from '../policySummary';
import { shiftMonth } from '../dates';
import type { BudgetIncomeItem } from '../types';
import { budgetPlanFromLines } from '../../testFixtures/budget';
import { formatINR } from '../../lib/format';

const today = '2026-02-15';
const incomes: BudgetIncomeItem[] = [
  {
    id: 'monthly', name: 'Monthly salary', category: 'Salary', amount: 1_000,
    frequency: 'monthly', firstDueMonth: '2026-03', day: 5,
  },
  {
    id: 'quarterly', name: 'Quarterly contract', category: 'Freelance', amount: 12_000,
    frequency: 'quarterly', firstDueMonth: '2026-03', day: 5,
  },
  {
    id: 'half-yearly', name: 'Half-yearly bonus', category: 'Other', amount: 18_000,
    frequency: 'half-yearly', firstDueMonth: '2026-04', day: 5,
  },
  {
    id: 'yearly', name: 'Yearly bonus', category: 'Other', amount: 24_000,
    frequency: 'yearly', firstDueMonth: '2026-05', day: 5,
  },
];

function incomePlannedIncomes(month: string): number {
  return plannedIncomeOf({ incomes }, month);
}

describe('P29-AB-R1 income recurrence consumers', () => {
  it('prints the 12-month consumer table and keeps every consumer recurrence-aware', async () => {
    const plan = budgetPlanFromLines([], {
      incomes,
      repeatMonthly: true,
      repeatFrom: '2026-02',
    });
    const dataWithPlan = { ...emptyAppData(today), budgetPlan: plan };
    const currentSnapshot = applyBudgetPlanToMonth(dataWithPlan, '2026-02', {
      newId: () => 'unused',
      today,
    }).monthBudgets?.[0];
    if (!currentSnapshot) throw new Error('Current-month income snapshot was not materialized.');
    const data = { ...dataWithPlan, monthBudgets: [currentSnapshot] };
    const backup = await createBackup(data, {
      exportedAt: '2026-02-15T12:00:00.000Z',
      digest: async (text) => `test-${text.length}`,
    });
    const imported = await parseBackup(backup, {
      today,
      newId: () => 'unused',
      digest: async (text) => `test-${text.length}`,
    });
    if (!imported.ok) throw new Error(`Income backup round-trip failed: ${imported.message}`);

    const months = Array.from({ length: 12 }, (_, index) => shiftMonth('2026-03', index));
    const rows = months.map((month) => {
      const overview = budgetOverview(data, month, today);
      const incomeSection = overview.sections.find((section) => section.id === 'income');
      const effective = effectiveMonthBudget(data, month, today);
      const projected = projectedCashFlow(data, month, today);
      const dues = pendingItems(data, month, today)
        .filter((item) => item.source.kind === 'income')
        .reduce((sum, item) => sum + item.amount, 0);
      const snapshot = applyBudgetPlanToMonth(dataWithPlan, month, {
        newId: () => 'unused',
        today,
      });
      const snapshotOverview = budgetOverview(snapshot, month, today);
      const planned = incomePlannedIncomes(month);
      return {
        month,
        plannedIncomeOf: planned,
        overviewRows: incomeSection?.planned ?? 0,
        overviewTotal: overview.stacked.income.planned,
        summaryText: overview.summary.stacked.includes(`Income ${formatINR(planned)} planned`),
        receivedDues: dues,
        projectedCashFlow: projected.closing - projected.opening,
        virtualMonth: effective.budget
          ? plannedIncomeOf(effective.budget, month)
          : 0,
        appliedSnapshot: snapshotOverview.stacked.income.planned,
        backupImport: plannedIncomeOf({ incomes: imported.data.budgetPlan?.incomes ?? [] }, month),
      };
    });
    console.log('P29-AB-R1 after-fix 12-month consumer table', JSON.stringify(rows, null, 2));
    console.log('P29-AB-R1 after-fix policy estimate', policySummary(data, today).yearlyIncomeEstimate);

    const expected = [13_000, 19_000, 25_000, 13_000, 1_000, 1_000, 13_000, 19_000, 1_000, 13_000, 1_000, 1_000];
    expect(rows.map((row) => row.plannedIncomeOf)).toEqual(expected);
    expect(rows.map((row) => row.overviewRows)).toEqual(expected);
    expect(rows.map((row) => row.overviewTotal)).toEqual(expected);
    expect(rows.map((row) => row.summaryText)).toEqual(Array(12).fill(true));
    expect(rows.map((row) => row.receivedDues)).toEqual(expected);
    expect(rows.map((row) => row.projectedCashFlow)).toEqual(expected);
    expect(rows.map((row) => row.virtualMonth)).toEqual(expected);
    expect(rows.map((row) => row.appliedSnapshot)).toEqual(expected);
    expect(rows.map((row) => row.backupImport)).toEqual(expected);
    expect(policySummary(data, today).yearlyIncomeEstimate).toBe(119_000);
    expect(imported.data.budgetPlan?.incomes).toEqual(incomes);
  });
});
