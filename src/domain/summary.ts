import { efBalance, monthlyBaseline, monthsCovered } from './ef';
import { ensureEfGoal, goalProgressPct, goalSaved } from './goals';
import type { LiabilitySummary } from './liability';
import { liabilitySummary } from './liability';
import { holdingValue } from './portfolio';
import type { AppData, ISODate, RecurringLiability } from './types';

// export function netWorth(data: AppData, asOf: ISODate): {
//   assets: number;
//   liabilities: number;
//   netWorth: number;
// } {
//   const assets = data.holdings.reduce((sum, holding) => sum + holdingValue(holding, asOf), 0)
//     + efBalance(data.efEntries);
//   const liabilities = data.liabilities.reduce((sum, liability) => sum + liabilitySummary(liability, asOf, 0).balance, 0);
//   return { assets, liabilities, netWorth: assets - liabilities };
// }

export function netWorth(data: AppData, asOf: ISODate) {
  const holdings = data.holdings ?? [];
  const efEntries = data.efEntries ?? [];
  const liabilities = data.liabilities ?? [];

  const assets =
    holdings.reduce(
      (sum, holding) => sum + holdingValue(holding, asOf),
      0,
    ) + efBalance(efEntries);

  const totalLiabilities = liabilities.reduce(
    (sum, liability) =>
      sum + liabilitySummary(liability, asOf, 0).balance,
    0,
  );

  return {
    assets,
    liabilities: totalLiabilities,
    netWorth: assets - totalLiabilities,
  };
}

export function homeSummary(data: AppData, asOf: ISODate): {
  assets: number;
  liabilities: number;
  netWorth: number;
  emergencyMonths: number | null;
  goals: { goal: AppData['goals'][number]; saved: number; pct: number }[];
} {
  const worth = netWorth(data, asOf);
  const emergencyBalance = efBalance(data.efEntries);
  const expenseBaseline = monthlyBaseline(data.transactions, 'expense', asOf);
  const goals = ensureEfGoal(data.goals, { expenseBaseline, asOf }).map((goal) => {
    const saved = goalSaved(goal, emergencyBalance);
    return { goal, saved, pct: goalProgressPct(goal, saved) };
  });
  return {
    ...worth,
    emergencyMonths: monthsCovered(emergencyBalance, expenseBaseline),
    goals,
  };
}

export type LiabilitiesOverview = {
  totalOutstanding: number;
  monthlyEmi: number;
  emiPctOfIncome: number | null;
  loanFreeBy: ISODate | 'never' | null;
  items: LiabilitySummary[];
};
export type LoansOverview = LiabilitiesOverview;

export function liabilitiesOverview(data: AppData, asOf: ISODate, extra: number): LiabilitiesOverview {
  const items = data.liabilities.map((liability) => liabilitySummary(liability, asOf, extra));
  const activeLoans: { loan: RecurringLiability; summary: Extract<LiabilitySummary, { monthsLeft: number | null }> }[] = data.liabilities
    .filter((liability): liability is RecurringLiability => liability.kind === 'recurring')
    .map((loan) => ({ loan, summary: liabilitySummary(loan, asOf, extra) as Extract<LiabilitySummary, { monthsLeft: number | null }> }))
    .filter(({ summary }) => !summary.cleared);
  const incomeBaseline = monthlyBaseline(data.transactions, 'income', asOf);
  const loanFreeBy: LoansOverview['loanFreeBy'] = activeLoans.length === 0
    ? null
    : activeLoans.some(({ summary }) => summary.monthsLeft === null)
      ? 'never'
      : activeLoans.reduce<ISODate>((latest, { summary }) => {
        const date = summary.payoffDate!;
        return date > latest ? date : latest;
      }, '0000-01-01');
  return {
    totalOutstanding: items.reduce((total, item) => total + item.balance, 0),
    monthlyEmi: activeLoans.reduce((total, { loan }) => total + loan.emi, 0),
    emiPctOfIncome: incomeBaseline > 0
      ? activeLoans.reduce((total, { loan }) => total + loan.emi, 0) / incomeBaseline * 100
      : null,
    loanFreeBy,
    items,
  };
}
export const loansOverview = liabilitiesOverview;
