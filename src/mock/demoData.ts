import { addInvestmentEntry } from '../domain/investmentActions';
import { addLiabilityPayment } from '../domain/liabilityActions';
import {
  allocateSurplus,
  fundShortfall,
  recordMoneyMovement,
  shortfallForMonth,
} from '../domain/cashFlow';
import {
  applyBudgetPlanToMonth,
  defaultBudgetSectionIdFor,
  defaultBudgetSections,
  editBudgetItem,
} from '../domain/budget';
import { addMonths, isValidISO, monthKey, shiftMonth } from '../domain/dates';
import { defaultCoverGoals } from '../domain/coverGoals';
import { INVESTMENT_FORM_CATEGORIES, TRANSACTION_CATEGORIES } from '../domain/schemas';
import type {
  AppData,
  BudgetItem,
  BudgetPlan,
  Goal,
  Holding,
  ISODate,
  Liability,
  Policy,
} from '../domain/types';

const EXPENSE_AMOUNTS: Record<string, number> = {
  Living: 13_000,
  Food: 5_000,
  Transport: 1_800,
  Family: 2_500,
  EMI: 1_500,
  Insurance: 900,
  'Insurance premium': 900,
  'Term life premium': 2_200,
  'Health premium': 1_800,
  'Motor premium': 600,
  'Home premium': 500,
  Shopping: 1_100,
  Health: 1_200,
  Bills: 1_500,
  Education: 1_000,
  Festival: 1_000,
  Donation: 300,
  Gifts: 700,
  Other: 500,
  'Eating out': 900,
  Entertainment: 500,
  Fashion: 800,
  Culture: 400,
  Unexpected: 700,
  Rent: 15_000,
  Utilities: 2_500,
  Subscriptions: 800,
  'Personal spending': 1_200,
  Travel: 1_500,
};

const INVESTMENT_AMOUNTS: Record<string, number> = {
  'Mutual fund / SIP': 3_000,
  'Stocks / ETF': 1_500,
  'Fixed deposit / RD': 2_000,
  'Gold / Silver': 800,
  'Other investments': 1_200,
};

const INVESTMENT_HOLDING_IDS: Record<string, string> = {
  'Mutual fund / SIP': 'demo-holding-mutual-fund',
  'Stocks / ETF': 'demo-holding-stocks',
  'Fixed deposit / RD': 'demo-holding-fd',
  'Gold / Silver': 'demo-holding-gold',
  'Other investments': 'demo-holding-epf',
};

function monthDate(month: string, desiredDay: number, today: ISODate): ISODate {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year!, monthNumber!, 0)).getUTCDate();
  const day = Math.min(desiredDay, lastDay, month === monthKey(today) ? Number(today.slice(8, 10)) : lastDay);
  return `${month}-${String(day).padStart(2, '0')}`;
}

function monthEnd(month: string): ISODate {
  const nextMonth = shiftMonth(month, 1);
  const year = Number(nextMonth.slice(0, 4));
  const monthNumber = Number(nextMonth.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, monthNumber - 1, 0)).getUTCDate();
  return `${month}-${String(lastDay).padStart(2, '0')}`;
}

function generatedIdFactory(): () => string {
  let index = 0;
  return () => `demo-generated-${String(++index).padStart(5, '0')}`;
}

function makeBudgetPlanItems(): BudgetItem[] {
  const percentages: Record<string, number> = {
    Living: 18,
    Food: 8,
    'Mutual fund / SIP': 5,
    Shopping: 4,
    Unexpected: 3,
  };
  const builtInItems = [
    ...TRANSACTION_CATEGORIES.expense.filter((category) => category !== 'EMI' && category !== 'Insurance').map((category) => ({
      category,
      mode: percentages[category] === undefined ? 'amount' as const : 'percent' as const,
      value: category === 'Festival'
        ? EXPENSE_AMOUNTS.Festival
        : percentages[category] ?? Math.max(1_500, (EXPENSE_AMOUNTS[category] ?? 1_000) * 1.5),
      ...(category === 'Bills' ? { dueDay: 5 } : {}),
    })),
    ...INVESTMENT_FORM_CATEGORIES.map((category) => ({
      category,
      mode: category === 'Mutual fund / SIP' ? 'percent' as const : 'amount' as const,
      value: category === 'Mutual fund / SIP' ? 5 : Math.max(2_000, (INVESTMENT_AMOUNTS[category] ?? 1_000) * 1.5),
    })),
  ];
  return [
    ...builtInItems.map((item, index) => ({
      id: `demo-budget-item-${index + 1}`,
      sectionId: defaultBudgetSectionIdFor(item.category),
      name: item.category,
      mode: item.mode,
      value: item.value,
      ...('dueDay' in item ? { dueDay: item.dueDay } : {}),
    })),
    {
      id: 'demo-budget-item-domestic-help',
      sectionId: 'survival',
      name: 'Domestic help',
      mode: 'amount',
      value: 2_000,
    },
    {
      id: 'demo-budget-item-manual-insurance',
      sectionId: 'insurance',
      name: 'Insurance',
      mode: 'amount',
      value: 1_200,
      dueDay: 20,
    },
    {
      id: 'demo-budget-item-pets',
      sectionId: 'demo-section-pets',
      name: 'Pet care',
      mode: 'amount',
      value: 3_000,
    },
  ];
}

function makeHoldings(today: ISODate, months: string[]): Holding[] {
  const manuals: Holding[] = [
    {
      id: 'demo-holding-emergency-cash',
      kind: 'manual',
      name: 'Emergency cash',
      type: 'Cash',
      invested: 25_000,
      value: 25_000,
      valueAsOf: today,
      logs: [],
    },
    {
      id: 'demo-holding-emergency-bank',
      kind: 'manual',
      name: 'Emergency savings account',
      type: 'Savings account',
      invested: 85_000,
      value: 92_000,
      valueAsOf: today,
      logs: [],
    },
    {
      id: 'demo-holding-fd',
      kind: 'manual',
      name: 'Emergency fixed deposit',
      type: 'Fixed deposit',
      invested: 65_000,
      value: 70_000,
      valueAsOf: today,
      logs: [],
    },
    {
      id: INVESTMENT_HOLDING_IDS['Mutual fund / SIP']!,
      kind: 'manual',
      name: 'Index mutual fund',
      type: 'Mutual fund / SIP',
      invested: 38_000,
      value: 42_000,
      valueAsOf: today,
      logs: [],
    },
    {
      id: INVESTMENT_HOLDING_IDS['Stocks / ETF']!,
      kind: 'manual',
      name: 'Broad market ETF',
      type: 'Stocks / ETF',
      invested: 24_000,
      value: 27_500,
      valueAsOf: today,
      logs: [],
    },
    {
      id: INVESTMENT_HOLDING_IDS['Gold / Silver']!,
      kind: 'manual',
      name: 'Gold savings',
      type: 'Gold',
      invested: 18_000,
      value: 20_500,
      valueAsOf: today,
      logs: [],
    },
    {
      id: INVESTMENT_HOLDING_IDS['Other investments']!,
      kind: 'manual',
      name: 'Employee provident fund',
      type: 'EPFO / PF',
      invested: 180_000,
      value: 205_000,
      valueAsOf: today,
      logs: [],
    },
  ];
  const firstPlanDate = `${months[0]}-25` as ISODate;
  const plan: Holding = {
    id: 'demo-holding-recurring-deposit',
    kind: 'plan',
    name: 'Monthly recurring deposit',
    type: 'Recurring deposit',
    frequency: 'monthly',
    amount: 2_000,
    ratePct: 6.5,
    stepUpPct: 0,
    tenureYears: 5,
    startDate: firstPlanDate,
    trackFrom: firstPlanDate,
    opening: 12_000,
    actualValue: null,
    actualValueDate: null,
    logs: [],
  };
  return [...manuals, plan];
}

function makeLiabilities(months: string[]): Liability[] {
  const currentMonth = months.at(-1);
  if (!currentMonth) throw new Error('The demo requires a current month.');
  const startDate = addMonths(`${currentMonth}-12`, -2);
  return [{
    id: 'demo-liability-home',
    kind: 'recurring',
    name: 'Home improvement loan',
    type: 'Home loan',
    principal: 300_000,
    ratePct: 8.5,
    tenureMonths: 72,
    emi: 5_500,
    startDate,
    payments: [],
    settlement: { asOf: monthEnd(months[1]!), balance: 274_000 },
  }, {
    id: 'demo-liability-settled',
    kind: 'recurring',
    name: 'Settled education loan',
    type: 'Education loan',
    principal: 40_000,
    ratePct: 5,
    tenureMonths: 12,
    emi: 3_500,
    startDate: addMonths(startDate, -18),
    payments: [],
    settlement: { asOf: monthEnd(months[0]!), balance: 0 },
  }];
}

function makeGoals(): Goal[] {
  return [{
    id: 'demo-goal-emergency',
    name: 'Emergency fund',
    target: 250_000,
    saved: 0,
    year: 2029,
    auto: 'ef',
    links: [
      { instrumentId: 'demo-holding-emergency-cash', share: 100 },
      { instrumentId: 'demo-holding-emergency-bank', share: 100 },
      { instrumentId: 'demo-holding-fd', share: 100 },
    ],
  }, {
    id: 'demo-goal-retirement',
    name: 'Retirement portfolio',
    target: 1_000_000,
    saved: 0,
    year: 2040,
    links: [{ instrumentId: 'demo-holding-recurring-deposit', share: 60 }],
  }, {
    id: 'demo-goal-home',
    name: 'Home deposit',
    target: 800_000,
    saved: 0,
    year: 2040,
    links: [
      { instrumentId: 'demo-holding-recurring-deposit', share: 30 },
      { instrumentId: INVESTMENT_HOLDING_IDS['Other investments']!, share: 25 },
    ],
  }, {
    id: 'demo-goal-education',
    name: 'Education fund',
    target: 200_000,
    saved: 10_000,
    year: 2032,
    links: [{ instrumentId: INVESTMENT_HOLDING_IDS['Stocks / ETF']!, share: 25 }],
  }, {
    id: 'demo-goal-travel',
    name: 'Family holiday',
    target: 500_000,
    saved: 25_000,
    year: 2029,
    links: [],
  }];
}

function makePolicies(today: ISODate, firstMonth: string): Policy[] {
  return [{
    id: 'demo-policy-health',
    name: 'Family health cover',
    insurer: 'Demo Mutual',
    kind: 'health',
    premium: 900,
    frequency: 'monthly',
    startDate: addMonths(`${firstMonth}-10`, -1),
    status: 'active',
    premiumYears: 20,
    trackFrom: `${firstMonth}-01`,
    sumAssured: 500_000,
    currentValue: null,
    valueAsOf: null,
    payments: [],
  }, {
    id: 'demo-policy-term-life',
    name: 'Term life protection',
    insurer: 'Demo Life',
    kind: 'term-life',
    premium: 1_200,
    frequency: 'yearly',
    startDate: addMonths(`${firstMonth}-12`, -12),
    status: 'active',
    premiumYears: 30,
    trackFrom: `${firstMonth}-12`,
    sumAssured: 10_000_000,
    currentValue: null,
    valueAsOf: null,
    payments: [],
  }, {
    id: 'demo-policy-health-yearly',
    name: 'Annual health cover',
    insurer: 'Demo Mutual',
    kind: 'health',
    premium: 12_000,
    frequency: 'yearly',
    startDate: `${firstMonth}-15`,
    status: 'active',
    premiumYears: 10,
    trackFrom: `${firstMonth}-15`,
    sumAssured: 1_000_000,
    currentValue: null,
    valueAsOf: null,
    payments: [],
  }, {
    id: 'demo-policy-motor',
    name: 'Family car policy',
    insurer: 'Demo General',
    kind: 'motor',
    premium: 8_000,
    frequency: 'yearly',
    startDate: `${firstMonth}-20`,
    status: 'active',
    premiumYears: 5,
    trackFrom: `${firstMonth}-20`,
    sumAssured: 700_000,
    currentValue: null,
    valueAsOf: null,
    payments: [],
  }, {
    id: 'demo-policy-lapsed',
    name: 'Old personal cover',
    insurer: 'Demo General',
    kind: 'other',
    premium: 4_000,
    frequency: 'yearly',
    startDate: addMonths(`${firstMonth}-05`, -24),
    status: 'lapsed',
    premiumYears: 10,
    trackFrom: `${firstMonth}-05`,
    sumAssured: 250_000,
    currentValue: null,
    valueAsOf: null,
    payments: [],
  }];
}

export function buildDemoData(today: ISODate): AppData {
  if (!isValidISO(today)) throw new RangeError(`Invalid ISO date: ${today}`);
  const currentMonth = monthKey(today);
  const months = Array.from({ length: 4 }, (_, index) => shiftMonth(currentMonth, index - 3));
  const id = generatedIdFactory();
  const holdings = makeHoldings(today, months);
  const liabilities = makeLiabilities(months);
  const goals = makeGoals();
  const policies = makePolicies(today, months[0]!);
  const budgetPlan: BudgetPlan = {
    incomes: [
      { id: 'demo-income-salary', name: 'Salary', category: 'Salary', amount: 68_500, day: 1 },
      { id: 'demo-income-freelance', name: 'Freelance', category: 'Freelance', amount: 6_500, day: 15 },
    ],
    sections: [
      ...defaultBudgetSections(),
      { id: 'demo-section-pets', name: 'Pets', type: 'spend' },
    ],
    items: makeBudgetPlanItems(),
    repeatMonthly: true,
    repeatFrom: shiftMonth(currentMonth, 1),
  };
  let data: AppData = {
    settings: { name: 'Demo User', theme: 'system', monthlySalary: 75_000, onboarded: true },
    transactions: [],
    goals,
    holdings,
    liabilities,
    policies,
    coverGoals: defaultCoverGoals(),
    budget: null,
    budgetPlan,
    monthBudgets: [],
    efAllocation: {
      cash: 10,
      bank: 40,
      'fd-rd': 50,
    },
    efCustomBuckets: [],
    efBucketLinks: {
      cash: ['demo-holding-emergency-cash'],
      bank: ['demo-holding-emergency-bank'],
      'fd-rd': ['demo-holding-fd'],
    },
  };

  for (const [monthIndex, month] of months.entries()) {
    const payDate = monthDate(month, 5, today);
    data.transactions.push({
      id: `demo-salary-${month}`,
      type: 'income',
      amount: 75_000,
      category: 'Salary',
      note: 'Monthly salary',
      date: payDate,
    });
    if (monthIndex === 1 || monthIndex === 3) {
      data.transactions.push({
        id: `demo-freelance-${month}`,
        type: 'income',
        amount: 6_500,
        category: 'Freelance',
        note: 'Design project',
        date: monthDate(month, 8, today),
      });
    }
    if (monthIndex === 2) {
      data.transactions.push({
        id: `demo-rental-${month}`,
        type: 'income',
        amount: 12_000,
        category: 'Rental',
        note: 'Room rental',
        date: monthDate(month, 9, today),
      });
    }
    if (monthIndex === 0) {
      data.transactions.push({
        id: `demo-business-${month}`,
        type: 'income',
        amount: 4_000,
        category: 'Business',
        note: 'Consulting work',
        date: monthDate(month, 11, today),
      });
    }

    for (const category of TRANSACTION_CATEGORIES.expense) {
      const base = EXPENSE_AMOUNTS[category];
      if (base === undefined) throw new Error(`Missing demo expense amount for ${category}.`);
      const exceptionalRepair = category === 'Unexpected' && monthIndex === 1 ? 120_000 : 0;
      data.transactions.push({
        id: `demo-expense-${month}-${category.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
        type: 'expense',
        amount: base + exceptionalRepair,
        category,
        note: exceptionalRepair > 0 ? 'Major emergency home repair' : `${category} spending`,
        date: monthDate(month, 12, today),
      });
    }
    for (const [category, amount] of [['Domestic help', 1_500], ['Pet care', 2_000]] as const) {
      data.transactions.push({
        id: `demo-expense-${month}-${category.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
        type: 'expense',
        amount,
        category,
        note: `${category} spending`,
        date: monthDate(month, 13, today),
      });
    }
    if (monthIndex === 3) {
      data.transactions.push({
        id: `demo-unbudgeted-vet-${month}`,
        type: 'expense',
        amount: 650,
        category: 'Vet visit',
        note: 'Unbudgeted veterinary visit',
        date: monthDate(month, 16, today),
      });
    }
  }

  for (const month of months) {
    for (const category of INVESTMENT_FORM_CATEGORIES) {
      const holdingId = INVESTMENT_HOLDING_IDS[category];
      if (!holdingId) throw new Error(`No demo holding for investment category ${category}.`);
      data = addInvestmentEntry(data, holdingId, {
        date: monthDate(month, 14, today),
        amount: INVESTMENT_AMOUNTS[category]!,
        kind: 'Deposit',
        note: `${category} contribution`,
      }, id, today);
    }
  }

  const plan = data.holdings.find((holding) =>
    holding.id === 'demo-holding-recurring-deposit' && holding.kind === 'plan');
  if (!plan || plan.kind !== 'plan') throw new Error('Demo recurring deposit plan is missing.');
  for (const month of months.slice(0, 2)) {
    const dueDate = addMonths(plan.startDate, months.indexOf(month));
    data = addInvestmentEntry(data, plan.id, {
      date: dueDate,
      amount: plan.amount,
      kind: 'Deposit',
      note: 'Recurring deposit installment',
    }, id, today);
  }

  const recurringLiability = data.liabilities.find((liability) =>
    liability.id === 'demo-liability-home' && liability.kind === 'recurring');
  if (!recurringLiability || recurringLiability.kind !== 'recurring') {
    throw new Error('Demo recurring liability is missing.');
  }
  for (const month of months.slice(0, 2)) {
    const dueDate = addMonths(recurringLiability.startDate, months.indexOf(month) + 1);
    data = addLiabilityPayment(data, recurringLiability.id, {
      date: dueDate,
      amount: recurringLiability.emi,
      kind: 'EMI',
      note: 'Monthly EMI',
    }, { newId: id });
  }

  const borrowedStartDate = monthDate(months[0]!, 18, today);
  data = recordMoneyMovement(data, {
    kind: 'loan-received',
    amount: 20_000,
    date: borrowedStartDate,
    liability: {
      kind: 'one-time',
      name: 'Borrowed from a friend',
      type: 'Borrowed money',
      principal: 20_000,
      ratePct: 0,
      startDate: borrowedStartDate,
      dueDate: addMonths(`${currentMonth}-20`, 2),
    },
  }, id, today);
  const friendLiability = data.liabilities.find((liability) =>
    liability.kind === 'one-time' && liability.name === 'Borrowed from a friend');
  if (!friendLiability || friendLiability.kind !== 'one-time') {
    throw new Error('Demo borrowed liability was not created.');
  }
  data = addLiabilityPayment(data, friendLiability.id, {
    date: monthDate(months[1]!, 20, today),
    amount: 2_500,
    kind: 'Payment',
    note: 'Partial repayment',
  }, { newId: id });

  const currentPolicy = data.policies[0];
  if (!currentPolicy) throw new Error('Demo insurance policy is missing.');
  for (const month of months.slice(0, 3)) {
    const paymentDate = addMonths(currentPolicy.startDate, months.indexOf(month) + 1);
    const paymentId = id();
    currentPolicy.payments.push({ id: paymentId, date: paymentDate, amount: currentPolicy.premium, note: 'Monthly premium' });
    data.transactions.push({
      id: id(),
      type: 'expense',
      amount: currentPolicy.premium,
      category: 'Insurance',
      note: `${currentPolicy.name} premium`,
      date: paymentDate,
      source: { kind: 'policy-payment', parentId: currentPolicy.id, entryId: paymentId },
    });
  }

  const shortfallMonth = months[1]!;
  const shortfall = shortfallForMonth(data, shortfallMonth);
  if (shortfall <= 0) throw new Error('The demo shortfall month must be negative before funding.');
  data = fundShortfall(data, {
    month: shortfallMonth,
    allocations: [{ kind: 'borrowed', amount: shortfall, lenderName: 'Demo lender' }],
  }, id);

  const surplusMonth = months[0]!;
  data = allocateSurplus(data, {
    date: monthEnd(surplusMonth),
    allocations: [{ kind: 'liability', liabilityId: recurringLiability.id, amount: 5_000 }],
  }, id, today);

  for (const month of months.slice(0, 3)) {
    data = applyBudgetPlanToMonth(data, month, { newId: id, today });
  }
  data = applyBudgetPlanToMonth(data, currentMonth, { newId: id, today });
  const currentBudget = data.monthBudgets?.find((budget) => budget.month === currentMonth);
  if (!currentBudget) throw new Error('Demo current-month applied budget was not created.');
  const linkedCurrentBudget = data.monthBudgets?.find((budget) => budget.month === currentMonth);
  if (!linkedCurrentBudget) throw new Error('Demo current-month linked budget was not created.');
  data.budget = {
    plannedIncome: linkedCurrentBudget.incomes.reduce((total, income) => total + income.amount, 0),
    lines: linkedCurrentBudget.items.map((item) => ({ category: item.name, planned: item.value })),
  };
  const customMonth = shiftMonth(currentMonth, 2);
  data = editBudgetItem(data, customMonth, { kind: 'line', category: 'Food' }, {
    amount: 2_400,
    dueDay: 17,
  }, 'month', today);
  data = editBudgetItem(data, customMonth, {
    kind: 'income',
    incomeId: 'demo-income-freelance',
    category: 'Freelance',
  }, {
    amount: 8_000,
    dueDay: 18,
  }, 'month', today);
  return data;
}
