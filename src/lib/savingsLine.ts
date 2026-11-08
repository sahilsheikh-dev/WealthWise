type SavingsSummary = {
  income: number;
  earnedIncome: number;
  withdrawals: number;
  rates: { savedPct: number; investedPct: number } | null;
};

export type SavingsLine =
  | { kind: 'none' }
  | { kind: 'no-earned-income'; withdrawals: number }
  | {
    kind: 'rates';
    basis: 'income' | 'earned income';
    savedPct: number;
    investedPct: number;
    withdrawals: number;
  };

export function savingsLine(summary: SavingsSummary): SavingsLine {
  if (summary.income === 0 && summary.withdrawals === 0) return { kind: 'none' };
  if (summary.earnedIncome <= 0 || summary.rates === null) {
    return { kind: 'no-earned-income', withdrawals: summary.withdrawals };
  }
  return {
    kind: 'rates',
    basis: summary.withdrawals > 0 ? 'earned income' : 'income',
    savedPct: summary.rates.savedPct,
    investedPct: summary.rates.investedPct,
    withdrawals: summary.withdrawals,
  };
}
