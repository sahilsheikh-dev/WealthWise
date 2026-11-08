import { efBalance, monthlyBaseline, monthsCovered } from './ef';
import { ensureEfGoal, goalView } from './goals';
import {
  liabilitySummary,
  type LiabilitySummary,
  type RecurringLiabilitySummary,
} from './liability';
import { holdingValue } from './portfolio';
import type { AppData, ISODate, RecurringLiability } from './types';

export function netWorth(data: AppData, asOf: ISODate): {
  assets: number;
  liabilities: number;
  netWorth: number;
} {
  const assets = data.holdings.reduce((sum, holding) => sum + holdingValue(holding, asOf), 0)
    + efBalance(data.efEntries);
  const liabilities = data.liabilities.reduce((sum, liability) =>
    sum + liabilitySummary(liability, asOf, 0).balance, 0);
  return { assets, liabilities, netWorth: assets - liabilities };
}

export function homeSummary(data: AppData, asOf: ISODate, expenseBaselineInput?: number): {
  assets: number;
  liabilities: number;
  netWorth: number;
  emergencyMonths: number | null;
  expenseBaseline: number;
  goals: ({
    goal: AppData['goals'][number];
  } & ReturnType<typeof goalView>)[];
} {
  const worth = netWorth(data, asOf);
  const emergencyBalance = efBalance(data.efEntries);
  const expenseBaseline = expenseBaselineInput ?? monthlyBaseline(data.transactions, 'expense', asOf);
  const goals = ensureEfGoal(data.goals, { expenseBaseline, asOf }).map((goal) => {
    return { goal, ...goalView(goal, { emergencyBalance, expenseBaseline }) };
  });
  return {
    ...worth,
    emergencyMonths: monthsCovered(emergencyBalance, expenseBaseline),
    expenseBaseline,
    goals,
  };
}

export type LiabilitiesOverview = {
  totalOutstanding: number;
  monthlyEmi: number;
  emiPctOfIncome: number | null;
  incomeSource: 'transactions' | 'salary' | null;
  debtFreeBy: ISODate | 'never' | null;
  items: LiabilitySummary[];
};

export function liabilitiesOverview(data: AppData, asOf: ISODate, extra: number): LiabilitiesOverview {
  const items = data.liabilities.map((liability) => liabilitySummary(liability, asOf, extra));
  const activeRecurring: { liability: RecurringLiability; summary: RecurringLiabilitySummary }[] =
    data.liabilities.filter((liability): liability is RecurringLiability => liability.kind === 'recurring')
      .map((liability) => ({ liability, summary: liabilitySummary(liability, asOf, extra) }))
      .filter(({ summary }) => !summary.cleared);
  const incomeBaseline = incomeBaselineFor(data, asOf);
  const debtFreeBy: LiabilitiesOverview['debtFreeBy'] = activeRecurring.length === 0
    ? null
    : activeRecurring.some(({ summary }) => summary.monthsLeft === null)
      ? 'never'
      : activeRecurring.reduce<ISODate>((latest, { summary }) => {
        const date = summary.payoffDate!;
        return date > latest ? date : latest;
      }, '0000-01-01');
  const monthlyEmi = activeRecurring.reduce((total, { liability }) => total + liability.emi, 0);
  return {
    totalOutstanding: items.reduce((total, item) => total + item.balance, 0),
    monthlyEmi,
    emiPctOfIncome: incomeBaseline ? monthlyEmi / incomeBaseline.amount * 100 : null,
    incomeSource: incomeBaseline?.source ?? null,
    debtFreeBy,
    items,
  };
}

export function incomeBaselineFor(
  data: AppData,
  asOf: ISODate,
): { amount: number; source: 'transactions' | 'salary' } | null {
  const earnedIncome = monthlyBaseline(
    data.transactions,
    'income',
    asOf,
    { excludeCategories: ['Withdrawal'] },
  );
  if (earnedIncome > 0) return { amount: earnedIncome, source: 'transactions' };
  if (data.settings.monthlySalary !== null) {
    return { amount: data.settings.monthlySalary, source: 'salary' };
  }
  return null;
}
