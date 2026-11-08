import { defaultValuationMethod, ledgerSummary } from '../holdingLedger';
import type { LedgerHolding } from '../holdingLedger';

const ledger: LedgerHolding = {
  id: 'ledger',
  name: 'Ledger',
  type: 'Other',
  valuationMethod: 'manual',
  entries: [
    { id: 'opening', date: '2026-01-01', kind: 'deposit', amount: 10_000, note: 'Opening' },
    { id: 'deposit-1', date: '2026-02-01', kind: 'deposit', amount: 1_000, note: '' },
    { id: 'deposit-2', date: '2026-03-01', kind: 'deposit', amount: 1_000, note: '' },
    { id: 'withdrawal', date: '2026-04-01', kind: 'withdrawal', amount: 2_000, note: '' },
    { id: 'value-update', date: '2026-05-01', kind: 'valueUpdate', amount: 500, note: '' },
    { id: 'future', date: '2026-06-01', kind: 'deposit', amount: 5_000, note: '' },
  ],
};

describe('unified holding ledger', () => {
  it('uses the owner-approved default valuation method for every holding type', () => {
    expect([
      defaultValuationMethod('Cash'),
      defaultValuationMethod('Savings account'),
      defaultValuationMethod('Fixed deposit'),
      defaultValuationMethod('Recurring deposit'),
      defaultValuationMethod('EPFO / PF'),
      defaultValuationMethod('Other'),
      defaultValuationMethod('Stocks / ETF'),
      defaultValuationMethod('Mutual fund / SIP'),
      defaultValuationMethod('Gold'),
      defaultValuationMethod('Silver'),
    ]).toEqual([
      'balance',
      'balanceInterest',
      'accrual',
      'accrual',
      'accrual',
      'manual',
      'unitsPrice',
      'unitsPrice',
      'unitsPrice',
      'unitsPrice',
    ]);
  });

  it('calculates invested, value and gain from dated entries without future activity', () => {
    expect(ledgerSummary(ledger, '2026-05-01')).toEqual({
      deposits: 12_000,
      withdrawals: 2_000,
      invested: 10_000,
      costRecovered: false,
      value: 10_500,
      gain: 500,
    });
  });

  it('floors display invested and value while retaining recovered cost and gain', () => {
    const overWithdrawn: LedgerHolding = {
      ...ledger,
      entries: [
        { id: 'opening', date: '2026-01-01', kind: 'deposit', amount: 1_000, note: '' },
        { id: 'withdrawal', date: '2026-02-01', kind: 'withdrawal', amount: 5_000, note: '' },
        { id: 'value-update', date: '2026-03-01', kind: 'valueUpdate', amount: 8_000, note: '' },
      ],
    };
    expect(ledgerSummary(overWithdrawn, '2026-03-01')).toEqual({
      deposits: 1_000,
      withdrawals: 5_000,
      invested: 0,
      costRecovered: true,
      value: 4_000,
      gain: 8_000,
    });
  });

  it('returns zero totals for an empty holding history', () => {
    expect(ledgerSummary({ ...ledger, entries: [] }, '2026-05-01')).toEqual({
      deposits: 0,
      withdrawals: 0,
      invested: 0,
      costRecovered: false,
      value: 0,
      gain: 0,
    });
  });
});
