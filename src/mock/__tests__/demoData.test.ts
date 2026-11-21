import {
  BUDGET_GROUPS,
  budgetMonthView,
  budgetOverview,
  isItemDueInMonth,
  nextDueMonth,
  plannedIncomeOf,
} from '../../domain/budget';
import { monthPositions } from '../../domain/cashFlow';
import { addMonths, monthKey, shiftMonth } from '../../domain/dates';
import { goalProjection, goalSavedFor } from '../../domain/goalLinks';
import { goalView } from '../../domain/goals';
import { isLiabilityClosed, liabilitySummary } from '../../domain/liability';
import { validateIntegrity } from '../../domain/links';
import { duesThroughPreview } from '../../domain/dues';
import { pendingItems } from '../../domain/pending';
import { planReminders } from '../../domain/reminders';
import { policySchedule } from '../../domain/policySchedule';
import { holdingValue } from '../../domain/portfolio';
import { homeSummary, netWorth } from '../../domain/summary';
import { monthSummary } from '../../domain/transactions';
import { appDataSchema, INVESTMENT_FORM_CATEGORIES, TRANSACTION_CATEGORIES } from '../../domain/schemas';
import { storageLevel, utf8ByteLength } from '../../lib/storageGuard';
import { buildDemoData } from '../demoData';

describe('six-month demo data', () => {
  const today = '2026-10-16';
  const data = buildDemoData(today);
  const months = Array.from({ length: 6 }, (_, index) => shiftMonth(monthKey(today), index - 5));

  it('is deterministic, current-schema data with valid links and no emergency-fund invest entity', () => {
    expect(buildDemoData(today)).toEqual(data);
    expect(appDataSchema.safeParse(data).success).toBe(true);
    expect(validateIntegrity(data)).toEqual([]);
    expect(data.transactions.some((transaction) => transaction.category === 'Emergency fund')).toBe(false);
    expect(data).not.toHaveProperty('efEntries');
    expect(data.settings).toEqual({
      name: 'Demo User',
      monthlySalary: 80_000,
      theme: 'system',
      onboarded: true,
    });
  });

  it('includes planner dues for today, tomorrow, and later', () => {
    const reminders = planReminders(data, {
      enabled: true,
      localTime: '09:00',
      dayBefore: true,
      sameDay: true,
      showAmounts: false,
      hidePreviews: false,
    }, new Date(2026, 9, 16, 8), 60);
    const dueDates = new Set(reminders.map((reminder) => reminder.target.dueDate));
    expect([...dueDates]).toEqual(expect.arrayContaining([
      '2026-10-16',
      '2026-10-17',
      '2026-10-23',
    ]));
  });

  it('uses the three requested emergency-fund default allocations', () => {
    expect(data.efAllocation).toEqual({
      cash: 10,
      bank: 40,
      'fd-rd': 50,
    });
    expect(data.efCustomBuckets).toEqual(expect.arrayContaining([
      expect.objectContaining({ access: 'instant' }),
      expect.objectContaining({ access: 'days', marketLinked: true }),
      expect.objectContaining({ access: 'slow' }),
    ]));
    expect(data.efCustomBuckets).toHaveLength(3);
  });

  it('includes a paid-premium Term policy and leaves the Life placeholder available', () => {
    expect(data.policies).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'demo-policy-term-life', kind: 'term-life', sumAssured: 10_000_000, status: 'active' }),
      expect.objectContaining({ id: 'demo-policy-health-yearly', kind: 'health', frequency: 'once', status: 'active' }),
      expect.objectContaining({ id: 'demo-policy-motor', kind: 'motor', status: 'active' }),
      expect.objectContaining({ id: 'demo-policy-home', kind: 'home', status: 'active' }),
      expect.objectContaining({ id: 'demo-policy-lapsed', status: 'lapsed' }),
    ]));
    expect(data.policies.find((policy) => policy.id === 'demo-policy-term-life')?.premium).toBeGreaterThan(0);
    expect(data.policies.some((policy) => policy.kind === 'life-savings')).toBe(false);
    expect(data.transactions.filter((transaction) => transaction.source?.kind === 'policy-payment')
      .map((transaction) => transaction.category)).toEqual(expect.arrayContaining([
      'Health premium',
    ]));
    expect(data.transactions.map((transaction) => transaction.category)).toEqual(expect.arrayContaining([
      'Term life premium',
      'Health premium',
      'Motor premium',
      'Home premium',
    ]));
  });

  it('has six complete months, exactly Rs 1 lakh earned income, and a custom upcoming override', () => {
    const customMonth = shiftMonth(monthKey(today), 2);
    expect(data.monthBudgets?.map(({ month }) => month)).toEqual([...months, customMonth]);
    expect(data.budgetPlan?.incomes).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'demo-income-salary', amount: 80_000, day: 1 }),
      expect.objectContaining({ id: 'demo-income-freelance', amount: 20_000, day: 15 }),
    ]));
    expect(data.budgetPlan?.incomes.reduce((sum, item) => sum + item.amount, 0)).toBe(100_000);
    for (const month of months) {
      const rows = data.transactions.filter((transaction) => monthKey(transaction.date) === month);
      expect(rows).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'income', category: 'Salary', amount: 80_000 }),
        expect.objectContaining({ type: 'income', category: 'Freelance', amount: 20_000 }),
      ]));
      expect(monthSummary(data.transactions, month).earnedIncome).toBe(100_000);
      expect(monthSummary(data.transactions, month).expense + monthSummary(data.transactions, month).invest)
        .toBeLessThanOrEqual(100_000);
      for (const category of TRANSACTION_CATEGORIES.expense) {
        expect(rows).toEqual(expect.arrayContaining([
          expect.objectContaining({ type: 'expense', category }),
        ]));
      }
      for (const category of INVESTMENT_FORM_CATEGORIES.filter((item) => item !== 'Fixed deposit / RD')) {
        expect(rows).toEqual(expect.arrayContaining([
          expect.objectContaining({ type: 'invest', category }),
        ]));
      }
    }
    expect(data.transactions.filter((transaction) =>
      transaction.type === 'invest'
      && transaction.source?.kind === 'holding-entry'
      && transaction.source.parentId === 'demo-holding-recurring-deposit')).toHaveLength(2);
    expect(BUDGET_GROUPS.every((group) => group.categories.length > 0)).toBe(true);
    expect(data.budgetPlan?.items.some((item) => item.mode === 'amount')).toBe(true);
    expect(data.budgetPlan?.items.some((item) => item.mode === 'percent')).toBe(true);
    expect(data.budgetPlan?.sections).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'demo-section-pets', name: 'Pets', type: 'spend' }),
    ]));
    expect(data.budgetPlan?.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Pet care', sectionId: 'demo-section-pets' }),
      expect.objectContaining({ name: 'Domestic help', sectionId: 'survival' }),
      expect.objectContaining({ name: 'Insurance', sectionId: 'insurance', value: 1_200, dueDay: 20 }),
    ]));
    expect(data.transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: 'Pet care', type: 'expense' }),
      expect.objectContaining({ category: 'Domestic help', type: 'expense' }),
      expect.objectContaining({ category: 'Vet visit', type: 'expense', amount: 650 }),
    ]));
    expect(data.budgetPlan).toMatchObject({
      repeatMonthly: true,
      repeatFrom: shiftMonth(monthKey(today), 1),
    });

    expect(data.budgetPlan?.items.some((item) => item.name === 'EMI')).toBe(false);
    expect(data).not.toHaveProperty('budgetTemplates');
    expect(data.monthBudgets?.find(({ month }) => month === monthKey(today)))
      .toMatchObject({
        source: 'plan',
        linkedIncluded: true,
        items: expect.arrayContaining([expect.objectContaining({ name: 'Bills', dueDay: 5 })]),
      });
    const currentSnapshot = data.monthBudgets?.find(({ month }) => month === monthKey(today));
    if (!currentSnapshot) throw new Error('Demo current-month budget snapshot is missing.');
    expect(data.budget?.plannedIncome).toBe(plannedIncomeOf(currentSnapshot, monthKey(today)));
    expect(data.monthBudgets?.find(({ month }) => month === customMonth)).toMatchObject({
      source: 'custom',
      linkedIncluded: true,
      incomes: expect.arrayContaining([
        expect.objectContaining({ id: 'demo-income-freelance', amount: 8_000, day: 18 }),
      ]),
      items: expect.arrayContaining([
        expect.objectContaining({ name: 'Food', value: 2_400, dueDay: 17 }),
      ]),
    });
  });

  it('demonstrates each Budget cadence with a due transaction and a projected next due', () => {
    const items = data.budgetPlan?.items ?? [];
    const expectations = [
      ['Recharge', 'monthly'],
      ['Streaming subscription', 'quarterly'],
      ['Maintenance', 'half-yearly'],
    ] as const;
    for (const [name, frequency] of expectations) {
      const item = items.find((row) => row.name === name);
      if (!item) throw new Error(`Missing recurring demo item: ${name}.`);
      expect(item.frequency).toBe(frequency);
      if (name === 'Recharge') expect(item.dueDay).toBe(5);
      const dueMonth = months.find((month) => isItemDueInMonth(item, month));
      if (!dueMonth) throw new Error(`No due month in the demo window for ${name}.`);
      expect(data.transactions).toContainEqual(expect.objectContaining({
        type: 'expense',
        category: name,
        amount: item.value,
        date: expect.stringMatching(new RegExp(`^${dueMonth}-`)),
      }));
      const upcomingMonth = nextDueMonth(item, monthKey(today));
      if (!upcomingMonth) throw new Error(`Missing projected next due for recurring demo item ${name}.`);
      expect(pendingItems(data, upcomingMonth, today)).toContainEqual(expect.objectContaining({
        title: name,
        category: name,
        status: 'upcoming',
        dueDate: expect.stringMatching(new RegExp(`^${upcomingMonth}-`)),
      }));
    }
  });

  it('includes one once-only Budget item and insurance premium in the demo', () => {
    const onceItem = data.budgetPlan?.items.find((item) => item.name === 'Domain renewal');
    const oncePolicy = data.policies.find((policy) => policy.id === 'demo-policy-health-yearly');
    const firstMonth = months[0];
    if (!onceItem || !oncePolicy || !firstMonth) throw new Error('Once-only demo fixtures are missing.');

    expect(onceItem).toMatchObject({
      frequency: 'once',
      firstDueMonth: monthKey(today),
    });
    expect(months.filter((month) => isItemDueInMonth(onceItem, month))).toEqual([monthKey(today)]);
    expect(data.transactions.filter((transaction) =>
      transaction.category === 'Domain renewal' && transaction.type === 'expense')).toHaveLength(1);
    expect(oncePolicy.frequency).toBe('once');
    expect(policySchedule(oncePolicy, '2026-12-31').rows.map((row) => row.dueDate))
      .toEqual([`${firstMonth}-15`]);
  });

  it('shows past, current and upcoming months in the budget overview demo', () => {
    expect(budgetOverview(data, months[0]!, today).mode).toBe('past');
    expect(budgetOverview(data, monthKey(today), today).mode).toBe('current');
    expect(budgetOverview(data, shiftMonth(monthKey(today), 1), today).mode).toBe('future');
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
        expect(view.groupTotals).toHaveLength(stored?.sections.filter((section) => section.system !== 'income').length ?? 0);
        for (const linked of view.linkedByCategory ?? []) {
          const ownPlanned = stored?.items.find((item) => item.name === linked.category)?.value ?? 0;
          const linkedPlanned = linked.rows.reduce((sum, row) => sum + row.amount, 0);
          expect(view.lines.find((line) => line.category === linked.category)?.planned)
            .toBe(ownPlanned + linkedPlanned);
        }
        for (const section of stored?.sections.filter((row) => row.system !== 'income') ?? []) {
          expect(view.groupTotals?.find((row) => row.groupId === section.id)?.planned).toBe(
            view.lines.filter((line) => stored?.items.some((item) =>
              item.name === line.category && item.sectionId === section.id,
            ) || (line.category === 'EMI' && section.system === 'debt')
              || (line.category === 'Insurance' && section.system === 'insurance'))
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

  it('conserves month positions with borrowed money and an allocated surplus', () => {
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

  it('keeps paid, partial and overdue Budget examples with future dues and an overdue SIP', () => {
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
      amount: 750,
      dueDate: `${currentMonth}-05`,
      status: 'overdue',
    });
    const currentBudgetRows = pendingItems(data, currentMonth, today)
      .filter((item) => item.kind === 'budget');
    expect(currentBudgetRows).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Festival' }),
    ]));
    const currentBudgetView = budgetMonthView(data, currentMonth, today);
    expect(currentBudgetView.lines).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: 'Festival', planned: 1_000, actual: 1_000, remaining: 0 }),
      expect.objectContaining({ category: 'Food', planned: 8_000, actual: 5_000, remaining: 3_000 }),
      expect.objectContaining({ category: 'Mutual fund / SIP', actual: 3_000 }),
    ]));
    expect(data.monthBudgets?.find(({ month }) => month === currentMonth)?.items)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Mutual fund / SIP' }),
      ]));
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

  it("shows a later clearable due in Home's five-row preview", () => {
    const homeDues = pendingItems(data, monthKey(today), today)
      .filter((item) => item.kind === 'due')
      .slice(0, 5);
    expect(homeDues.some((item) =>
      item.dueDate
      && (item.source.kind === 'plan' || item.source.kind === 'liability')
      && duesThroughPreview(data, {
        kind: item.source.kind,
        id: item.source.parentId,
      }, item.dueDate, today).count > 1,
    )).toBe(true);
  });

  it('shows the linked-asset emergency fund and reachable and unreachable goal projections', () => {
    expect(data.efAllocation).toEqual({
      cash: 10,
      bank: 40,
      'fd-rd': 50,
    });
    expect(data.efCustomBuckets.map(({ access, marketLinked }) => ({ access, marketLinked }))).toEqual([
      { access: 'instant', marketLinked: false },
      { access: 'days', marketLinked: true },
      { access: 'slow', marketLinked: false },
    ]);
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

  it('includes a fully closed zero-balance demo loan without changing outstanding liabilities', () => {
    const closed = data.liabilities.find((liability) =>
      liability.kind === 'recurring' && isLiabilityClosed(liability));
    if (!closed || closed.kind !== 'recurring') throw new Error('Demo closed liability is missing.');
    expect(closed.settlement?.balance).toBe(0);
    expect(liabilitySummary(closed, today).balance).toBe(0);
    expect(netWorth(data, today).liabilities).toBe(1_000_000);
  });

  it('uses assets minus liabilities for net worth and stays below the storage warning threshold', () => {
    const worth = netWorth(data, today);
    expect(worth).toEqual({ assets: 10_000_000, liabilities: 1_000_000, netWorth: 9_000_000 });
    expect(worth.netWorth).toBe(worth.assets - worth.liabilities);
    expect(data.holdings.reduce((sum, holding) => sum + holdingValue(holding, today), 0)).toBe(worth.assets);
    expect(data.holdings.filter((holding) => holding.type === 'Real estate')).toHaveLength(1);
    expect(data.holdings.filter((holding) => holding.type === 'Custom')).toEqual([
      expect.objectContaining({ customTypeName: 'Collectibles' }),
    ]);
    expect(data.efBucketLinks['fd-rd']).toContain('demo-holding-fd');
    expect(data.efBucketLinks.bank).toContain('demo-holding-emergency-bank');
    const bytes = utf8ByteLength(JSON.stringify(data));
    expect(storageLevel(bytes)).toBe('ok');
  });

  it('keeps every linked goal between 20% and 87%, including full shared asset values', () => {
    const summary = homeSummary(data, today);
    const goals = data.goals.map((goal) => ({
      id: goal.id,
      ...goalView(goal, { expenseBaseline: summary.expenseBaseline, data, asOf: today }),
    }));
    const percentages = goals.map(({ pct }) => pct);
    expect(Math.min(...percentages)).toBeLessThanOrEqual(25);
    expect(Math.max(...percentages)).toBeGreaterThanOrEqual(75);
    expect(Math.max(...percentages)).toBeLessThanOrEqual(87);
    expect(goals).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'demo-goal-emergency', saved: 2_000_000, pct: 80 }),
      expect.objectContaining({ id: 'demo-goal-retirement', saved: 4_000, pct: 20 }),
      expect.objectContaining({ id: 'demo-goal-home', saved: 4_000_000 }),
      expect.objectContaining({ id: 'demo-goal-education', saved: 2_000_000, pct: 80 }),
      expect.objectContaining({ id: 'demo-goal-travel', saved: 25_000, pct: 20 }),
    ]));
  });

  it('rejects invalid dates rather than reading the clock implicitly', () => {
    expect(() => buildDemoData('not-a-date')).toThrow('Invalid ISO date');
    expect(addMonths('2026-07-25', 1)).toBe('2026-08-25');
  });
});
