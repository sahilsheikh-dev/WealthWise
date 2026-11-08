import {
  DEFAULT_SORTS,
  SORT_OPTIONS,
  resolveSortSpec,
  sortIfSelected,
  sortItems,
  type SortList,
} from '../sorting';
import { mockAppData } from '../../mock/data';
import type { BudgetHistoryRow } from '../../domain/budget';
import { buildPortfolioRows, filterRows } from '../../domain/portfolio';
import { filterTransactions } from '../../domain/transactions';

describe('sorting registries and comparator behavior', () => {
  it.each(Object.entries(SORT_OPTIONS) as [SortList, (typeof SORT_OPTIONS)[SortList]][])(
    'sorts every %s comparator ascending and descending, with nulls last',
    (list, options) => {
      if (list === 'budgetHistory') return;
      for (const option of options) {
        if (option.key === 'created') continue;
        const rows = [
          { id: 'z', [option.key]: 3 },
          { id: 'a', [option.key]: 1 },
          { id: 'null', [option.key]: null },
        ];
        expect(sortItems(rows, list, { key: option.key, dir: 'asc' }).map(({ id }) => id))
          .toEqual(['a', 'z', 'null']);
        expect(sortItems(rows, list, { key: option.key, dir: 'desc' }).map(({ id }) => id))
          .toEqual(['z', 'a', 'null']);
      }
    },
  );

  it.each([
    ['month', ['2026-01', '2026-02', '2026-03'], ['2026-03', '2026-02', '2026-01']],
    ['plannedSpend', ['2026-02', '2026-03', '2026-01'], ['2026-01', '2026-03', '2026-02']],
    ['actualSpend', ['2026-01', '2026-03', '2026-02'], ['2026-02', '2026-03', '2026-01']],
    ['plannedSave', ['2026-01', '2026-03', '2026-02'], ['2026-02', '2026-03', '2026-01']],
    ['actualInvested', ['2026-03', '2026-02', '2026-01'], ['2026-01', '2026-02', '2026-03']],
    ['savingsRate', ['2026-01', '2026-03', '2026-02'], ['2026-03', '2026-01', '2026-02']],
    ['closing', ['2026-01', '2026-03', '2026-02'], ['2026-02', '2026-03', '2026-01']],
    ['outstanding', ['2026-02', '2026-03', '2026-01'], ['2026-01', '2026-03', '2026-02']],
    ['templateName', ['2026-02', '2026-03', '2026-01'], ['2026-01', '2026-03', '2026-02']],
    ['customized', ['2026-02', '2026-01', '2026-03'], ['2026-01', '2026-03', '2026-02']],
  ] as const)(
    'sorts Budget history by %s in both directions',
    (key, ascendingIds, descendingIds) => {
      const rows: BudgetHistoryRow[] = [
        {
          month: '2026-01', templateName: 'Zulu', customized: true, plannedIncome: null,
          plannedSpend: 400, plannedSave: 120, actualEarned: 1000, actualSpend: 150,
          actualInvested: 800, savingsRatePct: 15, closing: 1000, outstanding: { count: 3, amount: 600 },
        },
        {
          month: '2026-02', templateName: 'Alpha', customized: false, plannedIncome: null,
          plannedSpend: 200, plannedSave: 300, actualEarned: 0, actualSpend: 250,
          actualInvested: 700, savingsRatePct: null, closing: 3000, outstanding: { count: 1, amount: 100 },
        },
        {
          month: '2026-03', templateName: 'Middle', customized: true, plannedIncome: null,
          plannedSpend: 300, plannedSave: 200, actualEarned: 1000, actualSpend: 200,
          actualInvested: 600, savingsRatePct: 30, closing: 2000, outstanding: { count: 2, amount: 300 },
        },
      ];

      expect(SORT_OPTIONS.budgetHistory.map((option) => option.key))
        .toEqual([
          'month', 'plannedSpend', 'actualSpend', 'plannedSave', 'actualInvested',
          'savingsRate', 'closing', 'outstanding', 'templateName', 'customized',
        ]);
      expect(sortItems(rows, 'budgetHistory', { key, dir: 'asc' }).map((row) => row.month))
        .toEqual(ascendingIds);
      expect(sortItems(rows, 'budgetHistory', { key, dir: 'desc' }).map((row) => row.month))
        .toEqual(descendingIds);
    },
  );

  it('uses month as the id tie-breaker in both Budget history directions', () => {
    const rows = [
      { month: '2026-03', plannedSpend: 10 },
      { month: '2026-01', plannedSpend: 10 },
      { month: '2026-02', plannedSpend: 10 },
    ];
    expect(sortItems(rows, 'budgetHistory', { key: 'plannedSpend', dir: 'asc' }).map(({ month }) => month))
      .toEqual(['2026-01', '2026-02', '2026-03']);
    expect(sortItems(rows, 'budgetHistory', { key: 'plannedSpend', dir: 'desc' }).map(({ month }) => month))
      .toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it.each(Object.entries(DEFAULT_SORTS) as [SortList, (typeof DEFAULT_SORTS)[SortList]][])(
    'declares the first listed key as the default for %s',
    (list, spec) => {
      expect(spec.key).toBe(SORT_OPTIONS[list][0]?.key);
    },
  );

  it('preserves the existing list order until a preference is selected', () => {
    const rows = [{ id: 'last', amount: 1 }, { id: 'first', amount: 10 }];
    expect(sortIfSelected(rows, 'transactions', null)).toEqual(rows);
    expect(sortIfSelected(rows, 'transactions', { key: 'amount', dir: 'desc' }))
      .toEqual([{ id: 'first', amount: 10 }, { id: 'last', amount: 1 }]);
  });

  it('keeps demo transactions and asset rows in their existing default order', () => {
    const transactions = filterTransactions(mockAppData.transactions, {
      month: mockAppData.transactions[0]?.date.slice(0, 7) ?? '2026-01',
      type: 'all',
      query: '',
    });
    const assets = buildPortfolioRows(mockAppData, '2026-10-11');
    expect(sortIfSelected(transactions, 'transactions', null)).toEqual(transactions);
    expect(sortIfSelected(assets, 'assets', null)).toEqual(assets);
  });

  it('sorts only the active filtered result without changing its members', () => {
    const assets = buildPortfolioRows(mockAppData, '2026-10-11');
    const recurring = filterRows(assets, 'Recurring');
    const sortedAssets = sortItems(recurring, 'sips', { key: 'value', dir: 'desc' });
    expect(new Set(sortedAssets.map(({ id }) => id))).toEqual(new Set(recurring.map(({ id }) => id)));
    expect(sortedAssets.every((row) => row.kind === 'plan')).toBe(true);

    const transactionRows = filterTransactions(mockAppData.transactions, {
      month: mockAppData.transactions[0]?.date.slice(0, 7) ?? '2026-01',
      type: 'expense',
      query: '',
    });
    const sortedTransactions = sortItems(transactionRows, 'transactions', { key: 'amount', dir: 'desc' });
    expect(new Set(sortedTransactions.map(({ id }) => id)))
      .toEqual(new Set(transactionRows.map(({ id }) => id)));
    expect(sortedTransactions.every(({ type }) => type === 'expense')).toBe(true);
  });

  it('keeps nulls last and uses id ascending for equal values in either direction', () => {
    const rows = [
      { id: 'z', amount: 5 },
      { id: 'a', amount: 5 },
      { id: 'null', amount: null },
    ];
    expect(sortItems(rows, 'transactions', { key: 'amount', dir: 'asc' }).map(({ id }) => id))
      .toEqual(['a', 'z', 'null']);
    expect(sortItems(rows, 'transactions', { key: 'amount', dir: 'desc' }).map(({ id }) => id))
      .toEqual(['a', 'z', 'null']);
  });

  it('sorts created order by original stored position and reverses it on descending', () => {
    const rows = [{ id: 'z' }, { id: 'a' }, { id: 'm' }];
    expect(sortItems(rows, 'transactions', { key: 'created', dir: 'asc' })).toEqual(rows);
    expect(sortItems(rows, 'transactions', { key: 'created', dir: 'desc' }))
      .toEqual([...rows].reverse());
  });

  it('falls back to each list default for invalid or unknown stored values', () => {
    const options = SORT_OPTIONS.transactions;
    const fallback = DEFAULT_SORTS.transactions;
    expect(resolveSortSpec(undefined, options, fallback)).toBeNull();
    expect(resolveSortSpec({ key: 'unknown', dir: 'asc' }, options, fallback)).toEqual(fallback);
    expect(resolveSortSpec({ key: 'date', dir: 'sideways' }, options, fallback)).toEqual(fallback);
    expect(resolveSortSpec('invalid', options, fallback)).toEqual(fallback);
    expect(resolveSortSpec({ key: 'amount', dir: 'asc' }, options, fallback))
      .toEqual({ key: 'amount', dir: 'asc' });
  });
});
