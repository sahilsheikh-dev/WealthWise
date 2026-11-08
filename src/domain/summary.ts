import { efBalance, monthlyBaseline, monthsCovered } from './ef';
import { ensureEfGoal, goalProgressPct, goalSaved } from './goals';
import { loanSummary } from './loan';
import { holdingValue } from './portfolio';
import type { AppData, ISODate, Loan } from './types';
import type { LoanSummary } from './loan';

export function netWorth(data: AppData, asOf: ISODate): {
  assets: number;
  liabilities: number;
  netWorth: number;
} {
  const assets = data.holdings.reduce((sum, holding) => sum + holdingValue(holding, asOf), 0)
    + efBalance(data.efEntries);
  const liabilities = data.loans.reduce((sum, loan) => sum + loanSummary(loan, asOf, 0).balance, 0);
  return { assets, liabilities, netWorth: assets - liabilities };
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

export type LoansOverview = {
  totalOutstanding: number;
  monthlyEmi: number;
  emiPctOfIncome: number | null;
  loanFreeBy: ISODate | 'never' | null;
  items: LoanSummary[];
};

export function loansOverview(data: AppData, asOf: ISODate, extra: number): LoansOverview {
  const items = data.loans.map((loan) => loanSummary(loan, asOf, extra));
  const activeLoans: { loan: Loan; summary: LoanSummary }[] = data.loans
    .map((loan, index) => ({ loan, summary: items[index]! }))
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
