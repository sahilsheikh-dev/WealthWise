import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { StateStorage } from 'zustand/middleware';

import BudgetScreen from '../../../app/(tabs)/budget';
import BudgetItemFormScreen from '../../../app/budget-item-form';
import { emptyAppData } from '../../domain/actions';
import { createAppStore } from '../../data/createAppStore';
import { budgetPlanFromLines, monthBudgetFromLines } from '../../testFixtures/budget';
import { todayISO } from '../../lib/clock';
import { useUIStore } from '../../data/uiStore';

let mockStore: ReturnType<typeof createAppStore> | null = null;
let mockRouteParams: Record<string, string> = {};

jest.mock('../../data/store', () => {
  const useAppStore = (selector: (state: unknown) => unknown) => {
    if (!mockStore) throw new Error('Budget roundtrip store has not been created.');
    return mockStore(selector as never);
  };
  return {
    useAppStore: Object.assign(useAppStore, {
      getState: () => {
        if (!mockStore) throw new Error('Budget roundtrip store has not been created.');
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
  usePathname: () => '/budget-item-form',
  useIsFocused: () => true,
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: ({ name }: { name: string }) => {
    const ReactModule = jest.requireActual('react') as typeof import('react');
    return ReactModule.createElement('icon', { name });
  },
  Ionicons: ({ name }: { name: string }) => {
    const ReactModule = jest.requireActual('react') as typeof import('react');
    return ReactModule.createElement('icon', { name });
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => undefined), removeItem: jest.fn(async () => undefined) },
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
    'flatlist', props,
    ListHeaderComponent ? ReactModule.createElement(ListHeaderComponent) : null,
    ...data.map((item, index) => renderItem?.({ item, index }) ?? null),
  );
  const Modal = ({ visible, children, ...props }: { visible?: boolean; children?: React.ReactNode; [key: string]: unknown }) =>
    visible ? ReactModule.createElement('modal', props, children) : null;
  return {
    Alert: { alert: jest.fn() },
    AppState: { addEventListener: () => ({ remove: jest.fn() }), currentState: 'active' },
    BackHandler: { addEventListener: () => ({ remove: jest.fn() }), exitApp: jest.fn() },
    FlatList,
    Keyboard: { addListener: () => ({ remove: jest.fn() }), dismiss: jest.fn() },
    KeyboardAvoidingView: node('keyboard-avoiding-view'),
    Modal,
    PanResponder: { create: () => ({ panHandlers: {} }) },
    Platform: { OS: 'ios' },
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1, absoluteFill: {} },
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
  writes = 0;

  getItem(name: string): string | null { return this.values.get(name) ?? null; }
  setItem(name: string, value: string): void { this.writes += 1; this.values.set(name, value); }
  removeItem(name: string): void { this.values.delete(name); }
}

async function waitForHydration(store: ReturnType<typeof createAppStore>): Promise<void> {
  if (store.getState().hydrated) return;
  await new Promise<void>((resolve) => {
    const unsubscribe = store.subscribe((state) => {
      if (state.hydrated) { unsubscribe(); resolve(); }
    });
  });
}

async function flushPersistence(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function renderScreen(screen: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => { renderer = TestRenderer.create(screen); });
  if (!renderer) throw new Error('Budget screen did not render.');
  return renderer;
}

function visibleText(renderer: TestRenderer.ReactTestRenderer): string {
  const flatten = (value: React.ReactNode): string => {
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(flatten).join(' ');
    if (React.isValidElement<{ children?: React.ReactNode }>(value)) return flatten(value.props.children);
    return '';
  };
  return renderer.root.findAllByType('text').map((node) => flatten(node.props.children)).join(' ');
}

function persistedData(storage: MemoryStorage): ReturnType<typeof emptyAppData> & { budgetPlan: NonNullable<ReturnType<typeof emptyAppData>['budgetPlan']> } {
  const raw = storage.values.get('wealthwise.app.v1');
  if (!raw) throw new Error('Persisted app state was not written.');
  return JSON.parse(raw).state.data as ReturnType<typeof emptyAppData> & { budgetPlan: NonNullable<ReturnType<typeof emptyAppData>['budgetPlan']> };
}

describe('Budget form persisted store roundtrip', () => {
  const today = todayISO();
  const month = today.slice(0, 7);
  const itemId = 'fixture-item-1';
  let storage: MemoryStorage;
  let sequence = 0;
  let baseline: ReturnType<typeof emptyAppData>;

  const makeStore = () => createAppStore(storage, {
    newId: () => `roundtrip-${++sequence}`,
    today: () => today,
    isDev: false,
  });

  const seed = async () => {
    const store = mockStore;
    if (!store) throw new Error('Budget roundtrip store is missing.');
    store.setState({ data: baseline });
    await flushPersistence();
    storage.writes = 0;
  };

  const assertPersistedAndRehydrated = async (expectedPlanValue: number | null, expectedSnapshotValue: number | null) => {
    const data = persistedData(storage);
    expect(data.budgetPlan?.items.find((item) => item.id === itemId)?.value ?? null).toBe(expectedPlanValue);
    expect(data.monthBudgets?.[0]?.items.find((item) => item.id === itemId)?.value ?? null).toBe(expectedSnapshotValue);
    const freshStore = makeStore();
    await waitForHydration(freshStore);
    expect(freshStore.getState().data.budgetPlan?.items.find((item) => item.id === itemId)?.value ?? null)
      .toBe(expectedPlanValue);
    expect(freshStore.getState().data.monthBudgets?.[0]?.items.find((item) => item.id === itemId)?.value ?? null)
      .toBe(expectedSnapshotValue);
  };

  beforeEach(async () => {
    sequence = 0;
    mockRouteParams = { month, sectionId: 'survival', itemId, scope: 'following' };
    storage = new MemoryStorage();
    mockStore = makeStore();
    await waitForHydration(mockStore);
    const data = emptyAppData(today);
    const plan = budgetPlanFromLines([{ category: 'Rent', value: 300, frequency: 'monthly', firstDueMonth: month }], {
      incomes: [], repeatMonthly: true, repeatFrom: month,
    });
    plan.items[0].id = itemId;
    const snapshot = monthBudgetFromLines(month, [{ category: 'Rent', planned: 300, frequency: 'monthly', firstDueMonth: month }], {
      incomes: [], source: 'plan',
    });
    snapshot.items[0].id = itemId;
    baseline = { ...data, budgetPlan: plan, monthBudgets: [snapshot] };
    mockStore.setState({ data: baseline });
    await flushPersistence();
    storage.writes = 0;
    useUIStore.getState().setTxMonth(month);
  });

  afterEach(() => {
    mockStore = null;
    mockRouteParams = {};
  });

  it('edits through the real form, persists and rehydrates, then deletes by both scopes', async () => {
    let form: TestRenderer.ReactTestRenderer | null = renderScreen(React.createElement(BudgetItemFormScreen));
    try {
      act(() => {
        form?.root.findByProps({ accessibilityLabel: 'Planned amount' }).props.onChangeText('450');
      });
      await act(async () => {
        await form.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        form.root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
        await flushPersistence();
      });
      expect(storage.writes).toBe(1);
      expect(mockStore?.getState().data.budgetPlan?.items.find((item) => item.id === itemId)?.value).toBe(450);
      expect(mockStore?.getState().data.monthBudgets?.[0]?.items.find((item) => item.id === itemId)?.value).toBe(450);
      await assertPersistedAndRehydrated(450, 450);
      act(() => form?.unmount());
      form = null;
    } finally {
      if (form) act(() => form.unmount());
    }

    let budget = renderScreen(React.createElement(BudgetScreen));
    expect(visibleText(budget)).toContain('450');
    await act(async () => {
      budget.root.findByProps({ accessibilityLabel: 'Edit Rent' }).props.onPress();
      await Promise.resolve();
    });
    const pushed = jest.requireMock('expo-router').router.push.mock.calls.at(-1)?.[0] as { params?: Record<string, string> } | undefined;
    expect(pushed?.params).toMatchObject({ month, sectionId: 'survival', itemId });
    mockRouteParams = { month, sectionId: 'survival', itemId, scope: 'following' };
    act(() => budget.unmount());
    form = renderScreen(React.createElement(BudgetItemFormScreen));
    expect(form.root.findByProps({ accessibilityLabel: 'Planned amount' }).props.value).toBe('450');
    act(() => form.unmount());
    act(() => budget.unmount());

    form = renderScreen(React.createElement(BudgetItemFormScreen));
    storage.writes = 0;
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'Delete item' }).props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'This month only' }).props.onPress();
      await flushPersistence();
    });
    expect(storage.writes).toBe(1);
    expect(mockStore?.getState().data.monthBudgets?.[0]?.items.some((item) => item.id === itemId)).toBe(false);
    expect(mockStore?.getState().data.budgetPlan?.items.some((item) => item.id === itemId)).toBe(true);
    await assertPersistedAndRehydrated(450, null);
    act(() => form.unmount());
    budget = renderScreen(React.createElement(BudgetScreen));
    expect(visibleText(budget)).not.toContain('Rent');
    act(() => budget.unmount());

    await seed();
    form = renderScreen(React.createElement(BudgetItemFormScreen));
    storage.writes = 0;
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'Delete item' }).props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
      await flushPersistence();
    });
    expect(storage.writes).toBe(1);
    expect(mockStore?.getState().data.budgetPlan?.items.some((item) => item.id === itemId)).toBe(false);
    expect(mockStore?.getState().data.monthBudgets?.[0]?.items.some((item) => item.id === itemId)).toBe(false);
    await assertPersistedAndRehydrated(null, null);
    act(() => form.unmount());
    budget = renderScreen(React.createElement(BudgetScreen));
    expect(visibleText(budget)).not.toContain('Rent');
    act(() => budget.unmount());
  });

});
