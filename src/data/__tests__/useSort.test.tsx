import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { StateStorage } from 'zustand/middleware';

import { DEFAULT_SORTS, type SortList } from '../../lib/sorting';
import { createMetaStore } from '../metaStore';
import { useSort } from '../useSort';

class MockStorage implements StateStorage {
  values = new Map<string, string>();
  async getItem(name: string) {
    return this.values.get(name) ?? null;
  }
  async setItem(name: string, value: string) {
    this.values.set(name, value);
  }
  async removeItem(name: string) {
    this.values.delete(name);
  }
}

let mockStorage = new MockStorage();
let mockActiveMetaStore = createMetaStore(mockStorage);

jest.mock('../store', () => ({
  get metaStore() {
    return mockActiveMetaStore;
  },
}));

type HookVal = ReturnType<typeof useSort>;

function HookHarness({ list, onValue }: { list: SortList; onValue: (val: HookVal) => void }) {
  const sort = useSort(list);
  React.useEffect(() => {
    onValue(sort);
  }, [onValue, sort]);
  return null;
}

describe('persistent sorting preferences across screens and sections', () => {
  beforeEach(() => {
    mockStorage = new MockStorage();
    mockActiveMetaStore = createMetaStore(mockStorage);
  });

  it('remembers selected sort field and direction independently for each screen or section', async () => {
    let txVal: HookVal = {} as HookVal;
    let assetVal: HookVal = {} as HookVal;
    let sipVal: HookVal = {} as HookVal;
    let liabilityVal: HookVal = {} as HookVal;
    let budgetVal: HookVal = {} as HookVal;
    let goalVal: HookVal = {} as HookVal;
    let linkMissingVal: HookVal = {} as HookVal;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        <>
          <HookHarness list="transactions" onValue={(v) => { txVal = v; }} />
          <HookHarness list="assets" onValue={(v) => { assetVal = v; }} />
          <HookHarness list="sips" onValue={(v) => { sipVal = v; }} />
          <HookHarness list="liabilities" onValue={(v) => { liabilityVal = v; }} />
          <HookHarness list="budgetSpending" onValue={(v) => { budgetVal = v; }} />
          <HookHarness list="goals" onValue={(v) => { goalVal = v; }} />
          <HookHarness list="linkMissing" onValue={(v) => { linkMissingVal = v; }} />
        </>,
      );
      await Promise.resolve();
    });

    // Check default values
    expect(txVal.spec).toEqual(DEFAULT_SORTS.transactions);
    expect(assetVal.spec).toEqual(DEFAULT_SORTS.assets);
    expect(sipVal.spec).toEqual(DEFAULT_SORTS.sips);
    expect(liabilityVal.spec).toEqual(DEFAULT_SORTS.liabilities);
    expect(budgetVal.spec).toEqual(DEFAULT_SORTS.budgetSpending);
    expect(goalVal.spec).toEqual(DEFAULT_SORTS.goals);
    expect(linkMissingVal.spec).toEqual(DEFAULT_SORTS.linkMissing);

    // Update sort preferences independently
    await act(async () => {
      txVal.setSpec({ key: 'amount', dir: 'asc' });
      assetVal.setSpec({ key: 'name', dir: 'desc' });
      sipVal.setSpec({ key: 'gainPct', dir: 'asc' });
      liabilityVal.setSpec({ key: 'name', dir: 'asc' });
      budgetVal.setSpec({ key: 'name', dir: 'asc' });
      goalVal.setSpec({ key: 'name', dir: 'desc' });
      linkMissingVal.setSpec({ key: 'amount', dir: 'asc' });
      await Promise.resolve();
    });

    // Verify in-memory state updated independently
    expect(txVal.spec).toEqual({ key: 'amount', dir: 'asc' });
    expect(assetVal.spec).toEqual({ key: 'name', dir: 'desc' });
    expect(sipVal.spec).toEqual({ key: 'gainPct', dir: 'asc' });
    expect(liabilityVal.spec).toEqual({ key: 'name', dir: 'asc' });
    expect(budgetVal.spec).toEqual({ key: 'name', dir: 'asc' });
    expect(goalVal.spec).toEqual({ key: 'name', dir: 'desc' });
    expect(linkMissingVal.spec).toEqual({ key: 'amount', dir: 'asc' });

    // Verify persisted payload in metaStore
    const meta = await mockActiveMetaStore.getMeta();
    expect(meta.sortSpecs).toEqual({
      transactions: { key: 'amount', dir: 'asc' },
      assets: { key: 'name', dir: 'desc' },
      sips: { key: 'gainPct', dir: 'asc' },
      liabilities: { key: 'name', dir: 'asc' },
      budgetSpending: { key: 'name', dir: 'asc' },
      goals: { key: 'name', dir: 'desc' },
      linkMissing: { key: 'amount', dir: 'asc' },
    });

    act(() => {
      renderer?.unmount();
    });
  });

  it('restores each preference when the user returns to that screen and after app restart', async () => {
    // Seed storage with persisted preferences
    await mockStorage.setItem(
      'wealthwise.meta.v1',
      JSON.stringify({
        sortSpecs: {
          transactions: { key: 'category', dir: 'asc' },
          assets: { key: 'invested', dir: 'asc' },
          liabilities: { key: 'rate', dir: 'desc' },
          budgetSpending: { key: 'actual', dir: 'desc' },
        },
      }),
    );

    // Simulate fresh app launch
    mockActiveMetaStore = createMetaStore(mockStorage);

    let txVal: HookVal = {} as HookVal;
    let assetVal: HookVal = {} as HookVal;
    let liabilityVal: HookVal = {} as HookVal;
    let budgetVal: HookVal = {} as HookVal;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        <>
          <HookHarness list="transactions" onValue={(v) => { txVal = v; }} />
          <HookHarness list="assets" onValue={(v) => { assetVal = v; }} />
          <HookHarness list="liabilities" onValue={(v) => { liabilityVal = v; }} />
          <HookHarness list="budgetSpending" onValue={(v) => { budgetVal = v; }} />
        </>,
      );
      await Promise.resolve();
    });

    // Preferences restored from storage
    expect(txVal.spec).toEqual({ key: 'category', dir: 'asc' });
    expect(assetVal.spec).toEqual({ key: 'invested', dir: 'asc' });
    expect(liabilityVal.spec).toEqual({ key: 'rate', dir: 'desc' });
    expect(budgetVal.spec).toEqual({ key: 'actual', dir: 'desc' });

    // Simulate returning to screen (unmount and remount)
    act(() => {
      renderer?.unmount();
    });

    let returnTxVal: HookVal = {} as HookVal;
    await act(async () => {
      renderer = TestRenderer.create(<HookHarness list="transactions" onValue={(v) => { returnTxVal = v; }} />);
      await Promise.resolve();
    });

    expect(returnTxVal.spec).toEqual({ key: 'category', dir: 'asc' });
    act(() => {
      renderer?.unmount();
    });
  });

  it('persists a new choice when a user changes a sort choice on a screen', async () => {
    let currentVal: HookVal = {} as HookVal;
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = TestRenderer.create(<HookHarness list="transactions" onValue={(v) => { currentVal = v; }} />);
      await Promise.resolve();
    });

    expect(currentVal.spec).toEqual(DEFAULT_SORTS.transactions);

    // Change sort choice
    await act(async () => {
      currentVal.setSpec({ key: 'type', dir: 'asc' });
      await Promise.resolve();
    });

    expect(currentVal.spec).toEqual({ key: 'type', dir: 'asc' });

    // Verify stored in storage
    const raw = await mockStorage.getItem('wealthwise.meta.v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.sortSpecs.transactions).toEqual({ key: 'type', dir: 'asc' });

    act(() => {
      renderer?.unmount();
    });
  });

  it('keeps sorting preferences separate from filters without overwriting them', async () => {
    type FilterState = 'All' | 'Recurring' | 'One-time';

    function FilterAndSortScreen({
      filter,
      onValue,
    }: {
      filter: FilterState;
      onValue: (val: HookVal) => void;
    }) {
      const sort = useSort('liabilities');
      React.useEffect(() => {
        onValue(sort);
      }, [onValue, sort]);
      return <mock-filter filter={filter} />;
    }

    let capturedSort: HookVal = {} as HookVal;
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = TestRenderer.create(
        <FilterAndSortScreen
          filter="Recurring"
          onValue={(v) => {
            capturedSort = v;
          }}
        />,
      );
      await Promise.resolve();
    });

    expect(renderer?.root.findByType('mock-filter' as React.ElementType).props.filter).toBe('Recurring');
    expect(capturedSort.spec).toEqual(DEFAULT_SORTS.liabilities);

    // Changing sort preference must not mutate filter state
    await act(async () => {
      capturedSort.setSpec({ key: 'name', dir: 'asc' });
      await Promise.resolve();
    });

    expect(renderer?.root.findByType('mock-filter' as React.ElementType).props.filter).toBe('Recurring');
    expect(capturedSort.spec).toEqual({ key: 'name', dir: 'asc' });

    // Changing filter must not clear or overwrite sort preference
    await act(async () => {
      renderer?.update(
        <FilterAndSortScreen
          filter="One-time"
          onValue={(v) => {
            capturedSort = v;
          }}
        />,
      );
      await Promise.resolve();
    });

    expect(renderer?.root.findByType('mock-filter' as React.ElementType).props.filter).toBe('One-time');
    expect(capturedSort.spec).toEqual({ key: 'name', dir: 'asc' });

    act(() => {
      renderer?.unmount();
    });
  });

  it('subscribes to metaStore changes so concurrent or remote updates are reflected', async () => {
    let valA: HookVal = {} as HookVal;
    let valB: HookVal = {} as HookVal;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        <>
          <HookHarness list="budgetSpending" onValue={(v) => { valA = v; }} />
          <HookHarness list="budgetSpending" onValue={(v) => { valB = v; }} />
        </>,
      );
      await Promise.resolve();
    });

    expect(valA.spec).toEqual(DEFAULT_SORTS.budgetSpending);
    expect(valB.spec).toEqual(DEFAULT_SORTS.budgetSpending);

    // Update via valA
    await act(async () => {
      valA.setSpec({ key: 'actual', dir: 'asc' });
      await Promise.resolve();
    });

    // valB should reflect the update via subscription
    expect(valA.spec).toEqual({ key: 'actual', dir: 'asc' });
    expect(valB.spec).toEqual({ key: 'actual', dir: 'asc' });

    act(() => {
      renderer?.unmount();
    });
  });

  it('rejects invalid sort keys or directions', async () => {
    let testVal: HookVal = {} as HookVal;
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = TestRenderer.create(<HookHarness list="transactions" onValue={(v) => { testVal = v; }} />);
      await Promise.resolve();
    });

    expect(() => {
      testVal.setSpec({ key: 'nonexistentKey', dir: 'asc' });
    }).toThrow('Sort preference is invalid.');

    expect(() => {
      testVal.setSpec({ key: 'amount', dir: 'invalidDir' as 'asc' });
    }).toThrow('Sort preference is invalid.');

    act(() => {
      renderer?.unmount();
    });
  });
});
