import { BUDGET_GROUPS, budgetMonthView } from '../../domain/budget';
import { monthPositions } from '../../domain/cashFlow';
import { addMonths, monthKey, shiftMonth } from '../../domain/dates';
import { goalProjection, goalSavedFor } from '../../domain/goalLinks';
import { validateIntegrity } from '../../domain/links';
import { pendingItems } from '../../domain/pending';
import { holdingValue } from '../../domain/portfolio';
import { homeSummary, netWorth } from '../../domain/summary';
import { monthSummary } from '../../domain/transactions';
import { appDataSchema, INVESTMENT_FORM_CATEGORIES, TRANSACTION_CATEGORIES } from '../../domain/schemas';
import { storageLevel, utf8ByteLength } from '../../lib/storageGuard';
import { buildDemoData } from '../demoData';

describe('four-month demo data', () => {
  const today = '2026-10-16';
  const data = buildDemoData(today);
  const months = Array.from({ length: 4 }, (_, index) => shiftMonth(monthKey(today), index - 3));

  it('is deterministic, current-schema data with valid links and no emergency-fund invest entity', () => {
    expect(buildDemoData(today)).toEqual(data);
    expect(appDataSchema.safeParse(data).success).toBe(true);
    expect(validateIntegrity(data)).toEqual([]);
    expect(data.transactions.some((transaction) => transaction.category === 'Emergency fund')).toBe(false);
    expect(data).not.toHaveProperty('efEntries');
    expect(data.settings).toEqual({
      name: 'Demo User',
      monthlySalary: 75_000,
      theme: 'system',
      onboarded: true,
    });
  });

  it('has four complete months of income, every budget expense category, and each investment category', () => {
    expect(data.monthBudgets?.map(({ month }) => month)).toEqual([monthKey(today)]);
    for (const month of months) {
      const rows = data.transactions.filter((transaction) => monthKey(transaction.date) === month);
      expect(rows).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'income', category: 'Salary', amount: 75_000 }),
      ]));
      for (const category of TRANSACTION_CATEGORIES.expense) {
        expect(rows).toEqual(expect.arrayContaining([
          expect.objectContaining({ type: 'expense', category }),
        ]));
      }
      for (const category of INVESTMENT_FORM_CATEGORIES) {
        expect(rows).toEqual(expect.arrayContaining([
          expect.objectContaining({ type: 'invest', category }),
        ]));
      }
    }
    expect(BUDGET_GROUPS.every((group) => group.categories.length > 0)).toBe(true);
    expect(data.budgetPlan?.lines.some((line) => line.mode === 'amount')).toBe(true);
    expect(data.budgetPlan?.lines.some((line) => line.mode === 'percent')).toBe(true);
    expect(data.budgetPlan).toMatchObject({
      repeatMonthly: true,
      repeatFrom: shiftMonth(monthKey(today), 1),
    });
    expect(data.budgetPlan?.lines.some((line) => line.category === 'EMI' || line.category === 'Insurance')).toBe(false);
    expect(data).not.toHaveProperty('budgetTemplates');
    expect(data.monthBudgets?.find(({ month }) => month === monthKey(today)))
      .toMatchObject({
        source: 'plan',
        linkedIncluded: true,
        lines: expect.arrayContaining([expect.objectContaining({ category: 'Bills', dueDay: 5 })]),
      });
  });

  it('reconciles every stored budget view with the transaction totals', () => {
    for (const month of months) {
      const view = budgetMonthView(data, month);
      const summary = monthSummary(data.transactions, month);
      expect(view.lines.reduce((sum, line) => sum + line.actual, 0) + view.unbudgeted)
        .toBe(summary.expense + summary.invest);
      expect(view.income.actual).toBe(summary.earnedIncome);
      expect(view.income.bySource.reduce((sum, row) => sum + row.amount, 0))
        .toBe(summary.earnedIncome);
      expect(view.position.earnedIncome).toBe(summary.earnedIncome);
      expect(view.position.expense).toBe(summary.expense);
      expect(view.position.invest).toBe(summary.invest);
      expect(view.position.flow).toBe(summary.net);
      if (month === monthKey(today)) {
        const stored = data.monthBudgets?.find((budget) => budget.month === month);
        expect(stored?.linkedIncluded).toBe(true);
        expect(view.linkedByCategory?.length).toBeGreaterThan(0);
        expect(view.groupTotals).toHaveLength(BUDGET_GROUPS.length);
        for (const linked of view.linkedByCategory ?? []) {
          const ownPlanned = stored?.lines.find((line) => line.category === linked.category)?.planned ?? 0;
          const linkedPlanned = linked.rows.reduce((sum, row) => sum + row.amount, 0);
          expect(view.lines.find((line) => line.category === linked.category)?.planned)
            .toBe(ownPlanned + linkedPlanned);
        }
        for (const group of BUDGET_GROUPS) {
          expect(view.groupTotals?.find((row) => row.groupId === group.id)?.planned).toBe(
            view.lines.filter((line) => group.categories.includes(line.category))
              .reduce((sum, line) => sum + line.planned, 0),
          );
        }
        const legacyView = budgetMonthView({
          ...data,
          monthBudgets: data.monthBudgets?.map((budget) => ({ ...budget, linkedIncluded: false })),
        }, month);
        expect(view.actualSpend).toBe(legacyView.actualSpend);
        expect(view.actualSave).toBe(legacyView.actualSave);
      }
    }
  });

  it('conserves month positions and includes a Month-review-funded shortfall and allocated surplus', () => {
    const positions = monthPositions(data.transactions);
    expect(positions.map(({ month }) => month)).toEqual(months);
    positions.forEach((position, index) => {
      expect(position.closing).toBe(
        position.opening + position.earnedIncome + position.withdrawals + position.borrowed
          + position.loanProceeds + position.ownFunds - position.expense - position.invest,
      );
      if (index > 0) expect(position.opening).toBe(positions[index - 1]?.closing);
    });
    expect(data.transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'income', category: 'Borrowed', source: expect.objectContaining({ kind: 'liability-origin' }) }),
    ]));
    expect(data.liabilities.some((liability) =>
      liability.kind === 'recurring' && liability.settlement !== null,
    )).toBe(true);
    expect(data.liabilities.some((liability) =>
      liability.kind === 'one-time' && liability.name === 'Borrowed from a friend',
    )).toBe(true);
  });

  it('includes an overdue SIP, upcoming EMI, future-month due, later installment, and planned budget rows', () => {
    const currentMonth = monthKey(today);
    const futureMonth = shiftMonth(currentMonth, 1);
    const pending = [
      ...months.flatMap((month) => pendingItems(data, month, today)),
      ...pendingItems(data, futureMonth, today),
      ...pendingItems(data, shiftMonth(currentMonth, 2), today),
    ];
    expect(pending).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'due', status: 'overdue' }),
      expect.objectContaining({ kind: 'due', status: 'upcoming' }),
      expect.objectContaining({ kind: 'budget', status: 'planned' }),
    ]));
    expect(pendingItems(data, currentMonth, today).some((item) =>
      item.kind === 'budget' && item.status === 'planned',
    )).toBe(true);
    const billsDue = pendingItems(data, currentMonth, today)
      .filter((item) => item.kind === 'budget' && item.category === 'Bills');
    expect(billsDue).toHaveLength(1);
    expect(billsDue[0]).toMatchObject({
      title: 'Bills',
      dueDate: `${currentMonth}-05`,
      status: 'overdue',
    });
    expect(pendingItems(data, currentMonth, today)
      .filter((item) => item.title === 'Bills')).toHaveLength(1);
    expect(pending.some((item) =>
      item.kind === 'due'
      && item.source.kind === 'plan'
      && item.source.parentId === 'demo-holding-recurring-deposit'
      && item.status === 'overdue',
    )).toBe(true);
    expect(pendingItems(data, futureMonth, today)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'due',
        title: 'Home improvement loan',
        status: 'upcoming',
        source: expect.objectContaining({ kind: 'liability', parentId: 'demo-liability-home' }),
      }),
    ]));
    const laterSip = pendingItems(data, currentMonth, today).find((item) =>
      item.kind === 'due'
      && item.source.kind === 'plan'
      && item.source.parentId === 'demo-holding-recurring-deposit'
      && item.status === 'upcoming',
    );
    expect(laterSip).toMatchObject({ actionable: false, dueDate: `${currentMonth}-25` });
    expect(pending.some((item) =>
      item.kind === 'due' && item.dueDate !== undefined && item.dueDate.slice(0, 7) > currentMonth,
    )).toBe(true);
  });

  it('shows the linked-asset emergency fund and reachable and unreachable goal projections', () => {
    const emergency = data.goals.find((goal) => goal.auto === 'ef');
    if (!emergency) throw new Error('Emergency goal missing from demo data.');
    expect(emergency.links.map(({ instrumentId }) => instrumentId)).toEqual([
      'demo-holding-emergency-cash',
      'demo-holding-emergency-bank',
      'demo-holding-fd',
    ]);
    const emergencyValue = goalSavedFor(emergency, data, today);
    expect(emergencyValue).toBeGreaterThan(0);
    const summary = homeSummary(data, today);
    expect(summary.emergencyMonths).toBeCloseTo(emergencyValue / summary.expenseBaseline, 10);
    expect(summary.emergencyMonths).toBeGreaterThan(0);

    const retirement = data.goals.find((goal) => goal.id === 'demo-goal-retirement');
    const travel = data.goals.find((goal) => goal.id === 'demo-goal-travel');
    if (!retirement || !travel) throw new Error('Demo goals are incomplete.');
    expect(goalProjection(retirement, data, today).projectedDate).not.toBeNull();
    expect(goalProjection(travel, data, today)).toMatchObject({ projectedDate: null, status: 'none' });
    expect(data.goals.filter((goal) => goal.auto !== 'ef')).toHaveLength(4);
    expect(data.goals.find((goal) => goal.id === 'demo-goal-home')?.links)
      .toEqual(expect.arrayContaining([expect.objectContaining({ instrumentId: 'demo-holding-recurring-deposit' })]));
    expect(data.goals.find((goal) => goal.id === 'demo-goal-retirement')?.links)
      .toEqual(expect.arrayContaining([expect.objectContaining({ instrumentId: 'demo-holding-recurring-deposit' })]));
  });

  it('contains a partially repaid one-time borrowing and keeps its origin and all entries linked', () => {
    const friend = data.liabilities.find((liability) =>
      liability.kind === 'one-time' && liability.name === 'Borrowed from a friend');
    if (!friend || friend.kind !== 'one-time') throw new Error('Demo friend liability is missing.');
    expect(friend.payments).toHaveLength(1);
    expect(data.transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        source: { kind: 'liability-origin', parentId: friend.id, entryId: friend.id },
        type: 'income',
        amount: friend.principal,
      }),
      expect.objectContaining({
        source: { kind: 'liability-payment', parentId: friend.id, entryId: friend.payments[0]?.id },
        type: 'expense',
      }),
    ]));
    expect(data.holdings.filter((holding) => holding.kind === 'plan')).toHaveLength(1);
    expect(data.holdings.filter((holding) => holding.kind === 'manual')
      .every((holding) => holding.valueAsOf === today)).toBe(true);
    expect(data.holdings.flatMap((holding) => holding.logs)
      .every((entry) => data.transactions.some((transaction) =>
        transaction.source?.kind === 'holding-entry' && transaction.source.entryId === entry.id,
      ))).toBe(true);
    expect(data.policies.flatMap((policy) => policy.payments)
      .every((payment) => data.transactions.some((transaction) =>
        transaction.source?.kind === 'policy-payment' && transaction.source.entryId === payment.id,
      ))).toBe(true);
  });

  it('uses assets minus liabilities for net worth and stays below the storage warning threshold', () => {
    const worth = netWorth(data, today);
    expect(worth.netWorth).toBe(worth.assets - worth.liabilities);
    expect(data.holdings.reduce((sum, holding) => sum + holdingValue(holding, today), 0)).toBe(worth.assets);
    expect(data.efBucketLinks['fd-rd']).toContain('demo-holding-fd');
    expect(data.efBucketLinks.bank).toContain('demo-holding-emergency-bank');
    const bytes = utf8ByteLength(JSON.stringify(data));
    expect(storageLevel(bytes)).toBe('ok');
  });

  it('rejects invalid dates rather than reading the clock implicitly', () => {
    expect(() => buildDemoData('not-a-date')).toThrow('Invalid ISO date');
    expect(addMonths('2026-07-25', 1)).toBe('2026-08-25');
  });
});
