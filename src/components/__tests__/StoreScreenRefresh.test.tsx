import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { StateStorage } from 'zustand/middleware';

import AssetsScreen from '../../../app/assets';
import BudgetScreen from '../../../app/(tabs)/budget';
import EmergencyFundScreen from '../../../app/emergency-fund';
import GoalsScreen from '../../../app/(tabs)/goals';
import HomeScreen from '../../../app/(tabs)';
import InvestmentEntriesScreen from '../../../app/investment-entries';
import LiabilitiesScreen from '../../../app/liabilities';
import TransactionsScreen from '../../../app/(tabs)/transactions';
import { emptyAppData } from '../../domain/actions';
import { todayISO } from '../../lib/clock';
import { budgetPlanFromLines } from '../../testFixtures/budget';
import { createAppStore } from '../../data/createAppStore';
import { useUIStore } from '../../data/uiStore';
import { StorageErrorBanner } from '../StorageErrorBanner';

let mockStore: ReturnType<typeof createAppStore> | null = null;
let mockStorage: MemoryStorage | null = null;
let mockRouteParams: Record<string, string> = {};

jest.mock('../../data/store', () => {
  const useAppStore = (selector: (state: unknown) => unknown) => {
    if (!mockStore) throw new Error('Refresh test store has not been created.');
    return mockStore(selector as never);
  };
  return {
    useAppStore: Object.assign(useAppStore, {
      getState: () => {
        if (!mockStore) throw new Error('Refresh test store has not been created.');
        return mockStore.getState();
      },
    }),
    metaStore: {
      getMeta: async () => ({}),
      updateMeta: async (patch: object) => patch,
      updateSortSpec: async () => ({}),
      clearMeta: async () => undefined,
    },
  };
});

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: () => mockRouteParams,
  usePathname: () => '/',
  useIsFocused: () => true,
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: ({ name }: { name: string }) => {
    const ReactModule = jest.requireActual('react') as typeof import('react');
    return ReactModule.createElement('icon', { name });
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => {
    const palette = jest.requireActual('../../theme/themes').themes.light;
    return { ...palette, themeId: 'light', resolvedId: 'light', setTheme: jest.fn() };
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      ReactModule.createElement('view', props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  const FlatList = ({ data = [], renderItem, ListHeaderComponent, ...props }: {
    data?: unknown[];
    renderItem?: (info: { item: unknown; index: number }) => React.ReactNode;
    ListHeaderComponent?: React.ComponentType;
    [key: string]: unknown;
  }) => ReactModule.createElement(
    'flatlist',
    props,
    ListHeaderComponent ? ReactModule.createElement(ListHeaderComponent) : null,
    ...data.map((item, index) => renderItem?.({ item, index }) ?? null),
  );
  return {
    Alert: { alert: jest.fn() },
    AppState: { addEventListener: () => ({ remove: jest.fn() }), currentState: 'active' },
    BackHandler: { addEventListener: () => ({ remove: jest.fn() }), exitApp: jest.fn() },
    FlatList,
    Keyboard: { addListener: () => ({ remove: jest.fn() }), dismiss: jest.fn() },
    KeyboardAvoidingView: node('keyboard-avoiding-view'),
    Modal: node('modal'),
    PanResponder: { create: (handlers: object) => ({ panHandlers: handlers }) },
    Platform: { OS: 'ios' },
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    Switch: node('switch'),
    Text: node('text'),
    TextInput: node('textinput'),
    TouchableOpacity: node('touchableopacity'),
    View: node('view'),
    useWindowDimensions: () => ({ fontScale: 1, width: 390, height: 844, scale: 1 }),
  };
});

class MemoryStorage implements StateStorage {
  values = new Map<string, string>();
  failWrites = false;

  getItem(name: string): string | null {
    return this.values.get(name) ?? null;
  }

  setItem(name: string, value: string): void {
    if (this.failWrites) throw new Error('disk full');
    this.values.set(name, value);
  }

  removeItem(name: string): void {
    this.values.delete(name);
  }
}

async function waitForHydration(store: ReturnType<typeof createAppStore>): Promise<void> {
  if (store.getState().hydrated) return;
  await new Promise<void>((resolve) => {
    const unsubscribe = store.subscribe((state) => {
      if (state.hydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
}

async function flushPersistence(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function renderScreen(screen: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    renderer = TestRenderer.create(screen);
  });
  if (!renderer) throw new Error('Screen did not render.');
  return renderer;
}

function visibleText(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root.findAllByType('text')
    .map((node) => {
      const flatten = (value: React.ReactNode): string => {
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        if (Array.isArray(value)) return value.map(flatten).join(' ');
        if (React.isValidElement<{ children?: React.ReactNode }>(value)) return flatten(value.props.children);
        return '';
      };
      return flatten(node.props.children);
    })
    .join(' ');
}

describe('real-store screen refresh', () => {
  const today = todayISO();
  const month = today.slice(0, 7);
  let sequence = 0;

  beforeEach(async () => {
    sequence = 0;
    mockRouteParams = {};
    mockStorage = new MemoryStorage();
    mockStore = createAppStore(mockStorage, {
      newId: () => `refresh-${++sequence}`,
      today: () => today,
      isDev: false,
    });
    await waitForHydration(mockStore);
    const data = emptyAppData(today);
    mockStore.setState({
      data: {
        ...data,
        settings: { ...data.settings, name: 'Refresh test', monthlySalary: 40_000, onboarded: true },
      },
    });
    useUIStore.getState().setTxMonth(month);
    await flushPersistence();
  });

  afterEach(() => {
    mockStore = null;
    mockStorage = null;
    mockRouteParams = {};
  });

  it('refreshes the Assets list after a holding value edit without remounting', async () => {
    const store = mockStore;
    if (!store) throw new Error('Refresh test store is missing.');
    const actions = store.getState().actions;
    actions.addHolding({ name: 'Refresh asset', type: 'Gold', invested: 100, value: 100 });
    const holding = store.getState().data.holdings[0];
    if (!holding) throw new Error('Refresh asset was not added.');
    const renderer = renderScreen(React.createElement(AssetsScreen));
    try {
      expect(visibleText(renderer)).toContain('100');
      await act(async () => {
        actions.updateHoldingValue(holding.id, 250, today, 'manual');
        await flushPersistence();
      });
      expect(visibleText(renderer)).toContain('250');
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('refreshes holding details after an entry add without remounting', async () => {
    const store = mockStore;
    if (!store) throw new Error('Refresh test store is missing.');
    store.getState().actions.addHolding({ name: 'Entry holding', type: 'Gold', invested: 100, value: 100 });
    const holding = store.getState().data.holdings[0];
    if (!holding) throw new Error('Entry holding was not added.');
    mockRouteParams = { id: holding.id };
    const renderer = renderScreen(React.createElement(InvestmentEntriesScreen));
    try {
      expect(visibleText(renderer)).not.toContain('Added after render');
      await act(async () => {
        store.getState().actions.addInvestmentEntry(holding.id, {
          date: today,
          amount: 25,
          kind: 'Deposit',
          note: 'Added after render',
        });
        await flushPersistence();
      });
      expect(visibleText(renderer)).toContain('Added after render');
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('refreshes liabilities after an edit without remounting', async () => {
    const store = mockStore;
    if (!store) throw new Error('Refresh test store is missing.');
    store.getState().actions.addLiability({
      kind: 'recurring',
      name: 'Before liability edit',
      type: 'Personal loan',
      principal: 10_000,
      ratePct: 0,
      startDate: today,
      tenureMonths: 12,
      emi: 1_000,
    });
    const liability = store.getState().data.liabilities[0];
    if (!liability) throw new Error('Refresh liability was not added.');
    const renderer = renderScreen(React.createElement(LiabilitiesScreen));
    try {
      expect(visibleText(renderer)).toContain('Before liability edit');
      await act(async () => {
        store.getState().actions.updateLiability(liability.id, { name: 'After liability edit' });
        await flushPersistence();
      });
      expect(visibleText(renderer)).toContain('After liability edit');
      expect(visibleText(renderer)).not.toContain('Before liability edit');
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('refreshes Transactions after a note edit without remounting', async () => {
    const store = mockStore;
    if (!store) throw new Error('Refresh test store is missing.');
    store.getState().actions.addTransaction({
      type: 'income',
      amount: 100,
      category: 'Salary',
      note: 'Before transaction edit',
      date: today,
    });
    const transaction = store.getState().data.transactions[0];
    if (!transaction) throw new Error('Refresh transaction was not added.');
    const renderer = renderScreen(React.createElement(TransactionsScreen));
    try {
      expect(visibleText(renderer)).toContain('Before transaction edit');
      await act(async () => {
        store.getState().actions.updateTransaction(transaction.id, { note: 'After transaction edit' });
        await flushPersistence();
      });
      expect(visibleText(renderer)).toContain('After transaction edit');
      expect(visibleText(renderer)).not.toContain('Before transaction edit');
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('refreshes Goals after a saved-value edit without remounting', async () => {
    const store = mockStore;
    if (!store) throw new Error('Refresh test store is missing.');
    store.getState().actions.addGoal({ name: 'Refresh goal', target: 1_000, saved: 100, year: 2030 });
    const goal = store.getState().data.goals.find((item) => item.name === 'Refresh goal');
    if (!goal) throw new Error('Refresh goal was not added.');
    const renderer = renderScreen(React.createElement(GoalsScreen));
    try {
      expect(visibleText(renderer)).toContain('100');
      await act(async () => {
        store.getState().actions.updateGoal(goal.id, { saved: 500 });
        await flushPersistence();
      });
      expect(visibleText(renderer)).toContain('500');
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('refreshes Emergency Fund after linking a holding without remounting', async () => {
    const store = mockStore;
    if (!store) throw new Error('Refresh test store is missing.');
    store.getState().actions.addHolding({
      name: 'Linked refresh cash',
      type: 'Cash',
      invested: 1_000,
      value: 1_000,
    });
    const holding = store.getState().data.holdings[0];
    const goal = store.getState().data.goals.find((item) => item.auto === 'ef');
    if (!holding || !goal) throw new Error('Emergency fund fixtures were not added.');
    const renderer = renderScreen(React.createElement(EmergencyFundScreen));
    try {
      expect(visibleText(renderer)).not.toContain('1,000');
      await act(async () => {
        store.getState().actions.setGoalLinks(goal.id, [{ instrumentId: holding.id, share: 100 }]);
        await flushPersistence();
      });
      expect(visibleText(renderer)).toContain('1.00 K');
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('refreshes Budget after an income add without remounting', async () => {
    const store = mockStore;
    if (!store) throw new Error('Refresh test store is missing.');
    store.getState().actions.saveBudgetPlan(budgetPlanFromLines([], {
      incomes: [],
      repeatMonthly: true,
      repeatFrom: month,
    }));
    store.getState().actions.applyBudgetPlan(month);
    const renderer = renderScreen(React.createElement(BudgetScreen));
    try {
      expect(visibleText(renderer)).not.toContain('Refresh income');
      await act(async () => {
        store.getState().actions.addBudgetIncome(month, {
          name: 'Refresh income',
          amount: 5_000,
          category: 'Salary',
          day: 1,
        }, 'following', today);
        await flushPersistence();
      });
      expect(visibleText(renderer)).toContain('Refresh income');
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('refreshes Home after a policy add without remounting', async () => {
    const store = mockStore;
    if (!store) throw new Error('Refresh test store is missing.');
    const renderer = renderScreen(React.createElement(HomeScreen));
    try {
      expect(renderer.root.findAll((node) =>
        node.props.accessibilityLabel === 'Insurance, No policies yet',
      ).length).toBeGreaterThan(0);
      await act(async () => {
        store.getState().actions.addPolicy({
          name: 'Refresh policy',
          insurer: 'Refresh insurer',
          kind: 'term-life',
          premium: 500,
          frequency: 'yearly',
          startDate: today,
          status: 'active',
          premiumYears: 5,
          trackFrom: today,
          currentValue: null,
          valueAsOf: null,
          sumAssured: 50_000,
        });
        await flushPersistence();
      });
      expect(renderer.root.findAll((node) =>
        node.props.accessibilityLabel === 'Insurance, total cover ₹50,000',
      ).length).toBeGreaterThan(0);
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('shows a user-visible error when a store write cannot be persisted', async () => {
    const store = mockStore;
    const storage = mockStorage;
    if (!store || !storage) throw new Error('Refresh test store is missing.');
    const renderer = renderScreen(React.createElement(StorageErrorBanner));
    try {
      storage.failWrites = true;
      await act(async () => {
        store.getState().actions.updateSettings({ name: 'Unsaved change' });
        await flushPersistence();
      });
      expect(visibleText(renderer)).toContain('Your last change could not be saved.');
      expect(renderer.root.findAll((node) =>
        node.props.accessibilityRole === 'alert',
      ).length).toBeGreaterThan(0);
    } finally {
      act(() => renderer.unmount());
    }
  });
});
