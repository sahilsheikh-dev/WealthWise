import React from 'react';
import { createHash } from 'node:crypto';
import TestRenderer, { act } from 'react-test-renderer';
import type { StateStorage } from 'zustand/middleware';

import BudgetScreen from '../../../app/(tabs)/budget';
import BudgetItemFormScreen from '../../../app/budget-item-form';
import BudgetIncomeFormScreen from '../../../app/budget-income-form';
import { emptyAppData } from '../../domain/actions';
import { createBackup, parseBackup } from '../../domain/backup';
import { createAppStore } from '../../data/createAppStore';
import { budgetPlanFromLines, monthBudgetFromLines } from '../../testFixtures/budget';
import { todayISO } from '../../lib/clock';
import { formatMonth } from '../../lib/format';
import { useUIStore } from '../../data/uiStore';
import { shiftMonth } from '../../domain/dates';
import type { BudgetIncomeItem } from '../../domain/types';
import { buildDemoData } from '../../mock/demoData';

let mockStore: ReturnType<typeof createAppStore> | null = null;
let mockRouteParams: Record<string, string> = {};
const sha256 = async (value: string): Promise<string> => createHash('sha256').update(value).digest('hex');

jest.mock('../../data/store', () => {
  const useAppStore = (selector: (state: ReturnType<ReturnType<typeof createAppStore>['getState']>) => unknown) => {
    if (!mockStore) throw new Error('Budget roundtrip store has not been created.');
    return mockStore(selector);
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
    const mockReact = jest.requireActual<typeof import('react')>('react');
    return mockReact.createElement('icon', { name });
  },
  Ionicons: ({ name }: { name: string }) => {
    const mockReact = jest.requireActual<typeof import('react')>('react');
    return mockReact.createElement('icon', { name });
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
  const mockReact = jest.requireActual<typeof import('react')>('react');
  return {
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      mockReact.createElement('view', props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('react-native', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    mockReact.createElement(type, props, children);
  const FlatList = ({ data = [], renderItem, ListHeaderComponent, ...props }: {
    data?: unknown[];
    renderItem?: (info: { item: unknown; index: number }) => React.ReactNode;
    ListHeaderComponent?: React.ComponentType;
    [key: string]: unknown;
  }) => mockReact.createElement(
    'flatlist', props,
    ListHeaderComponent ? mockReact.createElement(ListHeaderComponent) : null,
    ...data.map((item, index) => renderItem?.({ item, index }) ?? null),
  );
  const Modal = ({ visible, children, ...props }: { visible?: boolean; children?: React.ReactNode; [key: string]: unknown }) =>
    visible ? mockReact.createElement('modal', props, children) : null;
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

function pressAccessibleControl(renderer: TestRenderer.ReactTestRenderer, label: string): void {
  const control = renderer.root.findAllByProps({ accessibilityLabel: label })
    .find((node) => typeof node.props.onPress === 'function');
  if (!control) throw new Error(`Pressable control "${label}" was not rendered.`);
  act(() => control.props.onPress());
}

function changeAccessibleText(renderer: TestRenderer.ReactTestRenderer, label: string, value: string): void {
  const control = renderer.root.findAllByType('textinput')
    .find((node) => node.props.accessibilityLabel === label);
  if (!control) throw new Error(`Text input "${label}" was not rendered.`);
  act(() => {
    control.props.onFocus?.();
    control.props.onChangeText(value);
  });
}

function persistedData(storage: MemoryStorage): ReturnType<typeof emptyAppData> & { budgetPlan: NonNullable<ReturnType<typeof emptyAppData>['budgetPlan']> } {
  const raw = storage.values.get('wealthwise.app.v1');
  if (!raw) throw new Error('Persisted app state was not written.');
  return JSON.parse(raw).state.data;
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
    const currentForm = (): TestRenderer.ReactTestRenderer => {
      if (!form) throw new Error('Budget item form is not mounted.');
      return form;
    };
    try {
      act(() => {
        currentForm().root.findByProps({ accessibilityLabel: 'Planned amount' }).props.onChangeText('450');
      });
      await act(async () => {
        await currentForm().root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        currentForm().root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
        await flushPersistence();
      });
      expect(storage.writes).toBe(1);
      expect(mockStore?.getState().data.budgetPlan?.items.find((item) => item.id === itemId)?.value).toBe(450);
      expect(mockStore?.getState().data.monthBudgets?.[0]?.items.find((item) => item.id === itemId)?.value).toBe(450);
      await assertPersistedAndRehydrated(450, 450);
      act(() => currentForm().unmount());
      form = null;
    } finally {
      const remainingForm = form;
      if (remainingForm) act(() => remainingForm.unmount());
    }

    let budget = renderScreen(React.createElement(BudgetScreen));
    expect(visibleText(budget)).toContain('450');
    await act(async () => {
      budget.root.findByProps({ accessibilityLabel: 'Edit Rent' }).props.onPress();
      await Promise.resolve();
    });
    const pushed = jest.requireMock('expo-router').router.push.mock.calls.at(-1)?.[0];
    expect(pushed?.params).toMatchObject({ month, sectionId: 'survival', itemId });
    mockRouteParams = { month, sectionId: 'survival', itemId, scope: 'following' };
    act(() => budget.unmount());
    form = renderScreen(React.createElement(BudgetItemFormScreen));
    expect(currentForm().root.findByProps({ accessibilityLabel: 'Planned amount' }).props.value).toBe('450');
    act(() => currentForm().unmount());
    act(() => budget.unmount());

    form = renderScreen(React.createElement(BudgetItemFormScreen));
    storage.writes = 0;
    await act(async () => {
      currentForm().root.findByProps({ accessibilityLabel: 'Delete item' }).props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      currentForm().root.findByProps({ accessibilityLabel: 'This month only' }).props.onPress();
      await flushPersistence();
    });
    expect(storage.writes).toBe(1);
    expect(mockStore?.getState().data.monthBudgets?.[0]?.items.some((item) => item.id === itemId)).toBe(false);
    expect(mockStore?.getState().data.budgetPlan?.items.some((item) => item.id === itemId)).toBe(true);
    await assertPersistedAndRehydrated(450, null);
    act(() => currentForm().unmount());
    budget = renderScreen(React.createElement(BudgetScreen));
    expect(visibleText(budget)).not.toContain('Rent');
    act(() => budget.unmount());

    await seed();
    form = renderScreen(React.createElement(BudgetItemFormScreen));
    storage.writes = 0;
    await act(async () => {
      currentForm().root.findByProps({ accessibilityLabel: 'Delete item' }).props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      currentForm().root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
      await flushPersistence();
    });
    expect(storage.writes).toBe(1);
    expect(mockStore?.getState().data.budgetPlan?.items.some((item) => item.id === itemId)).toBe(false);
    expect(mockStore?.getState().data.monthBudgets?.[0]?.items.some((item) => item.id === itemId)).toBe(false);
    await assertPersistedAndRehydrated(null, null);
    act(() => currentForm().unmount());
    budget = renderScreen(React.createElement(BudgetScreen));
    expect(visibleText(budget)).not.toContain('Rent');
    act(() => budget.unmount());
  });

  it.each(['name', 'due day', 'frequency', 'start month'])(
    'round-trips a %s edit through the real form in following scope',
    async (field) => {
      const form = renderScreen(React.createElement(BudgetItemFormScreen));
      const nextMonth = shiftMonth(month, 1);
      const targetLabel = field === 'name'
        ? 'Budget item name'
        : field === 'due day'
          ? 'Due day'
          : field === 'frequency'
            ? 'Budget item frequency'
            : 'Budget item start month';
      const targetValue = field === 'name'
        ? 'Housing'
        : field === 'due day'
          ? '18'
          : field === 'frequency'
            ? 'Quarterly'
            : formatMonth(nextMonth);

      if (field === 'start month') {
        pressAccessibleControl(form, 'Budget item frequency');
        pressAccessibleControl(form, 'Quarterly');
      }
      if (field === 'frequency' || field === 'start month') {
        pressAccessibleControl(form, targetLabel);
        pressAccessibleControl(form, targetValue);
      } else {
        act(() => {
          form.root.findByProps({ accessibilityLabel: targetLabel }).props.onChangeText(targetValue);
        });
      }
      await act(async () => {
        form.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        form.root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
        await flushPersistence();
      });

      expect(storage.writes).toBe(1);
      const editedPlanItem = mockStore?.getState().data.budgetPlan?.items.find((item) => item.id === itemId);
      const editedSnapshotItem = mockStore?.getState().data.monthBudgets?.[0]?.items.find((item) => item.id === itemId);
      if (field === 'name') {
        expect(editedPlanItem?.name).toBe(targetValue);
        expect(editedSnapshotItem?.name).toBe(targetValue);
      } else if (field === 'due day') {
        expect(editedPlanItem?.dueDay).toBe(18);
        expect(editedSnapshotItem?.dueDay).toBe(18);
      } else if (field === 'frequency') {
        expect(editedPlanItem?.frequency).toBe('quarterly');
        expect(editedSnapshotItem?.frequency).toBe('quarterly');
      } else {
        expect(editedPlanItem?.firstDueMonth).toBe(nextMonth);
        expect(editedSnapshotItem?.firstDueMonth).toBe(nextMonth);
      }
      const persistedItem = persistedData(storage).budgetPlan?.items.find((item) => item.id === itemId);
      expect(persistedItem).toEqual(editedPlanItem);
      act(() => form.unmount());
    },
  );

  it.each(['name', 'amount', 'due day', 'frequency'])(
    'round-trips a %s edit through the real form in month-only scope',
    async (field) => {
      const form = renderScreen(React.createElement(BudgetItemFormScreen));
      if (field === 'name') {
        act(() => {
          form.root.findByProps({ accessibilityLabel: 'Budget item name' }).props.onChangeText('Housing');
        });
      } else if (field === 'amount') {
        changeAccessibleText(form, 'Planned amount', '450');
      } else if (field === 'due day') {
        act(() => {
          form.root.findByProps({ accessibilityLabel: 'Due day' }).props.onChangeText('18');
        });
      } else {
        pressAccessibleControl(form, 'Budget item frequency');
        pressAccessibleControl(form, 'Quarterly');
      }
      await act(async () => {
        form.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        form.root.findByProps({ accessibilityLabel: 'This month only' }).props.onPress();
        await flushPersistence();
      });

      expect(storage.writes).toBe(1);
      const editedPlanItem = mockStore?.getState().data.budgetPlan?.items.find((item) => item.id === itemId);
      const editedSnapshotItem = mockStore?.getState().data.monthBudgets?.[0]?.items.find((item) => item.id === itemId);
      if (field === 'name') {
        expect(editedPlanItem?.name).toBe('Rent');
        expect(editedSnapshotItem?.name).toBe('Housing');
      } else if (field === 'amount') {
        expect(editedPlanItem?.value).toBe(300);
        expect(editedSnapshotItem?.value).toBe(450);
      } else if (field === 'due day') {
        expect(editedPlanItem?.dueDay).toBeUndefined();
        expect(editedSnapshotItem?.dueDay).toBe(18);
      } else {
        expect(editedPlanItem?.frequency).toBe('monthly');
        expect(editedSnapshotItem?.frequency).toBe('quarterly');
      }
      expect(persistedData(storage).monthBudgets?.[0]?.items.find((item) => item.id === itemId))
        .toEqual(editedSnapshotItem);
      act(() => form.unmount());
    },
  );

  it.each(['monthly', 'once'])(
    'edits a %s Invest item through the real form and preserves its section',
    async (kind) => {
      const frequency = kind === 'once' ? 'once' : 'monthly';
      const plan = budgetPlanFromLines([{ category: 'Rent', value: 300, frequency, firstDueMonth: month }], {
        incomes: [], repeatMonthly: true, repeatFrom: month,
      });
      const investSection = plan.sections.find((section) => section.type === 'invest');
      if (!investSection) throw new Error('Invest section fixture is missing.');
      const investItem = { ...plan.items[0], id: itemId, name: 'Equity investments', sectionId: investSection.id };
      plan.items = [investItem];
      const snapshot = monthBudgetFromLines(month, [{ category: 'Equity investments', planned: 300, frequency, firstDueMonth: month }], {
        incomes: [], source: 'plan', sections: plan.sections,
      });
      snapshot.items = [investItem];
      baseline = { ...emptyAppData(today), budgetPlan: plan, monthBudgets: [snapshot] };
      mockRouteParams = { month, sectionId: investSection.id, itemId, scope: 'following' };
      mockStore?.setState({ data: baseline });
      await flushPersistence();
      storage.writes = 0;

      const form = renderScreen(React.createElement(BudgetItemFormScreen));
      changeAccessibleText(form, 'Planned amount', '475');
      expect(form.root.findAllByType('textinput').find((node) => node.props.accessibilityLabel === 'Planned amount')?.props.value).toBe('475');
      await act(async () => {
        form.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        form.root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
        await flushPersistence();
      });

      expect(storage.writes).toBe(1);
      expect(mockStore?.getState().data.budgetPlan?.items[0]).toMatchObject({
        sectionId: investSection.id,
        name: 'Equity investments',
        value: 475,
        frequency,
      });
      expect(mockStore?.getState().data.monthBudgets?.[0]?.items[0])
        .toMatchObject({ sectionId: investSection.id, value: 475, frequency });
      act(() => form.unmount());
    },
  );

  it('edits a one-time Spend item through the real form', async () => {
    const plan = budgetPlanFromLines([{ category: 'Rent', value: 300, frequency: 'once', firstDueMonth: month }], {
      incomes: [], repeatMonthly: true, repeatFrom: month,
    });
    plan.items[0].id = itemId;
    const snapshot = monthBudgetFromLines(month, [{ category: 'Rent', planned: 300, frequency: 'once', firstDueMonth: month }], {
      incomes: [], source: 'plan',
    });
    snapshot.items[0].id = itemId;
    baseline = { ...emptyAppData(today), budgetPlan: plan, monthBudgets: [snapshot] };
    mockRouteParams = { month, sectionId: 'survival', itemId, scope: 'following' };
    mockStore?.setState({ data: baseline });
    await flushPersistence();
    storage.writes = 0;

    const form = renderScreen(React.createElement(BudgetItemFormScreen));
    changeAccessibleText(form, 'Planned amount', '325');
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
    });
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
      await flushPersistence();
    });

    expect(mockStore?.getState().data.budgetPlan?.items[0]).toMatchObject({ frequency: 'once', value: 325 });
    expect(mockStore?.getState().data.monthBudgets?.[0]?.items[0]).toMatchObject({ frequency: 'once', value: 325 });
    expect(storage.writes).toBe(1);
    act(() => form.unmount());
  });

  it.each(['monthly', 'once'])(
    'edits a %s Income through the real income form',
    async (kind) => {
      const income: BudgetIncomeItem = {
        id: 'salary',
        name: 'Salary',
        category: 'Salary',
        amount: 1_000,
        day: 12,
        frequency: kind === 'once' ? 'once' : 'monthly',
        ...(kind === 'once' ? { firstDueMonth: month } : {}),
      };
      const plan = budgetPlanFromLines([{ category: 'Rent', value: 300 }], {
        incomes: [income], repeatMonthly: true, repeatFrom: month,
      });
      const snapshot = monthBudgetFromLines(month, [{ category: 'Rent', planned: 300 }], {
        incomes: [income], source: 'plan',
      });
      baseline = { ...emptyAppData(today), budgetPlan: plan, monthBudgets: [snapshot] };
      mockRouteParams = { month, incomeId: 'salary', scope: 'following' };
      mockStore?.setState({ data: baseline });
      await flushPersistence();
      storage.writes = 0;

      const form = renderScreen(React.createElement(BudgetIncomeFormScreen));
      changeAccessibleText(form, 'Income amount', '1250');
      await act(async () => {
        form.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        form.root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
        await flushPersistence();
      });

      expect(storage.writes).toBe(1);
      expect(mockStore?.getState().data.budgetPlan?.incomes.find((row) => row.id === 'salary'))
        .toMatchObject({ amount: 1250, frequency: income.frequency });
      expect(mockStore?.getState().data.monthBudgets?.[0]?.incomes.find((row) => row.id === 'salary'))
        .toMatchObject({ amount: 1250, frequency: income.frequency });
      act(() => form.unmount());
    },
  );

  it.each([
    { entry: 'Spend', kind: 'once', scope: 'month' },
    { entry: 'Spend', kind: 'once', scope: 'following' },
    { entry: 'Invest', kind: 'monthly', scope: 'month' },
    { entry: 'Invest', kind: 'monthly', scope: 'following' },
    { entry: 'Invest', kind: 'once', scope: 'month' },
    { entry: 'Invest', kind: 'once', scope: 'following' },
    { entry: 'Income', kind: 'monthly', scope: 'month' },
    { entry: 'Income', kind: 'monthly', scope: 'following' },
    { entry: 'Income', kind: 'once', scope: 'month' },
    { entry: 'Income', kind: 'once', scope: 'following' },
  ])('deletes a $kind $entry entry with $scope scope from its real form', async ({ entry, kind, scope }) => {
    const incomeFrequency = kind === 'once' ? 'once' : 'monthly';
    const selectedScope = scope === 'month' ? 'This month only' : 'This and following months';
    const deletingIncome = entry === 'Income';
    let entryName = 'Rent';
    if (deletingIncome) {
      const income: BudgetIncomeItem = {
        id: 'salary', name: 'Salary', category: 'Salary', amount: 1_000, day: 12,
        frequency: incomeFrequency,
        ...(kind === 'once' ? { firstDueMonth: month } : {}),
      };
      const plan = budgetPlanFromLines([{ category: 'Rent', value: 300 }], {
        incomes: [income], repeatMonthly: true, repeatFrom: month,
      });
      const snapshot = monthBudgetFromLines(month, [{ category: 'Rent', planned: 300 }], {
        incomes: [income], source: 'plan',
      });
      baseline = { ...emptyAppData(today), budgetPlan: plan, monthBudgets: [snapshot] };
      mockRouteParams = { month, incomeId: 'salary', scope };
      entryName = 'Salary';
    } else {
      const sectionId = entry === 'Invest' ? 'savings-investments' : 'survival';
      entryName = entry === 'Invest' ? 'Equity investments' : 'Rent';
      const plan = budgetPlanFromLines([{
        category: 'Rent', value: 300, frequency: incomeFrequency, firstDueMonth: month,
      }], { incomes: [], repeatMonthly: true, repeatFrom: month });
      const section = plan.sections.find((item) => item.id === sectionId);
      if (!section) throw new Error(`${entry} section fixture is missing.`);
      const item = { ...plan.items[0], id: itemId, sectionId, name: entryName };
      plan.items = [item];
      const snapshot = monthBudgetFromLines(month, [{
        category: entryName, planned: 300, frequency: incomeFrequency, firstDueMonth: month,
      }], { incomes: [], source: 'plan', sections: plan.sections });
      snapshot.items = [item];
      baseline = { ...emptyAppData(today), budgetPlan: plan, monthBudgets: [snapshot] };
      mockRouteParams = { month, sectionId, itemId, scope };
    }
    mockStore?.setState({ data: baseline });
    await flushPersistence();
    storage.writes = 0;

    const form = renderScreen(React.createElement(
      deletingIncome ? BudgetIncomeFormScreen : BudgetItemFormScreen,
    ));
    pressAccessibleControl(form, deletingIncome ? 'Delete income' : 'Delete item');
    pressAccessibleControl(form, selectedScope);
    await flushPersistence();

    expect(storage.writes).toBe(1);
    const savedData = mockStore?.getState().data;
    const savedPlanItem = savedData?.budgetPlan?.items.find((item) => item.id === itemId);
    const savedSnapshotItem = savedData?.monthBudgets?.[0]?.items.find((item) => item.id === itemId);
    const savedPlanIncome = savedData?.budgetPlan?.incomes.find((income) => income.id === 'salary');
    const savedSnapshotIncome = savedData?.monthBudgets?.[0]?.incomes.find((income) => income.id === 'salary');
    if (deletingIncome) {
      expect(savedPlanIncome !== undefined).toBe(scope === 'month');
      expect(savedSnapshotIncome).toBeUndefined();
      const stored = persistedData(storage);
      expect(stored.budgetPlan?.incomes.some((income) => income.id === 'salary')).toBe(scope === 'month');
      expect(stored.monthBudgets?.[0]?.incomes.some((income) => income.id === 'salary')).toBe(false);
    } else {
      expect(savedPlanItem !== undefined).toBe(scope === 'month');
      expect(savedSnapshotItem).toBeUndefined();
      const stored = persistedData(storage);
      expect(stored.budgetPlan?.items.some((item) => item.id === itemId)).toBe(scope === 'month');
      expect(stored.monthBudgets?.[0]?.items.some((item) => item.id === itemId)).toBe(false);
    }
    const freshStore = makeStore();
    await waitForHydration(freshStore);
    if (deletingIncome) {
      expect(freshStore.getState().data.budgetPlan?.incomes.some((income) => income.id === 'salary'))
        .toBe(scope === 'month');
    } else {
      expect(freshStore.getState().data.budgetPlan?.items.some((item) => item.id === itemId))
        .toBe(scope === 'month');
    }
    act(() => form.unmount());
    const budget = renderScreen(React.createElement(BudgetScreen));
    expect(visibleText(budget)).not.toContain(entryName);
    act(() => budget.unmount());
  });

  it('round-trips an edit while viewing a non-current virtual month', async () => {
    const viewedMonth = shiftMonth(month, 1);
    mockRouteParams = { month: viewedMonth, sectionId: 'survival', itemId, scope: 'following' };
    useUIStore.getState().setTxMonth(viewedMonth);
    storage.writes = 0;
    const form = renderScreen(React.createElement(BudgetItemFormScreen));
    changeAccessibleText(form, 'Planned amount', '525');
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
    });
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
      await flushPersistence();
    });

    expect(storage.writes).toBe(1);
    expect(mockStore?.getState().data.budgetPlan?.items.find((item) => item.id === itemId)?.value).toBe(525);
    expect(mockStore?.getState().data.monthBudgets?.find((row) => row.month === month)?.items[0]?.value).toBe(300);
    expect(mockStore?.getState().data.monthBudgets?.some((row) => row.month === viewedMonth)).toBe(false);
    const freshStore = makeStore();
    await waitForHydration(freshStore);
    expect(freshStore.getState().data.budgetPlan?.items.find((item) => item.id === itemId)?.value).toBe(525);
    act(() => form.unmount());
  });

  it('round-trips a form edit after restoring a plain backup', async () => {
    const plan = budgetPlanFromLines([{ category: 'Rent', value: 300, firstDueMonth: month }], {
      incomes: [], repeatMonthly: true, repeatFrom: month,
    });
    plan.items[0].id = itemId;
    const snapshot = monthBudgetFromLines(month, [{ category: 'Rent', planned: 300, firstDueMonth: month }], {
      incomes: [], source: 'plan',
    });
    snapshot.items[0].id = itemId;
    baseline = { ...emptyAppData(today), budgetPlan: plan, monthBudgets: [snapshot] };
    const backup = await createBackup(baseline, {
      exportedAt: '2026-11-21T00:00:00.000Z', digest: sha256,
    });
    const parsed = await parseBackup(backup, { digest: sha256, today, newId: () => 'restore-id' });
    if (!parsed.ok) throw new Error(`${parsed.reason}: ${parsed.message}`);
    const store = mockStore;
    if (!store) throw new Error('Budget roundtrip store is missing.');
    const restored = await store.getState().actions.replaceAllData(parsed.data);
    if (!restored.ok) throw new Error(restored.message);
    mockRouteParams = { month, sectionId: 'survival', itemId, scope: 'following' };
    useUIStore.getState().setTxMonth(month);
    storage.writes = 0;

    const form = renderScreen(React.createElement(BudgetItemFormScreen));
    changeAccessibleText(form, 'Planned amount', '425');
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
    });
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
      await flushPersistence();
    });

    expect(storage.writes).toBe(1);
    expect(mockStore?.getState().data.budgetPlan?.items.find((item) => item.id === itemId)?.value).toBe(425);
    expect(persistedData(storage).budgetPlan?.items.find((item) => item.id === itemId)?.value).toBe(425);
    act(() => form.unmount());
  });

  it('round-trips a form edit after loading demo data', async () => {
    const demoData = buildDemoData(today);
    const demoItem = demoData.budgetPlan?.items.find((item) => !item.holdingId && item.mode === 'amount');
    if (!demoItem || !demoData.budgetPlan) throw new Error('Demo Budget item fixture is missing.');
    const store = mockStore;
    if (!store) throw new Error('Budget roundtrip store is missing.');
    const loaded = await store.getState().actions.replaceAllData(demoData);
    if (!loaded.ok) throw new Error(loaded.message);
    mockRouteParams = {
      month, sectionId: demoItem.sectionId, itemId: demoItem.id, scope: 'following',
    };
    useUIStore.getState().setTxMonth(month);
    storage.writes = 0;
    const nextValue = demoItem.value + 25;

    const form = renderScreen(React.createElement(BudgetItemFormScreen));
    changeAccessibleText(form, 'Planned amount', String(nextValue));
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
    });
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
      await flushPersistence();
    });

    expect(storage.writes).toBe(1);
    expect(mockStore?.getState().data.budgetPlan?.items.find((item) => item.id === demoItem.id)?.value).toBe(nextValue);
    expect(persistedData(storage).budgetPlan?.items.find((item) => item.id === demoItem.id)?.value).toBe(nextValue);
    act(() => form.unmount());
  });

  it('keeps both writes when an edit is followed immediately by navigation and another edit', async () => {
    const form = renderScreen(React.createElement(BudgetItemFormScreen));
    const router = jest.requireMock('expo-router').router;
    router.back.mockClear();
    storage.writes = 0;
    changeAccessibleText(form, 'Planned amount', '450');
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
    });
    await act(async () => {
      form.root.findByProps({ accessibilityLabel: 'This and following months' }).props.onPress();
    });
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(storage.writes).toBe(1);

    act(() => {
      mockStore?.getState().actions.editBudgetStructureItem(
        month, itemId, { value: 500 }, 'following', today,
      );
    });

    expect(storage.writes).toBe(2);
    expect(mockStore?.getState().data.budgetPlan?.items[0]?.value).toBe(500);
    expect(persistedData(storage).budgetPlan?.items[0]?.value).toBe(500);
    const freshStore = makeStore();
    await waitForHydration(freshStore);
    expect(freshStore.getState().data.budgetPlan?.items[0]?.value).toBe(500);
    expect(freshStore.getState().data.monthBudgets?.[0]?.items[0]?.value).toBe(500);
    act(() => form.unmount());
  });

  it('deletes the selected ID after a store update while the form remains mounted', async () => {
    const form = renderScreen(React.createElement(BudgetItemFormScreen));
    storage.writes = 0;
    act(() => {
      mockStore?.getState().actions.addBudgetItem(month, {
        sectionId: 'survival', name: 'Utilities', mode: 'amount', value: 125,
      }, 'month', today);
    });
    expect(storage.writes).toBe(1);
    expect(mockStore?.getState().data.monthBudgets?.[0]?.items.some((item) => item.name === 'Utilities')).toBe(true);
    storage.writes = 0;

    pressAccessibleControl(form, 'Delete item');
    pressAccessibleControl(form, 'This month only');
    await flushPersistence();

    expect(storage.writes).toBe(1);
    expect(mockStore?.getState().data.monthBudgets?.[0]?.items.some((item) => item.id === itemId)).toBe(false);
    expect(mockStore?.getState().data.monthBudgets?.[0]?.items.some((item) => item.name === 'Utilities')).toBe(true);
    const stored = persistedData(storage);
    expect(stored.monthBudgets?.[0]?.items.some((item) => item.name === 'Utilities')).toBe(true);
    act(() => form.unmount());
  });

});
