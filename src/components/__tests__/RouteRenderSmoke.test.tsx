import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import AssetsScreen from '../../../app/assets';
import BackupScreen from '../../../app/backup';
import BudgetScreen from '../../../app/(tabs)/budget';
import BudgetHistoryScreen from '../../../app/budget-history';
import BudgetMonthFormScreen from '../../../app/budget-month-form';
import BudgetTemplateFormScreen from '../../../app/budget-template-form';
import BudgetTemplatesScreen from '../../../app/budget-templates';
import ClearDuesScreen from '../../../app/clear-dues';
import EfAllocationFormScreen from '../../../app/ef-allocation-form';
import EfEntryFormScreen from '../../../app/ef-entry-form';
import EmergencyFundScreen from '../../../app/emergency-fund';
import EraseDataScreen from '../../../app/erase-data';
import GoalFormScreen from '../../../app/goal-form';
import GoalsScreen from '../../../app/(tabs)/goals';
import HomeScreen from '../../../app/(tabs)';
import InvestmentEntryFormScreen from '../../../app/investment-entry-form';
import InvestmentEntriesScreen from '../../../app/investment-entries';
import InvestmentFormScreen from '../../../app/investment-form';
import LiabilitiesScreen from '../../../app/liabilities';
import LiabilityFormScreen from '../../../app/liability-form';
import LiabilityPaymentsScreen from '../../../app/liability-payments';
import LiabilityPaymentFormScreen from '../../../app/liability-payment-form';
import LinkMissingScreen from '../../../app/link-missing';
import MonthReviewScreen from '../../../app/month-review';
import OnboardingScreen from '../../../app/onboarding';
import ProfileFormScreen from '../../../app/profile-form';
import SecurityScreen from '../../../app/security';
import ThemeScreen from '../../../app/theme';
import TransactionFormScreen from '../../../app/transaction-form';
import TransactionsScreen from '../../../app/(tabs)/transactions';
import { assertNoVerbText } from '../testUtils/assertNoVerbText';
import { monthKey, shiftMonth } from '../../domain/dates';
import { emptyAppData } from '../../domain/actions';
import type { ManualHolding, OneTimeLiability, PlanHolding, Transaction } from '../../domain/types';
import { useUIStore } from '../../data/uiStore';
import { useAppStore } from '../../data/store';
import { formatMonth } from '../../lib/format';
import { todayISO } from '../../lib/clock';

let mockFontScale = 1;

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async () => 'digest'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: true })),
}));

jest.mock('expo-file-system', () => ({
  File: class {
    uri: string;
    exists: boolean;
    constructor(uri = '') { this.uri = uri; this.exists = false; }
    create() { this.exists = true; }
    write() { return undefined; }
    delete() { this.exists = false; }
    async text() { return ''; }
  },
  Paths: { cache: '' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => false),
  shareAsync: jest.fn(async () => undefined),
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    SafeAreaView: ({ children }: { children?: React.ReactNode }) => ReactModule.createElement('view', null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  authenticateAsync: jest.fn(async () => ({ success: true })),
}));

jest.mock('../../components/SecurityProvider', () => ({
  useSecuritySettings: () => ({ settings: { enabled: false, hidePreviews: false, graceMs: 30_000 }, update: jest.fn() }),
}));

jest.mock('../../lib/authenticate', () => ({
  createAuthenticator: () => ({
    getCapability: jest.fn(async () => 'ready'),
    authenticate: jest.fn(async () => ({ ok: true })),
  }),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('../../data/store', () => {
  const mockState = {
    data: {
      settings: { name: 'Demo', theme: 'system', monthlySalary: 40000, onboarded: true },
      transactions: [],
      goals: [],
      holdings: [],
      liabilities: [],
      policies: [],
      efEntries: [],
    },
    lastError: null,
    undoImport: null,
    actions: {
      replaceAllData: jest.fn(async () => ({ ok: true })),
      undoImport: jest.fn(async () => ({ ok: true })),
      addGoal: jest.fn(),
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
      addTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      deleteTransaction: jest.fn(),
      recordMoneyMovement: jest.fn(),
      addPlan: jest.fn(),
      addPlanWithHistory: jest.fn(),
      updatePlan: jest.fn(),
      deletePlan: jest.fn(),
      fundShortfall: jest.fn(),
      allocateSurplus: jest.fn(),
      addEfEntry: jest.fn(),
      updateEfEntry: jest.fn(),
      deleteEfEntry: jest.fn(),
      addLiability: jest.fn(),
      updateLiability: jest.fn(),
      deleteLiability: jest.fn(),
      addLiabilityPayment: jest.fn(),
      updateLiabilityPayment: jest.fn(),
      deleteLiabilityPayment: jest.fn(),
      addHolding: jest.fn(),
      updateHolding: jest.fn(),
      deleteHolding: jest.fn(),
      addInvestmentEntry: jest.fn(),
      updateInvestmentEntry: jest.fn(),
      deleteInvestmentEntry: jest.fn(),
      completeOnboarding: jest.fn(),
      updateSettings: jest.fn(),
    },
  };

  const useAppStore = Object.assign(
    (selector: (state: typeof mockState) => unknown) => selector(mockState),
    { getState: () => mockState },
  );
  return {
    useAppStore,
    metaStore: {
      getMeta: async () => ({}),
      updateSortSpec: async () => ({}),
    },
  };
});

jest.mock('../../data/useAppData', () => {
  const mockData = {
    settings: { name: 'Demo', theme: 'system', monthlySalary: 40000, onboarded: true },
    transactions: [],
    goals: [],
    holdings: [],
    liabilities: [],
    policies: [],
    efEntries: [],
  };
  const mockStoreState = {
    data: mockData,
    lastError: null,
    undoImport: null,
    actions: {
      replaceAllData: jest.fn(async () => ({ ok: true })),
      undoImport: jest.fn(async () => ({ ok: true })),
      addGoal: jest.fn(),
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
      addTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      deleteTransaction: jest.fn(),
      recordMoneyMovement: jest.fn(),
      addPlan: jest.fn(),
      addPlanWithHistory: jest.fn(),
      updatePlan: jest.fn(),
      deletePlan: jest.fn(),
      fundShortfall: jest.fn(),
      allocateSurplus: jest.fn(),
      addEfEntry: jest.fn(),
      updateEfEntry: jest.fn(),
      deleteEfEntry: jest.fn(),
      addLiability: jest.fn(),
      updateLiability: jest.fn(),
      deleteLiability: jest.fn(),
      addLiabilityPayment: jest.fn(),
      updateLiabilityPayment: jest.fn(),
      deleteLiabilityPayment: jest.fn(),
      addHolding: jest.fn(),
      updateHolding: jest.fn(),
      deleteHolding: jest.fn(),
      addInvestmentEntry: jest.fn(),
      updateInvestmentEntry: jest.fn(),
      deleteInvestmentEntry: jest.fn(),
      completeOnboarding: jest.fn(),
      updateSettings: jest.fn(),
    },
  };

  return {
    useAppData: () => mockData,
    useAppActions: () => mockStoreState.actions,
  };
});

jest.mock('../../components/AppHeader', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    AppHeader: ({
      title,
      rightActions,
      menu,
    }: {
      title: string;
      rightActions?: { label: string; onPress: () => void }[];
      menu?: { label: string; onPress: () => void }[];
    }) => {
      const [menuOpen, setMenuOpen] = ReactModule.useState(false);
      return ReactModule.createElement('header', null,
        ReactModule.createElement('text', null, title),
        ...(rightActions ?? []).map((action) => ReactModule.createElement('button', {
          key: action.label,
          accessibilityLabel: action.label,
          onPress: action.onPress,
        }, action.label)),
        ...(menu ? [
          ReactModule.createElement('button', {
            key: 'more-options',
            accessibilityLabel: 'More options',
            onPress: () => setMenuOpen(true),
          }, 'More options'),
          ...(menuOpen ? menu.map((item) => ReactModule.createElement('button', {
            key: item.label,
            accessibilityLabel: item.label,
            onPress: item.onPress,
          }, item.label)) : []),
        ] : []),
      );
    },
  };
});

jest.mock('../../components/ScreenErrorBoundary', () => ({
  ScreenErrorBoundary: () => null,
}));

jest.mock('../../components/BrandMark', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return { BrandMark: () => ReactModule.createElement('brandmark') };
});

jest.mock('../../components/ui', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  const Button = ({ label, ...props }: { label: string; [key: string]: unknown }) =>
    ReactModule.createElement('button', { ...props, accessibilityLabel: label }, label);
  const Chip = ({ label, ...props }: { label: string; [key: string]: unknown }) =>
    ReactModule.createElement('chip', { ...props, accessibilityLabel: label }, label);
  return {
    AppText: node('text'),
    Button,
    Card: node('card'),
    Chip,
    ChipRow: node('chiprow'),
    DetailTabBar: node('detailtabbar'),
    EmptyState: node('empty'),
    ProgressBar: node('progress'),
    Screen: node('screen'),
    SectionTitle: node('section'),
    StatPill: node('pill'),
    StatPillRow: node('pillrow'),
    StatusBadge: node('badge'),
    ListItem: node('listitem'),
    WarningBanner: node('warning'),
    ActionRow: node('actionrow'),
    SearchField: node('searchfield'),
  };
});

jest.mock('../../components/form/FormScreen', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    FormScreen: ({ title, children, footer, onClose, isDirty }: {
      title: string;
      children?: React.ReactNode;
      footer?: React.ReactNode;
      onClose: () => void;
      isDirty?: boolean;
    }) =>
      ReactModule.createElement(
        'screen',
        null,
        ReactModule.createElement('button', {
          accessibilityRole: 'button',
          accessibilityLabel: 'Close',
          onPress: onClose,
          isDirty,
        }),
        ReactModule.createElement('text', null, title),
        children,
        footer,
      ),
  };
});

jest.mock('../../components/form/ChoiceField', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    ChoiceField: ({ label, choices }: { label: string; choices: readonly string[] }) =>
      ReactModule.createElement('text', null, `${label}: ${choices.join(', ')}`),
  };
});

jest.mock('../../components/form/SwitchRow', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    SwitchRow: ({ label }: { label: string }) => ReactModule.createElement('text', null, label),
  };
});

jest.mock('../../components/form/TextField', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    TextField: ({ label, ...props }: { label: string; [key: string]: unknown }) =>
      ReactModule.createElement('textfield', { ...props, label }, label),
  };
});

jest.mock('../../components/form/MoneyField', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    MoneyField: ({ label = 'Amount', accessibilityLabel, ...props }: {
      label?: string;
      accessibilityLabel?: string;
      [key: string]: unknown;
    }) => ReactModule.createElement('moneyfield', {
      ...props,
      label,
      accessibilityLabel: accessibilityLabel ?? `${label} in rupees`,
    }, label),
  };
});

jest.mock('../../components/form/DateField', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    DateField: ({ label, accessibilityLabel, accessibilityHint, ...props }: {
      label: string;
      accessibilityLabel?: string;
      accessibilityHint?: string;
      [key: string]: unknown;
    }) => ReactModule.createElement('datefield', { ...props, accessibilityLabel, accessibilityHint }, label),
  };
});

jest.mock('../../components/form/SegmentedControl', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    SegmentedControl: ({ label, ...props }: { label: string; [key: string]: unknown }) =>
      ReactModule.createElement('segmentedcontrol', { ...props, label }, label),
  };
});

jest.mock('../../components/form/ReadOnlyRow', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    ReadOnlyRow: ({ label, value }: { label: string; value: string }) =>
      ReactModule.createElement('text', null, `${label}: ${value}`),
  };
});

jest.mock('../../components/form/FormErrorBanner', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    FormErrorBanner: ({ message }: { message?: string }) => ReactModule.createElement('text', null, message),
  };
});

jest.mock('../../lib/confirm', () => ({
  choiceAsync: async () => null,
  confirmAsync: async () => true,
}));

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => {
    const { themes } = jest.requireActual('../../theme/themes');
    return { colors: themes.light.colors, themeId: 'light', resolvedId: 'light', isDark: false, statusBar: 'dark' };
  },
}));

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  const FlatList = ({ ListHeaderComponent, ...props }: {
    ListHeaderComponent?: React.ComponentType;
    [key: string]: unknown;
  }) => ReactModule.createElement(
    'flatlist',
    props,
    ListHeaderComponent ? ReactModule.createElement(ListHeaderComponent) : null,
  );
  return {
    Alert: { alert: jest.fn() },
    BackHandler: { addEventListener: () => ({ remove: jest.fn() }), exitApp: jest.fn() },
    FlatList,
    KeyboardAvoidingView: node('keyboard-avoiding-view'),
    Modal: node('modal'),
    Platform: { OS: 'ios' },
    PanResponder: { create: (handlers: object) => ({ panHandlers: handlers }) },
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    StyleSheet: { create: (styles: object) => styles },
    Switch: node('switch'),
    Text: node('text'),
    TextInput: node('textinput'),
    TouchableOpacity: node('touchableopacity'),
    View: node('view'),
    useWindowDimensions: () => ({ fontScale: mockFontScale, width: 390, height: 844, scale: 1, }),
  };
});

function renderScreen(screen: React.ReactElement) {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    renderer = TestRenderer.create(screen);
  });
  if (!renderer) throw new Error('Route did not render.');
  return renderer;
}

function makeInvestmentTestPlan(): PlanHolding {
  const today = todayISO();
  return {
    id: 'investment-plan-test',
    kind: 'plan',
    name: 'Test plan',
    type: 'Mutual fund / SIP',
    frequency: 'monthly',
    amount: 1_000,
    ratePct: 12,
    stepUpPct: 0,
    tenureYears: 10,
    startDate: today,
    trackFrom: today,
    opening: 0,
    actualValue: null,
    actualValueDate: null,
    logs: [],
  };
}

describe('route render smoke audit', () => {
  const screens: [string, React.ReactElement][] = [
    ['Security', React.createElement(SecurityScreen)],
    ['Home', React.createElement(HomeScreen)],
    ['Budget', React.createElement(BudgetScreen)],
    ['Budget templates', React.createElement(BudgetTemplatesScreen)],
    ['Budget template form', React.createElement(BudgetTemplateFormScreen)],
    ['Budget month form', React.createElement(BudgetMonthFormScreen)],
    ['Budget history', React.createElement(BudgetHistoryScreen)],
    ['Goals', React.createElement(GoalsScreen)],
    ['Transactions', React.createElement(TransactionsScreen)],
    ['Month review empty state', React.createElement(MonthReviewScreen)],
    ['Backup', React.createElement(BackupScreen)],
    ['Clear past dues', React.createElement(ClearDuesScreen)],
    ['Assets', React.createElement(AssetsScreen)],
    ['Emergency fund', React.createElement(EmergencyFundScreen)],
    ['Emergency fund allocation form', React.createElement(EfAllocationFormScreen)],
    ['Emergency fund entry form', React.createElement(EfEntryFormScreen)],
    ['Erase data', React.createElement(EraseDataScreen)],
    ['Theme', React.createElement(ThemeScreen)],
    ['Link missing', React.createElement(LinkMissingScreen)],
    ['Onboarding', React.createElement(OnboardingScreen)],
    ['Profile form', React.createElement(ProfileFormScreen)],
    ['Goal form create', React.createElement(GoalFormScreen)],
    ['Goal form edit', React.createElement(GoalFormScreen)],
    ['Transaction form create', React.createElement(TransactionFormScreen)],
    ['Transaction form edit', React.createElement(TransactionFormScreen)],
    ['Liability form create', React.createElement(LiabilityFormScreen)],
    ['Liability form edit', React.createElement(LiabilityFormScreen)],
    ['Liability payment form create', React.createElement(LiabilityPaymentFormScreen)],
    ['Liability payment form edit', React.createElement(LiabilityPaymentFormScreen)],
    ['Liabilities', React.createElement(LiabilitiesScreen)],
    ['Liability payments', React.createElement(LiabilityPaymentsScreen)],
    ['Investment entries', React.createElement(InvestmentEntriesScreen)],
    ['Investment form create', React.createElement(InvestmentFormScreen)],
    ['Investment form edit', React.createElement(InvestmentFormScreen)],
    ['Investment entry form create', React.createElement(InvestmentEntryFormScreen)],
    ['Investment entry form edit', React.createElement(InvestmentEntryFormScreen)],
    ['Emergency fund entry form create', React.createElement(EfEntryFormScreen)],
    ['Emergency fund entry form edit', React.createElement(EfEntryFormScreen)],
  ];

  it.each(screens)('%s renders without verb text', async (name, screen) => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(screen);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Route did not render.');
    assertNoVerbText(renderer.root, { screen: name === 'Home' ? 'home' : undefined });
  });

  it('announces exact large amounts in screen-level accessibility labels', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as ReturnType<typeof emptyAppData>;
    const previousRouteData = { ...routeData };
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const data = {
      ...emptyAppData(todayISO()),
      transactions: [
        { id: 'large-income', type: 'income' as const, amount: 123_456_789, category: 'Salary', note: 'Salary', date: '2026-10-10' },
        { id: 'large-expense', type: 'expense' as const, amount: 12_345_678, category: 'Food', note: 'Food', date: '2026-10-11' },
        { id: 'prior-expense', type: 'expense' as const, amount: 12_345_678, category: 'Food', note: 'Food', date: '2026-09-11' },
      ],
      goals: [{
        id: 'large-goal',
        name: 'Large goal',
        target: 123_456_789,
        saved: 12_345_678,
        year: 2030,
        links: [],
      }],
      holdings: [{
        id: 'large-holding',
        kind: 'manual' as const,
        name: 'Large holding',
        type: 'Savings account' as const,
        invested: 123_456_789,
        value: 246_913_578,
        valueAsOf: '2026-10-10',
        logs: [],
      }, {
        id: 'second-large-holding',
        kind: 'manual' as const,
        name: 'Second large holding',
        type: 'Cash' as const,
        invested: 12_345_678,
        value: 12_345_678,
        valueAsOf: '2026-10-10',
        logs: [],
      }],
      liabilities: [{
        id: 'large-liability',
        kind: 'one-time' as const,
        name: 'Large liability',
        type: 'Borrowed money' as const,
        principal: 123_456_789,
        ratePct: 0,
        startDate: '2026-09-01',
        dueDate: '2026-12-01',
        payments: [],
      }, {
        id: 'large-recurring-liability',
        kind: 'recurring' as const,
        name: 'Large recurring liability',
        type: 'Other' as const,
        principal: 123_456_789,
        ratePct: 0,
        startDate: '2026-09-01',
        tenureMonths: 12,
        emi: 12_345_678,
        settlement: null,
        payments: [],
      }],
      budget: {
        plannedIncome: 123_456_789,
        lines: [{ category: 'Food', planned: 123_456_789 }],
      },
      monthBudgets: [{
        month: '2026-10',
        templateId: null,
        templateName: null,
        customized: false,
        plannedIncome: 123_456_789,
        lines: [{ category: 'Food', planned: 123_456_789 }],
      }],
      efEntries: [{ id: 'large-ef', date: '2026-10-01', amount: 123_456_789, note: 'Large balance' }],
    };
    Object.assign(routeData, data);
    store.data = data;

    const labelsFor = (screen: React.ReactElement): string[] => {
      const renderer = renderScreen(screen);
      const labels = renderer.root.findAll((node) => typeof node.props.accessibilityLabel === 'string')
        .map((node) => node.props.accessibilityLabel)
        .filter((label): label is string => typeof label === 'string');
      act(() => renderer.unmount());
      return labels;
    };
    const exactA = '₹12,34,56,789';
    const exactB = '₹1,23,45,678';

    try {
      expect(labelsFor(React.createElement(HomeScreen)).some((label) =>
        label.includes(`target ${exactA}`) && label.includes(`saved ${exactB}`),
      )).toBe(true);
      const assetsLabels = labelsFor(React.createElement(AssetsScreen));
      expect(assetsLabels.some((label) => label.startsWith(`Gain ${exactA}`))).toBe(true);
      expect(assetsLabels).toContain(`Cash, invested ${exactB}`);
      expect(labelsFor(React.createElement(LiabilitiesScreen))).toEqual(expect.arrayContaining([
        exactA,
        `Monthly EMI, ${exactB}`,
      ]));
      expect(labelsFor(React.createElement(EmergencyFundScreen))).toEqual(expect.arrayContaining([
        exactA,
        expect.stringContaining(`Based on an average of ${exactB} monthly expenses`),
      ]));
      expect(labelsFor(React.createElement(GoalsScreen)).some((label) =>
        label.includes(`target ${exactA}`) && label.includes(`saved ${exactB}`),
      )).toBe(true);
      expect(labelsFor(React.createElement(BudgetScreen)).some((label) =>
        label.includes(`${exactB} of ${exactA}`),
      )).toBe(true);
      expect(labelsFor(React.createElement(TransactionsScreen))).toEqual(expect.arrayContaining([
        `Income, ${exactA}`,
        `Expense, ${exactB}`,
      ]));
    } finally {
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
    }
  });

  const formScreens = screens.filter(([name]) =>
    /form|month review|money movement invalid|clear past dues/i.test(name),
  );

  it.each(formScreens)('%s exposes Close and receives its dirty state', async (_name, screen) => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(screen);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Form route did not render.');
    const close = renderer.root.findByProps({ accessibilityLabel: 'Close' });
    expect(close.props.accessibilityRole).toBe('button');
    expect(close.props.onPress).toEqual(expect.any(Function));
    expect(typeof close.props.isDirty).toBe('boolean');
    act(() => renderer?.unmount());
  });

  it.each([
    {
      direction: 'EMI from rate and tenure',
      fields: { 'Annual interest rate': '10', 'Liability tenure in months': '12' },
      calculated: 'Calculated EMI: ₹87,916',
      saved: { ratePct: 10, tenureMonths: 12, emi: 87_915.89 },
    },
    {
      direction: 'rate from EMI and tenure',
      fields: { 'Liability tenure in months': '12', 'Liability EMI': '87915.89' },
      calculated: 'Calculated annual interest rate: 10.00%',
      saved: { ratePct: 10, tenureMonths: 12, emi: 87_915.89 },
    },
    {
      direction: 'tenure from rate and EMI',
      fields: { 'Annual interest rate': '10', 'Liability EMI': '87915.89' },
      calculated: 'Calculated tenure: 12 months',
      saved: { ratePct: 10, tenureMonths: 12, emi: 87_915.89 },
    },
  ])('shows and saves calculated liability values for $direction', async ({ fields, calculated, saved }) => {
    const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
      addLiability: jest.Mock;
    };
    actions.addLiability.mockClear();
    const renderer = renderScreen(React.createElement(LiabilityFormScreen));
    try {
      await act(async () => {
        renderer.root.findByProps({ accessibilityLabel: 'Liability name' }).props.onChangeText('Test loan');
        renderer.root.findByProps({ accessibilityLabel: 'Liability principal' }).props.onChangeText('1000000');
        for (const [label, value] of Object.entries(fields)) {
          renderer.root.findByProps({ accessibilityLabel: label }).props.onChangeText(value);
        }
        await Promise.resolve();
      });
      const textContent = renderer.root.findAllByType('text')
        .flatMap((node) => node.children.map(String));
      expect(textContent).toContain(calculated);
      act(() => renderer.root.findByProps({
        accessibilityLabel: 'I received this money in my account',
      }).props.onValueChange(false));
      const save = renderer.root.findByProps({ accessibilityLabel: 'Save' });
      await act(async () => {
        save.props.onPress();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(actions.addLiability).toHaveBeenCalledWith(expect.objectContaining(saved));
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('sets zero interest from the chip and calculates the EMI', async () => {
    const renderer = renderScreen(React.createElement(LiabilityFormScreen));
    try {
      await act(async () => {
        renderer.root.findByProps({ accessibilityLabel: 'Liability principal' }).props.onChangeText('12000');
        renderer.root.findByProps({ accessibilityLabel: 'Liability tenure in months' }).props.onChangeText('12');
        renderer.root.findByProps({ accessibilityLabel: 'No interest' }).props.onPress();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(renderer.root.findByProps({ accessibilityLabel: 'Annual interest rate' }).props.value).toBe('0');
      expect(renderer.root.findAllByType('text')
        .flatMap((node) => node.children.map(String))).toContain('Calculated EMI: ₹1,000');
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('defaults received funds on and auto-disables historical starts until the switch is touched', async () => {
    const renderer = renderScreen(React.createElement(LiabilityFormScreen));
    try {
      const receivedSwitch = () => renderer.root.findByProps({
        accessibilityLabel: 'I received this money in my account',
      });
      const historicalStart = `${shiftMonth(monthKey(todayISO()), -1)}-01`;
      expect(receivedSwitch().props.value).toBe(true);
      await act(async () => {
        renderer.root.findByProps({ accessibilityLabel: 'Liability start date' }).props.onChange(historicalStart);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(receivedSwitch().props.value).toBe(false);
      expect(renderer.root.findAllByType('text')
        .flatMap((node) => node.children.map(String))).toContain(
        "This loan started before this month, so we left this off to avoid changing that month's balance",
      );
      act(() => receivedSwitch().props.onValueChange(true));
      expect(receivedSwitch().props.value).toBe(true);
      expect(renderer.root.findAllByType('text')
        .flatMap((node) => node.children.map(String))).not.toContain(
        "This loan started before this month, so we left this off to avoid changing that month's balance",
      );
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('saves a new received liability through the shared origin-transaction action', async () => {
    const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
      recordMoneyMovement: jest.Mock;
      addLiability: jest.Mock;
    };
    actions.recordMoneyMovement.mockClear();
    actions.addLiability.mockClear();
    const renderer = renderScreen(React.createElement(LiabilityFormScreen));
    try {
      await act(async () => {
        renderer.root.findByProps({ accessibilityLabel: 'Liability name' }).props.onChangeText('Received loan');
        renderer.root.findByProps({ accessibilityLabel: 'Liability principal' }).props.onChangeText('1000000');
        renderer.root.findByProps({ accessibilityLabel: 'Annual interest rate' }).props.onChangeText('10');
        renderer.root.findByProps({ accessibilityLabel: 'Liability tenure in months' }).props.onChangeText('12');
        await Promise.resolve();
      });
      const save = renderer.root.findByProps({ accessibilityLabel: 'Save' });
      await act(async () => {
        save.props.onPress();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(actions.recordMoneyMovement).toHaveBeenCalledWith(expect.objectContaining({
        kind: 'loan-received',
        amount: 1_000_000,
        date: todayISO(),
        liability: expect.objectContaining({
          kind: 'recurring',
          principal: 1_000_000,
          ratePct: 10,
          tenureMonths: 12,
          emi: 87_915.89,
        }),
      }));
      expect(actions.addLiability).not.toHaveBeenCalled();
    } finally {
      act(() => renderer.unmount());
    }
  });

  it('shows the non-blocking EMI mismatch and applies its calculated value', async () => {
    const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
      addLiability: jest.Mock;
    };
    actions.addLiability.mockClear();
    const renderer = renderScreen(React.createElement(LiabilityFormScreen));
    try {
      await act(async () => {
        renderer.root.findByProps({ accessibilityLabel: 'Liability name' }).props.onChangeText('Test loan');
        renderer.root.findByProps({ accessibilityLabel: 'Liability principal' }).props.onChangeText('1000000');
        renderer.root.findByProps({ accessibilityLabel: 'Annual interest rate' }).props.onChangeText('10');
        renderer.root.findByProps({ accessibilityLabel: 'Liability tenure in months' }).props.onChangeText('12');
        renderer.root.findByProps({ accessibilityLabel: 'Liability EMI' }).props.onChangeText('90000');
        await Promise.resolve();
      });
      const warningText = renderer.root.findAllByType('text')
        .flatMap((node) => node.children.map(String));
      expect(warningText).toContain('These do not match: the EMI for this rate and tenure would be ');
      expect(warningText).toContain('₹87,916');
      act(() => renderer.root.findByProps({
        accessibilityLabel: 'I received this money in my account',
      }).props.onValueChange(false));
      const save = renderer.root.findByProps({ accessibilityLabel: 'Save' });
      await act(async () => {
        save.props.onPress();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(actions.addLiability).toHaveBeenCalledWith(expect.objectContaining({ emi: 90_000 }));
      actions.addLiability.mockClear();
      act(() => renderer.root.findByProps({ accessibilityLabel: 'Use calculated EMI' }).props.onPress());
      expect(renderer.root.findByProps({ accessibilityLabel: 'Liability EMI' }).props.value).toBe('87915.89');
      await act(async () => {
        save.props.onPress();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(actions.addLiability).toHaveBeenCalledWith(expect.objectContaining({ emi: 87_915.89 }));
    } finally {
      act(() => renderer.unmount());
    }
  });

  it.each([
    ['Transactions', () => React.createElement(TransactionsScreen)],
    ['Budget spending', () => React.createElement(BudgetScreen)],
    ['Budget history', () => React.createElement(BudgetHistoryScreen)],
    ['Goals', () => React.createElement(GoalsScreen)],
    ['Assets', () => React.createElement(AssetsScreen)],
    ['Liabilities', () => React.createElement(LiabilitiesScreen)],
    ['Emergency fund passbook', () => React.createElement(EmergencyFundScreen)],
    ['Investment entries', () => React.createElement(InvestmentEntriesScreen)],
    ['Liability payments', () => React.createElement(LiabilityPaymentsScreen)],
    ['Link missing transactions', () => React.createElement(LinkMissingScreen)],
  ])('%s exposes its SortChip', (name, makeScreen) => {
    const appData = jest.requireMock('../../data/useAppData').useAppData() as {
      holdings: object[];
      liabilities: object[];
      monthBudgets?: object[];
    };
    const storeData = useAppStore((state) => state).data;
    const holding: ManualHolding = {
      id: 'sort-holding',
      kind: 'manual',
      name: 'Sort holding',
      type: 'Savings account',
      invested: 10,
      value: 10,
      valueAsOf: '2026-10-01',
      logs: [{ id: 'sort-entry', date: '2026-10-01', amount: 10, note: 'Deposit', kind: 'Deposit' }],
    };
    const liability: OneTimeLiability = {
      id: 'sort-liability',
      kind: 'one-time',
      name: 'Sort liability',
      type: 'Borrowed money',
      principal: 100,
      ratePct: 0,
      startDate: '2026-01-01',
      dueDate: null,
      payments: [],
    };
    appData.holdings = name === 'Investment entries' ? [holding] : [];
    appData.liabilities = name === 'Liability payments' ? [liability] : [];
    appData.monthBudgets = name === 'Budget spending' ? [{
      month: todayISO().slice(0, 7), templateId: null, templateName: null, customized: false,
      plannedIncome: 1000, lines: [{ category: 'Food', planned: 500 }],
    }] : [];
    storeData.holdings = name === 'Link missing transactions' ? [holding] : [];
    storeData.liabilities = [];
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    routeParams.mockReturnValue(name === 'Budget spending'
      ? { month: todayISO().slice(0, 7) }
      : name === 'Investment entries'
      ? { id: holding.id }
      : name === 'Liability payments'
        ? { id: liability.id }
        : {});

    const renderer = renderScreen(makeScreen());
    expect(renderer.root.findAll((node) =>
      typeof node.props.accessibilityLabel === 'string'
      && node.props.accessibilityLabel.startsWith('Sort:'),
    )).toHaveLength(1);
    act(() => renderer.unmount());
    routeParams.mockReturnValue({});
  });

  it('lists every Budget history sort key in the SortChip menu', () => {
    const renderer = renderScreen(React.createElement(BudgetHistoryScreen));
    const sortButton = renderer.root.find((node) =>
      typeof node.props.accessibilityLabel === 'string'
      && node.props.accessibilityLabel.startsWith('Sort:'),
    );
    act(() => sortButton.props.onPress());

    const menu = renderer.root.find((node) => String(node.type) === 'modal' && node.props.visible === true);
    const options = menu.findAll((node) => node.props.accessibilityState?.selected !== undefined)
      .map((node) => node.findAll((child) => String(child.type) === 'text')
        .map((text) => text.children.join(''))
        .join(''));
    for (const label of [
      'Month',
      'Planned spend',
      'Actual spend',
      'Planned saving',
      'Actual invested',
      'Savings rate',
      'Closing balance',
      'Outstanding amount',
      'Template name',
      'Customized',
    ]) {
      expect(options.some((option) => option.includes(label))).toBe(true);
    }
  });

  it('changes months with horizontal swipes and leaves chip-origin swipes alone', () => {
    const renderer = renderScreen(React.createElement(TransactionsScreen));
    const monthLabel = () => renderer.root.findByProps({ accessibilityRole: 'adjustable' }).props.accessibilityLabel as string;
    const previousMonthLabel = monthLabel();
    const expectedMonth = shiftMonth(useUIStore.getState().txMonth, 1);
    const chipSurface = renderer.root.findByProps({ testID: 'transaction-filter-row' });
    const responder = () => renderer.root.findAll(
      (node) => typeof node.props.onMoveShouldSetPanResponderCapture === 'function',
    )[0];
    if (!responder()) throw new Error('Transaction swipe responder did not render.');

    act(() => chipSurface.props.onTouchStart());
    expect(responder()?.props.onMoveShouldSetPanResponderCapture({}, { dx: -80, dy: 0, vx: -1 })).toBe(false);
    act(() => chipSurface.props.onTouchEnd());

    const pan = responder();
    if (!pan) throw new Error('Transaction swipe responder did not render.');
    expect(pan.props.onMoveShouldSetPanResponderCapture({}, { dx: -80, dy: 0, vx: -1 })).toBe(true);
    act(() => pan.props.onPanResponderRelease({}, { dx: -80, dy: 0, vx: -1 }));
    expect(monthLabel()).not.toBe(previousMonthLabel);
    expect(monthLabel()).toBe(`Selected month: ${formatMonth(expectedMonth)}`);
  });

  it.each([
    ['shortfall', 'expense', 100],
    ['surplus', 'income', 100],
  ] as const)('renders the %s month review allocation builder', (mode, type, amount) => {
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const selectedMonth = shiftMonth(monthKey(todayISO()), -1);
    const data = {
      ...emptyAppData(`${selectedMonth}-01`),
      transactions: [{
        id: `review-${mode}`,
        type,
        amount,
        category: type === 'expense' ? 'Living' : 'Salary',
        note: 'Review smoke',
        date: `${selectedMonth}-10`,
      }],
    };
    useAppStore((state) => state).data = data;
    routeParams.mockReturnValue({ month: selectedMonth });
    const renderer = renderScreen(React.createElement(MonthReviewScreen));
    expect(renderer.root.findAll((node) => String(node.type) === 'screen').length).toBeGreaterThan(0);
    useAppStore((state) => state).data = emptyAppData(todayISO());
    routeParams.mockReturnValue({});
  });

  it('explains the first SIP installment and installment tracking dates', () => {
    const renderer = renderScreen(React.createElement(InvestmentFormScreen));
    const dates = renderer.root.findAll((node) => String(node.type) === 'datefield');
    expect(dates[0]?.props).toMatchObject({
      accessibilityLabel: 'First scheduled contribution date',
      accessibilityHint: 'The first date on your recurring investment schedule.',
    });
    expect(dates[1]?.props).toMatchObject({
      accessibilityLabel: 'Installment tracking start date',
      accessibilityHint: 'Only installments due on or after this date count toward missed contributions.',
    });
    const helperText = renderer.root.findAllByType('text').map((node) => node.children.join(' ')).join(' ');
    expect(helperText).toContain('The plan schedule starts on this date.');
    expect(helperText).toContain('For an existing SIP, choose when you want WealthWise to start counting expected installments.');
  });

  it('keeps one-time and manual holding forms free of plan-only value fields', () => {
    const renderer = renderScreen(React.createElement(InvestmentFormScreen));
    const storeState = useAppStore((state) => state) as {
      data: { holdings: (ManualHolding | PlanHolding)[] };
    };
    const previousHoldings = storeState.data.holdings;
    const holding: ManualHolding = {
      id: 'manual-investment-test',
      kind: 'manual',
      name: 'Manual investment',
      type: 'Gold',
      invested: 10_000,
      value: 11_000,
      valueAsOf: todayISO(),
      logs: [],
    };
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    let editRenderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      act(() => renderer.root.findByProps({ label: 'Investment type' }).props.onChange('one-time'));
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Opening balance' })).toHaveLength(0);
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Latest actual value' })).toHaveLength(0);
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Actual value date' })).toHaveLength(0);

      storeState.data.holdings = [holding];
      routeParams.mockReturnValue({ id: holding.id });
      editRenderer = renderScreen(React.createElement(InvestmentFormScreen));
      expect(editRenderer.root.findAllByProps({ accessibilityLabel: 'Opening balance' })).toHaveLength(0);
      expect(editRenderer.root.findAllByProps({ accessibilityLabel: 'Latest actual value' })).toHaveLength(0);
      expect(editRenderer.root.findAllByProps({ accessibilityLabel: 'Actual value date' })).toHaveLength(0);
    } finally {
      act(() => renderer.unmount());
      if (editRenderer) act(() => editRenderer?.unmount());
      storeState.data.holdings = previousHoldings;
      routeParams.mockReturnValue({});
    }
  });

  it.each(['create', 'edit'] as const)('explains investment value fields in recurring %s mode', (mode) => {
    const storeState = useAppStore((state) => state) as {
      data: { holdings: (ManualHolding | PlanHolding)[] };
    };
    const previousHoldings = storeState.data.holdings;
    const plan = makeInvestmentTestPlan();
    storeState.data.holdings = mode === 'edit' ? [plan] : [];
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    routeParams.mockReturnValue(mode === 'edit' ? { id: plan.id } : {});
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    try {
      renderer = renderScreen(React.createElement(InvestmentFormScreen));
      const helpers = [
        'Money you had already put in before you started tracking here. It counts towards your invested amount.',
        "Today's value from your statement or investment app. Leave it blank and we will use our estimate.",
        "The date you checked that value. We fill in today's date when you enter a value.",
      ];
      for (const helperText of helpers) {
        const helper = renderer.root.findAllByType('text').find((node) => node.children.join('') === helperText);
        expect(helper?.props.accessibilityHint).toBe(helperText);
      }
      expect(renderer.root.findByProps({ accessibilityLabel: 'Opening balance' })).toBeDefined();
      expect(renderer.root.findByProps({ accessibilityLabel: 'Latest actual value' })).toBeDefined();
      expect(renderer.root.findByProps({ accessibilityLabel: 'Actual value date' }).props.accessibilityHint)
        .toBe(helpers[2]);

      const information = renderer.root.findByProps({ accessibilityLabel: 'Investment value example' });
      act(() => information.props.onPress());
      const sheet = renderer.root.find((node) => String(node.type) === 'modal' && node.props.visible === true);
      const sheetText = sheet.findAllByType('text');
      expect(sheetText.map((node) => node.children.join('')).join(' '))
        .toContain('For example, you had');
      expect(sheetText.map((node) => node.children.join('')).join(' '))
        .toContain('₹10,000');
      expect(sheetText.map((node) => node.children.join('')).join(' '))
        .toContain('₹11,000');
      expect(sheetText.find((node) => node.props.accessibilityLabel)?.props.accessibilityLabel)
        .toContain('₹10,000');
      act(() => sheet.props.onRequestClose());
      expect(renderer.root.find((node) => String(node.type) === 'modal').props.visible).toBe(false);
    } finally {
      if (renderer) act(() => renderer?.unmount());
      storeState.data.holdings = previousHoldings;
      routeParams.mockReturnValue({});
    }
  });

  it('prefills today as the actual value date when the user enters an actual value', async () => {
    const renderer = renderScreen(React.createElement(InvestmentFormScreen));
    try {
      await act(async () => {
        renderer.root.findByProps({ accessibilityLabel: 'Latest actual value' }).props.onChangeText('1100');
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });
      expect(renderer.root.findByProps({ accessibilityLabel: 'Actual value date' }).props.value).toBe(todayISO());
    } finally {
      act(() => renderer.unmount());
    }
  });

  it.each(['Festival', 'Donation', 'Gifts'] as const)(
    'opens the %s transactions from its budget line',
    (category) => {
      const data = jest.requireMock('../../data/useAppData').useAppData() as {
        transactions: unknown[];
        monthBudgets?: unknown[];
      };
      const previousTransactions = data.transactions;
      const previousBudgets = data.monthBudgets;
      const month = todayISO().slice(0, 7);
      data.transactions = [];
      data.monthBudgets = [{
        month,
        templateId: null,
        templateName: null,
        customized: false,
        plannedIncome: 10_000,
        lines: ['Festival', 'Donation', 'Gifts'].map((lineCategory) => ({
          category: lineCategory,
          planned: 500,
        })),
      }];
      const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
      const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
      routeParams.mockReturnValue({ month });
      router.push.mockClear();

      try {
        const renderer = renderScreen(React.createElement(BudgetScreen));
        const categoryLine = renderer.root.findAll((node) =>
          node.props.accessibilityRole === 'button'
          && typeof node.props.accessibilityLabel === 'string'
          && node.props.accessibilityLabel.startsWith(`${category}:`),
        )[0];
        if (!categoryLine) throw new Error(`${category} budget line did not render.`);
        act(() => categoryLine.props.onPress());
        expect(router.push).toHaveBeenCalledWith({
          pathname: '/(tabs)/transactions',
          params: { month, category },
        });
      } finally {
        data.transactions = previousTransactions;
        data.monthBudgets = previousBudgets;
        routeParams.mockReturnValue({});
      }
    },
  );

  it('shows History and Month review quick actions and keeps only templates in the Budget menu', () => {
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    router.push.mockClear();
    mockFontScale = 2;
    try {
      const renderer = renderScreen(React.createElement(BudgetScreen));
      const quickActions = renderer.root.findByProps({ testID: 'budget-quick-actions' });
      const quickStyles = Array.isArray(quickActions.props.style) ? quickActions.props.style : [quickActions.props.style];
      expect(quickStyles).toEqual(expect.arrayContaining([
        expect.objectContaining({ flexDirection: 'row', flexWrap: 'wrap' }),
      ]));
      expect(quickStyles.every((style) =>
        !('height' in style) && !('maxHeight' in style),
      )).toBe(true);
      expect(renderer.root.findByProps({ accessibilityLabel: 'History' }).props.icon).toBe('calendar');
      expect(renderer.root.findByProps({ accessibilityLabel: 'Month review' })).toBeDefined();
      expect(renderer.root.findAllByProps({ testID: 'budget-month-review-dot' })).toHaveLength(0);

      act(() => renderer.root.findByProps({ accessibilityLabel: 'History' }).props.onPress());
      expect(router.push).toHaveBeenCalledWith('/budget-history');
      act(() => renderer.root.findByProps({ testID: 'budget-month-review-action' }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith('/month-review');

      act(() => renderer.root.findByProps({ accessibilityLabel: 'More options' }).props.onPress());
      const header = renderer.root.findByType('header');
      const menuLabels = header.findAllByProps({ accessibilityLabel: 'Budget templates' });
      expect(menuLabels).toHaveLength(1);
      expect(header.findAllByProps({ accessibilityLabel: 'Budget history' })).toHaveLength(0);
      expect(header.findAllByProps({ accessibilityLabel: 'Month review' })).toHaveLength(0);
      act(() => menuLabels[0]?.props.onPress());
      expect(router.push).toHaveBeenLastCalledWith('/budget-templates');
    } finally {
      mockFontScale = 1;
    }
  });

  it('marks and opens the most recent reviewable month from the Budget quick action', () => {
    const data = jest.requireMock('../../data/useAppData').useAppData() as {
      transactions: Transaction[];
    };
    const previousTransactions = data.transactions;
    const reviewMonth = shiftMonth(monthKey(todayISO()), -1);
    data.transactions = [{
      id: 'budget-review-transaction',
      type: 'income',
      amount: 100,
      category: 'Salary',
      note: 'Pay',
      date: `${reviewMonth}-10`,
    }];
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    router.push.mockClear();
    try {
      const renderer = renderScreen(React.createElement(BudgetScreen));
      expect(renderer.root.findByProps({ testID: 'budget-month-review-dot' })).toBeDefined();
      const action = renderer.root.findByProps({ testID: 'budget-month-review-action' });
      expect(action.props.accessibilityLabel).toBe(`Month review, ${formatMonth(reviewMonth)} needs review`);
      act(() => action.props.onPress());
      expect(router.push).toHaveBeenCalledWith({ pathname: '/month-review', params: { month: reviewMonth } });
    } finally {
      data.transactions = previousTransactions;
    }
  });

  it('returns from Budget history to the tab with the selected month', () => {
    const data = jest.requireMock('../../data/useAppData').useAppData() as {
      monthBudgets?: unknown[];
    };
    const previousBudgets = data.monthBudgets;
    const month = '2026-09';
    data.monthBudgets = [{
      month,
      templateId: null,
      templateName: 'September',
      customized: false,
      plannedIncome: 10_000,
      lines: [{ category: 'Food', planned: 2_000 }],
    }];
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    router.push.mockClear();
    try {
      const renderer = renderScreen(React.createElement(BudgetHistoryScreen));
      const row = renderer.root.findAll((node) =>
        typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith(`Open budget for ${formatMonth(month)}, closing balance`),
      )[0];
      if (!row) throw new Error('Selected month budget history row was not rendered.');
      act(() => row.props.onPress());
      expect(router.push).toHaveBeenCalledWith({ pathname: '/(tabs)/budget', params: { month } });
    } finally {
      data.monthBudgets = previousBudgets;
    }
  });
});
