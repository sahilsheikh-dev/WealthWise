import type { StateStorage } from 'zustand/middleware';

import { createAppStore } from '../createAppStore';
import type { AppData, ISODate } from '../../domain/types';
import { budgetPlanFromLines } from '../../testFixtures/budget';

class MemoryStorage implements StateStorage {
  readonly values = new Map<string, string>();

  getItem(name: string): string | null {
    return this.values.get(name) ?? null;
  }

  setItem(name: string, value: string): void {
    this.values.set(name, value);
  }

  removeItem(name: string): void {
    this.values.delete(name);
  }
}

function makeStore(storage: StateStorage, today: ISODate, nextId: () => string) {
  return createAppStore(storage, { newId: nextId, today: () => today, isDev: false });
}

async function waitForHydration(store: ReturnType<typeof makeStore>): Promise<void> {
  if (store.getState().hydrated) return;
  await new Promise<void>((resolve) => {
    const unsubscribe = store.subscribe((state) => {
      if (state.hydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
}

async function flushPersistence(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('Release 2 persisted-value refresh harness', () => {
  it('round-trips real add, edit and delete actions across every changed entity family', async () => {
    const storage = new MemoryStorage();
    const today = '2026-11-08';
    const month = today.slice(0, 7);
    let sequence = 0;
    const nextId = () => `release2-${++sequence}`;
    const store = makeStore(storage, today, nextId);
    await waitForHydration(store);

    let checkpoint = 0;
    let previousData: AppData | null = null;
    let previousDataJson: string | null = null;
    const verify = async (): Promise<void> => {
      checkpoint += 1;
      if (previousData !== null && JSON.stringify(previousData) !== previousDataJson) {
        throw new Error(`Store action ${checkpoint} mutated its previous AppData state.`);
      }
      await flushPersistence();
      const current = store.getState().data;
      const raw = storage.getItem('wealthwise.app.v1');
      if (raw === null) throw new Error('Store action did not persist its JSON state.');
      const persisted = JSON.parse(raw) as { state?: { data?: AppData } };
      if (JSON.stringify(persisted.state?.data) !== JSON.stringify(current)) {
        throw new Error(`Persisted state differs from the store after action ${checkpoint}.`);
      }

      const freshStore = makeStore(storage, today, nextId);
      await waitForHydration(freshStore);
      if (JSON.stringify(freshStore.getState().data) !== JSON.stringify(current)) {
        throw new Error(`Fresh hydration differs from the store after action ${checkpoint}.`);
      }
      previousData = current;
      previousDataJson = JSON.stringify(current);
    };

    const actions = store.getState().actions;
    actions.ensureCurrentMonthBudget(today);
    await verify();
    actions.addHolding({ name: 'Refresh cash', type: 'Cash', invested: 1_000, value: 1_000 });
    await verify();
    const holding = store.getState().data.holdings[0];
    if (!holding) throw new Error('Refresh holding was not created.');
    actions.updateHoldingValue(holding.id, 1_250, today, 'manual');
    await verify();
    actions.addInvestmentEntry(holding.id, {
      date: today, amount: 250, kind: 'Deposit', note: 'Added refresh entry',
    });
    await verify();
    const entry = holding.kind === 'manual' ? store.getState().data.holdings
      .find((item) => item.id === holding.id)?.logs[0] : undefined;
    if (!entry) throw new Error('Refresh entry was not created.');
    actions.updateInvestmentEntry(holding.id, entry.id, { amount: 300 });
    await verify();
    actions.deleteInvestmentEntry(holding.id, entry.id);
    await verify();

    actions.addPlan({
      name: 'Refresh plan',
      type: 'Recurring deposit',
      frequency: 'monthly',
      amount: 1_000,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate: today,
      trackFrom: today,
      opening: 0,
      actualValue: 0,
      actualValueDate: today,
    });
    await verify();
    const plan = store.getState().data.holdings.find((item) => item.kind === 'plan');
    if (!plan || plan.kind !== 'plan') throw new Error('Refresh plan was not created.');
    actions.updatePlan(plan.id, { amount: 1_100 });
    await verify();
    actions.deletePlan(plan.id, { linkedTransactions: 'keep' });
    await verify();

    actions.addLiability({
      kind: 'recurring',
      name: 'Refresh loan',
      type: 'Personal loan',
      principal: 10_000,
      ratePct: 0,
      startDate: today,
      tenureMonths: 12,
      emi: 1_000,
    });
    await verify();
    const liability = store.getState().data.liabilities[0];
    if (!liability || liability.kind !== 'recurring') throw new Error('Refresh liability was not created.');
    actions.addLiabilityPayment(liability.id, { date: today, amount: 1_000, kind: 'EMI', note: '' });
    await verify();
    const payment = store.getState().data.liabilities[0]?.payments[0];
    if (!payment) throw new Error('Refresh liability payment was not created.');
    actions.updateLiabilityPayment(liability.id, payment.id, { amount: 1_100 });
    await verify();
    actions.deleteLiabilityPayment(liability.id, payment.id);
    await verify();
    actions.updateLiability(liability.id, { name: 'Edited refresh loan' });
    await verify();
    actions.deleteLiability(liability.id, { linkedTransactions: 'keep' });
    await verify();

    actions.addTransaction({ type: 'income', amount: 500, category: 'Salary', note: 'Refresh transaction', date: today });
    await verify();
    const transaction = store.getState().data.transactions[0];
    if (!transaction) throw new Error('Refresh transaction was not created.');
    actions.updateTransaction(transaction.id, { amount: 600, note: 'Edited refresh transaction' });
    await verify();
    actions.deleteTransaction(transaction.id);
    await verify();

    actions.addGoal({ name: 'Refresh goal', target: 10_000, saved: 1_000, year: 2030 });
    await verify();
    const goal = store.getState().data.goals.find((item) => item.name === 'Refresh goal');
    if (!goal) throw new Error('Refresh goal was not created.');
    actions.updateGoal(goal.id, { saved: 1_500 });
    await verify();
    actions.setGoalLinks(goal.id, [{ instrumentId: holding.id, share: 50 }]);
    await verify();
    actions.setGoalLinks(goal.id, []);
    await verify();
    const efGoal = store.getState().data.goals.find((item) => item.auto === 'ef');
    if (!efGoal) throw new Error('Emergency Fund goal was not created.');
    actions.setGoalLinks(efGoal.id, [{ instrumentId: holding.id, share: 100 }]);
    await verify();
    actions.setEfBucketLinks('cash', [holding.id]);
    await verify();
    actions.setEfBucketLinks('cash', []);
    await verify();
    actions.deleteGoal(goal.id);
    await verify();

    const initialData = store.getState().data;
    const planTemplate = budgetPlanFromLines([], {
      incomes: [],
      repeatMonthly: true,
      repeatFrom: month,
    });
    actions.saveAndApplyBudgetPlan(planTemplate, month);
    await verify();
    const section = store.getState().data.monthBudgets?.[0]?.sections[0];
    if (!section) throw new Error('Refresh budget section was not created.');
    actions.addBudgetItem(month, {
      sectionId: section.id,
      name: 'Refresh item',
      mode: 'amount',
      value: 500,
    }, 'month', today);
    await verify();
    const item = store.getState().data.monthBudgets?.[0]?.items.find((row) => row.name === 'Refresh item');
    if (!item) throw new Error('Refresh budget item was not created.');
    actions.editBudgetStructureItem(month, item.id, { value: 750 }, 'month', today);
    await verify();
    actions.deleteBudgetStructureItem(month, item.id, 'month', today);
    await verify();
    actions.addBudgetIncome(month, {
      name: 'Refresh income',
      category: 'Salary',
      amount: 5_000,
      day: 1,
      frequency: 'quarterly',
      firstDueMonth: month,
    }, 'following', today);
    await verify();
    const income = store.getState().data.budgetPlan?.incomes[0];
    if (!income) throw new Error('Refresh budget income was not created.');
    actions.editBudgetIncome(month, income.id, {
      name: 'Edited refresh income',
      category: 'Freelance',
      amount: 6_000,
      day: 2,
      frequency: 'half-yearly',
      firstDueMonth: month,
    }, 'following', today);
    await verify();
    actions.removeBudgetItem(month, { kind: 'income', incomeId: income.id, category: 'Salary' }, 'following', today);
    await verify();
    actions.restoreBudgetPlanAndMonth(
      initialData.budgetPlan,
      month,
      initialData.monthBudgets?.find((budget) => budget.month === month) ?? null,
    );
    await verify();

    actions.addPolicy({
      name: 'Refresh policy',
      insurer: 'Refresh insurer',
      kind: 'term-life',
      premium: 500,
      frequency: 'yearly',
      startDate: today,
      status: 'active',
      premiumYears: 5,
      trackFrom: today,
      currentValue: null,
      valueAsOf: null,
      sumAssured: 50_000,
    });
    await verify();
    const policy = store.getState().data.policies[0];
    if (!policy) throw new Error('Refresh policy was not created.');
    actions.updatePolicy(policy.id, { premium: 600, sumAssured: 60_000 });
    await verify();
    actions.deletePolicy(policy.id);
    await verify();
  });
});
