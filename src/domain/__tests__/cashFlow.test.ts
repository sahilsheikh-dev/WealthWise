import { deleteTransaction, emptyAppData, updateTransaction } from '../actions';
import {
  allocateSurplus,
  availableBalance,
  fundShortfall,
  monthPositions,
  recordMoneyMovement,
  reviewableMonths,
  shortfallForMonth,
  surplusForMonth,
} from '../cashFlow';
import { deleteLiability, updateLiability } from '../liabilityActions';
import { describeSource, validateIntegrity } from '../links';
import type { AppData, Transaction } from '../types';

const ids = () => {
  let next = 0;
  return () => `generated-${++next}`;
};

const seedData = (): AppData => emptyAppData('2026-01-01');

const tx = (
  id: string,
  date: string,
  type: Transaction['type'],
  amount: number,
  category: string,
): Transaction => ({ id, date, type, amount, category, note: category });

describe('cash flow positions', () => {
  it('carries closing cash across empty months without double-counting opening as income', () => {
    const rows = monthPositions([
      tx('jan-income', '2026-01-02', 'income', 1000, 'Salary'),
      tx('jan-out', '2026-01-03', 'expense', 300, 'Living'),
      tx('jan-invest', '2026-01-04', 'invest', 200, 'Stocks / ETF'),
      tx('mar-withdrawal', '2026-03-01', 'income', 40, 'Withdrawal'),
      tx('mar-borrowed', '2026-03-02', 'income', 60, 'Borrowed'),
      tx('mar-proceeds', '2026-03-03', 'income', 70, 'Loan proceeds'),
      tx('mar-own', '2026-03-04', 'income', 80, 'Own funds'),
      tx('mar-expense', '2026-03-05', 'expense', 50, 'Food'),
    ]);
    expect(rows).toEqual([
      {
        month: '2026-01', opening: 0, earnedIncome: 1000, withdrawals: 0, borrowed: 0,
        loanProceeds: 0, ownFunds: 0, expense: 300, invest: 200, closing: 500,
      },
      {
        month: '2026-02', opening: 500, earnedIncome: 0, withdrawals: 0, borrowed: 0,
        loanProceeds: 0, ownFunds: 0, expense: 0, invest: 0, closing: 500,
      },
      {
        month: '2026-03', opening: 500, earnedIncome: 0, withdrawals: 40, borrowed: 60,
        loanProceeds: 70, ownFunds: 80, expense: 50, invest: 0, closing: 700,
      },
    ]);
  });

  it('carries the prior close into the current available balance and excludes future-dated transactions', () => {
    const transactions = [
      tx('prior-income', '2026-01-10', 'income', 1000, 'Salary'),
      tx('prior-expense', '2026-01-11', 'expense', 200, 'Food'),
      tx('current-income', '2026-02-01', 'income', 500, 'Salary'),
      tx('current-other-income', '2026-02-02', 'income', 100, 'Borrowed'),
      tx('current-expense', '2026-02-03', 'expense', 250, 'Food'),
      tx('current-invest', '2026-02-04', 'invest', 50, 'Stocks / ETF'),
      tx('future-income', '2026-02-20', 'income', 900, 'Salary'),
      tx('future-expense', '2026-02-21', 'expense', 800, 'Food'),
    ];
    expect(availableBalance(transactions, '2026-02', '2026-02-10')).toEqual({
      label: 'Available balance',
      amount: 1100,
      broughtForward: 800,
      income: 500,
      otherMoneyIn: 100,
      spent: 250,
      invested: 50,
    });
  });

  it('counts current-month entries through today, carries across an empty month, and leaves past closes unchanged', () => {
    const transactions = [
      tx('jan-income', '2026-01-10', 'income', 1_000, 'Salary'),
      tx('jan-expense', '2026-01-11', 'expense', 250, 'Food'),
      tx('mar-income', '2026-03-01', 'income', 300, 'Salary'),
      tx('mar-today-expense', '2026-03-10', 'expense', 100, 'Food'),
      tx('mar-today-invest', '2026-03-10', 'invest', 50, 'Stocks / ETF'),
      tx('mar-future-income', '2026-03-11', 'income', 900, 'Salary'),
      tx('mar-future-expense', '2026-03-12', 'expense', 800, 'Food'),
      tx('mar-future-invest', '2026-03-13', 'invest', 700, 'Stocks / ETF'),
    ];

    expect(availableBalance(transactions, '2026-03', '2026-03-10')).toEqual({
      label: 'Available balance',
      amount: 900,
      broughtForward: 750,
      income: 300,
      otherMoneyIn: 0,
      spent: 100,
      invested: 50,
    });
    expect(availableBalance(transactions, '2026-01', '2026-03-10')).toEqual({
      label: 'Closing balance',
      amount: 750,
      broughtForward: 0,
      income: 1_000,
      otherMoneyIn: 0,
      spent: 250,
      invested: 0,
    });
  });

  it('returns zero without prior transactions and preserves a negative current balance', () => {
    expect(availableBalance([], '2026-03', '2026-03-10')).toEqual({
      label: 'Available balance',
      amount: 0,
      broughtForward: 0,
      income: 0,
      otherMoneyIn: 0,
      spent: 0,
      invested: 0,
    });
    expect(availableBalance([
      tx('overspent', '2026-03-01', 'expense', 100, 'Food'),
    ], '2026-03', '2026-03-10').amount).toBe(-100);
  });

  it('reports shortfalls numerically, handles missing history, and matches closed positions', () => {
    const transactions = [
      tx('income', '2026-01-01', 'income', 200, 'Salary'),
      tx('expense', '2026-01-02', 'expense', 300, 'Food'),
    ];
    expect(availableBalance(transactions, '2026-01', '2026-01-31')).toMatchObject({
      amount: -100,
      label: 'Available balance',
    });
    expect(availableBalance([], '2026-01', '2026-01-31').amount).toBe(0);
    expect(availableBalance(transactions, '2026-01', '2026-02-01')).toMatchObject({
      amount: monthPositions(transactions)[0]?.closing,
      label: 'Closing balance',
    });
  });

  it('preserves conservation and edit locality across 500 seeded transaction edits', () => {
    let state = seedData();
    state = {
      ...state,
      transactions: [
        tx('start-anchor', '2025-01-01', 'income', 1, 'Salary'),
        tx('end-anchor', '2025-12-31', 'income', 1, 'Salary'),
      ],
    };
    let seed = 0x15ca5e;
    console.log('cashFlow edit sequence seed: 0x15CA5E');
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x1_0000_0000;
    };
    for (let step = 0; step < 500; step += 1) {
      const before = monthPositions(state.transactions);
      const beforeByMonth = new Map(before.map((item) => [item.month, item]));
      const monthIndex = Math.floor(random() * 12);
      const month = `2025-${String(monthIndex + 1).padStart(2, '0')}`;
      const oldRows = state.transactions.filter((row) =>
        row.date.startsWith(month) && row.id !== 'start-anchor' && row.id !== 'end-anchor',
      );
      const choice = Math.floor(random() * 3);
      if (choice === 0 || oldRows.length === 0) {
        const day = Math.floor(random() * 28) + 1;
        const types: Transaction['type'][] = ['income', 'expense', 'invest'];
        state = {
          ...state,
          transactions: [...state.transactions, tx(
            `seed-${step}`,
            `${month}-${String(day).padStart(2, '0')}`,
            types[Math.floor(random() * types.length)] ?? 'expense',
            Math.floor(random() * 1000) + 1,
            random() < 0.2 ? 'Borrowed' : 'Other',
          )],
        };
      } else if (choice === 1) {
        const selected = oldRows[Math.floor(random() * oldRows.length)];
        if (selected) state = {
          ...state,
          transactions: state.transactions.map((row) => row.id === selected.id
            ? { ...row, amount: Math.floor(random() * 1000) + 1 }
            : row),
        };
      } else {
        const selected = oldRows[Math.floor(random() * oldRows.length)];
        if (selected) state = {
          ...state,
          transactions: state.transactions.filter((row) => row.id !== selected.id),
        };
      }

      const after = monthPositions(state.transactions);
      let expectedOpening = 0;
      for (const position of after) {
        expect(position.opening).toBe(expectedOpening);
        expect(position.closing).toBe(position.opening + position.earnedIncome +
          position.withdrawals + position.borrowed + position.loanProceeds + position.ownFunds -
          position.expense - position.invest);
        expectedOpening = position.closing;
      }

      const oldChangedMonth = beforeByMonth.get(month);
      const nextChangedMonth = after.find((item) => item.month === month);
      if (!oldChangedMonth || !nextChangedMonth) throw new Error(`Missing seeded month ${month}`);
      const closingDelta = nextChangedMonth.closing - oldChangedMonth.closing;
      for (const position of after) {
        const old = beforeByMonth.get(position.month);
        if (!old) continue;
        if (position.month < month) expect(position).toEqual(old);
        if (position.month > month) {
          expect(position.closing).toBe(old.closing + closingDelta);
          expect(position.earnedIncome).toBe(old.earnedIncome);
          expect(position.expense).toBe(old.expense);
          expect(position.invest).toBe(old.invest);
        }
      }
      expect(nextChangedMonth.closing).toBe(oldChangedMonth.closing + closingDelta);
    }
  });

  it('lists closed nonzero months newest first and excludes current and one-rupee-zero rows', () => {
    const data = {
      ...seedData(),
      transactions: [
        tx('old', '2026-01-01', 'income', 10, 'Salary'),
        tx('break-even', '2026-02-01', 'expense', 10, 'Food'),
        tx('new', '2026-03-01', 'expense', 20, 'Food'),
        tx('one', '2026-04-01', 'income', 1, 'Salary'),
      ],
    };
    expect(reviewableMonths(data, '2026-04-15').map(({ month }) => month)).toEqual(['2026-03', '2026-01']);
    expect(reviewableMonths(seedData(), '2026-04-15')).toEqual([]);
    expect(monthPositions([])).toEqual([]);
    expect(shortfallForMonth(seedData(), '2026-04')).toBe(0);
    expect(surplusForMonth(seedData(), '2026-04')).toBe(0);
  });
});

describe('cash-flow allocations and movements', () => {
  const manualHolding = {
    id: 'asset', kind: 'manual' as const, name: 'Savings', type: 'Savings account' as const,
    invested: 100, value: 100, logs: [],
  };
  const recurringLiability = {
    id: 'existing-loan', kind: 'recurring' as const, name: 'Existing loan', type: 'Personal loan' as const,
    principal: 1000, ratePct: 0, startDate: '2025-01-01', tenureMonths: 12, emi: 100,
    payments: [], settlement: null,
  };
  const shortfallData = () => ({
    ...seedData(),
    transactions: [
      tx('income', '2026-02-01', 'income', 200, 'Salary'),
      tx('expense', '2026-02-02', 'expense', 1000, 'Living'),
    ],
    holdings: [manualHolding],
    liabilities: [recurringLiability],
  });
  const surplusData = () => ({
    ...seedData(),
    transactions: [tx('income', '2026-02-01', 'income', 1000, 'Salary')],
    holdings: [manualHolding],
    liabilities: [recurringLiability],
  });

  it('funds a shortfall with every allocation kind and validates each created relationship', () => {
    const result = fundShortfall(shortfallData(), {
      month: '2026-02',
      allocations: [
        { kind: 'borrowed', amount: 100, lenderName: 'A friend' },
        { kind: 'loan-proceeds', liabilityId: 'existing-loan', amount: 100 },
        { kind: 'withdrawal', instrumentId: 'asset', amount: 100 },
        { kind: 'own-funds', amount: 100, note: 'Cash I already had' },
      ],
    }, ids());
    expect(result.liabilities).toHaveLength(2);
    expect(result.transactions.filter((item) => item.date === '2026-02-28')).toHaveLength(4);
    expect(result.transactions.find((item) => item.category === 'Loan proceeds')).toMatchObject({
      type: 'income', amount: 100, date: '2026-02-28',
      source: { kind: 'liability-origin', parentId: 'existing-loan' },
    });
    expect(result.holdings[0]?.logs).toHaveLength(1);
    expect(validateIntegrity(result)).toEqual([]);
  });

  it('rejects mismatched shortfall allocations and failed compositions do not mutate input', () => {
    const data = shortfallData();
    expect(() => fundShortfall(data, {
      month: '2026-02',
      allocations: [{ kind: 'own-funds', amount: 900, note: '' }],
    }, ids())).toThrow('Allocations must be positive');
    expect(data.transactions).toHaveLength(2);
    expect(data.liabilities).toHaveLength(1);
    expect(() => fundShortfall(data, {
      month: '2026-02',
      allocations: [
        { kind: 'own-funds', amount: 100, note: '' },
        { kind: 'withdrawal', instrumentId: 'missing', amount: 100 },
      ],
    }, ids())).toThrow('Holding with id "missing" was not found');
    expect(data.holdings[0]?.logs).toEqual([]);
  });

  it('allocates surplus into a holding and a liability with linked records', () => {
    const result = allocateSurplus(surplusData(), {
      date: '2026-02-28',
      allocations: [
        { kind: 'invest', instrumentId: 'asset', amount: 100 },
        { kind: 'liability', liabilityId: 'existing-loan', amount: 100 },
      ],
    }, ids(), '2026-02-28');
    expect(result.holdings[0]?.logs[0]).toMatchObject({ kind: 'Deposit', amount: 100 });
    expect(result.liabilities[0]?.payments[0]).toMatchObject({ kind: 'Prepayment', amount: 100 });
    expect(validateIntegrity(result)).toEqual([]);
    expect(() => allocateSurplus(surplusData(), {
      date: '2026-03-01', allocations: [{ kind: 'invest', instrumentId: 'asset', amount: 1 }],
    }, ids(), '2026-02-28')).toThrow('Date cannot be in the future');
  });

  it('records borrowed, new and existing loan proceeds, repayments, withdrawals and own funds', () => {
    const start = seedData();
    const movements = [
      { kind: 'borrowed-in' as const, lenderName: 'Friend', amount: 100, date: '2026-02-01' },
      {
        kind: 'loan-received' as const, amount: 200, date: '2026-02-02',
        liability: { kind: 'one-time' as const, name: 'New loan', type: 'Borrowed money' as const,
          principal: 300, ratePct: 2, startDate: '2026-01-01', dueDate: null },
      },
      { kind: 'loan-received' as const, amount: 100, date: '2026-02-03', liabilityId: 'existing-loan'       },
      { kind: 'repay' as const, liabilityId: 'existing-loan', amount: 25, date: '2026-02-04' },
      { kind: 'withdraw' as const, instrumentId: 'asset', amount: 20, date: '2026-02-05' },
      { kind: 'own-funds' as const, amount: 40, date: '2026-02-07', note: 'Already saved cash' },
    ];
    let data: AppData = { ...start, holdings: [manualHolding], liabilities: [recurringLiability] };
    const newId = ids();
    for (const movement of movements) {
      data = recordMoneyMovement(data, movement, newId, '2026-02-28');
      expect(validateIntegrity(data)).toEqual([]);
    }
    expect(data.transactions.filter((item) => item.category === 'Borrowed')).toHaveLength(1);
    expect(data.transactions.filter((item) => item.category === 'Loan proceeds')).toHaveLength(2);
    expect(data.transactions.filter((item) => item.category === 'Withdrawal')).toHaveLength(1);
    expect(data.liabilities.find((item) => item.id === 'existing-loan')?.payments).toHaveLength(1);
  });

  it('does not replace an existing liability origin or exceed its principal', () => {
    const data = {
      ...seedData(),
      liabilities: [recurringLiability],
      transactions: [{
        ...tx('origin', '2025-01-01', 'income', 100, 'Loan proceeds'),
        source: { kind: 'liability-origin' as const, parentId: 'existing-loan', entryId: 'existing-loan' },
      }],
    };
    expect(() => recordMoneyMovement(data, {
      kind: 'loan-received', amount: 100, date: '2026-02-01', liabilityId: 'existing-loan',
    }, ids(), '2026-02-28')).toThrow('already has a proceeds transaction');
    expect(() => recordMoneyMovement(seedData(), {
      kind: 'loan-received', amount: 301, date: '2026-02-01',
      liability: {
        kind: 'one-time', name: 'Loan', type: 'Borrowed money', principal: 300,
        ratePct: 0, startDate: '2026-01-01', dueDate: null,
      },
    }, ids(), '2026-02-28')).toThrow('Allocations must be positive');
  });

  it('uniquifies repeated borrowed-from names and rejects linked-origin edit or delete', () => {
    const makeId = ids();
    const first = recordMoneyMovement(seedData(), {
      kind: 'borrowed-in', lenderName: 'Friend', amount: 10, date: '2026-02-01',
    }, makeId, '2026-02-28');
    const second = recordMoneyMovement(first, {
      kind: 'borrowed-in', lenderName: 'Friend', amount: 20, date: '2026-02-02',
    }, makeId, '2026-02-28');
    expect(second.liabilities.map(({ name }) => name)).toEqual(['Borrowed from Friend', 'Borrowed from Friend (2)']);
    const origin = second.transactions.find((item) => item.source?.kind === 'liability-origin');
    if (!origin) throw new Error('Expected a liability-origin transaction.');
    expect(() => updateTransaction(second, origin.id, { amount: 1 })).toThrow('linked');
    expect(() => deleteTransaction(second, origin.id)).toThrow('linked');
    expect(validateIntegrity(second)).toEqual([]);
  });

  it('describes, locks, renames and keeps or deletes linked liability-origin transactions', () => {
    const borrowed = fundShortfall(shortfallData(), {
      month: '2026-02',
      allocations: [{ kind: 'borrowed', amount: 100, lenderName: 'Friend' }],
    }, ids());
    const liability = borrowed.liabilities[1];
    if (!liability) throw new Error('Expected a newly borrowed liability.');
    const origin = borrowed.transactions.find((item) => item.source?.kind === 'liability-origin');
    if (!origin?.source) throw new Error('Expected a linked liability-origin transaction.');
    expect(describeSource(borrowed, origin.source)).toMatchObject({
      label: liability.name,
      route: '/liability-payments',
    });

    const renamed = updateLiability(borrowed, liability.id, { name: 'Friend loan updated' });
    expect(renamed.transactions.find((item) => item.id === origin.id)?.note).toBe('Friend loan updated');
    expect(() => updateTransaction(borrowed, origin.id, { amount: 1 })).toThrow('linked');

    const kept = deleteLiability(renamed, liability.id, { linkedTransactions: 'keep' });
    const keptOrigin = kept.transactions.find((item) => item.id === origin.id);
    expect(keptOrigin?.source).toBeUndefined();
    const deleted = deleteLiability(renamed, liability.id, { linkedTransactions: 'delete' });
    expect(deleted.transactions.some((item) => item.id === origin.id)).toBe(false);
  });

  it('rejects invalid shortfall allocations and invalid loan-proceeds references', () => {
    const base = shortfallData();
    const largeShortfall = {
      ...base,
      transactions: [
        tx('income', '2026-02-01', 'income', 200, 'Salary'),
        tx('expense', '2026-02-02', 'expense', 2000, 'Living'),
      ],
    };
    expect(() => fundShortfall(base, { month: '2026-02', allocations: [] }, ids())).toThrow();
    expect(() => fundShortfall(base, {
      month: '2026-02', allocations: [{ kind: 'own-funds', amount: 0, note: 'Invalid' }],
    }, ids())).toThrow();
    expect(() => fundShortfall(largeShortfall, {
      month: '2026-02', allocations: [{ kind: 'loan-proceeds', liabilityId: 'missing', amount: 1 }],
    }, ids())).toThrow('not found');
    expect(() => fundShortfall(largeShortfall, {
      month: '2026-02', allocations: [{ kind: 'loan-proceeds', liabilityId: 'existing-loan', amount: 1001 }],
    }, ids())).toThrow();
    const alreadyOriginated = {
      ...largeShortfall,
      transactions: [
        ...largeShortfall.transactions,
        {
          ...tx('origin', '2025-01-01', 'income', 10, 'Loan proceeds'),
          source: { kind: 'liability-origin' as const, parentId: 'existing-loan', entryId: 'existing-loan' },
        },
      ],
    };
    expect(() => fundShortfall(alreadyOriginated, {
      month: '2026-02', allocations: [{ kind: 'loan-proceeds', liabilityId: 'existing-loan', amount: 1 }],
    }, ids())).toThrow('already has a proceeds transaction');
    const futureStart = {
      ...largeShortfall,
      liabilities: [{ ...recurringLiability, startDate: '2026-03-01' }],
    };
    expect(() => fundShortfall(futureStart, {
      month: '2026-02', allocations: [{ kind: 'loan-proceeds', liabilityId: 'existing-loan', amount: 1 }],
    }, ids())).toThrow('cannot predate');
    const withdrawal = fundShortfall({
      ...base,
      holdings: [manualHolding],
    }, {
      month: '2026-02', allocations: [{ kind: 'withdrawal', instrumentId: 'asset', amount: 20 }],
    }, ids());
    expect(withdrawal.holdings[0]?.logs).toMatchObject([
      { kind: 'Withdrawal', amount: 20, date: '2026-02-28' },
    ]);
  });

  it('rejects surplus allocations without targets or above the outstanding balance', () => {
    const data = surplusData();
    expect(() => allocateSurplus(data, {
      date: '2026-02-15', allocations: [{ kind: 'invest', instrumentId: 'missing', amount: 10 }],
    }, ids(), '2026-02-28')).toThrow('not found');
    expect(() => allocateSurplus(data, {
      date: '2026-02-15', allocations: [{ kind: 'liability', liabilityId: 'missing', amount: 10 }],
    }, ids(), '2026-02-28')).toThrow('not found');
    const smallLiability = {
      ...data,
      liabilities: [{
        ...recurringLiability,
        kind: 'one-time' as const,
        principal: 10,
        startDate: '2026-02-01',
        dueDate: null,
        payments: [],
      }],
    };
    expect(() => allocateSurplus(smallLiability, {
      date: '2026-02-15', allocations: [{ kind: 'liability', liabilityId: 'existing-loan', amount: 20 }],
    }, ids(), '2026-02-28')).toThrow('exceeds the outstanding balance');
  });

  it('rejects invalid money movements and missing loan or repayment targets', () => {
    const data = { ...seedData(), liabilities: [recurringLiability] };
    expect(() => recordMoneyMovement(data, {
      kind: 'own-funds', amount: 1, date: '2026-03-01', note: 'Future',
    }, ids(), '2026-02-28')).toThrow('future');
    expect(() => recordMoneyMovement(data, {
      kind: 'own-funds', amount: 0, date: '2026-02-01', note: 'Zero',
    }, ids(), '2026-02-28')).toThrow('greater than zero');
    expect(() => recordMoneyMovement(data, {
      kind: 'loan-received', amount: 10, date: '2026-02-01',
    }, ids(), '2026-02-28')).toThrow('Choose a liability');
    expect(() => recordMoneyMovement(data, {
      kind: 'loan-received', amount: 10, date: '2026-02-01', liabilityId: 'missing',
    }, ids(), '2026-02-28')).toThrow('not found');
    expect(() => recordMoneyMovement(data, {
      kind: 'loan-received', amount: 1001, date: '2026-02-01', liabilityId: 'existing-loan',
    }, ids(), '2026-02-28')).toThrow();
    expect(() => recordMoneyMovement(data, {
      kind: 'loan-received', amount: 10, date: '2024-12-31', liabilityId: 'existing-loan',
    }, ids(), '2026-02-28')).toThrow('cannot predate');
    expect(() => recordMoneyMovement(data, {
      kind: 'repay', amount: 10, date: '2026-02-01', liabilityId: 'missing',
    }, ids(), '2026-02-28')).toThrow('not found');
    const oneTime = {
      ...data,
      liabilities: [{
        ...recurringLiability,
        kind: 'one-time' as const,
        startDate: '2026-02-01',
        dueDate: null,
        payments: [],
      }],
    };
    const result = recordMoneyMovement(oneTime, {
      kind: 'repay', amount: 10, date: '2026-02-01', liabilityId: 'existing-loan',
    }, ids(), '2026-02-28');
    expect(result.liabilities[0]?.payments[0]).toMatchObject({ kind: 'Payment', amount: 10 });
  });
});
