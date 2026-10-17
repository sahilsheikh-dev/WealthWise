import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Switch } from 'react-native';

import AssetsScreen from '../../../app/assets';
import BackupScreen from '../../../app/backup';
import BudgetScreen from '../../../app/(tabs)/budget';
import BudgetMonthFormScreen from '../../../app/budget-month-form';
import BudgetSetupScreen from '../../../app/budget-setup';
import ClearDuesScreen from '../../../app/clear-dues';
import EfAllocationFormScreen from '../../../app/ef-allocation-form';
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
import OnboardingScreen from '../../../app/onboarding';
import ProfileFormScreen from '../../../app/profile-form';
import SecurityScreen from '../../../app/security';
import ThemeScreen from '../../../app/theme';
import TransactionFormScreen from '../../../app/transaction-form';
import TransactionsScreen from '../../../app/(tabs)/transactions';
import { assertNoVerbText } from '../testUtils/assertNoVerbText';
import { AmountText } from '../AmountText';
import { DueActions } from '../DueActions';
import { IconButton } from '../IconButton';
import { monthKey, shiftMonth } from '../../domain/dates';
import { linkedRecurringForMonth } from '../../domain/budget';
import { duesThroughPreview } from '../../domain/dues';
import { emptyAppData } from '../../domain/actions';
import type { AppData, ManualHolding, OneTimeLiability, PlanHolding, RecurringLiability, Transaction } from '../../domain/types';
import { useUIStore } from '../../data/uiStore';
import { useAppStore } from '../../data/store';
import { formatAmount } from '../../lib/amountDisplay';
import { formatDate, formatINR, formatMonth } from '../../lib/format';
import { todayISO } from '../../lib/clock';
import { buildDemoData } from '../../mock/demoData';

let mockFontScale = 1;
let mockSafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const mockConfirmAsync = jest.fn(async (_options: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
}) => true);

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
    useSafeAreaInsets: () => mockSafeAreaInsets,
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
  useIsFocused: jest.fn(() => true),
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
      efAllocation: null,
      efCustomBuckets: [],
      efBucketLinks: {},
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
      clearDue: jest.fn(),
      clearDuesThrough: jest.fn(),
      undoClearDue: jest.fn(),
      undoClearDuesThrough: jest.fn(),
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
    efAllocation: null,
    efCustomBuckets: [],
    efBucketLinks: {},
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
      clearDue: jest.fn(),
      clearDuesThrough: jest.fn(),
      undoClearDue: jest.fn(),
      undoClearDuesThrough: jest.fn(),
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
      menuPlacement,
      menuIndicator,
    }: {
      title: string;
      rightActions?: {
        label: string;
        icon: string;
        onPress: () => void;
        expanded?: boolean;
        showIndicator?: boolean;
      }[];
      menu?: { label: string; onPress: () => void }[];
      menuPlacement?: 'leading' | 'trailing';
      menuIndicator?: boolean;
    }) => {
      const [menuOpen, setMenuOpen] = ReactModule.useState(false);
      return ReactModule.createElement('header', null,
        ReactModule.createElement('text', null, title),
        ...(menu && menuPlacement === 'leading' ? [
          ReactModule.createElement('button', {
            key: 'more-options',
            accessibilityLabel: 'More options',
            menuIndicator,
          }, 'More options'),
        ] : []),
        ...(rightActions ?? []).map((action) => ReactModule.createElement('button', {
          key: action.label,
          accessibilityLabel: action.label,
          accessibilityState: action.expanded === undefined ? {} : { expanded: action.expanded },
          icon: action.icon,
          showIndicator: action.showIndicator,
          onPress: action.onPress,
        }, action.label, action.showIndicator ? ReactModule.createElement('view', { testID: 'header-action-indicator' }) : null)),
        ...(menu && menuPlacement !== 'leading' ? [
          ReactModule.createElement('button', {
            key: 'more-options',
            accessibilityLabel: 'More options',
            menuIndicator,
            onPress: () => setMenuOpen(true),
          }, 'More options'),
          ...(menuIndicator ? [ReactModule.createElement('view', {
            key: 'menu-indicator',
            testID: 'header-menu-indicator',
          })] : []),
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
    FormScreen: ({ title, children, footer, bottomNavigation, onClose, isDirty }: {
      title: string;
      children?: React.ReactNode;
      footer?: React.ReactNode;
      bottomNavigation?: React.ReactNode;
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
        bottomNavigation,
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
    MoneyField: ({ label, accessibilityLabel, ...props }: {
      label?: string;
      accessibilityLabel?: string;
      [key: string]: unknown;
    }) => ReactModule.createElement('moneyfield', {
      ...props,
      label,
      accessibilityLabel,
    }, label ?? ''),
  };
});

jest.mock('../../components/form/PercentField', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    PercentField: ({ label, ...props }: { label?: string; [key: string]: unknown }) =>
      ReactModule.createElement('percentfield', { ...props, label }, label ?? ''),
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
  confirmAsync: (...args: Parameters<typeof mockConfirmAsync>) => mockConfirmAsync(...args),
}));

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => {
    const { themes } = jest.requireActual('../../theme/themes');
    return { colors: themes.light.colors, themeId: 'light', resolvedId: 'light', isDark: false, statusBar: 'dark' };
  },
}));

jest.mock('@expo/vector-icons', () => ({ Feather: () => null, Ionicons: () => null }));

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
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
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
    ['Budget setup', React.createElement(BudgetSetupScreen)],
    ['Budget month form', React.createElement(BudgetMonthFormScreen)],
    ['Goals', React.createElement(GoalsScreen)],
    ['Transactions', React.createElement(TransactionsScreen)],
    ['Backup', React.createElement(BackupScreen)],
    ['Clear past dues', React.createElement(ClearDuesScreen)],
    ['Assets', React.createElement(AssetsScreen)],
    ['Emergency fund', React.createElement(EmergencyFundScreen)],
    ['Emergency fund allocation form', React.createElement(EfAllocationFormScreen)],
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
  ];

  it.each([1, 1.3, 2])('renders the single-plan setup and grouped inputs at font scale %s', async (fontScale) => {
    mockFontScale = fontScale;
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    try {
      const setup = renderScreen(React.createElement(BudgetSetupScreen));
      expect(setup.root.findAll((node) => node.type === 'text' && node.props.children === 'Budget plan')).toHaveLength(1);
      for (const id of ['survival', 'savings-investments', 'wants', 'festival-donations-culture', 'unexpected-extras']) {
        expect(setup.root.findByProps({ testID: `budget-category-group-${id}` }).props.accessibilityRole).toBe('button');
      }
      expect(setup.root.findAllByProps({ accessibilityLabel: 'Planned monthly income' }).length).toBeGreaterThan(0);
      expect(setup.root.findAllByType(Switch)).toHaveLength(1);
      expect(setup.root.findByType(Switch).props.accessibilityLabel).toBe('Repeat every month from next month');
      expect(setup.root.findAllByProps({ label: 'Start from suggested split' })).toHaveLength(1);
      expect(setup.root.findAllByProps({ label: `Apply to ${formatMonth(todayISO().slice(0, 7))}` })).toHaveLength(1);
      expect(setup.root.findAllByProps({ label: 'Save only' })).toHaveLength(1);
      expect(setup.root.findAllByProps({ accessibilityLabel: 'Food amount' })).toHaveLength(2);
      act(() => setup.unmount());

      routeParams.mockReturnValue({ month: todayISO().slice(0, 7) });
      const monthForm = renderScreen(React.createElement(BudgetMonthFormScreen));
      expect(monthForm.root.findByProps({ testID: 'budget-category-group-survival' }).props.accessibilityRole).toBe('button');
      act(() => monthForm.unmount());
    } finally {
      routeParams.mockReturnValue({});
      mockFontScale = 1;
    }
  });

  it.each(screens)('%s renders without verb text', async (name, screen) => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(screen);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Route did not render.');
    assertNoVerbText(renderer.root, { screen: name === 'Home' ? 'home' : undefined });
  });

  it('groups linked recurring items with names, amounts, due dates and the source note', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const today = todayISO();
    const demo = buildDemoData(today);
    const original = {
      holdings: routeData.holdings,
      liabilities: routeData.liabilities,
      policies: routeData.policies,
      budgetPlan: routeData.budgetPlan,
      monthBudgets: routeData.monthBudgets,
      transactions: routeData.transactions,
    };
    Object.assign(routeData, {
      holdings: demo.holdings,
      liabilities: demo.liabilities,
      policies: demo.policies,
      budgetPlan: demo.budgetPlan,
      monthBudgets: demo.monthBudgets,
      transactions: demo.transactions,
    });
    try {
      const setup = renderScreen(React.createElement(BudgetSetupScreen));
      expect(setup.root.findAll((node) => node.type === 'text'
        && node.props.children === 'Linked recurring items').length).toBeGreaterThan(0);
      expect(setup.root.findAll((node) => node.type === 'text'
        && typeof node.props.children === 'string'
        && node.props.children.includes('These come from your assets, liabilities and insurance.')).length).toBeGreaterThan(0);
      const expectedRow = linkedRecurringForMonth(demo, monthKey(today), today)[0];
      if (!expectedRow) throw new Error('Demo data must include a current-month linked row.');
      const visibleText = JSON.stringify(setup.toJSON());
      expect(visibleText).toContain(expectedRow.name);
      expect(visibleText).toContain(expectedRow.dueDate);
      expect(visibleText).toContain(formatAmount(expectedRow.amount, 'exact', 1));
      act(() => setup.unmount());
    } finally {
      Object.assign(routeData, original);
    }
  });

  it('renders every registered screen with the four-month demo data', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const storeState = useAppStore((state) => state);
    const previousRouteData = { ...routeData };
    const previousStoreData = storeState.data;
    const demoData = buildDemoData(todayISO());
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    try {
      Object.assign(routeData, demoData);
      storeState.data = demoData;
      for (const [, screen] of screens) {
        renderer = renderScreen(screen);
        expect(renderer.root.findAll((node) => String(node.type) === 'screen').length)
          .toBeGreaterThan(0);
        act(() => renderer?.unmount());
        renderer = undefined;
      }
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      storeState.data = previousStoreData;
    }
  });

  it('offers assets already linked to another goal and adds them without a share field', () => {
    const storeState = useAppStore((state) => state) as { data: AppData };
    const previousData = storeState.data;
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousParams = routeParams();
    const today = todayISO();
    const plan = makeInvestmentTestPlan();
    const goal = {
      id: 'goal-under-test',
      name: 'Goal under test',
      target: 10_000,
      saved: 0,
      year: 2030,
      links: [],
    };
    const otherGoal = {
      id: 'other-goal',
      name: 'Other goal',
      target: 10_000,
      saved: 0,
      year: 2031,
      links: [{ instrumentId: plan.id, share: 100 }],
    };
    let form: TestRenderer.ReactTestRenderer | undefined;

    try {
      storeState.data = { ...emptyAppData(today), goals: [goal, otherGoal], holdings: [plan] };
      routeParams.mockReturnValue({ id: goal.id });
      form = renderScreen(React.createElement(GoalFormScreen));
      act(() => form?.root.findByProps({ accessibilityLabel: 'Link an asset' }).props.onPress());

      const availableAsset = form.root.findAll((node) =>
        String(node.type) === 'pressable'
        && typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith('Link Test plan, current value '),
      )[0];
      if (!availableAsset) throw new Error('An asset linked to another goal was unavailable.');
      act(() => availableAsset.props.onPress());

      expect(form.root.findAll((node) => node.type === 'text' && node.children.includes('Test plan'))).toHaveLength(1);
      expect(form.root.findAll((node) => node.type === 'button' && node.children.includes('Link an asset'))).toHaveLength(1);
      expect(form.root.findAll((node) => node.type === 'text' && node.children.includes('Share of asset (%)'))).toHaveLength(0);
      const linked = storeState.data.goals.find((item) => item.id === goal.id);
      expect(linked?.links).toEqual([]);
    } finally {
      act(() => form?.unmount());
      storeState.data = previousData;
      routeParams.mockReturnValue(previousParams);
    }
  });

  it('keeps Home spending collapsed and asks before changing a due', async () => {
    const routeModule = jest.requireMock('../../data/useAppData') as { useAppData: () => AppData };
    const routeData = routeModule.useAppData();
    const previousData = { ...routeData };
    const today = todayISO();
    const textOf = (renderer: TestRenderer.ReactTestRenderer) =>
      renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' ');
    let home: TestRenderer.ReactTestRenderer | undefined;

    try {
      Object.assign(routeData, emptyAppData(today));
      home = renderScreen(React.createElement(HomeScreen));
      expect(home.root.findByProps({ testID: 'home-spending-toggle' }).props.accessibilityState)
        .toEqual({ expanded: false });
      expect(home.root.findAllByProps({ accessibilityLabel: 'Open budget' })).toHaveLength(0);
      expect(home.root.findAllByProps({ accessibilityLabel: 'Apply budget' })).toHaveLength(0);
      expect(home.root.findAllByProps({ testID: 'home-spending-details' })).toHaveLength(0);
      act(() => home?.root.findByProps({ testID: 'home-spending-toggle' }).props.onPress());
      expect(home.root.findByProps({ testID: 'home-spending-toggle' }).props.accessibilityState)
        .toEqual({ expanded: true });
      expect(home.root.findAllByType('text').some((node) =>
        node.children.includes('No spending recorded this month.'),
      )).toBe(true);
      act(() => home?.root.findByProps({ testID: 'home-spending-toggle' }).props.onPress());
      expect(home.root.findAllByProps({ testID: 'home-spending-details' })).toHaveLength(0);
      act(() => home?.unmount());
      home = undefined;

      Object.assign(routeData, {
        ...emptyAppData(today),
        monthBudgets: [{
          month: today.slice(0, 7),
          source: 'custom' as const,
          plannedIncome: 10_000,
          lines: [{ category: 'Food', planned: 1_000 }],
        }],
      });
      home = renderScreen(React.createElement(HomeScreen));
      expect(home.root.findAllByProps({ accessibilityLabel: 'Open budget' })).toHaveLength(0);
      expect(home.root.findAllByProps({ accessibilityLabel: 'Apply budget' })).toHaveLength(0);
      act(() => home?.unmount());
      home = undefined;

      Object.assign(routeData, {
        ...emptyAppData(today),
        holdings: [makeInvestmentTestPlan()],
      });
      mockConfirmAsync.mockClear();
      mockConfirmAsync.mockResolvedValue(false);
      mockFontScale = 2;
      home = renderScreen(React.createElement(HomeScreen));
      const dueHome = home;
      const dueRow = dueHome.root.findAll((node) =>
        typeof node.props.testID === 'string' && node.props.testID.startsWith('home-due-row-due:'),
      )[0];
      if (!dueRow) throw new Error('Home due item did not render.');
      expect(dueRow.findAll((node) =>
        Array.isArray(node.props.style)
        && node.props.style.some((style: unknown) =>
          typeof style === 'object' && style !== null && 'flexDirection' in style
          && style.flexDirection === 'column',
        ),
      ).length).toBeGreaterThan(0);
      expect(dueRow.props.onPress).toBeUndefined();
      expect(textOf(dueHome)).toContain('Test plan');
      expect(textOf(dueHome)).toContain(formatAmount(1_000, 'exact', 1));
      expect(textOf(dueHome)).toContain(formatDate(today));
      const markPaid = dueRow.findByProps({ accessibilityLabel: 'Paid' });
      expect(markPaid.type).toBe('button');
      expect(markPaid.children).toContain('Paid');
      expect(mockConfirmAsync).not.toHaveBeenCalled();
      await act(async () => {
        markPaid.props.onPress();
        await Promise.resolve();
      });
      expect(mockConfirmAsync).toHaveBeenCalledWith({
        title: 'Was this paid?',
        message: `Test plan, ${formatAmount(1_000, 'exact', 1)}, due ${formatDate(today)}`,
        confirmLabel: 'Paid',
        cancelLabel: 'Not paid',
      });
      expect(textOf(dueHome)).toContain('Test plan');
      expect(dueHome.root.findAll((node) =>
        node.type === 'button' && ['Pay', 'Clear due', 'View schedule'].includes(String(node.children[0])),
      )).toHaveLength(0);
      expect(dueHome.root.findAllByProps({ testID: 'pending-item-action-sheet' })).toHaveLength(0);
      expect(dueRow.props.onPress).toBeUndefined();
      await act(async () => {
        markPaid.props.onPress();
        await Promise.resolve();
      });
      expect(mockConfirmAsync).toHaveBeenCalledTimes(2);
      const actions = (jest.requireMock('../../data/useAppData') as {
        useAppActions: () => { clearDue: jest.Mock };
      }).useAppActions();
      expect(actions.clearDue).not.toHaveBeenCalled();
    } finally {
      act(() => home?.unmount());
      Object.assign(routeData, previousData);
      mockFontScale = 1;
      mockConfirmAsync.mockResolvedValue(true);
    }
  });

  it.each([1.3, 2])('stacks Home due content and the text payment action at font scale %s', (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousData = { ...routeData };
    mockFontScale = fontScale;
    let home: TestRenderer.ReactTestRenderer | undefined;
    try {
      Object.assign(routeData, {
        ...emptyAppData(todayISO()),
        holdings: [makeInvestmentTestPlan()],
      });
      home = renderScreen(React.createElement(HomeScreen));
      const dueRow = home.root.findAll((node) =>
        typeof node.props.testID === 'string' && node.props.testID.startsWith('home-due-row-'),
      )[0];
      if (!dueRow) throw new Error('Home due item did not render.');
      expect(dueRow.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ alignItems: 'stretch', flexDirection: 'column' }),
      ]));
      const actions = dueRow.find((node) =>
        typeof node.props.testID === 'string' && node.props.testID.startsWith('home-due-actions-'),
      );
      expect(actions?.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ justifyContent: 'flex-end' }),
      ]));
      expect(dueRow.findByProps({ accessibilityLabel: 'Paid' }).type).toBe('button');
    } finally {
      act(() => home?.unmount());
      Object.assign(routeData, previousData);
      mockFontScale = 1;
    }
  });

  it('clears a confirmed Home due with Undo and previews earlier dues', async () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const actions = (jest.requireMock('../../data/useAppData') as {
      useAppActions: () => {
        clearDue: jest.Mock;
        clearDuesThrough: jest.Mock;
        undoClearDue: jest.Mock;
        undoClearDuesThrough: jest.Mock;
      };
    }).useAppActions();
    const store = useAppStore((state) => state);
    const previousRouteData = { ...routeData };
    const previousStoreData = store.data;
    const previousToast = useUIStore.getState().actionToast;
    const today = todayISO();
    const currentMonth = monthKey(today);
    const oldMonth = shiftMonth(currentMonth, -4);
    const singlePlan = makeInvestmentTestPlan();
    const laterPlan = { ...singlePlan, id: 'older-plan', startDate: `${oldMonth}-01`, trackFrom: `${oldMonth}-01` };
    const addLinkedTransactions = (entryIds: string[], linkedPlan: PlanHolding) => {
      store.data = {
        ...store.data,
        transactions: [
          ...store.data.transactions,
          ...entryIds.map((entryId) => ({
            id: `tx-${entryId}`,
            type: 'invest' as const,
            amount: 1_000,
            category: linkedPlan.type,
            note: linkedPlan.name,
            date: today,
            source: { kind: 'holding-entry' as const, parentId: linkedPlan.id, entryId },
          })),
        ],
      };
    };
    let home: TestRenderer.ReactTestRenderer | undefined;

    try {
      Object.assign(routeData, { ...emptyAppData(today), holdings: [makeInvestmentTestPlan()] });
      store.data = routeData;
      actions.clearDue.mockImplementation((_target, _slotId) => {
        addLinkedTransactions(['paid-entry'], singlePlan);
        return 'paid-entry';
      });
      mockConfirmAsync.mockResolvedValue(true);
      useUIStore.getState().setActionToast(null);
      home = renderScreen(React.createElement(HomeScreen));
      const oldestRow = home.root.findAll((node) =>
        typeof node.props.testID === 'string' && node.props.testID.startsWith('home-due-row-due:plan:investment-plan-test'),
      )[0];
      if (!oldestRow) throw new Error('Oldest due row did not render.');
      const markPaid = oldestRow.findByProps({ accessibilityLabel: 'Paid' });
      await act(async () => {
        markPaid.props.onPress();
        await Promise.resolve();
      });
      expect(actions.clearDue).toHaveBeenCalledWith({ kind: 'plan', id: 'investment-plan-test' }, expect.any(String));
      expect(useUIStore.getState().actionToast?.message).toBe(`${formatAmount(1_000, 'exact', 1)} marked as paid`);
      const singleUndo = useUIStore.getState().actionToast?.onAction;
      if (!singleUndo) throw new Error('Single-due Undo action was not set.');
      act(() => singleUndo());
      expect(actions.undoClearDue).toHaveBeenCalledWith({ kind: 'plan', id: 'investment-plan-test' }, 'paid-entry');
      act(() => home?.unmount());
      home = undefined;

      Object.assign(routeData, { ...emptyAppData(today), holdings: [laterPlan] });
      store.data = routeData;
      actions.clearDuesThrough.mockImplementation((_target, _dueDate) => {
        const entryIds = ['paid-older-1', 'paid-older-2', 'paid-current'];
        addLinkedTransactions(entryIds, laterPlan);
        return entryIds;
      });
      actions.undoClearDuesThrough.mockClear();
      mockConfirmAsync.mockClear();
      useUIStore.getState().setActionToast(null);
      home = renderScreen(React.createElement(HomeScreen));
      const laterRow = home.root.findAll((node) =>
        typeof node.props.testID === 'string' && node.props.testID.startsWith('home-due-row-due:plan:older-plan:'),
      )[0];
      if (!laterRow) throw new Error('Later due row did not render.');
      const laterMarkPaid = laterRow.findByProps({ accessibilityLabel: 'Paid' });
      const preview = duesThroughPreview(routeData, { kind: 'plan', id: laterPlan.id }, currentMonth + '-01', today);
      expect(preview.count).toBeGreaterThan(1);
      const expectedMessage = `Test plan, ${formatAmount(1_000, 'exact', 1)}, due ${formatDate(currentMonth + '-01')}\nThis also clears ${preview.count - 1} earlier dues, ${formatAmount(preview.amount, 'exact', 1)} total.`;
      await act(async () => {
        laterMarkPaid.props.onPress();
        await Promise.resolve();
      });
      expect(mockConfirmAsync).toHaveBeenCalledWith({
        title: 'Was this paid?',
        message: expectedMessage,
        confirmLabel: 'Paid',
        cancelLabel: 'Not paid',
      });
      expect(actions.clearDuesThrough).toHaveBeenCalledWith({ kind: 'plan', id: laterPlan.id }, currentMonth + '-01');
      const throughUndo = useUIStore.getState().actionToast?.onAction;
      if (!throughUndo) throw new Error('Clear-through Undo action was not set.');
      act(() => throughUndo());
      expect(actions.undoClearDuesThrough).toHaveBeenCalledWith(
        { kind: 'plan', id: laterPlan.id },
        ['paid-older-1', 'paid-older-2', 'paid-current'],
      );
    } finally {
      act(() => home?.unmount());
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
      useUIStore.getState().setActionToast(previousToast);
      mockConfirmAsync.mockResolvedValue(true);
    }
  });

  it.each([1, 1.3, 2])('places goal details above a final progress bar without status text at font scale %s', async (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousData = { ...routeData };
    const today = todayISO();
    const plan = makeInvestmentTestPlan();
    const data: AppData = {
      ...emptyAppData(today),
      holdings: [plan],
      goals: [{
        id: 'goal-travel',
        name: 'Travel',
        target: 50_000,
        saved: 5_000,
        year: 2028,
        links: [{ instrumentId: plan.id }],
      }, {
        id: 'goal-emergency',
        name: 'Emergency fund',
        target: 100_000,
        saved: 0,
        year: 2028,
        auto: 'ef',
        links: [],
      }],
    };
    let home: TestRenderer.ReactTestRenderer | undefined;
    let goals: TestRenderer.ReactTestRenderer | undefined;
    mockFontScale = fontScale;

    try {
      Object.assign(routeData, data);
      home = renderScreen(React.createElement(HomeScreen));
      goals = renderScreen(React.createElement(GoalsScreen));
      if (!home || !goals) throw new Error('Goal screens did not render.');

      for (const screen of [home, goals]) {
        const rows = screen.root.findAll((node) =>
          node.type === 'view' && node.props.testID === 'goal-progress-row',
        );
        expect(rows.length).toBeGreaterThanOrEqual(2);
        expect(screen.root.findAllByType('text').some((node) =>
          node.children.includes('Emergency fund'),
        )).toBe(true);
        for (const row of rows) {
          const bar = row.find((node) =>
            node.type === 'view' && node.props.testID === 'goal-progress-bar',
          );
          if (!bar) throw new Error('Goal progress bar did not render.');
          expect(bar.props.style).toEqual(expect.objectContaining({ width: '100%' }));
          expect(row.children).toHaveLength(1);
          expect(row.children.map((child) => typeof child === 'string' ? child : child.props.testID))
            .toEqual(['goal-progress-bar']);
          const siblingIds = row.parent?.children.map((child) =>
            typeof child === 'string' ? child : child.props.testID,
          );
          expect(siblingIds?.at(-1)).toBe('goal-progress-row');
        }
        const visibleText = screen.root.findAllByType('text').map((node) => node.children.join('')).join(' ');
        expect(visibleText).toContain('Projected');
        expect(visibleText).not.toMatch(/\b(?:Behind|On track|Ahead)\b|Not reachable with current contributions/);
      }
    } finally {
      act(() => {
        home?.unmount();
        goals?.unmount();
      });
      Object.assign(routeData, previousData);
      mockFontScale = 1;
    }
  });

  it.each([1, 1.3, 2])('renders Home goals as rows in one divided card at font scale %s', (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousData = { ...routeData };
    mockFontScale = fontScale;
    Object.assign(routeData, {
      ...emptyAppData(todayISO()),
      goals: [
        { id: 'home-goal-a', name: 'Goal A', target: 20_000, saved: 2_000, year: 2028, links: [] },
        { id: 'home-goal-b', name: 'Goal B', target: 30_000, saved: 3_000, year: 2029, links: [] },
        { id: 'home-goal-c', name: 'Goal C', target: 40_000, saved: 4_000, year: 2030, links: [] },
      ],
    });
    let home: TestRenderer.ReactTestRenderer | undefined;
    try {
      home = renderScreen(React.createElement(HomeScreen));
      const section = home.root.findByProps({ testID: 'home-goals-section' });
      expect(section.findAll((node) => String(node.type) === 'card')).toHaveLength(1);
      const rowsByTestId = new Map(section.findAll((node) =>
        typeof node.props.testID === 'string'
        && node.props.testID.startsWith('home-goal-row-'),
      ).map((node) => [node.props.testID as string, node]));
      const rows = [...rowsByTestId.values()];
      expect(rows.map((row) => row.props.testID)).toEqual([
        'home-goal-row-goal-emergency',
        'home-goal-row-home-goal-a',
        'home-goal-row-home-goal-b',
      ]);
      expect(rows[0]?.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ borderBottomWidth: 1 }),
      ]));
      expect(rows[1]?.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ borderBottomWidth: 1 }),
      ]));
      expect(rows[2]?.props.style).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ borderBottomWidth: 1 }),
      ]));
    } finally {
      act(() => home?.unmount());
      Object.assign(routeData, previousData);
      mockFontScale = 1;
    }
  });

  it.each([1.3, 2])('opens asset and liability editing from the card body at font scale %s', (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousData = { ...routeData };
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    mockFontScale = fontScale;
    const today = todayISO();
    const dueDate = `${shiftMonth(monthKey(today), 1)}-01`;
    Object.assign(routeData, {
      ...emptyAppData(today),
      holdings: [{
        id: 'tap-cash',
        kind: 'manual' as const,
        name: 'Tap cash',
        type: 'Cash' as const,
        invested: 10_000,
        value: 10_000,
        valueAsOf: today,
        logs: [],
      }],
      liabilities: [{
        id: 'tap-liability',
        kind: 'one-time' as const,
        name: 'Tap liability',
        type: 'Borrowed money' as const,
        principal: 20_000,
        ratePct: 0,
        startDate: today,
        dueDate,
        payments: [],
      }, {
        id: 'tap-recurring-liability',
        kind: 'recurring' as const,
        name: 'Tap recurring liability',
        type: 'Other' as const,
        principal: 20_000,
        ratePct: 0,
        startDate: `${shiftMonth(monthKey(today), -2)}-01`,
        tenureMonths: 12,
        emi: 2_000,
        settlement: null,
        payments: [],
      }],
    });
    let assets: TestRenderer.ReactTestRenderer | undefined;
    let liabilities: TestRenderer.ReactTestRenderer | undefined;
    try {
      router.push.mockClear();
      assets = renderScreen(React.createElement(AssetsScreen));
      const assetCard = assets.root.findByProps({ testID: 'asset-card-manual-Tap cash' });
      expect(assetCard.props.accessibilityRole).toBe('button');
      expect(assetCard.props.accessibilityLabel).toBe('Edit Tap cash');
      expect(assetCard.props.accessibilityHint).toBe('Opens this asset for editing');
      expect(assetCard.findAllByType(IconButton)).toHaveLength(0);
      act(() => assetCard.props.onPress());
      expect(router.push).toHaveBeenLastCalledWith('/investment-form?id=tap-cash');

      router.push.mockClear();
      const deposit = assetCard.findByProps({ accessibilityLabel: 'Deposit' });
      const stopPropagation = jest.fn();
      router.push.mockClear();
      act(() => deposit.props.onPress({ stopPropagation }));
      expect(stopPropagation).toHaveBeenCalledTimes(1);
      expect(router.push).toHaveBeenLastCalledWith('/investment-entry-form?holdingId=tap-cash&kind=Deposit');
      expect(router.push).not.toHaveBeenCalledWith('/investment-form?id=tap-cash');
      act(() => assets?.unmount());
      assets = undefined;

      liabilities = renderScreen(React.createElement(LiabilitiesScreen));
      const liabilityCard = liabilities.root.findByProps({ testID: 'liability-card-tap-liability' });
      const liabilityContent = liabilityCard.findByProps({ testID: 'liability-card-content-tap-liability' });
      expect(liabilityCard.props.accessibilityRole).toBe('button');
      expect(liabilityCard.props.accessibilityLabel).toBe('Edit Tap liability');
      expect(liabilityCard.props.accessibilityHint).toBe('Opens this liability for editing');
      expect(liabilityCard.findAllByType(IconButton)).toHaveLength(0);
      const liabilityNodes = liabilityContent.findAll(() => true);
      const progressIndex = liabilityNodes.findIndex((node) => node.type === 'progress');
      const actionsIndex = liabilityNodes.findIndex((node) =>
        node.props.testID === 'liability-card-actions-tap-liability',
      );
      expect(progressIndex).toBeGreaterThan(0);
      expect(actionsIndex).toBeGreaterThan(progressIndex);
      expect(liabilityNodes.slice(progressIndex + 1, actionsIndex)
        .every((node) => node.type !== 'text')).toBe(true);
      const oneTimeActionContainer = liabilityContent.findByProps({
        testID: 'liability-card-actions-tap-liability',
      });
      expect(oneTimeActionContainer.children.map((child) =>
        typeof child === 'string' ? child : String(child.type),
      )).toEqual(['view']);
      expect(oneTimeActionContainer.findAll((node) => node.type === 'text')).toHaveLength(0);
      const paymentActions = liabilityContent.findAll((node) => String(node.type) === 'actionrow')[0];
      if (!paymentActions) throw new Error('One-time liability action row did not render.');
      expect(paymentActions.props.stopParentPress).toBe(true);
      act(() => liabilityCard.props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/liability-form',
        params: { id: 'tap-liability' },
      });
      const recurringCard = liabilities.root.findByProps({ testID: 'liability-card-tap-recurring-liability' });
      const recurringContent = recurringCard.findByProps({ testID: 'liability-card-content-tap-recurring-liability' });
      expect(recurringCard.findAllByType(IconButton)).toHaveLength(0);
      const recurringNodes = recurringContent.findAll(() => true);
      const recurringProgressIndex = recurringNodes.findIndex((node) => node.type === 'progress');
      const recurringActionsIndex = recurringNodes.findIndex((node) =>
        node.props.testID === 'liability-card-actions-tap-recurring-liability',
      );
      expect(recurringProgressIndex).toBeGreaterThan(0);
      expect(recurringActionsIndex).toBeGreaterThan(recurringProgressIndex);
      expect(recurringNodes.slice(recurringProgressIndex + 1, recurringActionsIndex)
        .every((node) => node.type !== 'text')).toBe(true);
      const recurringActionContainer = recurringContent.findByProps({
        testID: 'liability-card-actions-tap-recurring-liability',
      });
      expect(recurringActionContainer.children.map((child) =>
        typeof child === 'string' ? child : String(child.type),
      )).toEqual(['view']);
      expect(recurringActionContainer.findAll((node) => node.type === 'text')).toHaveLength(0);
      const recurringActionRow = recurringContent.findAll((node) => String(node.type) === 'actionrow')[0];
      if (!recurringActionRow) throw new Error('Recurring liability action row did not render.');
      expect(recurringActionRow.props.stopParentPress).toBe(true);
      const dueActions = recurringContent.findByType(DueActions);
      expect(dueActions.props.stopParentPress).toBe(true);
      const clearDue = recurringCard.findByProps({ accessibilityLabel: 'Clear due' });
      const clearDueStopPropagation = jest.fn();
      const dataActions = (jest.requireMock('../../data/useAppData') as {
        useAppActions: () => { clearDue: jest.Mock };
      }).useAppActions();
      router.push.mockClear();
      act(() => clearDue.props.onPress({ stopPropagation: clearDueStopPropagation }));
      expect(clearDueStopPropagation).toHaveBeenCalledTimes(1);
      expect(dataActions.clearDue).toHaveBeenCalledWith({ kind: 'liability', id: 'tap-recurring-liability' });
      expect(router.push).not.toHaveBeenCalledWith({
        pathname: '/liability-form',
        params: { id: 'tap-recurring-liability' },
      });
      expect(recurringCard.props.accessibilityLabel).toBe('Edit Tap recurring liability');
      act(() => recurringCard.props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/liability-form',
        params: { id: 'tap-recurring-liability' },
      });
    } finally {
      act(() => {
        assets?.unmount();
        liabilities?.unmount();
      });
      Object.assign(routeData, previousData);
      mockFontScale = 1;
    }
  });

  it('filters due payments and always shows only the user-kept balance elements', () => {
    const routeModule = jest.requireMock('../../data/useAppData') as { useAppData: () => AppData };
    const routeData = routeModule.useAppData();
    const store = useAppStore((state) => state);
    const previousRouteData = { ...routeData };
    const previousStoreData = store.data;
    const previousTxMonth = useUIStore.getState().txMonth;
    const today = todayISO();
    const month = shiftMonth(monthKey(today), -1);
    const data: AppData = {
      ...emptyAppData(today),
      transactions: [
        { id: 'income', type: 'income', amount: 1_000, category: 'Salary', note: '', date: `${month}-01` },
        { id: 'food', type: 'expense', amount: 100, category: 'Food', note: '', date: `${month}-02` },
      ],
      monthBudgets: [{
        month,
        source: 'custom' as const,
        plannedIncome: 1_000,
        lines: [
          { category: 'Food', planned: 300 },
          { category: 'Shopping', planned: 200 },
          { category: 'Other investments', planned: 75 },
        ],
      }],
    };
    Object.assign(routeData, data);
    store.data = data;
    act(() => useUIStore.getState().setTxMonth(month));
    mockFontScale = 2;

    try {
      const renderer = renderScreen(React.createElement(TransactionsScreen));
      const balance = renderer.root.findByProps({ testID: 'available-balance-card' });
      const balanceCard = balance.findAll((node) => String(node.type) === 'card')[0];
      if (!balanceCard) throw new Error('Balance Card did not render.');
      expect(balanceCard.props.style).toMatchObject({ minHeight: 56 });
      expect(balance.findAllByProps({ testID: 'available-balance-toggle' })).toHaveLength(0);
      expect(balance.findAllByProps({ testID: 'available-balance-details' })).toHaveLength(0);
      expect(balance.findAll((node) =>
        typeof node.props.testID === 'string' && node.props.testID.startsWith('balance-metric-'),
      )).toHaveLength(0);
      expect(balance.findAllByProps({ testID: 'available-balance-caption' })).toHaveLength(0);
      expect(balance.findAllByProps({ testID: 'balance-pending-caption' })).toHaveLength(0);
      const balanceText = balance.findAllByType('text').map((node) => node.children.join(' ')).join(' ');
      expect(balanceText).toContain('Closing balance');
      expect(balanceText).not.toContain('NaN');
      expect(renderer.root.findAllByProps({ testID: 'pending-items-toggle' })).toHaveLength(0);
      const pendingHeader = renderer.root.findByProps({ testID: 'pending-items-header' });
      expect(pendingHeader.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain('3 payments due of total');
      const pendingList = renderer.root.findByProps({ testID: 'pending-items-list' });
      const pendingCard = renderer.root.findByProps({ testID: 'pending-items-section' })
        .findAll((node) => String(node.type) === 'card')[0];
      if (!pendingCard) throw new Error('Due payments Card did not render.');
      expect(pendingList.findAll((node) =>
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:Food`,
      )).toHaveLength(1);
      expect(pendingList.findAllByProps({ children: 'Paid' })).toHaveLength(3);
      expect(pendingList.findAllByProps({ children: 'Pay' })).toHaveLength(0);
      const firstDueRow = pendingList.find((node) =>
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:Food`,
      );
      if (!firstDueRow) throw new Error('Filtered due row did not render.');
      expect(firstDueRow.props.accessibilityLabel).toContain('Food');
      expect(firstDueRow.props.accessibilityLabel).not.toContain('Overdue');
      expect(firstDueRow.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ borderBottomWidth: 1 }),
      ]));

      expect(renderer.root.findAllByProps({ accessibilityLabel: `Review ${formatMonth(month)}` }).length)
        .toBeGreaterThan(0);
      act(() => renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress());
      act(() => renderer.root.findByProps({ accessibilityLabel: 'Invested' }).props.onPress());
      expect(renderer.root.findAll((node) =>
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:Other investments`,
      )).toHaveLength(1);
      expect(renderer.root.findAll((node) =>
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:Food`,
      )).toHaveLength(0);
      const lastDueRow = renderer.root.find((node) =>
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:Other investments`,
      );
      if (!lastDueRow) throw new Error('Filtered last due row did not render.');
      expect(lastDueRow.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ borderBottomWidth: 0 }),
      ]));
      expect(renderer.root.findByProps({ testID: 'pending-items-header' }).findAllByType('text')
        .map((node) => node.children.join('')).join(' ')).toContain(formatAmount(75, 'exact', 1));
      act(() => renderer.unmount());

      const negativeData: AppData = {
        ...emptyAppData(today),
        transactions: [{
          id: 'overspend', type: 'expense', amount: 1_000, category: 'Food', note: '', date: `${month}-02`,
        }],
      };
      Object.assign(routeData, negativeData);
      store.data = negativeData;
      const negativeRenderer = renderScreen(React.createElement(TransactionsScreen));
      const negativeBalance = negativeRenderer.root.findByProps({ testID: 'available-balance-card' });
      expect(negativeBalance.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain('Shortfall');
      expect(negativeRenderer.root.findAllByProps({ testID: 'pending-items-section' })).toHaveLength(0);
      expect(negativeBalance.findAll((node) => node.props.accessibilityLabel === '-₹1,000'))
        .toHaveLength(0);
      act(() => negativeRenderer.unmount());
    } finally {
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
      act(() => useUIStore.getState().setTxMonth(previousTxMonth));
      mockFontScale = 1;
    }
  });

  it.each([1.3, 2])('stacks Transactions due rows at font scale %s', (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousRouteData = { ...routeData };
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const previousMonth = useUIStore.getState().txMonth;
    const today = todayISO();
    const month = monthKey(today);
    const data: AppData = {
      ...emptyAppData(today),
      monthBudgets: [{
        month,
        source: 'custom',
        plannedIncome: 1_000,
        lines: [{ category: 'Food', planned: 300 }],
      }],
    };
    Object.assign(routeData, data);
    store.data = data;
    act(() => useUIStore.getState().setTxMonth(month));
    mockFontScale = fontScale;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(TransactionsScreen));
      const row = renderer.root.find((node) =>
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:Food`,
      );
      if (!row) throw new Error('Transactions due row did not render.');
      expect(row.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ alignItems: 'stretch', flexDirection: 'column' }),
      ]));
      expect(row.findAllByProps({ accessibilityLabel: 'Paid' })).toHaveLength(1);
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
      act(() => useUIStore.getState().setTxMonth(previousMonth));
      mockFontScale = 1;
    }
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
      }, {
        id: 'large-emergency',
        name: 'Emergency fund',
        target: 123_456_789,
        saved: 0,
        year: 2028,
        auto: 'ef' as const,
        links: [{ instrumentId: 'large-holding', share: 50 }],
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
        source: 'custom' as const,
        plannedIncome: 123_456_789,
        lines: [{ category: 'Food', planned: 123_456_789 }],
      }],
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
        expect.stringContaining(`Based on your average monthly expenses, ${exactB}`),
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
    /form|money movement invalid|clear past dues/i.test(name),
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
    ['Goals', () => React.createElement(GoalsScreen)],
    ['Assets', () => React.createElement(AssetsScreen)],
    ['Liabilities', () => React.createElement(LiabilitiesScreen)],
    ['Investment entries', () => React.createElement(InvestmentEntriesScreen)],
    ['Liability payments', () => React.createElement(LiabilityPaymentsScreen)],
    ['Link missing transactions', () => React.createElement(LinkMissingScreen)],
  ])('%s exposes its SortChip in the existing location or inline filter panel', (name, makeScreen) => {
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
      month: todayISO().slice(0, 7), source: 'custom' as const,
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
    const filteredScreenPanel: Record<string, string> = {
      Transactions: 'transaction-filter-panel',
      Goals: 'goal-filter-panel',
      Assets: 'asset-filter-panel',
      Liabilities: 'liability-filter-panel',
    };
    const panelTestID = filteredScreenPanel[name];
    if (panelTestID) {
      expect(renderer.root.findAll((node) =>
        typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith('Sort:'),
      )).toHaveLength(0);
      expect(renderer.root.findAllByProps({ testID: panelTestID })).toHaveLength(0);
      const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
      expect(filterButton.props.accessibilityState).toEqual({ expanded: false });
      act(() => filterButton.props.onPress());
      expect(renderer.root.findByProps({ testID: panelTestID })).toBeDefined();
      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.accessibilityState)
        .toEqual({ expanded: true });
      if (name === 'Transactions') {
        expect(renderer.root.findAll((node) =>
          ['All', 'Income', 'Expense', 'Invested'].includes(String(node.props.accessibilityLabel)),
        ).length).toBeGreaterThanOrEqual(4);
        const investedChip = renderer.root.findAll((node) => String(node.type) === 'chip')
          .find((node) => node.props.accessibilityLabel === 'Invested');
        if (!investedChip) throw new Error('Invested filter chip did not render.');
        act(() => investedChip.props.onPress());
        expect(renderer.root.findAll((node) => String(node.type) === 'chip')
          .find((node) => node.props.accessibilityLabel === 'Invested')?.props.selected)
          .toBe(true);
      } else if (name === 'Assets') {
        expect(renderer.root.findAll((node) =>
          ['All', 'Recurring', 'Mutual fund / SIP'].includes(String(node.props.accessibilityLabel)),
        ).length).toBeGreaterThanOrEqual(3);
        const recurringChip = renderer.root.findAll((node) => String(node.type) === 'chip')
          .find((node) => node.props.accessibilityLabel === 'Recurring');
        if (!recurringChip) throw new Error('Recurring filter chip did not render.');
        act(() => recurringChip.props.onPress());
        expect(renderer.root.findAll((node) => String(node.type) === 'chip')
          .find((node) => node.props.accessibilityLabel === 'Recurring')?.props.selected)
          .toBe(true);
      } else if (name === 'Liabilities') {
        expect(renderer.root.findAll((node) =>
          ['All', 'Recurring', 'One-time'].includes(String(node.props.accessibilityLabel)),
        ).length).toBeGreaterThanOrEqual(3);
        const oneTimeChip = renderer.root.findAll((node) => String(node.type) === 'chip')
          .find((node) => node.props.accessibilityLabel === 'One-time');
        if (!oneTimeChip) throw new Error('One-time liability filter did not render.');
        act(() => oneTimeChip.props.onPress());
        expect(renderer.root.findAll((node) => String(node.type) === 'chip')
          .find((node) => node.props.accessibilityLabel === 'One-time')?.props.selected)
          .toBe(true);
      } else {
        expect(renderer.root.findAll((node) =>
          typeof node.props.accessibilityLabel === 'string'
          && node.props.accessibilityLabel.startsWith('Sort:'),
        )).toHaveLength(1);
      }
      if (name === 'Transactions' || name === 'Assets' || name === 'Liabilities') {
        expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBe(true);
        expect(renderer.root.findAll((node) =>
          String(node.type) === 'view' && node.props.testID === 'header-action-indicator',
        )).toHaveLength(1);
      }
      const header = renderer.root.findAllByType('header')[0];
      const headerActionLabels = header?.findAll((node) =>
        ['Filter', 'Add transaction', 'New goal', 'New investment', 'Add a liability', 'More options']
          .includes(String(node.props.accessibilityLabel)),
      ).map((node) => node.props.accessibilityLabel);
      expect(headerActionLabels?.at(-1)).toBe(name === 'Transactions'
        ? 'Add transaction'
        : name === 'Goals'
          ? 'New goal'
          : name === 'Assets'
            ? 'New investment'
            : 'Add a liability');
      expect(headerActionLabels).toContain('Filter');
      if (name === 'Transactions') {
        expect(headerActionLabels?.slice(0, 2)).toEqual(['More options', 'Filter']);
      }
    } else {
      expect(renderer.root.findAll((node) =>
      typeof node.props.accessibilityLabel === 'string'
      && node.props.accessibilityLabel.startsWith('Sort:'),
      )).toHaveLength(1);
    }
    act(() => renderer.unmount());
    routeParams.mockReturnValue({});
  });

  it('filters recurring and one-time liabilities and shows a no-matches state', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousRouteData = { ...routeData };
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const recurringA: RecurringLiability = {
      id: 'filter-liability-a',
      kind: 'recurring',
      name: 'Alpha recurring',
      type: 'Home loan',
      principal: 12_000,
      ratePct: 0,
      startDate: '2026-01-01',
      tenureMonths: 24,
      emi: 500,
      payments: [],
      settlement: null,
    };
    const recurringB: RecurringLiability = {
      ...recurringA,
      id: 'filter-liability-b',
      name: 'Beta recurring',
    };
    const oneTime: OneTimeLiability = {
      id: 'filter-one-time',
      kind: 'one-time',
      name: 'Friend loan',
      type: 'Borrowed money',
      principal: 1_000,
      ratePct: 0,
      startDate: '2026-01-01',
      dueDate: null,
      payments: [],
    };
    const data: AppData = {
      ...emptyAppData(todayISO()),
      liabilities: [recurringA, oneTime, recurringB],
    };
    Object.assign(routeData, data);
    store.data = data;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(LiabilitiesScreen));
      act(() => renderer?.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress());
      const cardIds = () => renderer?.root.findAll((node) =>
        String(node.type) === 'pressable'
        && typeof node.props.testID === 'string'
        && node.props.testID.startsWith('liability-card-filter-'),
      ).map((node) => node.props.testID) ?? [];
      const recurringChip = renderer.root.findAll((node) => String(node.type) === 'chip')
        .find((node) => node.props.accessibilityLabel === 'Recurring');
      if (!recurringChip) throw new Error('Recurring liability filter did not render.');
      act(() => recurringChip.props.onPress());
      expect(cardIds().sort()).toEqual(['liability-card-filter-liability-a', 'liability-card-filter-liability-b']);
      expect(renderer.root.findAll((node) =>
        typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith('Sort:'),
      )).toHaveLength(1);

      const oneTimeChip = renderer.root.findAll((node) => String(node.type) === 'chip')
        .find((node) => node.props.accessibilityLabel === 'One-time');
      if (!oneTimeChip) throw new Error('One-time liability filter did not render.');
      act(() => oneTimeChip.props.onPress());
      expect(cardIds()).toEqual(['liability-card-filter-one-time']);

      act(() => recurringChip.props.onPress());
      expect(cardIds().sort()).toEqual(['liability-card-filter-liability-a', 'liability-card-filter-liability-b']);
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
    }
  });

  it('shows No matches when a liability kind has no records', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousRouteData = { ...routeData };
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const data: AppData = {
      ...emptyAppData(todayISO()),
      liabilities: [{
        id: 'only-one-time',
        kind: 'one-time',
        name: 'Friend loan',
        type: 'Borrowed money',
        principal: 1_000,
        ratePct: 0,
        startDate: '2026-01-01',
        dueDate: null,
        payments: [],
      }],
    };
    Object.assign(routeData, data);
    store.data = data;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(LiabilitiesScreen));
      act(() => renderer?.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress());
      const recurringChip = renderer.root.findAll((node) => String(node.type) === 'chip')
        .find((node) => node.props.accessibilityLabel === 'Recurring');
      if (!recurringChip) throw new Error('Recurring liability filter did not render.');
      act(() => recurringChip.props.onPress());
      expect(renderer.root.findAllByProps({ testID: 'liability-no-matches' })).not.toHaveLength(0);
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
    }
  });

  it('changes months with horizontal swipes and leaves chip-origin swipes alone', () => {
    const renderer = renderScreen(React.createElement(TransactionsScreen));
    const monthLabel = () => renderer.root.findByProps({ accessibilityRole: 'adjustable' }).props.accessibilityLabel as string;
    const previousMonthLabel = monthLabel();
    const expectedMonth = shiftMonth(useUIStore.getState().txMonth, 1);
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress());
    const chipSurface = renderer.root.findByProps({ testID: 'transaction-filter-panel' });
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
      const kindControl = renderer.root.findAll((node) => String(node.type) === 'segmentedcontrol').find((node) =>
        node.props.options?.some((option: { value: string }) => option.value === 'one-time'),
      );
      if (!kindControl) throw new Error('Investment kind control did not render.');
      act(() => kindControl.props.onChange('one-time'));
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
    'shows the %s budget line once inside its group',
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
        source: 'custom' as const,
        plannedIncome: 10_000,
        lines: ['Festival', 'Donation', 'Gifts'].map((lineCategory) => ({
          category: lineCategory,
          planned: 500,
        })),
      }];
      const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
      routeParams.mockReturnValue({ month });

      try {
        const renderer = renderScreen(React.createElement(BudgetScreen));
        const categoryRows = renderer.root.findAll((node) =>
          String(node.type) === 'view'
          &&
          node.props.testID === `pending-item-budget:${month}:${category}`,
        );
        expect(categoryRows).toHaveLength(1);
        expect(categoryRows[0]?.findAllByProps({ accessibilityLabel: 'Marked as paid' })).toHaveLength(1);
      } finally {
        data.transactions = previousTransactions;
        data.monthBudgets = previousBudgets;
        routeParams.mockReturnValue({});
      }
    },
  );

  it('shows the no-budget state and plan-dependent primary action inside Plan summary', () => {
    const data = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previous = { monthBudgets: data.monthBudgets, budgetPlan: data.budgetPlan, holdings: data.holdings, liabilities: data.liabilities, transactions: data.transactions };
    data.monthBudgets = [];
    data.budgetPlan = null;
    data.holdings = [];
    data.liabilities = [];
    data.transactions = [];
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    router.push.mockClear();
    try {
      const renderer = renderScreen(React.createElement(BudgetScreen));
      const summary = renderer.root.findByProps({ testID: 'budget-plan-summary' });
      expect(summary.findAll((node) => String(node.type) === 'card')).toHaveLength(1);
      expect(summary.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain('No budget for this month');
      const setup = summary.findByProps({ accessibilityLabel: 'Set up budget' });
      expect(setup.props.variant).toBe('primary');
      act(() => setup.props.onPress());
      expect(router.push).toHaveBeenCalledWith('/budget-setup');
      act(() => renderer.unmount());

      data.budgetPlan = {
        plannedIncome: 1_000,
        lines: [{ category: 'Food', mode: 'amount', value: 200 }],
        repeatMonthly: false,
        repeatFrom: null,
      };
      const withPlan = renderScreen(React.createElement(BudgetScreen));
      expect(withPlan.root.findByProps({ testID: 'budget-plan-summary' })
        .findByProps({ accessibilityLabel: 'Apply budget' })).toBeDefined();
      act(() => withPlan.unmount());
    } finally {
      data.monthBudgets = previous.monthBudgets;
      data.budgetPlan = previous.budgetPlan;
      data.holdings = previous.holdings;
      data.liabilities = previous.liabilities;
      data.transactions = previous.transactions;
    }
  });

  it.each([1, 1.3, 2])('renders grouped Auto and budget rows at font scale %s', (fontScale) => {
    mockFontScale = fontScale;
    const data = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previous = { monthBudgets: data.monthBudgets, holdings: data.holdings, liabilities: data.liabilities, transactions: data.transactions };
    const month = monthKey(todayISO());
    data.transactions = [];
    data.liabilities = [];
    data.holdings = [{
      id: 'bills-plan',
      kind: 'plan',
      name: 'Monthly SIP',
      type: 'Mutual fund / SIP',
      frequency: 'monthly',
      amount: 100,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate: `${month}-01`,
      trackFrom: `${month}-01`,
      opening: 0,
      actualValue: null,
      actualValueDate: null,
      logs: [],
    }];
    data.monthBudgets = [{
      month,
      source: 'custom' as const,
      plannedIncome: 1_000,
      lines: [{ category: 'Food', planned: 200 }],
    }];
    try {
      const renderer = renderScreen(React.createElement(BudgetScreen));
      const survival = renderer.root.findByProps({ testID: 'budget-group-survival' });
      const savings = renderer.root.findByProps({ testID: 'budget-group-savings-investments' });
      const rowIds = new Set(renderer.root.findAll((node) =>
        node.props.testID === 'pending-item-due:plan:bills-plan:plan:0'
        || node.props.testID === `pending-item-budget:${month}:Food`,
      ).map((row) => row.props.testID));
      expect(rowIds).toEqual(new Set([
        'pending-item-due:plan:bills-plan:plan:0',
        `pending-item-budget:${month}:Food`,
      ]));
      const rows = [...rowIds].map((testID) => renderer.root.findByProps({ testID }));
      for (const row of rows) {
        expect(row.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ borderBottomWidth: 1 })]));
        expect(row.findAllByProps({ accessibilityLabel: 'Marked as paid' })).toHaveLength(1);
      }
      expect(survival.findAll((node) => String(node.type) === 'card')).toHaveLength(1);
      expect(savings.findAll((node) => String(node.type) === 'card')).toHaveLength(1);
      expect(renderer.root.findAll((node) => String(node.type) === 'progress')).toHaveLength(0);
      const sipRow = savings.findByProps({ testID: 'pending-item-due:plan:bills-plan:plan:0' });
      if (!sipRow) throw new Error('SIP due row did not render.');
      expect(sipRow.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain('Auto');
      const details = sipRow.findAll((node) =>
        String(node.type) === 'view' && node.props.style?.some?.((style: unknown) =>
          typeof style === 'object' && style !== null && 'justifyContent' in style,
        ),
      )[0];
      expect(details).toBeDefined();
      if (fontScale >= 1.3) {
        expect(details?.props.style).toEqual(expect.arrayContaining([
          expect.objectContaining({ flexDirection: 'column' }),
        ]));
      } else {
        expect(details?.props.style).toEqual(expect.arrayContaining([
          expect.objectContaining({ flexDirection: 'row' }),
        ]));
      }
    } finally {
      data.monthBudgets = previous.monthBudgets;
      data.holdings = previous.holdings;
      data.liabilities = previous.liabilities;
      data.transactions = previous.transactions;
      mockFontScale = 1;
    }
  });

  it('keeps paid, overdue, partial and linked rows inside their budget groups', () => {
    const data = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previous = {
      monthBudgets: data.monthBudgets,
      holdings: data.holdings,
      liabilities: data.liabilities,
      policies: data.policies,
      transactions: data.transactions,
    };
    const month = shiftMonth(monthKey(todayISO()), -1);
    data.holdings = [{
      id: 'budget-linked-sip',
      kind: 'plan',
      name: 'Monthly SIP',
      type: 'Mutual fund / SIP',
      frequency: 'monthly',
      amount: 100,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate: `${month}-05`,
      trackFrom: `${month}-05`,
      opening: 0,
      actualValue: null,
      actualValueDate: null,
      logs: [],
    }];
    data.liabilities = [];
    data.policies = [];
    data.transactions = [
      { id: 'food-partial', type: 'expense', amount: 25, category: 'Food', note: '', date: `${month}-10` },
      { id: 'shopping-paid', type: 'expense', amount: 200, category: 'Shopping', note: '', date: `${month}-11` },
    ];
    data.monthBudgets = [{
      month,
      source: 'custom',
      plannedIncome: 2_000,
      lines: [
        { category: 'Bills', planned: 120, dueDay: 5 },
        { category: 'Food', planned: 100 },
        { category: 'Shopping', planned: 200 },
      ],
    }];
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    routeParams.mockReturnValue({ month });
    try {
      const renderer = renderScreen(React.createElement(BudgetScreen));
      const paid = renderer.root.findByProps({ testID: `pending-item-budget:${month}:Shopping` });
      const bill = renderer.root.findByProps({ testID: `pending-item-budget:${month}:Bills` });
      const partial = renderer.root.findByProps({ testID: `pending-item-budget:${month}:Food` });
      const linked = renderer.root.findByProps({ testID: `pending-item-due:plan:budget-linked-sip:plan:0` });
      expect(paid.props.accessibilityLabel).toContain(', Paid,');
      expect(paid.findAllByProps({ label: 'Marked as paid' })).toHaveLength(0);
      expect(bill.findAll((node) => String(node.type) === 'badge' && node.props.label === 'Overdue')).toHaveLength(1);
      expect(partial.findAllByProps({ label: 'Marked as paid' })).toHaveLength(1);
      expect(partial.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain(formatAmount(25, 'row', 1));
      expect(linked.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain('Auto');
      expect(linked.findAllByProps({ label: 'Marked as paid' })).toHaveLength(1);
    } finally {
      Object.assign(data, previous);
      routeParams.mockReturnValue({});
    }
  });

  it.each([
    ['2026-09', formatMonth('2026-09')],
    ['invalid-month', formatMonth(todayISO().slice(0, 7))],
  ])('selects the routed Budget month %s, falling back for an invalid value', (monthParam, expectedLabel) => {
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    routeParams.mockReturnValue({ month: monthParam });
    try {
      const renderer = renderScreen(React.createElement(BudgetScreen));
      expect(renderer.root.findAllByType('text').some((node) => node.children.join('') === expectedLabel)).toBe(true);
    } finally {
      routeParams.mockReturnValue({});
    }
  });

  it('keeps one Edit budget action and the month switcher without a menu or Review control', () => {
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    router.push.mockClear();
    const renderer = renderScreen(React.createElement(BudgetScreen));
    const header = renderer.root.findByType('header');
    expect(header.findAllByProps({ accessibilityLabel: 'More options' })).toHaveLength(0);
    expect(header.findAllByProps({ accessibilityLabel: 'Edit budget' })).toHaveLength(1);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Previous month' })).toBeDefined();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Next month' })).toBeDefined();
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Review' })).toHaveLength(0);
    act(() => header.findByProps({ accessibilityLabel: 'Edit budget' }).props.onPress());
    expect(router.push).toHaveBeenCalledWith('/budget-setup');
  });

  it('shows cash flow, plan summary and grouped rows in the required order', () => {
    const data = jest.requireMock('../../data/useAppData').useAppData() as {
      transactions: Transaction[];
      monthBudgets?: unknown[];
    };
    const previousTransactions = data.transactions;
    const previousBudgets = data.monthBudgets;
    const selectedMonth = '2026-09';
    const priorMonth = shiftMonth(selectedMonth, -1);
    data.transactions = [
      { id: 'prior-income', type: 'income', amount: 2_000, category: 'Salary', note: 'Prior', date: `${priorMonth}-10` },
      { id: 'prior-expense', type: 'expense', amount: 3_000, category: 'Food', note: 'Prior', date: `${priorMonth}-12` },
      { id: 'selected-income', type: 'income', amount: 5_000, category: 'Salary', note: 'Current', date: `${selectedMonth}-10` },
      { id: 'selected-expense', type: 'expense', amount: 1_000, category: 'Food', note: 'Current', date: `${selectedMonth}-12` },
      { id: 'selected-invest', type: 'invest', amount: 500, category: 'Fund', note: 'Current', date: `${selectedMonth}-14` },
    ];
    data.monthBudgets = [{
      month: selectedMonth,
      source: 'custom' as const,
      plannedIncome: 10_000,
      lines: [
        { category: 'Food', planned: 4_000 },
        { category: 'Other investments', planned: 1_000 },
      ],
    }];
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    routeParams.mockReturnValue({ month: selectedMonth });
    router.push.mockClear();
    try {
      const renderer = renderScreen(React.createElement(BudgetScreen));
      const cashFlow = renderer.root.findByProps({ testID: 'budget-cash-flow' });
      const summary = renderer.root.findByProps({ testID: 'budget-plan-summary' });
      expect(cashFlow.findAllByType(AmountText)).toHaveLength(2);
      expect(cashFlow.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .not.toContain('This month’s flow');
      const cashFlowMetricRow = cashFlow.findAll((node) =>
        String(node.type) === 'view'
        && node.props.style?.minHeight === 30
        && node.props.style?.justifyContent === 'space-between',
      )[0];
      const summaryMetricRow = summary.findAll((node) =>
        String(node.type) === 'view'
        && node.props.style?.minHeight === 30
        && node.props.style?.justifyContent === 'space-between',
      )[0];
      expect(summaryMetricRow?.props.style).toEqual(cashFlowMetricRow?.props.style);
      const summaryText = summary.findAllByType('text').map((node) => node.children.join('')).join(' ');
      for (const expected of ['Planned income', 'Planned spending', 'Planned saving', 'Left to allocate', 'Actual income']) {
        expect(summaryText).toContain(expected);
      }
      expect(summary.findAll((node) => String(node.type) === 'card')).toHaveLength(1);
      expect(renderer.root.findAll((node) => typeof node.props.testID === 'string'
        && String(node.type) === 'view'
        && node.props.testID.startsWith('budget-group-')).map((node) => node.props.testID)).toEqual([
        'budget-group-survival',
        'budget-group-savings-investments',
        'budget-group-wants',
        'budget-group-festival-donations-culture',
        'budget-group-unexpected-extras',
        'budget-group-debt-repayments',
        'budget-group-insurance',
      ]);
      for (const group of renderer.root.findAll((node) => typeof node.props.testID === 'string'
        && String(node.type) === 'view'
        && node.props.testID.startsWith('budget-group-'))) {
        expect(group.findAll((node) => String(node.type) === 'card')).toHaveLength(1);
      }
      expect(renderer.root.findAll((node) => String(node.type) === 'progress')).toHaveLength(0);
      const screenCards = renderer.root.findAll((node) => String(node.type) === 'card');
      expect(screenCards).toHaveLength(9);
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Edit budget' })).toHaveLength(1);
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Review' })).toHaveLength(0);

      const editPlan = renderer.root.findByProps({ accessibilityLabel: 'Edit budget' });
      act(() => editPlan.props.onPress());
      expect(router.push).toHaveBeenCalledWith('/budget-setup');
      router.push.mockClear();
      act(() => renderer.root.findByProps({ label: 'Adjust this month' }).props.onPress());
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/budget-month-form',
        params: { month: selectedMonth },
      });
    } finally {
      data.transactions = previousTransactions;
      data.monthBudgets = previousBudgets;
      routeParams.mockReturnValue({});
      mockFontScale = 1;
    }
  });

  it.each([
    [-0, 0, 'neutral'],
    [-0.001, 0, 'neutral'],
    [0, 0, 'neutral'],
    [0.004, 0, 'neutral'],
    [1500, 1500, 'primary'],
    [-1500, -1500, 'err'],
  ] as const)('normalizes Budget closing balance %s with matching tone and accessible label', (input, expected, tone) => {
    const data = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousTransactions = data.transactions;
    const selectedMonth = '2026-09';
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    routeParams.mockReturnValue({ month: selectedMonth });
    data.transactions = input < 0
      ? [{ id: 'balance-expense', type: 'expense', amount: Math.abs(input), category: 'Food', note: '', date: `${selectedMonth}-10` }]
      : input > 0
        ? [{ id: 'balance-income', type: 'income', amount: input, category: 'Salary', note: '', date: `${selectedMonth}-10` }]
        : [];
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(BudgetScreen));
      const closingAmount = renderer.root.findByProps({ testID: 'budget-cash-flow' })
        .findAllByType(AmountText)
        .find((node) => node.props.value === expected && node.props.tone === tone);
      if (!closingAmount) throw new Error('Budget closing balance did not render.');
      expect(closingAmount.props.value).toBe(expected);
      expect(closingAmount.props.tone).toBe(tone);
      expect(closingAmount.findAll((node) =>
        node.props.accessibilityLabel === formatINR(expected),
      ).length).toBeGreaterThan(0);
      expect(closingAmount.findAll((node) =>
        node.type === 'text' && node.children.join('') === formatAmount(expected, 'row', 1),
      ).length).toBeGreaterThan(0);
    } finally {
      if (renderer) act(() => renderer?.unmount());
      data.transactions = previousTransactions;
      routeParams.mockReturnValue({});
    }
  });

  it('shows no tab bar on the Budget setup route', () => {
    const setup = renderScreen(React.createElement(BudgetSetupScreen));
    expect(setup.root.findAll((node) => node.props.testID === 'bottom-tab-bar')).toHaveLength(0);
  });
});
