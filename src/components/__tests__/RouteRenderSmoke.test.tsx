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
import MoneyMovementFormScreen from '../../../app/money-movement-form';
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
import type { ManualHolding, OneTimeLiability } from '../../domain/types';
import { useUIStore } from '../../data/uiStore';
import { useAppStore } from '../../data/store';
import { formatMonth } from '../../lib/format';
import { todayISO } from '../../lib/clock';

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
    useAppStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
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
    FormScreen: ({ title, children, onClose, isDirty }: {
      title: string;
      children?: React.ReactNode;
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
    TextField: ({ label }: { label: string }) => ReactModule.createElement('text', null, label),
  };
});

jest.mock('../../components/form/MoneyField', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    MoneyField: ({ label }: { label: string }) => ReactModule.createElement('text', null, label),
  };
});

jest.mock('../../components/form/DateField', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    DateField: ({ label, accessibilityLabel, accessibilityHint }: {
      label: string;
      accessibilityLabel?: string;
      accessibilityHint?: string;
    }) => ReactModule.createElement('datefield', { accessibilityLabel, accessibilityHint }, label),
  };
});

jest.mock('../../components/form/SegmentedControl', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    SegmentedControl: ({ label }: { label: string }) => ReactModule.createElement('text', null, label),
  };
});

jest.mock('../../components/form/ReadOnlyRow', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    ReadOnlyRow: ({ label }: { label: string }) => ReactModule.createElement('text', null, label),
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
    useWindowDimensions: () => ({ fontScale: 1, width: 390, height: 844, scale: 1, }),
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
    ['Money movement invalid state', React.createElement(MoneyMovementFormScreen)],
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

  it('changes months with horizontal swipes and leaves chip-origin swipes alone', () => {
    const renderer = renderScreen(React.createElement(TransactionsScreen));
    const monthLabel = () => renderer.root.findByProps({ accessibilityRole: 'adjustable' }).props.accessibilityLabel as string;
    const previousMonthLabel = monthLabel();
    const expectedMonth = shiftMonth(useUIStore.getState().txMonth, 1);
    const chipSurface = renderer.root.findAll((node) => typeof node.props.onTouchStart === 'function')[0];
    if (!chipSurface) throw new Error('Transaction filter touch surface did not render.');
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

  it.each(['borrowed-in', 'repay', 'withdraw', 'own-funds'])('renders the %s movement form', (kind) => {
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    routeParams.mockReturnValue({ kind });
    const renderer = renderScreen(React.createElement(MoneyMovementFormScreen));
    expect(renderer.root.findAll((node) => String(node.type) === 'screen').length).toBeGreaterThan(0);
    routeParams.mockReturnValue({});
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

  it('opens Budget history and Budget templates from the Budget tab menu', () => {
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    router.push.mockClear();
    const renderer = renderScreen(React.createElement(BudgetScreen));
    act(() => renderer.root.findByProps({ accessibilityLabel: 'More options' }).props.onPress());
    const history = renderer.root.findByProps({ accessibilityLabel: 'Budget history' });
    act(() => history.props.onPress());
    expect(router.push).toHaveBeenCalledWith('/budget-history');
    const templates = renderer.root.findByProps({ accessibilityLabel: 'Budget templates' });
    act(() => templates.props.onPress());
    expect(router.push).toHaveBeenLastCalledWith('/budget-templates');
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
      const row = renderer.root.findByProps({ accessibilityLabel: `Open budget for ${formatMonth(month)}` });
      act(() => row.props.onPress());
      expect(router.push).toHaveBeenCalledWith({ pathname: '/(tabs)/budget', params: { month } });
    } finally {
      data.monthBudgets = previousBudgets;
    }
  });
});
