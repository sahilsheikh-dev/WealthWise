import { liabilityState, liabilitySummary, emiAuto, monthsLeft, emiCoversInterest, payoffDate, isCleared } from './liability';
import type { ISODate, Loan } from './types';
export { emiAuto, monthsLeft, emiCoversInterest, payoffDate, isCleared };
export type LoanState = ReturnType<typeof liabilityState>;
export type LoanSummary = Extract<ReturnType<typeof liabilitySummary>, { monthsLeft: number | null }>;
function asLiability(loan: Loan) { return { ...loan, kind: 'recurring' as const, type: 'Other' as const, payments: loan.payments.map((payment) => ({ ...payment, kind: payment.kind === 'Prepayment' ? 'Prepayment' as const : 'EMI' as const })) }; }
export function loanState(loan: Loan, asOf: ISODate): LoanState { return liabilityState(asLiability(loan), asOf); }
export function loanSummary(loan: Loan, asOf: ISODate, extra: number): LoanSummary { return liabilitySummary(asLiability(loan), asOf, extra) as LoanSummary; }
