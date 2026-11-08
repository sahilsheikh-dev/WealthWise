import { emptyAppData } from './actions';
import { addDays, addMonths, addYears, daysBetween, monthKey, shiftMonth } from './dates';
import { emiAuto } from './liability';
import type {
  AppData,
  Holding,
  ISODate,
  Liability,
  MonthBudget,
  PlanHolding,
  Policy,
  Transaction,
} from './types';

export const STRESS_TRANSACTION_COUNT = 20_000;
export const STRESS_MONTHLY_TRANSACTION_COUNT = 25;
export const STRESS_HOLDING_COUNT = 12;
export const STRESS_YEARS = [50, 100, 126] as const;

export type StressYears = (typeof STRESS_YEARS)[number];

export type StressDataOptions = {
  today: ISODate;
  years: StressYears;
  seed: number;
  newId: () => string;
  dense?: boolean;
};

const HOLDING_TYPES: Holding['type'][] = [
  'Cash',
  'Savings account',
  'Recurring deposit',
  'EPFO / PF',
  'Fixed deposit',
  'Mutual fund / SIP',
  'Stocks / ETF',
  'Gold',
  'Silver',
  'Other',
  'Cash',
  'Savings account',
];

const LIABILITY_TYPES: Liability['type'][] = [
  'Home loan',
  'Car loan',
  'Personal loan',
  'Education loan',
  'Borrowed money',
  'Other',
];

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function dateInMonth(month: string, day: number, today: ISODate): ISODate {
  if (month === monthKey(today)) return today;
  return `${month}-${String(day).padStart(2, '0')}`;
}

function makeTransactions(
  today: ISODate,
  months: string[],
  recordMonthCount: number,
  newId: () => string,
  random: () => number,
): Transaction[] {
  const transactions: Transaction[] = [];
  for (let recordMonthIndex = 0; recordMonthIndex < recordMonthCount; recordMonthIndex += 1) {
    const monthIndex = Math.floor(recordMonthIndex * months.length / recordMonthCount);
    const month = months[monthIndex];
    if (!month) throw new Error('Stress-data month window is incomplete.');
    for (let movement = 0; movement < STRESS_MONTHLY_TRANSACTION_COUNT; movement += 1) {
      const kind = movement % 3;
      transactions.push({
        id: newId(),
        type: kind === 0 ? 'expense' : kind === 1 ? 'income' : 'invest',
        amount: 100 + Math.floor(random() * 9_900),
        category: kind === 0 ? 'Stress expense' : kind === 1 ? 'Salary' : 'Investment',
        note: 'Stress',
        date: dateInMonth(month, 1 + ((movement + monthIndex) % 28), today),
      });
    }
  }
  return transactions;
}

function makeHoldings(
  today: ISODate,
  months: string[],
  recordMonthCount: number,
  newId: () => string,
  random: () => number,
): Holding[] {
  return HOLDING_TYPES.map((type, holdingIndex) => ({
    id: newId(),
    kind: 'manual',
    name: `Stress asset ${holdingIndex + 1}`,
    type,
    invested: 100_000 + holdingIndex * 1_000,
    value: 100_000 + holdingIndex * 1_000,
    valueAsOf: today,
    logs: Array.from({ length: recordMonthCount }, (_, recordMonthIndex) => {
      const monthIndex = Math.floor(recordMonthIndex * months.length / recordMonthCount);
      const month = months[monthIndex];
      if (!month) throw new Error('Stress-data month window is incomplete.');
      return {
        id: newId(),
        date: dateInMonth(month, 1 + ((recordMonthIndex + holdingIndex) % 28), today),
        amount: 100 + Math.floor(random() * 900),
        note: 'Stress',
        kind: recordMonthIndex % 6 === 5 ? 'Withdrawal' as const : 'Deposit' as const,
      };
    }),
  }));
}

function makeLiabilities(today: ISODate, firstDate: ISODate, newId: () => string): Liability[] {
  const closedStart = addMonths(firstDate, 1);
  const activeStart = addMonths(today, -72);
  return LIABILITY_TYPES.map((type, index) => {
    const closed = index < 3;
    const startDate = closed ? addMonths(closedStart, index * 12) : addMonths(activeStart, (index - 3) * 12);
    const monthsPaid = closed ? 120 : Math.max(0, daysBetween(startDate, today) / 30.4375 | 0);
    const principal = 500_000 + index * 25_000;
    const ratePct = 7;
    const tenureMonths = 120;
    const emi = emiAuto(principal, ratePct, tenureMonths);
    const payments = Array.from({ length: monthsPaid }, (_, paymentIndex) => ({
      id: newId(),
      date: addMonths(startDate, paymentIndex + 1),
      amount: emi,
      note: 'Stress payment',
      kind: 'EMI' as const,
    })).filter((payment) => payment.date <= today);
    return {
      id: newId(),
      kind: 'recurring',
      name: `${closed ? 'Paid off' : 'Renewed'} stress loan ${index + 1}`,
      type,
      principal,
      ratePct,
      startDate,
      tenureMonths,
      emi,
      payments,
      settlement: closed ? { asOf: addMonths(startDate, 120), balance: 0 } : null,
    };
  });
}

function makePolicies(today: ISODate, newId: () => string): Policy[] {
  const policyDefinitions: Pick<Policy, 'name' | 'kind' | 'frequency' | 'premium'>[] = [
    { name: 'Stress term', kind: 'term-life', frequency: 'monthly', premium: 1_500 },
    { name: 'Stress health', kind: 'health', frequency: 'quarterly', premium: 4_500 },
    { name: 'Stress life', kind: 'life-savings', frequency: 'yearly', premium: 12_000 },
  ];
  return policyDefinitions.map((definition) => {
    const trackFrom = addYears(today, -20);
    const interval = definition.frequency === 'monthly' ? 1 : definition.frequency === 'quarterly' ? 3 : 12;
    const payments = Array.from({ length: 240 / interval }, (_, index) => {
      const dueDate = addMonths(trackFrom, index * interval);
      return {
        id: newId(),
        date: dueDate,
        dueDate,
        amount: definition.premium,
        note: 'Stress premium',
      };
    }).filter((payment) => payment.date <= today);
    return {
      id: newId(),
      ...definition,
      insurer: 'Stress insurer',
      startDate: trackFrom,
      status: 'active',
      premiumYears: 80,
      trackFrom,
      currentValue: definition.kind === 'life-savings' ? 250_000 : null,
      valueAsOf: definition.kind === 'life-savings' ? today : null,
      payments,
    };
  });
}

function makeMonthBudgets(months: string[]): MonthBudget[] {
  return months.map((month, index) => ({
    month,
    source: 'custom',
    incomes: [{ id: `stress-income-${index}`, name: 'Income', category: 'Salary', amount: 100_000 }],
    sections: [{ id: 'stress-section', name: 'Stress', type: 'spend' }],
    items: [{
      id: `stress-item-${index}`,
      sectionId: 'stress-section',
      name: 'Stress expense',
      mode: 'amount',
      value: 25_000,
      frequency: 'monthly',
    }],
  }));
}

function makeDailySip(today: ISODate, years: number, recordYears: number, newId: () => string): PlanHolding {
  const startDate = addYears(today, -years);
  const dayCount = daysBetween(startDate, today);
  const recordCount = recordYears * 365;
  return {
    id: newId(),
    kind: 'plan',
    name: 'Stress daily SIP',
    type: 'Mutual fund / SIP',
    frequency: 'daily',
    amount: 500,
    ratePct: 0,
    stepUpPct: 0,
    tenureYears: Math.min(years + 1, 100),
    startDate,
    trackFrom: startDate,
    opening: 0,
    actualValue: null,
    actualValueDate: null,
    logs: Array.from({ length: recordCount }, (_, index) => ({
      id: newId(),
      date: addDays(startDate, Math.floor(index * dayCount / recordCount)),
      amount: 500,
      note: 'Daily SIP',
      kind: 'Deposit',
    })),
  };
}

export function createStressData(options: StressDataOptions): AppData {
  const { today, years, seed, newId, dense = false } = options;
  if (!Number.isSafeInteger(seed)) throw new RangeError('Stress-data seed must be a safe integer.');
  if (dense && years !== 126) throw new RangeError('The dense stress tier is available only at 126 years.');

  const random = seededRandom(seed);
  const monthCount = years * 12;
  const recordMonthCount = (dense ? 200 : years) * 12;
  const firstMonth = shiftMonth(monthKey(today), -(monthCount - 1));
  const months = Array.from({ length: monthCount }, (_, index) => shiftMonth(firstMonth, index));
  const firstDate = `${firstMonth}-01` as ISODate;
  const holdings = makeHoldings(today, months, recordMonthCount, newId, random);
  const goals = [
    {
      id: newId(),
      name: 'Stress home',
      target: 5_000_000,
      saved: 0,
      year: Number(today.slice(0, 4)) + 5,
      links: holdings.slice(0, 3).map((holding) => ({ instrumentId: holding.id })),
    },
    {
      id: newId(),
      name: 'Stress education',
      target: 2_000_000,
      saved: 0,
      year: Number(today.slice(0, 4)) + 10,
      links: holdings.slice(3, 6).map((holding) => ({ instrumentId: holding.id })),
    },
  ];
  const sections = [{ id: 'stress-section', name: 'Stress', type: 'spend' as const }];
  const items = [{
    id: 'stress-plan-item',
    sectionId: 'stress-section',
    name: 'Stress expense',
    mode: 'amount' as const,
    value: 25_000,
    frequency: 'monthly' as const,
  }];
  const data = emptyAppData(today);
  return {
    ...data,
    settings: { ...data.settings, name: 'Stress Test', monthlySalary: 100_000 },
    transactions: makeTransactions(today, months, recordMonthCount, newId, random),
    goals: [...data.goals, ...goals],
    holdings: dense ? [...holdings, makeDailySip(today, years, 200, newId)] : holdings,
    liabilities: makeLiabilities(today, firstDate, newId),
    policies: makePolicies(today, newId),
    budget: { plannedIncome: 100_000, lines: [{ category: 'Stress expense', planned: 25_000 }] },
    budgetPlan: {
      incomes: [{ id: 'stress-plan-income', name: 'Income', category: 'Salary', amount: 100_000 }],
      sections,
      items,
      repeatMonthly: true,
      repeatFrom: firstMonth,
    },
    monthBudgets: makeMonthBudgets(months),
  };
}

export function createStressTransactions(today: ISODate, newId: () => string): Transaction[] {
  return Array.from({ length: STRESS_TRANSACTION_COUNT }, (_, index) => ({
    id: newId(),
    type: index % 3 === 0 ? 'invest' : index % 3 === 1 ? 'expense' : 'income',
    amount: (index % 10_000) + 1,
    category: index % 3 === 0 ? 'Investment' : index % 3 === 1 ? 'Stress expense' : 'Stress income',
    note: `Stress test transaction ${index + 1}`,
    date: today,
  }));
}
