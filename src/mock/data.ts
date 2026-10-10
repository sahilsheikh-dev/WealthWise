import type {
  AppData,
  EfEntry,
  Goal,
  Holding,
  Loan,
  Transaction,
} from '../domain/types';

export const transactions: Transaction[] = [
  { id: 'tx-salary', type: 'income', amount: 47_000, category: 'Salary', note: 'Salary', date: '2026-10-06' },
  { id: 'tx-freelance', type: 'income', amount: 3_000, category: 'Freelance', note: 'Side income', date: '2026-10-06' },
  { id: 'tx-rent', type: 'expense', amount: 15_000, category: 'Living', note: 'Rent and hostel', date: '2026-10-07' },
  { id: 'tx-family', type: 'expense', amount: 7_000, category: 'Family', note: 'Monty fees', date: '2026-10-07' },
  { id: 'tx-rd', type: 'invest', amount: 2_000, category: 'Investment', note: 'ICICI RD', date: '2026-10-08' },
  { id: 'tx-emi', type: 'expense', amount: 6_281, category: 'EMI', note: 'Bank EMI', date: '2026-10-08' },
];

export const goals: Goal[] = [
  { id: 'goal-portfolio', name: 'First ₹5L portfolio', target: 500_000, saved: 315_841, year: 2026 },
  { id: 'goal-home', name: 'Home - Nagpur', target: 10_000_000, saved: 0, year: 2041 },
  { id: 'goal-farm', name: 'Poultry farm', target: 200_000, saved: 0, year: 2026 },
  { id: 'goal-emergency', name: 'Emergency fund', target: 300_000, saved: 155_000, year: 2028, auto: 'ef' },
];

export const holdings: Holding[] = [
  {
    id: 'holding-pf',
    kind: 'manual',
    name: 'EPFO - PF',
    type: 'EPFO / PF',
    invested: 96_985,
    value: 135_385,
  },
  {
    id: 'holding-fd',
    kind: 'manual',
    name: 'HDFC Fixed Deposit',
    type: 'Fixed deposit',
    invested: 110_000,
    value: 135_456,
    valueAsOf: '2026-06-01',
  },
  {
    id: 'holding-sip',
    kind: 'plan',
    name: 'Retirement fund',
    type: 'Mutual fund / SIP',
    frequency: 'monthly',
    amount: 21_200,
    ratePct: 12,
    stepUpPct: 6,
    tenureYears: 34,
    startDate: '2024-01-01',
    trackFrom: '2026-07-01',
    opening: 50_000,
    actualValue: 118_000,
    actualValueDate: '2026-09-30',
    logs: [
      { id: 'sip-jul', date: '2026-07-05', amount: 21_200, note: 'Monthly SIP' },
      { id: 'sip-aug', date: '2026-08-05', amount: 21_200, note: 'Monthly SIP' },
      { id: 'sip-sep', date: '2026-09-05', amount: 21_200, note: 'Monthly SIP' },
    ],
  },
];

export const loans: Loan[] = [
  {
    id: 'loan-bank',
    name: 'Bank EMI',
    principal: 330_000,
    ratePct: 11,
    tenureMonths: 72,
    emi: 6_281,
    startDate: '2026-04-01',
    payments: [
      { id: 'emi-apr', date: '2026-04-05', amount: 6_281, note: '', kind: 'EMI' },
      { id: 'emi-may', date: '2026-05-05', amount: 6_281, note: '', kind: 'EMI' },
      { id: 'emi-jun', date: '2026-06-05', amount: 6_281, note: '', kind: 'EMI' },
      { id: 'emi-jul', date: '2026-07-05', amount: 6_281, note: '', kind: 'EMI' },
      { id: 'emi-aug', date: '2026-08-05', amount: 6_281, note: '', kind: 'EMI' },
      { id: 'emi-sep', date: '2026-09-05', amount: 6_281, note: '', kind: 'EMI' },
    ],
  },
];

export const emergencyFundEntries: EfEntry[] = [
  { id: 'ef-opening', date: '2026-08-10', amount: 153_000, note: 'Opening balance' },
  { id: 'ef-september', date: '2026-09-08', amount: 2_000, note: 'ICICI RD transfer' },
];

export const mockAppData: AppData = {
  settings: { name: 'Sahil', theme: 'system' },
  transactions,
  goals,
  holdings,
  loans,
  efEntries: emergencyFundEntries,
};
