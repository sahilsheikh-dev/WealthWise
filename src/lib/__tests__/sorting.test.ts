import {
  DEFAULT_SORTS,
  SORT_OPTIONS,
  resolveSortSpec,
  sortIfSelected,
  sortItems,
  type SortList,
} from '../sorting';
import { mockAppData } from '../../mock/data';
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
