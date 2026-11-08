import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

import AssetsScreen from '../../../app/assets';
import BackupScreen from '../../../app/backup';
import BudgetScreen from '../../../app/(tabs)/budget';
import BudgetIncomeFormScreen from '../../../app/budget-income-form';
import BudgetItemFormScreen from '../../../app/budget-item-form';
import BudgetSectionFormScreen from '../../../app/budget-section-form';
import ClearDuesScreen from '../../../app/clear-dues';
import EfAllocationFormScreen from '../../../app/ef-allocation-form';
import EfBucketFormScreen from '../../../app/ef-bucket-form';
import EmergencyFundScreen from '../../../app/emergency-fund';
import EraseDataScreen from '../../../app/erase-data';
import GoalFormScreen from '../../../app/goal-form';
import GoalsScreen from '../../../app/(tabs)/goals';
import HomeScreen from '../../../app/(tabs)';
import HoldingValuationFormScreen from '../../../app/holding-valuation-form';
import InsuranceScreen from '../../../app/insurance';
import InvestmentEntryFormScreen from '../../../app/investment-entry-form';
import InvestmentEntriesScreen from '../../../app/investment-entries';
import InvestmentFormScreen from '../../../app/investment-form';
import LiabilitiesScreen from '../../../app/liabilities';
import LiabilityFormScreen from '../../../app/liability-form';
import LiabilityClosureFormScreen from '../../../app/liability-closure-form';
import LiabilityClosureNoteFormScreen from '../../../app/liability-closure-note-form';
import LiabilityPaymentsScreen from '../../../app/liability-payments';
import LiabilityPaymentFormScreen from '../../../app/liability-payment-form';
import LinkMissingScreen from '../../../app/link-missing';
import OnboardingScreen from '../../../app/onboarding';
import PolicyFormScreen from '../../../app/policy-form';
import PaymentConfirmScreen from '../../../app/payment-confirm';
import ProfileFormScreen from '../../../app/profile-form';
import RemindersScreen from '../../../app/reminders';
import SecurityScreen from '../../../app/security';
import ThemeScreen from '../../../app/theme';
import TransactionFormScreen from '../../../app/transaction-form';
import TransactionsScreen from '../../../app/(tabs)/transactions';
import { assertNoVerbText } from '../testUtils/assertNoVerbText';
import { AmountText } from '../AmountText';
import { Dropdown } from '../Dropdown';
import { ChoiceField } from '../form/ChoiceField';
import { DueActions } from '../DueActions';
import { IconButton } from '../IconButton';
import { addDays, monthKey, shiftMonth } from '../../domain/dates';
import { addIncomeItem, applyBudgetPlanToMonth } from '../../domain/budget';
import { pendingItems } from '../../domain/pending';
import { clearDue as clearDueDomain, duesThroughPreview, undoClearDue as undoClearDueDomain } from '../../domain/dues';
import { liabilitySchedule, planSchedule } from '../../domain/schedule';
import { emptyAppData } from '../../domain/actions';
import { createBackup } from '../../domain/backup';
import { encryptBackup, isEncryptedBackup } from '../../domain/backupCrypto';
import type { AppData, Goal, ManualHolding, OneTimeLiability, PlanHolding, RecurringLiability } from '../../domain/types';
import { useUIStore } from '../../data/uiStore';
import { useAppStore } from '../../data/store';
import { formatAmount } from '../../lib/amountDisplay';
import { formatDate, formatINR, formatMonth } from '../../lib/format';
import { todayISO } from '../../lib/clock';
import { buildDemoData } from '../../mock/demoData';
import { budgetPlanFromLines, monthBudgetFromLines } from '../../testFixtures/budget';

let mockFontScale = 1;
let mockSafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const mockKeyboardListeners: Record<string, (event: { endCoordinates: { height: number } }) => void> = {};
const mockFileWrites: string[] = [];
let mockPickedFileText = '';
let mockDocumentPickerResult: { canceled: boolean; assets?: { uri: string }[] | null } = { canceled: true };
const mockGetRandomBytesAsync = jest.fn(async (length: number) => new Uint8Array(length).fill(7));
const mockConfirmAsync = jest.fn(async (_options: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
}) => true);
const mockChoiceAsync = jest.fn(async (_options: {
  title: string;
  message: string;
  choices: { id: string; label: string; destructive?: boolean }[];
}) => null);

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async () => 'digest'),
  getRandomBytesAsync: (length: number) => mockGetRandomBytesAsync(length),
  randomUUID: jest.fn(() => 'backup-import-id'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => mockDocumentPickerResult),
}));

jest.mock('expo-file-system', () => ({
  File: class {
    uri: string;
    exists: boolean;
    constructor(uri = '', name = '') { this.uri = name ? `${uri}/${name}` : uri; this.exists = false; }
    create() { this.exists = true; }
    write(contents: string) { mockFileWrites.push(contents); return undefined; }
    delete() { this.exists = false; }
    async text() { return mockPickedFileText; }
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
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  useIsFocused: jest.fn(() => true),
}));

jest.mock('../../data/store', () => {
  const mockState = {
    data: {
      settings: { name: 'Demo', theme: 'system', monthlySalary: 40000, onboarded: true },
      transactions: [],
      goals: [{ id: 'mock-emergency-fund', name: 'Emergency fund', target: 0, saved: 0, year: 2026, auto: 'ef', links: [] }],
      holdings: [],
      liabilities: [],
      policies: [],
      budget: null,
      budgetPlan: null,
      monthBudgets: [],
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
      addPolicy: jest.fn(),
      updatePolicy: jest.fn(),
      deletePolicy: jest.fn(),
      addPolicyPayment: jest.fn(),
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
      saveBudgetPlan: jest.fn(),
      saveAndApplyBudgetPlan: jest.fn(),
      applyBudgetPlan: jest.fn(),
      restoreMonthBudget: jest.fn(),
      restoreBudgetPlanAndMonth: jest.fn(),
      editBudgetItem: jest.fn(),
      removeBudgetItem: jest.fn(),
      addSection: jest.fn(),
      renameSection: jest.fn(),
      deleteSection: jest.fn(),
      addBudgetItem: jest.fn(),
      addBudgetIncome: jest.fn(),
      editBudgetIncome: jest.fn(),
      editBudgetStructureItem: jest.fn(),
      deleteBudgetStructureItem: jest.fn(),
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
      updateMeta: async (patch: object) => patch,
      updateSortSpec: async () => ({}),
    },
  };
});

jest.mock('../../lib/reminderNotifications', () => ({
  reminderNotificationAdapter: {
    getPermissionState: jest.fn(async () => 'granted'),
    requestPermission: jest.fn(async () => 'granted'),
    openSettings: jest.fn(async () => undefined),
    scheduleTest: jest.fn(async () => undefined),
  },
}));

jest.mock('../../data/useAppData', () => {
  const mockData = {
    settings: { name: 'Demo', theme: 'system', monthlySalary: 40000, onboarded: true },
    transactions: [],
    goals: [],
    holdings: [],
    liabilities: [],
    policies: [],
    budgetPlan: null,
    monthBudgets: [],
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
      addPolicy: jest.fn(),
      updatePolicy: jest.fn(),
      deletePolicy: jest.fn(),
      addPolicyPayment: jest.fn(),
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
      saveBudgetPlan: jest.fn(),
      saveAndApplyBudgetPlan: jest.fn(),
      applyBudgetPlan: jest.fn(),
      restoreMonthBudget: jest.fn(),
      restoreBudgetPlanAndMonth: jest.fn(),
      editBudgetItem: jest.fn(),
      removeBudgetItem: jest.fn(),
      addSection: jest.fn(),
      renameSection: jest.fn(),
      deleteSection: jest.fn(),
      addBudgetItem: jest.fn(),
      addBudgetIncome: jest.fn(),
      editBudgetIncome: jest.fn(),
      editBudgetStructureItem: jest.fn(),
      deleteBudgetStructureItem: jest.fn(),
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
    FormScreen: ({ title, children, footer, bottomNavigation, onClose, isDirty, leftAction, headerAction }: {
      title: string;
      children?: React.ReactNode;
      footer?: React.ReactNode;
      bottomNavigation?: React.ReactNode;
      onClose: () => void;
      isDirty?: boolean;
      leftAction?: { label: string; onPress: () => void } | null;
      headerAction?: { label: string; onPress: () => void };
    }) =>
      ReactModule.createElement(
        'screen',
        null,
        ReactModule.createElement(
          'view',
          { testID: 'form-shell' },
          ReactModule.createElement('view', { testID: 'form-shell-header' },
            leftAction === null ? null : ReactModule.createElement('button', {
              accessibilityRole: 'button',
              accessibilityLabel: leftAction?.label ?? 'Back',
              onPress: leftAction?.onPress ?? onClose,
              isDirty,
            }),
            headerAction ? ReactModule.createElement('button', {
              accessibilityRole: 'button',
              accessibilityLabel: headerAction.label,
              onPress: headerAction.onPress,
            }) : null,
            ReactModule.createElement('text', null, title),
          ),
          ReactModule.createElement('view', { testID: 'form-shell-body' }, children),
          ReactModule.createElement('view', { testID: 'form-shell-footer' }, footer),
        ),
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
    SwitchRow: ({ label, value, onValueChange }: {
      label: string;
      value: boolean;
      onValueChange: (value: boolean) => void;
    }) => ReactModule.createElement(
      'view',
      null,
      ReactModule.createElement('text', null, label),
      ReactModule.createElement('switch', {
        accessibilityRole: 'switch',
        accessibilityLabel: label,
        value,
        onValueChange,
      }),
    ),
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
  choiceAsync: (options: Parameters<typeof mockChoiceAsync>[0]) => mockChoiceAsync(options),
  confirmAsync: (...args: Parameters<typeof mockConfirmAsync>) => mockConfirmAsync(...args),
}));
jest.mock('../../components/PaidAmountDialog', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    PaidAmountDialog: ({ visible, title, dueAmount, dueDate, onPaid, onNotPaid }: {
      visible: boolean;
      title: string;
      dueAmount: number;
      dueDate?: string;
      onPaid: (amount: number) => void;
      onNotPaid: () => void;
    }) => visible ? ReactModule.createElement('paid-dialog', {
      testID: 'paid-amount-dialog',
      title,
      dueAmount,
      dueDate,
      onPaid,
      onNotPaid,
    }, ReactModule.createElement('button', {
      accessibilityLabel: 'Paid',
      onPress: () => onPaid(dueAmount),
    }, 'Paid'),
    ReactModule.createElement('button', {
      accessibilityLabel: 'Not paid',
      onPress: onNotPaid,
    }, 'Not paid')) : null,
  };
});
jest.mock('../../components/ApplyScopeDialog', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    ApplyScopeDialog: ({ visible, onApply, onClose, description }: {
      visible: boolean;
      onApply: (scope: 'month' | 'following') => void;
      onClose: () => void;
      description?: string;
    }) => visible ? ReactModule.createElement('apply-scope-dialog', {
      testID: 'apply-scope-dialog',
    },
    description ? ReactModule.createElement('text', null, description) : null,
    ReactModule.createElement('button', { onPress: () => onApply('month') }, 'This month only'),
    ReactModule.createElement('button', { onPress: () => onApply('following') }, 'This and following months'),
    ReactModule.createElement('button', { accessibilityLabel: 'Close', onPress: onClose }, 'Close')) : null,
  };
});

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
    AppState: { addEventListener: () => ({ remove: jest.fn() }), currentState: 'active' },
    BackHandler: { addEventListener: () => ({ remove: jest.fn() }), exitApp: jest.fn() },
    FlatList,
    Keyboard: {
      addListener: (event: string, listener: (event: { endCoordinates: { height: number } }) => void) => {
        mockKeyboardListeners[event] = listener;
        return { remove: jest.fn() };
      },
    },
    KeyboardAvoidingView: node('keyboard-avoiding-view'),
    Modal: node('modal'),
    Platform: { OS: 'ios' },
    PanResponder: { create: (handlers: object) => ({ panHandlers: handlers }) },
    Pressable: node('pressable'),
    ActivityIndicator: node('activityindicator'),
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

function findPressable(renderer: TestRenderer.ReactTestRenderer, label: string) {
  const control = renderer.root.findAllByProps({ accessibilityLabel: label })
    .find((node) => typeof node.props.onPress === 'function');
  if (!control) throw new Error(`Button ${label} was not rendered.`);
  return control;
}

function pressControl(renderer: TestRenderer.ReactTestRenderer, label: string) {
  const control = findPressable(renderer, label);
  const onPress = control.props.onPress;
  if (typeof onPress !== 'function') throw new Error(`Button ${label} has no press handler.`);
  act(() => onPress());
}

async function pressControlAndWait(renderer: TestRenderer.ReactTestRenderer, label: string) {
  const control = findPressable(renderer, label);
  const onPress = control.props.onPress;
  if (typeof onPress !== 'function') throw new Error(`Button ${label} has no press handler.`);
  await act(async () => {
    const result = onPress();
    if (result instanceof Promise) await result;
  });
}

function visibleText(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root.findAllByType('text')
    .map((node) => textContent(node.props.children))
    .join(' ');
}

function expectNoInlineBudgetScopeControl(renderer: TestRenderer.ReactTestRenderer): void {
  const isScopeOption = (option: unknown): boolean =>
    typeof option === 'object'
    && option !== null
    && 'label' in option
    && option.label === 'This month only';
  const scopeControls = renderer.root.findAll((node) =>
    String(node.type) === 'segmentedcontrol'
    && Array.isArray(node.props.options)
    && node.props.options.some(isScopeOption));
  expect(scopeControls).toHaveLength(0);
}

function textContent(value: React.ReactNode): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textContent).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(value)) return textContent(value.props.children);
  return '';
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


function selectDropdownOption(
  renderer: TestRenderer.ReactTestRenderer | undefined,
  fieldLabel: string,
  optionTitle: string,
) {
  if (!renderer) throw new Error('Budget screen renderer was not created.');
  openDropdown(renderer, fieldLabel);
  const option = renderer.root.findAllByProps({ accessibilityLabel: optionTitle })
    .find((node) => node.props.accessibilityRole === 'radio');
  if (!option) throw new Error(`Dropdown option ${optionTitle} was not rendered.`);
  act(() => option.props.onPress());
}

function openDropdown(
  renderer: TestRenderer.ReactTestRenderer,
  fieldLabel: string,
) {
  const field = renderer.root.findAllByProps({ accessibilityLabel: fieldLabel })
    .find((node) => typeof node.props.onPress === 'function');
  if (!field) throw new Error(`Dropdown field ${fieldLabel} was not rendered.`);
  act(() => field.props.onPress());
}

describe('route render smoke audit', () => {
  const screens: [string, React.ReactElement][] = [
    ['Security', React.createElement(SecurityScreen)],
    ['Reminders', React.createElement(RemindersScreen)],
    ['Payment confirmation', React.createElement(PaymentConfirmScreen)],
    ['Home', React.createElement(HomeScreen)],
    ['Budget', React.createElement(BudgetScreen)],
    ['Budget section form', React.createElement(BudgetSectionFormScreen)],
    ['Budget item form', React.createElement(BudgetItemFormScreen)],
    ['Budget income form', React.createElement(BudgetIncomeFormScreen)],
    ['Goals', React.createElement(GoalsScreen)],
    ['Transactions', React.createElement(TransactionsScreen)],
    ['Backup', React.createElement(BackupScreen)],
    ['Clear past dues', React.createElement(ClearDuesScreen)],
    ['Assets', React.createElement(AssetsScreen)],
    ['Emergency fund', React.createElement(EmergencyFundScreen)],
    ['Insurance', React.createElement(InsuranceScreen)],
    ['Emergency fund allocation form', React.createElement(EfAllocationFormScreen)],
    ['Emergency fund allocation item form', React.createElement(EfBucketFormScreen)],
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
    ['Policy form edit', React.createElement(PolicyFormScreen)],
    ['Policy form create', React.createElement(PolicyFormScreen)],
    ['Investment entries', React.createElement(InvestmentEntriesScreen)],
    ['Investment form create', React.createElement(InvestmentFormScreen)],
    ['Investment form edit', React.createElement(InvestmentFormScreen)],
    ['Investment entry form create', React.createElement(InvestmentEntryFormScreen)],
    ['Investment entry form edit', React.createElement(InvestmentEntryFormScreen)],
  ];

  it.each([
    ['Home', () => React.createElement(HomeScreen)],
    ['Transactions', () => React.createElement(TransactionsScreen)],
    ['Goals', () => React.createElement(GoalsScreen)],
    ['Budget', () => React.createElement(BudgetScreen)],
  ])('%s renders at 1.3x and 2.0x text scale', async (_name, createScreen) => {
    for (const fontScale of [1.3, 2]) {
      mockFontScale = fontScale;
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      await act(async () => {
        renderer = renderScreen(createScreen());
        await Promise.resolve();
      });
      if (!renderer) throw new Error(`${_name} did not render at ${fontScale}x.`);
      act(() => renderer?.unmount());
      renderer = undefined;
    }
    mockFontScale = 1;
  });

  it.each(screens)('%s renders without verb text', async (name, screen) => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(screen);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Route did not render.');
    const screenKind = name === 'Home'
      ? 'home'
      : name.startsWith('Budget item form') || name.startsWith('Budget income form')
        ? 'budget-form'
        : undefined;
    assertNoVerbText(renderer.root, { screen: screenKind });
  });

  it('exports encrypted backups by default without writing plaintext or persisting the passphrase', async () => {
    mockFileWrites.length = 0;
    mockFontScale = 1;
    mockConfirmAsync.mockClear();
    mockConfirmAsync.mockResolvedValue(true);
    mockGetRandomBytesAsync.mockClear();
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
    jest.mocked(Sharing.shareAsync).mockClear();
    jest.mocked(AsyncStorage.setItem).mockClear();

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      for (const fontScale of [1.3, 2]) {
        mockFontScale = fontScale;
        renderer = renderScreen(React.createElement(BackupScreen));
        const passphrase = renderer.root.findByProps({ accessibilityLabel: 'Passphrase' });
        const confirmation = renderer.root.findByProps({ accessibilityLabel: 'Confirm passphrase' });
        act(() => {
          passphrase.props.onChangeText('a sufficiently long passphrase');
          confirmation.props.onChangeText('a sufficiently long passphrase');
        });
        expect(renderer.root.findByProps({ accessibilityLabel: 'Passphrase' }).props.secureTextEntry).toBe(true);
        pressControl(renderer, 'Show passphrase');
        expect(renderer.root.findByProps({ accessibilityLabel: 'Passphrase' }).props.secureTextEntry).toBe(false);
        if (fontScale === 2) {
          await pressControlAndWait(renderer, 'Export encrypted backup');
        }
        act(() => renderer?.unmount());
        renderer = undefined;
      }

      expect(mockGetRandomBytesAsync.mock.calls.map(([length]) => length)).toEqual([16, 12]);
      expect(mockFileWrites).toHaveLength(1);
      const writtenFile = mockFileWrites[0];
      if (!writtenFile) throw new Error('The encrypted export did not write a file.');
      expect(isEncryptedBackup(writtenFile)).toBe(true);
      expect(writtenFile).not.toContain('a sufficiently long passphrase');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const persistedValues = jest.mocked(AsyncStorage.setItem).mock.calls
        .map(([, value]) => value)
        .join('\n');
      expect(persistedValues).not.toContain('a sufficiently long passphrase');
      expect(Sharing.shareAsync).toHaveBeenCalledTimes(1);
    } finally {
      mockFontScale = 1;
      if (renderer) act(() => renderer?.unmount());
    }
  });

  it('retries encrypted imports after a wrong passphrase and still accepts plain backups', async () => {
    const plainText = await createBackup(emptyAppData(todayISO()), {
      exportedAt: '2026-10-10T10:00:00.000Z',
      digest: async () => 'digest',
    });
    const correctPassphrase = 'a sufficiently long passphrase';
    const encryptedText = await encryptBackup(plainText, correctPassphrase, {
      salt: Uint8Array.from({ length: 16 }, (_, index) => index),
      nonce: Uint8Array.from({ length: 12 }, (_, index) => index + 16),
      kdf: { name: 'scrypt', params: { N: 2 ** 15, r: 8, p: 1, dkLen: 32 } },
    });
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://encrypted-backup', name: 'encrypted.json', lastModified: 0 }],
    });
    mockPickedFileText = encryptedText;
    mockConfirmAsync.mockClear();

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(BackupScreen));
      await pressControlAndWait(renderer, 'Import from file');
      expect(visibleText(renderer)).toContain('This backup is encrypted.');
      const passphrase = renderer.root.findByProps({ accessibilityLabel: 'Backup passphrase' });
      await act(async () => {
        passphrase.props.onChangeText('an incorrect long passphrase');
        await Promise.resolve();
      });
      expect(renderer.root.findByProps({ accessibilityLabel: 'Backup passphrase' }).props.value)
        .toBe('an incorrect long passphrase');
      await pressControlAndWait(renderer, 'Unlock backup');
      expect(visibleText(renderer)).toContain('AES-GCM cannot distinguish between those causes.');
      expect(useAppStore.getState().actions.replaceAllData).not.toHaveBeenCalled();

      const retry = renderer.root.findByProps({ accessibilityLabel: 'Backup passphrase' });
      await act(async () => {
        retry.props.onChangeText(correctPassphrase);
        await Promise.resolve();
      });
      await pressControlAndWait(renderer, 'Unlock backup');
      expect(visibleText(renderer)).toContain('Backup from');
      expect(useAppStore.getState().actions.replaceAllData).not.toHaveBeenCalled();
    } finally {
      if (renderer) act(() => renderer?.unmount());
      mockPickedFileText = plainText;
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://plain-backup', name: 'plain.json', lastModified: 0 }],
      });
    }

    let plainRenderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      plainRenderer = renderScreen(React.createElement(BackupScreen));
      await pressControlAndWait(plainRenderer, 'Import from file');
      expect(visibleText(plainRenderer)).toContain('Backup from');
    } finally {
      if (plainRenderer) act(() => plainRenderer?.unmount());
      mockPickedFileText = '';
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: true, assets: null });
    }
  }, 30_000);

  it('requires an explicit warning when opting out of encryption', async () => {
    mockFileWrites.length = 0;
    mockConfirmAsync.mockClear();
    mockConfirmAsync.mockResolvedValue(true);
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(BackupScreen));
      const encryptSwitch = renderer.root.findByProps({ accessibilityLabel: 'Encrypt exported backup' });
      act(() => encryptSwitch.props.onValueChange(false));
      expect(visibleText(renderer)).toContain('This file will be unencrypted.');
      await pressControlAndWait(renderer, 'Export plain backup');
      expect(mockConfirmAsync).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Export plain backup?',
        message: expect.stringContaining('will not be encrypted'),
      }));
      expect(mockFileWrites[0]).toMatch(/"app":\s*"wealthwise"/);
      expect(isEncryptedBackup(mockFileWrites[0] ?? '')).toBe(false);
    } finally {
      if (renderer) act(() => renderer?.unmount());
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

  it.each([
    ['denied', 'Notification permission was not granted. Reminders remain off.'],
    ['blocked', 'Allow notifications in system settings to turn reminders on.'],
  ])('shows the existing %s permission fix message after prompt setup', async (setup, message) => {
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    routeParams.mockReturnValue({ setup });
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        renderer = TestRenderer.create(<RemindersScreen />);
        await Promise.resolve();
        await Promise.resolve();
      });
      if (!renderer) throw new Error('Reminders renderer was not created.');
      expect(renderer.root.findAllByType('text')
        .some((node) => node.children.join('') === message)).toBe(true);
    } finally {
      act(() => renderer?.unmount());
      routeParams.mockReturnValue({});
    }
  });

  it('renders each route form with representative create and edit entry params', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const storeState = useAppStore((state) => state);
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousRouteData = { ...routeData };
    const previousStoreData = storeState.data;
    const previousParams = routeParams();
    const demoData = buildDemoData(todayISO());
    const goal = demoData.goals[0];
    const transaction = demoData.transactions[0];
    const plan = demoData.holdings.find((holding) => holding.kind === 'plan');
    const liability = demoData.liabilities.find((item) => item.payments.length > 0);
    const policy = demoData.policies[0];
    const entryHolding = demoData.holdings.find((holding) => holding.logs.length > 0);
    const budgetSection = demoData.budgetPlan?.sections.find((section) => section.system === undefined);
    const budgetItem = demoData.budgetPlan?.items.find((item) => item.sectionId === budgetSection?.id);
    const budgetIncome = demoData.budgetPlan?.incomes[0];

    if (!goal || !transaction || !plan || !liability?.payments[0] || !policy
      || !entryHolding?.logs[0] || !budgetSection || !budgetItem || !budgetIncome) {
      throw new Error('Demo data is missing a route-form edit fixture.');
    }
    const forms: [string, Record<string, string>, React.ReactElement][] = [
      ['Profile', {}, React.createElement(ProfileFormScreen)],
      ['Goal create', {}, React.createElement(GoalFormScreen)],
      ['Goal edit', { id: goal.id }, React.createElement(GoalFormScreen)],
      ['Transaction create from Budget', {
        type: 'expense', category: 'Food', amount: '100', date: todayISO(),
      }, React.createElement(TransactionFormScreen)],
      ['Transaction edit from list/detail', { id: transaction.id }, React.createElement(TransactionFormScreen)],
      ['Investment plan create from Transaction', { fromTransaction: '1' }, React.createElement(InvestmentFormScreen)],
      ['Investment plan edit', { id: plan.id }, React.createElement(InvestmentFormScreen)],
      ['Liability create from Home/list', {}, React.createElement(LiabilityFormScreen)],
      ['Liability edit', { id: liability.id }, React.createElement(LiabilityFormScreen)],
      ['Liability closure', { liabilityId: liability.id }, React.createElement(LiabilityClosureFormScreen)],
      ['Closed liability note', { liabilityId: liability.id }, React.createElement(LiabilityClosureNoteFormScreen)],
      ['Liability payment add from due/list', {
        liabilityId: liability.id, kind: 'Payment', amount: '1', date: todayISO(),
      }, React.createElement(LiabilityPaymentFormScreen)],
      ['Liability payment edit', {
        liabilityId: liability.id, paymentId: liability.payments[0].id,
      }, React.createElement(LiabilityPaymentFormScreen)],
      ['Policy edit', { id: policy.id }, React.createElement(PolicyFormScreen)],
      ['Policy create', {}, React.createElement(PolicyFormScreen)],
      ['Budget section create', { month: todayISO().slice(0, 7), type: 'spend', scope: 'following' },
        React.createElement(BudgetSectionFormScreen)],
      ['Budget section rename', {
        month: todayISO().slice(0, 7), sectionId: budgetSection.id, scope: 'month',
      }, React.createElement(BudgetSectionFormScreen)],
      ['Budget item add', {
        month: todayISO().slice(0, 7), sectionId: budgetSection.id, scope: 'following',
      }, React.createElement(BudgetItemFormScreen)],
      ['Budget item edit', {
        month: todayISO().slice(0, 7), sectionId: budgetItem.sectionId, itemId: budgetItem.id, scope: 'month',
      }, React.createElement(BudgetItemFormScreen)],
      ['Budget income add', { month: todayISO().slice(0, 7), scope: 'following' },
        React.createElement(BudgetIncomeFormScreen)],
      ['Budget income edit', {
        month: todayISO().slice(0, 7), incomeId: budgetIncome.id, scope: 'month',
      }, React.createElement(BudgetIncomeFormScreen)],
      ['Insurance from Goals/Budget/Home', {}, React.createElement(InsuranceScreen)],
      ['Investment entry add', { holdingId: entryHolding.id, kind: 'Deposit', date: todayISO() },
        React.createElement(InvestmentEntryFormScreen)],
      ['Investment entry edit', {
        holdingId: entryHolding.id, entryId: entryHolding.logs[0].id,
      }, React.createElement(InvestmentEntryFormScreen)],
      ['Clear dues from Home/Transactions', { kind: 'plan', id: plan.id },
        React.createElement(ClearDuesScreen)],
      ['Emergency fund allocation', {}, React.createElement(EfAllocationFormScreen)],
      ['Emergency fund allocation item create', {}, React.createElement(EfBucketFormScreen)],
      ['Emergency fund allocation item edit', { id: demoData.efCustomBuckets[0]?.id ?? '' },
        React.createElement(EfBucketFormScreen)],
    ];
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    try {
      Object.assign(routeData, demoData);
      storeState.data = demoData;
      for (const [name, params, screen] of forms) {
        routeParams.mockReturnValue(params);
        renderer = renderScreen(screen);
        if (renderer.root.findAll((node) => String(node.type) === 'screen').length === 0
          || renderer.root.findAll((node) => String(node.type) === 'text').length === 0) {
          throw new Error(`${name} did not render a form screen and title.`);
        }
        act(() => renderer?.unmount());
        renderer = undefined;
      }
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      storeState.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
    }
  });

  it.each([1.3, 2])('renders Budget route forms in the shared shell at font scale %s', (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const storeState = useAppStore((state) => state);
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousRouteData = { ...routeData };
    const previousStoreData = storeState.data;
    const previousParams = routeParams();
    const month = monthKey(todayISO());
    const plan = budgetPlanFromLines([{ category: 'Food', mode: 'amount', value: 200 }], {
      incomes: [{ id: 'salary-row', name: 'Salary', category: 'Salary', amount: 10_000 }],
    });
    plan.sections.push({ id: 'pets', name: 'Pets', type: 'spend' });
    const snapshot = monthBudgetFromLines(month, [{ category: 'Food', planned: 200 }], {
      incomes: plan.incomes,
    });
    snapshot.sections = plan.sections.map((section) => ({ ...section }));
    Object.assign(routeData, {
      budgetPlan: plan,
      monthBudgets: [snapshot],
      transactions: [],
    });
    storeState.data = routeData;
    mockFontScale = fontScale;

    try {
      const forms = [
        {
          name: 'section create',
          screen: BudgetSectionFormScreen,
          params: { month, type: 'spend', scope: 'following' },
          title: 'Add category',
          editing: false,
        },
        {
          name: 'section edit',
          screen: BudgetSectionFormScreen,
          params: { month, sectionId: 'pets', scope: 'month' },
          title: 'Rename category',
          editing: true,
        },
        {
          name: 'item create',
          screen: BudgetItemFormScreen,
          params: { month, sectionId: 'pets' },
          title: 'Add item',
          editing: false,
        },
        {
          name: 'item edit',
          screen: BudgetItemFormScreen,
          params: { month, sectionId: 'pets', itemId: 'pet-care', scope: 'month' },
          title: 'Edit item',
          editing: true,
        },
        {
          name: 'income create',
          screen: BudgetIncomeFormScreen,
          params: { month, scope: 'following' },
          title: 'Add income',
          editing: false,
        },
        {
          name: 'income edit',
          screen: BudgetIncomeFormScreen,
          params: { month, incomeId: 'salary-row', scope: 'month' },
          title: 'Edit income',
          editing: true,
        },
      ];
      plan.items.push({ id: 'pet-care', sectionId: 'pets', name: 'Pet care', mode: 'amount', value: 300 });
      snapshot.items = plan.items.map((item) => ({ ...item }));
      for (const form of forms) {
        routeParams.mockReturnValue(form.params);
        const renderer = renderScreen(React.createElement(form.screen));
        expect(renderer.root.findByProps({ testID: 'form-shell' })).toBeDefined();
        expect(renderer.root.findByProps({ testID: 'form-shell-header' })).toBeDefined();
        expect(renderer.root.findByProps({ testID: 'form-shell-body' })).toBeDefined();
        expect(renderer.root.findByProps({ testID: 'form-shell-footer' })).toBeDefined();
        expect(renderer.root.findByProps({ accessibilityLabel: 'Back' })).toBeDefined();
        expect(renderer.root.findByProps({ accessibilityLabel: 'Save' })).toBeDefined();
        expect(renderer.root.findAllByType('text').map((node) => node.children.join('')))
          .toContain(form.title);
        expect(renderer.root.findAllByType('text').map((node) => node.children.join('')))
          .not.toContain('Apply changes to');
        expect(renderer.root.findAll((node) => String(node.type) === 'segmentedcontrol')
          .some((node) => node.props.label === 'Apply changes to')).toBe(false);
        if (form.name.startsWith('item')) {
          expect(renderer.root.findAllByType(Dropdown)).toHaveLength(2);
          expect(renderer.root.findAllByType('text').map((node) => node.children.join('')))
            .not.toContain('Custom');
          expect(renderer.root.findAllByType('text').map((node) => node.children.join('')))
            .toContain('Section · Pets');
        }
        if (form.editing && !form.name.startsWith('section')) {
          expect(renderer.root.findByProps({
            accessibilityLabel: form.name.startsWith('item') ? 'Delete item' : 'Delete income',
          })).toBeDefined();
        }
        act(() => renderer.unmount());
      }
    } finally {
      Object.assign(routeData, previousRouteData);
      storeState.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      mockFontScale = 1;
    }
  });

  it('saves Budget route forms with scope, Undo, validation and edit-only delete actions', async () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const storeState = useAppStore((state) => state);
    const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
      addSection: jest.Mock;
      renameSection: jest.Mock;
      deleteSection: jest.Mock;
      addBudgetItem: jest.Mock;
      editBudgetStructureItem: jest.Mock;
      deleteBudgetStructureItem: jest.Mock;
      addBudgetIncome: jest.Mock;
      editBudgetIncome: jest.Mock;
      removeBudgetItem: jest.Mock;
      restoreBudgetPlanAndMonth: jest.Mock;
    };
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousRouteData = { ...routeData };
    const previousStoreData = storeState.data;
    const previousParams = routeParams();
    const month = monthKey(todayISO());
    const salary = { id: 'salary-row', name: 'Salary', category: 'Salary' as const, amount: 10_000 };
    const plan = budgetPlanFromLines([{ category: 'Food', mode: 'amount', value: 200 }], {
      incomes: [salary],
      repeatMonthly: true,
      repeatFrom: month,
    });
    plan.sections.push({ id: 'pets', name: 'Pets', type: 'spend' });
    plan.items.push({ id: 'pet-care', sectionId: 'pets', name: 'Pet care', mode: 'amount', value: 300 });
    const snapshot = monthBudgetFromLines(month, [{ category: 'Food', planned: 200 }], {
      incomes: [salary],
    });
    snapshot.sections = plan.sections.map((section) => ({ ...section }));
    snapshot.items = plan.items.map((item) => ({ ...item }));
    Object.assign(routeData, { budgetPlan: plan, monthBudgets: [snapshot], transactions: [] });
    storeState.data = routeData;
    storeState.lastError = null;
    for (const action of Object.values(actions)) action.mockClear();
    useUIStore.getState().setActionToast(null);

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      routeParams.mockReturnValue({ month, sectionId: 'pets', scope: 'following' });
      renderer = renderScreen(React.createElement(BudgetItemFormScreen));
      expectNoInlineBudgetScopeControl(renderer);
      expect(renderer.root.findAllByType(Dropdown)).toHaveLength(2);
      expect(renderer.root.findByProps({ accessibilityLabel: 'Budget item frequency' }).props.options)
        .toEqual([
          { value: 'monthly', title: 'Monthly' },
          { value: 'quarterly', title: 'Quarterly' },
          { value: 'half-yearly', title: 'Half-yearly' },
          { value: 'yearly', title: 'Yearly' },
        ]);
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Budget item name' }).props.onChangeText('Pet sitting');
        renderer?.root.findByProps({ accessibilityLabel: 'Planned amount' }).props.onChangeText('500');
        await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      const cancelScopeDialog = renderer.root.findByProps({ testID: 'apply-scope-dialog' });
      act(() => cancelScopeDialog.findByProps({ accessibilityLabel: 'Close' }).props.onPress());
      expect(renderer.root.findAllByProps({ testID: 'apply-scope-dialog' })).toHaveLength(0);
      expect(actions.addBudgetItem).not.toHaveBeenCalled();
      await act(async () => {
        await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
        if (!scopeDialog) throw new Error('Budget item scope dialog missing.');
        scopeDialog.findAllByProps({ children: 'This month only' })[0].props.onPress();
        await Promise.resolve();
      });
      expect(actions.addBudgetItem).toHaveBeenCalledWith(month, {
        sectionId: 'pets', name: 'Pet sitting', mode: 'amount', value: 500, frequency: 'monthly',
        firstDueMonth: month,
      }, 'month', todayISO());
      const itemSaveToast = useUIStore.getState().actionToast;
      expect(itemSaveToast?.actionLabel).toBe('Undo');
      act(() => itemSaveToast?.onAction?.());
      expect(actions.restoreBudgetPlanAndMonth).toHaveBeenCalledWith(plan, month, snapshot);
      act(() => renderer?.unmount());
      renderer = undefined;

      routeParams.mockReturnValue({ month, sectionId: 'pets', scope: 'following' });
      renderer = renderScreen(React.createElement(BudgetItemFormScreen));
      const frequencyDropdown = renderer.root.findAllByType(Dropdown)
        .find((node) => node.props.label === 'Frequency');
      if (!frequencyDropdown) throw new Error('Budget item frequency control missing.');
      const frequencyControl = renderer.root.findAllByProps({
        accessibilityLabel: 'Budget item frequency',
      }).find((node) => typeof node.props.onPress === 'function');
      if (!frequencyControl) throw new Error('Budget item frequency button missing.');
      act(() => frequencyControl.props.onPress());
      act(() => renderer?.root.findByProps({ accessibilityLabel: 'Quarterly' }).props.onPress());
      expect(renderer.root.findAllByType(Dropdown)).toHaveLength(2);
      const firstDueMonth = shiftMonth(month, 3);
      const firstDueDropdown = renderer.root.findAllByType(Dropdown)
        .find((node) => node.props.label === 'Start month');
      if (!firstDueDropdown) throw new Error('Start month control missing.');
      expect(firstDueDropdown.props.value).toBe(month);
      expect(firstDueDropdown.props.options).toHaveLength(25);
      expect(firstDueDropdown.props.options[0]).toMatchObject({ value: month });
      const firstDueControl = renderer.root.findAllByProps({
        accessibilityLabel: 'Budget item start month',
      }).find((node) => typeof node.props.onPress === 'function');
      if (!firstDueControl) throw new Error('Start month button missing.');
      act(() => firstDueControl.props.onPress());
      act(() => renderer?.root.findByProps({ accessibilityLabel: formatMonth(firstDueMonth) }).props.onPress());
      const valueTypeControl = renderer.root.findAll((node) =>
        String(node.type) === 'segmentedcontrol' && node.props.value === 'amount',
      )[0];
      expect(valueTypeControl?.props.options).toEqual([{ label: 'Amount', value: 'amount' }]);
      const addCallsBeforeConflict = actions.addBudgetItem.mock.calls.length;
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Budget item name' }).props.onChangeText('Quarterly pet care');
        renderer?.root.findByProps({ accessibilityLabel: 'Planned amount' }).props.onChangeText('700');
        await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
        if (!scopeDialog) throw new Error('Budget item start-month scope dialog missing.');
        scopeDialog.findAllByProps({ children: 'This month only' })[0].props.onPress();
        await Promise.resolve();
      });
      expect(actions.addBudgetItem).toHaveBeenCalledTimes(addCallsBeforeConflict);
      expect(visibleText(renderer))
        .toContain('This month only conflicts with a start month later than the viewed month.');
      await act(async () => {
        await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
        if (!scopeDialog) throw new Error('Budget item scope dialog missing.');
        scopeDialog.findAllByProps({ children: 'This and following months' })[0].props.onPress();
        await Promise.resolve();
      });
      expect(actions.addBudgetItem).toHaveBeenLastCalledWith(month, {
        sectionId: 'pets',
        name: 'Quarterly pet care',
        mode: 'amount',
        value: 700,
        frequency: 'quarterly',
        firstDueMonth: shiftMonth(month, 3),
      }, 'following', todayISO());
      act(() => renderer?.unmount());
      renderer = undefined;

      routeParams.mockReturnValue({ month, sectionId: 'pets', itemId: 'pet-care', scope: 'month' });
      renderer = renderScreen(React.createElement(BudgetItemFormScreen));
      expectNoInlineBudgetScopeControl(renderer);
      expect(renderer.root.findByProps({ accessibilityLabel: 'Delete item' })).toBeDefined();
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Budget item name' }).props.onChangeText('Pet boarding');
        renderer?.root.findByProps({ accessibilityLabel: 'Due day' }).props.onChangeText('12');
        await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
        if (!scopeDialog) throw new Error('Budget item edit scope dialog missing.');
        scopeDialog.findAllByProps({ children: 'This month only' })[0].props.onPress();
        await Promise.resolve();
      });
      expect(actions.editBudgetStructureItem).toHaveBeenCalledWith(month, 'pet-care', {
        name: 'Pet boarding', mode: 'amount', value: 300, dueDay: 12,
        frequency: 'monthly', firstDueMonth: month, holdingId: null,
      }, 'month', todayISO());
      act(() => renderer?.unmount());
      renderer = undefined;

      actions.deleteBudgetStructureItem.mockClear();
      actions.restoreBudgetPlanAndMonth.mockClear();
      routeParams.mockReturnValue({ month, sectionId: 'pets', itemId: 'pet-care', scope: 'month' });
      renderer = renderScreen(React.createElement(BudgetItemFormScreen));
      expectNoInlineBudgetScopeControl(renderer);
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Delete item' }).props.onPress();
        await Promise.resolve();
        await Promise.resolve();
      });
      const cancelDeleteScopeDialog = renderer.root.findByProps({ testID: 'apply-scope-dialog' });
      act(() => cancelDeleteScopeDialog.findByProps({ accessibilityLabel: 'Close' }).props.onPress());
      expect(renderer.root.findAllByProps({ testID: 'apply-scope-dialog' })).toHaveLength(0);
      expect(actions.deleteBudgetStructureItem).not.toHaveBeenCalled();
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Delete item' }).props.onPress();
        await Promise.resolve();
        await Promise.resolve();
      });
      await act(async () => {
        const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
        if (!scopeDialog) throw new Error('Budget item delete scope dialog missing.');
        scopeDialog.findAllByProps({ children: 'This month only' })[0].props.onPress();
        await Promise.resolve();
      });
      expect(actions.deleteBudgetStructureItem).toHaveBeenCalledWith(month, 'pet-care', 'month', todayISO());
      const itemDeleteToast = useUIStore.getState().actionToast;
      expect(itemDeleteToast?.actionLabel).toBe('Undo');
      act(() => itemDeleteToast?.onAction?.());
      expect(actions.restoreBudgetPlanAndMonth).toHaveBeenCalledWith(plan, month, snapshot);
      act(() => renderer?.unmount());
      renderer = undefined;

      routeParams.mockReturnValue({ month, scope: 'following' });
      renderer = renderScreen(React.createElement(BudgetSectionFormScreen));
      expectNoInlineBudgetScopeControl(renderer);
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Budget category name' }).props.onChangeText('Trips');
        const type = renderer?.root.findAll((node) => String(node.type) === 'segmentedcontrol')
          .find((node) => node.props.options?.some((option: { value: string }) => option.value === 'invest'));
        type?.props.onChange('invest');
        await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
        if (!scopeDialog) throw new Error('Budget section scope dialog missing.');
        scopeDialog.findAllByProps({ children: 'This and following months' })[0].props.onPress();
        await Promise.resolve();
      });
      expect(actions.addSection).toHaveBeenCalledWith(month, { name: 'Trips', type: 'invest' }, 'following', todayISO());
      act(() => renderer?.unmount());
      renderer = undefined;

      routeParams.mockReturnValue({ month, sectionId: 'pets', name: 'Pets', scope: 'month' });
      renderer = renderScreen(React.createElement(BudgetSectionFormScreen));
      expectNoInlineBudgetScopeControl(renderer);
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Budget category name' }).props.onChangeText('Animal care');
        await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
        if (!scopeDialog) throw new Error('Budget section edit scope dialog missing.');
        scopeDialog.findAllByProps({ children: 'This month only' })[0].props.onPress();
        await Promise.resolve();
      });
      expect(actions.renameSection).toHaveBeenCalledWith(month, 'pets', 'Animal care', 'month', todayISO());
      act(() => renderer?.unmount());
      renderer = undefined;

      actions.deleteSection.mockClear();
      actions.restoreBudgetPlanAndMonth.mockClear();
      mockConfirmAsync.mockClear();
      routeParams.mockReturnValue({ month, sectionId: 'pets', scope: 'following' });
      renderer = renderScreen(React.createElement(BudgetSectionFormScreen));
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Delete category' }).props.onPress();
      });
      const deleteSectionDialog = renderer.root.findByProps({ testID: 'apply-scope-dialog' });
      expect(deleteSectionDialog.findAllByProps({ children: 'This category contains 1 budget item.' }))
        .toHaveLength(1);
      expect(mockConfirmAsync).not.toHaveBeenCalled();
      await act(async () => {
        deleteSectionDialog.findAllByProps({ children: 'This and following months' })[0].props.onPress();
        await Promise.resolve();
      });
      expect(actions.deleteSection).toHaveBeenCalledWith(month, 'pets', 'following', todayISO());
      const sectionDeleteToast = useUIStore.getState().actionToast;
      expect(sectionDeleteToast?.actionLabel).toBe('Undo');
      act(() => sectionDeleteToast?.onAction?.());
      expect(actions.restoreBudgetPlanAndMonth).toHaveBeenCalledWith(plan, month, snapshot);
      act(() => renderer?.unmount());
      renderer = undefined;

      routeParams.mockReturnValue({ month, scope: 'following' });
      renderer = renderScreen(React.createElement(BudgetIncomeFormScreen));
      expectNoInlineBudgetScopeControl(renderer);
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Income name' }).props.onChangeText('Consulting');
        renderer?.root.findByProps({ accessibilityLabel: 'Income amount' }).props.onChangeText('1500');
        selectDropdownOption(renderer, 'Income category', 'Freelance');
        renderer?.root.findByProps({ accessibilityLabel: 'Income day' }).props.onChangeText('15');
        await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
        if (!scopeDialog) throw new Error('Budget income scope dialog missing.');
        scopeDialog.findAllByProps({ children: 'This and following months' })[0].props.onPress();
        await Promise.resolve();
      });
      expect(actions.addBudgetIncome).toHaveBeenCalledWith(month, {
        name: 'Consulting', amount: 1500, category: 'Freelance', day: 15, frequency: 'monthly',
      }, 'following', todayISO());
      act(() => renderer?.unmount());
      renderer = undefined;

      routeParams.mockReturnValue({ month, incomeId: 'salary-row', scope: 'month' });
      renderer = renderScreen(React.createElement(BudgetIncomeFormScreen));
      expectNoInlineBudgetScopeControl(renderer);
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Income name' }).props.onChangeText('Contract income');
        renderer?.root.findByProps({ accessibilityLabel: 'Income amount' }).props.onChangeText('12500');
        selectDropdownOption(renderer, 'Income category', 'Freelance');
        await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      await act(async () => {
        const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
        if (!scopeDialog) throw new Error('Budget income edit scope dialog missing.');
        scopeDialog.findAllByProps({ children: 'This month only' })[0].props.onPress();
        await Promise.resolve();
      });
      expect(actions.editBudgetIncome).toHaveBeenCalledWith(month, 'salary-row', {
        name: 'Contract income', amount: 12500, category: 'Freelance', frequency: 'monthly',
      }, 'month', todayISO());
      const incomeRenderer = renderer;
      if (!incomeRenderer) throw new Error('Budget income form renderer was not created.');
      expect(incomeRenderer.root.findByProps({ accessibilityLabel: 'Delete income' })).toBeDefined();
      act(() => incomeRenderer.unmount());
      renderer = undefined;

      actions.removeBudgetItem.mockClear();
      actions.restoreBudgetPlanAndMonth.mockClear();
      routeParams.mockReturnValue({ month, incomeId: 'salary-row', scope: 'month' });
      renderer = renderScreen(React.createElement(BudgetIncomeFormScreen));
      expectNoInlineBudgetScopeControl(renderer);
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Delete income' }).props.onPress();
        await Promise.resolve();
        await Promise.resolve();
      });
      await act(async () => {
        const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
        if (!scopeDialog) throw new Error('Budget income delete scope dialog missing.');
        scopeDialog.findAllByProps({ children: 'This month only' })[0].props.onPress();
        await Promise.resolve();
      });
      expect(actions.removeBudgetItem).toHaveBeenCalledWith(month, {
        kind: 'income', incomeId: 'salary-row', category: 'Salary',
      }, 'month', todayISO());
      const incomeDeleteToast = useUIStore.getState().actionToast;
      expect(incomeDeleteToast?.actionLabel).toBe('Undo');
      act(() => incomeDeleteToast?.onAction?.());
      expect(actions.restoreBudgetPlanAndMonth).toHaveBeenCalledWith(plan, month, snapshot);
      act(() => renderer?.unmount());
      renderer = undefined;

      routeParams.mockReturnValue({ month, sectionId: 'pets', scope: 'following' });
      renderer = renderScreen(React.createElement(BudgetItemFormScreen));
      actions.addBudgetItem.mockClear();
      await act(async () => {
        await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
      });
      expect(actions.addBudgetItem).not.toHaveBeenCalled();
      expect(renderer.root.findByProps({ accessibilityLabel: 'Save' }).props.disabled).toBe(true);
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      storeState.data = previousStoreData;
      storeState.lastError = null;
      routeParams.mockReturnValue(previousParams);
      useUIStore.getState().setActionToast(null);
    }
  });

  it.each([
    [1.3, 'month', 'This month only'],
    [2, 'following', 'This and following months'],
  ] as const)(
    'submits the quarterly income form payload and scope at font scale %s',
    async (fontScale, scope, scopeLabel) => {
      const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
      const storeState = useAppStore((state) => state);
      const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
        addBudgetIncome: jest.Mock;
        editBudgetIncome: jest.Mock;
      };
      const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
      const today = todayISO();
      const month = monthKey(today);
      const firstDueMonth = shiftMonth(month, 1);
      const previousRouteData = { ...routeData };
      const previousStoreData = storeState.data;
      const previousParams = routeParams();
      const previousFontScale = mockFontScale;
      mockFontScale = fontScale;
      routeParams.mockReturnValue({ month, scope });
      actions.addBudgetIncome.mockClear();
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      try {
        renderer = renderScreen(React.createElement(BudgetIncomeFormScreen));
        await act(async () => {
          renderer?.root.findByProps({ accessibilityLabel: 'Income name' }).props.onChangeText('Quarterly contract');
          renderer?.root.findByProps({ accessibilityLabel: 'Income amount' }).props.onChangeText('12000');
          selectDropdownOption(renderer, 'Income category', 'Freelance');
          await Promise.resolve();
        });
        selectDropdownOption(renderer, 'Income frequency', 'Quarterly');
        await act(async () => {
          renderer?.root.findByProps({ accessibilityLabel: 'Income first due month' }).props.onChangeText(firstDueMonth);
          await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
        });
        await act(async () => {
          const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
          if (!scopeDialog) throw new Error('Income recurrence scope dialog missing.');
          scopeDialog.findAllByProps({ children: scopeLabel })[0].props.onPress();
          await Promise.resolve();
        });
        expect(actions.addBudgetIncome).toHaveBeenCalledWith(month, {
          name: 'Quarterly contract',
          amount: 12_000,
          category: 'Freelance',
          frequency: 'quarterly',
          firstDueMonth,
        }, scope, today);
        act(() => renderer?.unmount());
        renderer = undefined;

        const income = {
          id: 'quarterly-route',
          name: 'Quarterly contract',
          category: 'Freelance' as const,
          amount: 12_000,
          day: 5,
          frequency: 'quarterly' as const,
          firstDueMonth,
        };
        const plan = budgetPlanFromLines([], {
          incomes: [income],
          repeatMonthly: true,
          repeatFrom: month,
        });
        const snapshot = monthBudgetFromLines(month, [], {
          incomes: [income],
          source: 'plan',
          sections: plan.sections,
        });
        const data = { ...emptyAppData(today), budgetPlan: plan, monthBudgets: [snapshot] };
        Object.assign(routeData, data);
        storeState.data = data;
        routeParams.mockReturnValue({ month, incomeId: income.id, scope });
        actions.editBudgetIncome.mockClear();
        renderer = renderScreen(React.createElement(BudgetIncomeFormScreen));
        const updatedFirstDueMonth = shiftMonth(month, 2);
        await act(async () => {
          renderer?.root.findByProps({ accessibilityLabel: 'Income name' }).props.onChangeText('Adjusted contract');
          renderer?.root.findByProps({ accessibilityLabel: 'Income amount' }).props.onChangeText('13000');
          selectDropdownOption(renderer, 'Income frequency', 'Half-yearly');
          renderer?.root.findByProps({ accessibilityLabel: 'Income first due month' }).props.onChangeText(updatedFirstDueMonth);
          await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
        });
        await act(async () => {
          const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
          if (!scopeDialog) throw new Error('Income edit recurrence scope dialog missing.');
          scopeDialog.findAllByProps({ children: scopeLabel })[0].props.onPress();
          await Promise.resolve();
        });
        expect(actions.editBudgetIncome).toHaveBeenCalledWith(month, income.id, {
          name: 'Adjusted contract',
          amount: 13_000,
          category: 'Freelance',
          day: 5,
          frequency: 'half-yearly',
          firstDueMonth: updatedFirstDueMonth,
        }, scope, today);
      } finally {
        if (renderer) act(() => renderer?.unmount());
        Object.assign(routeData, previousRouteData);
        storeState.data = previousStoreData;
        routeParams.mockReturnValue(previousParams);
        mockFontScale = previousFontScale;
      }
    },
  );

  it.each([1.3, 2])(
    'keeps non-due quarterly income in the collapsed recurring group at font scale %s',
    (fontScale) => {
      const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
      const storeState = useAppStore((state) => state);
      const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
      const previousRouteData = { ...routeData };
      const previousStoreData = storeState.data;
      const previousParams = routeParams();
      const previousFontScale = mockFontScale;
      const today = todayISO();
      const currentMonth = monthKey(today);
      const month = shiftMonth(currentMonth, 1);
      const firstDueMonth = shiftMonth(month, 1);
      const income = {
        id: 'quarterly-route',
        name: 'Quarterly contract',
        category: 'Freelance' as const,
        amount: 12_000,
        day: 5,
        frequency: 'quarterly' as const,
        firstDueMonth,
      };
      const data = {
        ...emptyAppData(today),
        budgetPlan: budgetPlanFromLines([], {
          incomes: [income],
          repeatMonthly: true,
          repeatFrom: currentMonth,
        }),
      };
      Object.assign(routeData, data);
      storeState.data = data;
      routeParams.mockReturnValue({ month });
      mockFontScale = fontScale;
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      try {
        renderer = renderScreen(React.createElement(BudgetScreen));
        const toggle = renderer.root.findByProps({ testID: 'budget-recurring-income-toggle' });
        expect(toggle.props.accessibilityState).toEqual({ expanded: false });
        act(() => toggle.props.onPress());
        const row = renderer.root.findByProps({ testID: 'budget-recurring-income-row:quarterly-route' });
        expect(row.findAllByType('text').map((node) => textContent(node.props.children)).join(' '))
          .toContain(`Not due this month, next due ${formatMonth(firstDueMonth)}`);
      } finally {
        if (renderer) act(() => renderer?.unmount());
        Object.assign(routeData, previousRouteData);
        storeState.data = previousStoreData;
        routeParams.mockReturnValue(previousParams);
        mockFontScale = previousFontScale;
      }
    },
  );

  it.each([1, 1.3, 2])(
    'reproduces recurring income visibility through the add form and Budget month controls at font scale %s',
    async (fontScale) => {
      const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
      const storeState = useAppStore((state) => state);
      const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
        addBudgetIncome: jest.Mock;
      };
      const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
      const previousRouteData = { ...routeData };
      const previousStoreData = storeState.data;
      const previousParams = routeParams();
      const previousFontScale = mockFontScale;
      const previousAddImplementation = actions.addBudgetIncome.getMockImplementation();
      const previousTxMonth = useUIStore.getState().txMonth;
      const today = todayISO();
      const startingMonth = monthKey(today);
      const firstDueMonth = shiftMonth(startingMonth, 1);
      const frequencies = [
        { frequency: 'quarterly', name: 'Quarterly contract', amount: '12000' },
        { frequency: 'half-yearly', name: 'Half-yearly bonus', amount: '18000' },
        { frequency: 'yearly', name: 'Yearly bonus', amount: '24000' },
      ] as const;
      const plan = budgetPlanFromLines([
        { category: 'Food', mode: 'amount', value: 100 },
      ], {
        incomes: [],
        repeatMonthly: true,
        repeatFrom: startingMonth,
      });
      let data: AppData = applyBudgetPlanToMonth({
        ...emptyAppData(today),
        budgetPlan: plan,
      }, startingMonth, { newId: () => 'unused', today });
      Object.assign(routeData, data);
      storeState.data = data;
      mockFontScale = fontScale;
      let renderer: TestRenderer.ReactTestRenderer | undefined;

      try {
        actions.addBudgetIncome.mockImplementation((
          month: string,
          values: {
            name: string;
            amount: number;
            category: 'Freelance' | 'Other';
            day: number;
            frequency: 'quarterly' | 'half-yearly' | 'yearly';
            firstDueMonth: string;
          },
          scope: 'month' | 'following',
          actionToday: string,
        ) => {
          data = addIncomeItem(data, month, {
            ...values,
            id: `income-${values.frequency}`,
          }, scope, actionToday);
          Object.assign(routeData, data);
          storeState.data = routeData;
        });

        for (const [index, item] of frequencies.entries()) {
          routeParams.mockReturnValue({ month: startingMonth, scope: 'following' });
          renderer = renderScreen(React.createElement(BudgetIncomeFormScreen));
          await act(async () => {
            renderer?.root.findByProps({ accessibilityLabel: 'Income name' }).props.onChangeText(item.name);
            renderer?.root.findByProps({ accessibilityLabel: 'Income amount' }).props.onChangeText(item.amount);
            renderer?.root.findByProps({ accessibilityLabel: 'Income day' }).props.onChangeText('5');
            selectDropdownOption(renderer, 'Income category', index === 0 ? 'Freelance' : 'Other');
            await Promise.resolve();
          });
          selectDropdownOption(renderer, 'Income frequency', item.frequency === 'quarterly'
            ? 'Quarterly'
            : item.frequency === 'half-yearly' ? 'Half-yearly' : 'Yearly');
          await act(async () => {
            renderer?.root.findByProps({ accessibilityLabel: 'Income first due month' }).props.onChangeText(firstDueMonth);
            await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
          });
          await act(async () => {
            const scopeDialog = renderer?.root.findByProps({ testID: 'apply-scope-dialog' });
            if (!scopeDialog) throw new Error('Income recurrence scope dialog missing.');
            scopeDialog.findAllByProps({ children: 'This and following months' })[0].props.onPress();
            await Promise.resolve();
          });
          act(() => renderer?.unmount());
          renderer = undefined;
        }

        expect(data.budgetPlan?.incomes.map(({ frequency, firstDueMonth }) => ({
          frequency,
          firstDueMonth,
        }))).toEqual(frequencies.map(({ frequency }) => ({ frequency, firstDueMonth })));
        routeParams.mockReturnValue({});
        const homeRenderer = renderScreen(React.createElement(HomeScreen));
        const homeNames = homeRenderer.root.findAllByType('text')
          .map((node) => textContent(node.props.children))
          .filter((text) => frequencies.some(({ name }) => text.includes(name)));
        act(() => homeRenderer.unmount());

        routeParams.mockReturnValue({ month: startingMonth });
        renderer = renderScreen(React.createElement(BudgetScreen));
        const monthDump = [];
        for (let offset = 0; offset < 12; offset += 1) {
          const names = frequencies.map(({ name }) => name);
          const textNodes = renderer.root.findAllByType('text')
            .map((node) => textContent(node.props.children))
            .filter((text) => names.some((name) => text.includes(name)));
          const accessibilityLabels = renderer.root.findAll((node) =>
            typeof node.props.accessibilityLabel === 'string'
            && names.some((name) => node.props.accessibilityLabel.includes(name)),
          ).flatMap((node) => (
            typeof node.props.accessibilityLabel === 'string' ? [node.props.accessibilityLabel] : []
          ));
          const month = shiftMonth(startingMonth, offset);
          act(() => useUIStore.getState().setTxMonth(month));
          const transactionsRenderer = renderScreen(React.createElement(TransactionsScreen));
          const transactionTextNodes = transactionsRenderer.root.findAllByType('text')
            .map((node) => textContent(node.props.children))
            .filter((text) => names.some((name) => text.includes(name)));
          const transactionAccessibilityLabels = transactionsRenderer.root.findAll((node) =>
            typeof node.props.accessibilityLabel === 'string'
            && names.some((name) => node.props.accessibilityLabel.includes(name)),
          ).flatMap((node) => (
            typeof node.props.accessibilityLabel === 'string' ? [node.props.accessibilityLabel] : []
          ));
          act(() => transactionsRenderer.unmount());
          const cashFlow = renderer.root.findByProps({ testID: 'budget-cash-flow' });
          const cashFlowLabels = cashFlow.findAll((node) =>
            typeof node.props.accessibilityLabel === 'string',
          ).flatMap((node) => (
            typeof node.props.accessibilityLabel === 'string' ? [node.props.accessibilityLabel] : []
          ));
          const cashFlowAmounts = cashFlow.findAllByType(AmountText)
            .map((node) => node.props.value)
            .filter((value): value is number => typeof value === 'number');
          const incomeAmounts = renderer.root.findByProps({ testID: 'budget-overview-metric-income' })
            .findAllByType(AmountText)
            .map((node) => node.props.value)
            .filter((value): value is number => typeof value === 'number');
          const incomePlanned = incomeAmounts[1];
          if (incomePlanned === undefined) throw new Error('Budget income planned total was not rendered.');
          const frequencySteps = { quarterly: 3, 'half-yearly': 6, yearly: 12 };
          const dueItems = frequencies.filter((item) => {
            const step = frequencySteps[item.frequency];
            return offset >= 1 && (offset - 1) % step === 0;
          });
          const dueNames = dueItems.map((item) => item.name);
          const recurringToggle = renderer.root.findAllByProps({
            testID: 'budget-recurring-income-toggle',
          })[0];
          const recurringExpandedRows: string[] = [];
          if (recurringToggle) {
            expect(recurringToggle.props.accessibilityState).toEqual({ expanded: false });
            act(() => recurringToggle.props.onPress());
            for (const item of frequencies.filter(({ name }) => !dueNames.includes(name))) {
              const row = renderer.root.findByProps({ testID: `budget-recurring-income-row:income-${item.frequency}` });
              const rowText = row.findAllByType('text')
                .map((node) => textContent(node.props.children))
                .join(' ');
              const step = frequencySteps[item.frequency];
              const nextOffset = offset < 1
                ? 1
                : 1 + (Math.floor((offset - 1) / step) + 1) * step;
              const expectedNextDue = formatMonth(shiftMonth(startingMonth, nextOffset));
              expect(rowText).toContain(`Not due this month, next due ${expectedNextDue}`);
              recurringExpandedRows.push(rowText);
            }
            act(() => renderer?.root.findByProps({
              testID: 'budget-recurring-income-toggle',
            }).props.onPress());
          }
          monthDump.push({
            month,
            textNodes,
            accessibilityLabels,
            transactionTextNodes,
            transactionAccessibilityLabels,
            homeNames,
            cashFlowLabels,
            incomePlanned,
            cashFlowAmounts,
            recurringExpandedRows,
          });
          const budgetNames = [...textNodes, ...accessibilityLabels].join(' ');
          const transactionNames = [...transactionTextNodes, ...transactionAccessibilityLabels].join(' ');
          for (const item of frequencies) {
            if (budgetNames.includes(item.name) !== dueNames.includes(item.name)) {
              throw new Error(JSON.stringify({
                month,
                item: item.name,
                dueNames,
                firstDueMonth,
                planIncomes: data.budgetPlan?.incomes,
                monthIncomes: data.monthBudgets?.[0]?.incomes,
                budgetNames: [...textNodes, ...accessibilityLabels],
                recurringExpandedRows,
              }));
            }
            expect(transactionNames.includes(item.name)).toBe(false);
          }
          expect(homeNames).toEqual([]);
          const expectedPlannedIncome = dueItems.reduce((sum, item) => sum + Number(item.amount), 0);
          expect(incomePlanned).toBe(expectedPlannedIncome);
          if (offset > 0) {
            const opening = cashFlowAmounts[0];
            const closing = cashFlowAmounts[1];
            if (opening === undefined || closing === undefined) {
              throw new Error('Budget cash-flow opening and closing values were not rendered.');
            }
            expect(closing - opening).toBe(expectedPlannedIncome - 100);
          }
          if (offset < 11) {
            act(() => renderer?.root.findByProps({ accessibilityLabel: 'Next month' }).props.onPress());
          }
        }
        console.log('P29-AB-R2 after-fix 12-month screen table', JSON.stringify(monthDump, null, 2));
      } finally {
        if (renderer) act(() => renderer?.unmount());
        Object.assign(routeData, previousRouteData);
        storeState.data = previousStoreData;
        routeParams.mockReturnValue(previousParams);
        mockFontScale = previousFontScale;
        useUIStore.getState().setTxMonth(previousTxMonth);
        actions.addBudgetIncome.mockReset();
        if (previousAddImplementation) actions.addBudgetIncome.mockImplementation(previousAddImplementation);
      }
    },
  );

  it('wires Budget section, item, income and unbudgeted entry points to routes', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const storeState = useAppStore((state) => state);
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
      deleteSection: jest.Mock;
      restoreBudgetPlanAndMonth: jest.Mock;
    };
    const previousRouteData = { ...routeData };
    const previousStoreData = storeState.data;
    const previousParams = routeParams();
    const month = monthKey(todayISO());
    const salary = { id: 'salary-row', name: 'Salary', category: 'Salary' as const, amount: 10_000 };
    const plan = budgetPlanFromLines([{ category: 'Food', mode: 'amount', value: 200 }], {
      incomes: [salary],
      repeatMonthly: true,
      repeatFrom: month,
    });
    plan.sections.push({ id: 'pets', name: 'Pets', type: 'spend' });
    plan.items.push({ id: 'pet-care', sectionId: 'pets', name: 'Pet care', mode: 'amount', value: 300 });
    const snapshot = monthBudgetFromLines(month, [{ category: 'Food', planned: 200 }], { incomes: [salary] });
    snapshot.sections = plan.sections.map((section) => ({ ...section }));
    snapshot.items = plan.items.map((item) => ({ ...item }));
    Object.assign(routeData, {
      budgetPlan: plan,
      monthBudgets: [snapshot],
      transactions: [{ id: 'vet', type: 'expense', amount: 350, category: 'Vet visit', note: '', date: todayISO() }],
    });
    storeState.data = routeData;
    routeParams.mockReturnValue({ month });
    router.push.mockClear();

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(BudgetScreen));
      const root = renderer.root;
      const sectionActions = (sectionId: string) => root.findByProps({ testID: `budget-section-actions-${sectionId}` });
      act(() => root.findByProps({ accessibilityLabel: 'Add category' }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/budget-section-form',
        params: { month, type: 'spend', scope: 'following' },
      });
      act(() => sectionActions('pets').findByProps({ accessibilityLabel: 'Add item' }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/budget-item-form',
        params: { month, sectionId: 'pets', scope: 'following' },
      });
      act(() => sectionActions('pets').findByProps({ accessibilityLabel: 'Rename section' }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/budget-section-form',
        params: { month, sectionId: 'pets', name: 'Pets', type: 'spend', scope: 'month' },
      });
      act(() => sectionActions('income').findByProps({ accessibilityLabel: 'Add income' }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/budget-income-form',
        params: { month, scope: 'following' },
      });
      act(() => root.findByProps({ accessibilityLabel: 'Edit Pet care' }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/budget-item-form',
        params: { month, sectionId: 'pets', itemId: 'pet-care', scope: 'month' },
      });
      act(() => root.findByProps({ accessibilityLabel: 'Edit Vet visit' }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/budget-item-form',
        params: { month, sectionId: 'survival', name: 'Vet visit', scope: 'following' },
      });
      act(() => root.findByProps({ accessibilityLabel: 'Edit Salary' }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/budget-income-form',
        params: { month, incomeId: 'salary-row', scope: 'month' },
      });
      const alert = jest.requireMock('react-native').Alert.alert as jest.Mock;
      alert.mockClear();
      act(() => sectionActions('pets').findByProps({ accessibilityLabel: 'Delete section' }).props.onPress());
      expect(alert.mock.calls.at(-1)?.[1]).toContain('Pets and its 1 item');
      const deleteOptions = alert.mock.calls.at(-1)?.[2] as { text: string; onPress?: () => void }[] | undefined;
      const following = deleteOptions?.find((option) => option.text === 'This and following months');
      if (!following?.onPress) throw new Error('Section delete scope options were not shown.');
      act(() => following.onPress?.());
      expect(actions.deleteSection).toHaveBeenCalledWith(month, 'pets', 'following', todayISO());
      const deleteToast = useUIStore.getState().actionToast;
      expect(deleteToast?.actionLabel).toBe('Undo');
      act(() => deleteToast?.onAction?.());
      expect(actions.restoreBudgetPlanAndMonth).toHaveBeenCalledWith(plan, month, snapshot);
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      storeState.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
    }
  });

  it('keeps Budget as the other Insurance entry point and removes Insurance from Goals', async () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const storeState = useAppStore((state) => state);
    const previousRouteData = { ...routeData };
    const previousStoreData = storeState.data;
    const previousFontScale = mockFontScale;
    const router = jest.requireMock('expo-router').router as {
      push: jest.Mock;
    };
    const screenActions = jest.requireMock('../../data/useAppData').useAppActions() as {
      clearDue: jest.Mock;
      undoClearDue: jest.Mock;
    };
    const demoData = buildDemoData(todayISO());
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    const assertInsuranceLink = (screen: React.ReactElement, label: string, testID?: string) => {
      renderer = renderScreen(screen);
      const link = testID
        ? renderer.root.findByProps({ testID })
        : renderer.root.findByProps({ accessibilityLabel: label });
      act(() => link.props.onPress({ stopPropagation: jest.fn() }));
      expect(router.push).toHaveBeenLastCalledWith('/insurance');
      act(() => renderer?.unmount());
      renderer = undefined;
    };

    try {
      Object.assign(routeData, demoData);
      storeState.data = demoData;
      router.push.mockClear();
      assertInsuranceLink(React.createElement(BudgetScreen), 'Manage policies');
      renderer = renderScreen(React.createElement(GoalsScreen));
      expect(renderer.root.findAll((node) => node.props.accessibilityLabel === 'Insurance cover')).toHaveLength(0);
      expect(renderer.root.findAllByType('text')
        .map((node) => node.children.join('')).join(' ').toLowerCase()).not.toContain('insurance');
      act(() => renderer?.unmount());
      renderer = undefined;
      renderer = renderScreen(React.createElement(HomeScreen));
      const homeInsuranceCard = renderer.root.findByProps({ testID: 'home-insurance-card' });
      act(() => homeInsuranceCard.props.onPress());
      expect(router.push).toHaveBeenLastCalledWith('/insurance');
      act(() => renderer?.unmount());
      renderer = undefined;
      const duePolicy = demoData.policies.find((policy) => policy.status === 'active');
      if (!duePolicy) throw new Error('Demo data has no policy due fixture.');
      const dueData = {
        ...demoData,
        policies: demoData.policies.map((policy) => policy.id === duePolicy.id
          ? { ...policy, startDate: todayISO(), endDate: undefined, payments: [] }
          : policy),
      };
      Object.assign(routeData, dueData);
      storeState.data = dueData;
      renderer = renderScreen(React.createElement(HomeScreen));
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Paid' }).length)
        .toBeGreaterThan(0);
      act(() => renderer?.unmount());
      renderer = undefined;
      Object.assign(routeData, demoData);
      storeState.data = demoData;

      mockFontScale = 1.3;
      const insuranceRenderer = renderScreen(React.createElement(InsuranceScreen));
      renderer = insuranceRenderer;
      const insuranceRoot = insuranceRenderer.root;
      const header = insuranceRoot.findByType('header');
      const headerActions = header.findAllByType('button').map((button) => button.props.accessibilityLabel);
      expect(headerActions).toEqual(['Add insurance']);
      const lifePlaceholder = insuranceRoot.findByProps({ accessibilityLabel: 'Add details for Life insurance' });
      expect(lifePlaceholder).toBeDefined();
      expect(insuranceRoot.findAllByProps({ accessibilityLabel: 'Add details for Term insurance' }))
        .toHaveLength(0);
      router.push.mockClear();
      act(() => lifePlaceholder.props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/policy-form',
        params: { kind: 'life-savings', name: 'Life insurance' },
      });
      router.push.mockClear();
      act(() => header.findByProps({ accessibilityLabel: 'Add insurance' }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith('/policy-form');
      router.push.mockClear();

      const activePolicy = demoData.policies.find((policy) => policy.status === 'active');
      if (!activePolicy) throw new Error('Demo data has no active policy fixture.');
      const endedPolicy = demoData.policies.find((policy) => policy.status !== 'active');
      if (!endedPolicy) throw new Error('Demo data has no ended policy fixture.');
      const endedCard = insuranceRoot.findByProps({ testID: `policy-card-${endedPolicy.id}` });
      expect(endedCard.findAll((node) =>
        String(node.type) === 'badge' && node.props.label === 'Ended',
      )).toHaveLength(1);
      expect(endedCard.findAllByProps({ accessibilityLabel: 'Paid' })).toHaveLength(0);
      const policyPressable = insuranceRoot.findByProps({ testID: `policy-card-${activePolicy.id}` });
      const policyCard = policyPressable.parent ?? policyPressable;
      const actions = policyCard.findAll((node) => {
        const styles = Array.isArray(node.props.style) ? node.props.style : [node.props.style];
        return styles.some((style) => typeof style === 'object' && style !== null
          && 'flexDirection' in style && style.flexDirection === 'column')
          && styles.some((style) => typeof style === 'object' && style !== null
            && 'borderTopWidth' in style);
      });
      expect(actions).toBeDefined();
      const paidButton = policyCard.findAllByType('button')
        .find((button) => button.props.accessibilityLabel === 'Paid');
      if (!paidButton) throw new Error('Active policy has no Paid action.');
      screenActions.clearDue.mockClear();
      await act(async () => {
        paidButton.props.onPress();
        await Promise.resolve();
      });
      const declinedPolicyDialog = insuranceRoot.findByProps({ testID: 'paid-amount-dialog' });
      await act(async () => {
        declinedPolicyDialog.findByProps({ accessibilityLabel: 'Not paid' }).props.onPress();
        await Promise.resolve();
      });
      expect(screenActions.clearDue).not.toHaveBeenCalled();
      screenActions.clearDue.mockReturnValueOnce('paid-policy-entry');
      await act(async () => {
        paidButton.props.onPress();
        await Promise.resolve();
      });
      const policyPaidDialog = insuranceRoot.findByProps({ testID: 'paid-amount-dialog' });
      await act(async () => {
        policyPaidDialog.findByProps({ accessibilityLabel: 'Paid' }).props.onPress();
        await Promise.resolve();
      });
      const undo = useUIStore.getState().actionToast?.onAction;
      if (!undo) throw new Error('Paid action did not expose Undo.');
      act(() => undo());
      expect(screenActions.clearDue).toHaveBeenCalledWith(
        { kind: 'policy', id: activePolicy.id },
        expect.any(String),
        expect.any(Number),
      );
      expect(screenActions.undoClearDue).toHaveBeenCalledWith(
        { kind: 'policy', id: activePolicy.id },
        'paid-policy-entry',
      );
      act(() => insuranceRoot.findByProps({ testID: `policy-card-${activePolicy.id}` }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/policy-form',
        params: { id: activePolicy.id },
      });
      act(() => insuranceRenderer.unmount());
      renderer = undefined;
      useUIStore.getState().setActionToast(null);

      const noIncomeData = {
        ...demoData,
        budgetPlan: null,
        monthBudgets: [],
        transactions: demoData.transactions.filter((transaction) => transaction.type !== 'income'),
      };
      Object.assign(routeData, noIncomeData);
      storeState.data = noIncomeData;
      mockFontScale = 2;
      const largeTextRenderer = renderScreen(React.createElement(InsuranceScreen));
      renderer = largeTextRenderer;
      const largeTextRow = largeTextRenderer.root.findAll((node) => {
        const styles = Array.isArray(node.props.style) ? node.props.style : [node.props.style];
        return styles.some((style) => typeof style === 'object' && style !== null
          && 'flexDirection' in style && style.flexDirection === 'column')
          && styles.some((style) => typeof style === 'object' && style !== null && 'minHeight' in style);
      });
      expect(largeTextRow).toBeDefined();
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      storeState.data = previousStoreData;
      mockFontScale = previousFontScale;
      useUIStore.getState().setActionToast(null);
      screenActions.clearDue.mockClear();
      screenActions.undoClearDue.mockClear();
    }
  });

  it('renders the simplified policy form with custom frequency fields', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const storeState = useAppStore((state) => state);
    const previousRouteData = { ...routeData };
    const previousStoreData = storeState.data;
    const previousParams = routeParams();
    const demoData = buildDemoData(todayISO());
    const policy = demoData.policies[0];
    if (!policy) throw new Error('Demo data has no policy form fixture.');
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    try {
      Object.assign(routeData, demoData);
      storeState.data = demoData;
      routeParams.mockReturnValue({ kind: 'term-life', name: 'Term insurance' });
      renderer = renderScreen(React.createElement(PolicyFormScreen));
      const createLabels = [
        'Policy name',
        'Insurer',
        'Policy type',
        'Premium',
        'Premium frequency',
        'Next premium due date',
        'Sum assured',
        'Policy number',
        'Policy note',
      ];
      for (const label of createLabels) {
        expect(renderer.root.findAllByProps({ accessibilityLabel: label }).length)
          .toBeGreaterThan(0);
      }
      expect(renderer.root.findByProps({ accessibilityLabel: 'Policy name' }).props.value)
        .toBe('Term insurance');
      expect(renderer.root.findByProps({ accessibilityLabel: 'Policy type' }).props.value)
        .toBe('term-life');
      const frequency = renderer.root.findByProps({ accessibilityLabel: 'Premium frequency' });
      expect(frequency.props.options).toEqual(expect.arrayContaining([
        { value: 'monthly', title: 'Monthly' },
        { value: 'quarterly', title: 'Quarterly' },
        { value: 'half-yearly', title: 'Half-yearly' },
        { value: 'yearly', title: 'Yearly' },
        { value: 'custom', title: 'Custom' },
      ]));
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Custom interval in months' })).toHaveLength(0);
      act(() => frequency.props.onChange('custom'));
      expect(renderer.root.findByProps({ accessibilityLabel: 'Custom interval in months' })).toBeDefined();
      expect(renderer.root.findByProps({ accessibilityLabel: 'Custom interval in months' }).props.value)
        .toBe('1');
      act(() => renderer?.unmount());
      renderer = undefined;
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      storeState.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
    }
  });

  it('confirms policy deletion and removes the selected policy', async () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const screenActions = jest.requireMock('../../data/useAppData').useAppActions() as {
      deletePolicy: jest.Mock;
    };
    const router = jest.requireMock('expo-router').router as { back: jest.Mock };
    const storeState = useAppStore((state) => state);
    const previousRouteData = { ...routeData };
    const previousStoreData = storeState.data;
    const previousParams = routeParams();
    const demoData = buildDemoData(todayISO());
    const policy = demoData.policies[0];
    if (!policy) throw new Error('Demo data has no policy deletion fixture.');
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    try {
      Object.assign(routeData, demoData);
      storeState.data = demoData;
      routeParams.mockReturnValue({ id: policy.id });
      renderer = renderScreen(React.createElement(PolicyFormScreen));
      screenActions.deletePolicy.mockClear();
      mockConfirmAsync.mockClear();
      router.back.mockClear();
      const deleteButton = renderer.root.findByProps({ accessibilityLabel: 'Delete policy' });
      await act(async () => {
        deleteButton.props.onPress();
        await Promise.resolve();
      });
      expect(mockConfirmAsync).toHaveBeenCalledWith(expect.objectContaining({
        title: `Delete ${policy.name}?`,
        message: 'Upcoming premium dues will be removed. Recorded payments stay in Transactions.',
      }));
      expect(screenActions.deletePolicy).toHaveBeenCalledWith(policy.id);
      expect(router.back).toHaveBeenCalled();
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      storeState.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      screenActions.deletePolicy.mockClear();
      mockConfirmAsync.mockClear();
    }
  });

  it('shows the two unstored Insurance placeholders and a simple add action', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const storeState = useAppStore((state) => state);
    const previousRouteData = { ...routeData };
    const previousStoreData = storeState.data;
    const previousParams = (jest.requireMock('expo-router').useLocalSearchParams as jest.Mock)();
    const router = jest.requireMock('expo-router').router as { push: jest.Mock };
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    try {
      const emptyPolicyData = { ...buildDemoData(todayISO()), policies: [] };
      Object.assign(routeData, emptyPolicyData);
      storeState.data = emptyPolicyData;
      renderer = renderScreen(React.createElement(InsuranceScreen));
      expect(renderer.root.findByProps({ accessibilityLabel: 'Add details for Term insurance' })).toBeDefined();
      expect(renderer.root.findByProps({ accessibilityLabel: 'Add details for Life insurance' })).toBeDefined();
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Filter' })).toHaveLength(0);
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Search policies' })).toHaveLength(0);
      router.push.mockClear();
      act(() => renderer?.root.findByProps({ accessibilityLabel: 'Add details for Term insurance' })
        .props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: '/policy-form',
        params: { kind: 'term-life', name: 'Term insurance' },
      });
      router.push.mockClear();
      act(() => renderer?.root.findByType('header').findByProps({ accessibilityLabel: 'Add insurance' })
        .props.onPress());
      expect(router.push).toHaveBeenLastCalledWith('/policy-form');
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      storeState.data = previousStoreData;
      (jest.requireMock('expo-router').useLocalSearchParams as jest.Mock).mockReturnValue(previousParams);
    }
  });

  it.each([1.3, 2])('keeps the Insurance list accessible at font scale %s', (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const storeState = useAppStore((state) => state);
    const previousRouteData = { ...routeData };
    const previousStoreData = storeState.data;
    const previousParams = routeParams();
    const previousFontScale = mockFontScale;
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    try {
      const data = { ...buildDemoData(todayISO()), policies: [] };
      Object.assign(routeData, data);
      storeState.data = data;
      routeParams.mockReturnValue({});
      mockFontScale = fontScale;
      renderer = renderScreen(React.createElement(InsuranceScreen));
      expect(renderer.root.findByProps({ accessibilityLabel: 'Add details for Term insurance' })).toBeDefined();
      expect(renderer.root.findByProps({ accessibilityLabel: 'Add details for Life insurance' })).toBeDefined();
      expect(renderer.root.findByProps({ accessibilityLabel: 'Add insurance' })).toBeDefined();
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      storeState.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      mockFontScale = previousFontScale;
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
      const picker = form.root.findByProps({ testID: 'goal-asset-picker-sheet' });
      expect(picker.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ maxHeight: 506.4 }),
      ]));
      expect(form.root.findByProps({ testID: 'goal-asset-picker-sheet-modal' }).props.visible).toBe(true);
      expect(form.root.findByProps({ testID: 'goal-asset-picker-sheet-backdrop' })).toBeDefined();

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
      expect(home.root.findByProps({ testID: 'home-spending-toggle' }).props.accessibilityLabel)
        .toBe('Show spending by category');
      expect(home.root.findAllByProps({ accessibilityLabel: 'Open budget' })).toHaveLength(0);
      expect(home.root.findAllByProps({ accessibilityLabel: 'Apply budget' })).toHaveLength(0);
      expect(home.root.findAllByProps({ testID: 'home-spending-details' })).toHaveLength(0);
      act(() => home?.root.findByProps({ testID: 'home-spending-toggle' }).props.onPress());
      expect(home.root.findByProps({ testID: 'home-spending-toggle' }).props.accessibilityLabel)
        .toBe('Hide spending by category');
      expect(home.root.findAllByType('text').some((node) =>
        node.children.includes('No spending recorded this month.'),
      )).toBe(true);
      act(() => home?.root.findByProps({ testID: 'home-spending-toggle' }).props.onPress());
      expect(home.root.findAllByProps({ testID: 'home-spending-details' })).toHaveLength(0);
      act(() => home?.unmount());
      home = undefined;

      Object.assign(routeData, {
        ...emptyAppData(today),
        monthBudgets: [monthBudgetFromLines(today.slice(0, 7), [{ category: 'Food', planned: 1_000 }], {
          incomes: [{ id: 'income', name: 'Income', category: 'Salary' as const, amount: 10_000 }],
        })],
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
      expect(mockConfirmAsync).not.toHaveBeenCalled();
      const paidDialog = home.root.findByProps({ testID: 'paid-amount-dialog' });
      expect(paidDialog.props.title).toBe('Test plan');
      expect(paidDialog.props.dueAmount).toBe(1_000);
      expect(textOf(dueHome)).toContain('Test plan');
      expect(dueHome.root.findAll((node) =>
        node.type === 'button' && ['Pay', 'Clear due', 'View schedule'].includes(String(node.children[0])),
      )).toHaveLength(0);
      expect(dueHome.root.findAllByProps({ testID: 'pending-item-action-sheet' })).toHaveLength(0);
      expect(dueRow.props.onPress).toBeUndefined();
      await act(async () => {
        paidDialog.findByProps({ accessibilityLabel: 'Not paid' }).props.onPress();
        await Promise.resolve();
      });
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

  it('opens the paid-amount dialog from the payment-confirm route and Not paid leaves the due unchanged', async () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const store = useAppStore((state) => state);
    const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
      clearDue: jest.Mock;
    };
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousData = { ...routeData };
    const previousStoreData = store.data;
    const previousParams = routeParams();
    const today = todayISO();
    const data = { ...emptyAppData(today), holdings: [makeInvestmentTestPlan()] };
    const due = pendingItems(data, monthKey(today), today)[0];
    if (!due?.dueDate) throw new Error('Payment-confirm fixture has no dated pending due.');
    Object.assign(routeData, data);
    store.data = data;
    actions.clearDue.mockClear();
    routeParams.mockReturnValue({ dueItemId: due.id, dueDate: due.dueDate });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(PaymentConfirmScreen));
      expect(renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain(due.title);
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Paid' }).props.onPress();
        await Promise.resolve();
      });
      const dialog = renderer.root.findByProps({ testID: 'paid-amount-dialog' });
      expect(dialog.props.title).toBe(due.title);
      expect(dialog.props.dueAmount).toBe(due.amount);
      expect(dialog.props.dueDate).toBe(due.dueDate);
      await act(async () => {
        dialog.findByProps({ accessibilityLabel: 'Not paid' }).props.onPress();
        await Promise.resolve();
      });
      expect(renderer.root.findAllByProps({ testID: 'paid-amount-dialog' })).toHaveLength(0);
      expect(actions.clearDue).not.toHaveBeenCalled();
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousData);
      store.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      actions.clearDue.mockClear();
    }
  });

  it('records and undoes a recurring liability EMI from payment confirmation', async () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const store = useAppStore((state) => state);
    const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
      clearDue: jest.Mock;
      undoClearDue: jest.Mock;
      addTransaction: jest.Mock;
    };
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousData = { ...routeData };
    const previousStoreData = store.data;
    const previousParams = routeParams();
    const previousToast = useUIStore.getState().actionToast;
    const today = todayISO();
    const liability: RecurringLiability = {
      id: 'confirm-recurring-liability',
      kind: 'recurring',
      name: 'Confirmation EMI',
      type: 'Home loan',
      principal: 12_000,
      ratePct: 0,
      startDate: `${shiftMonth(monthKey(today), -1)}-10`,
      tenureMonths: 12,
      emi: 1_000,
      payments: [],
      settlement: null,
    };
    const data = { ...emptyAppData(today), liabilities: [liability] };
    const due = pendingItems(data, monthKey(today), today).find((candidate) =>
      candidate.source.kind === 'liability' && candidate.source.parentId === liability.id,
    );
    if (!due?.dueDate || due.source.kind !== 'liability') {
      throw new Error('Payment-confirm fixture has no dated recurring EMI.');
    }
    Object.assign(routeData, data);
    store.data = data;
    routeParams.mockReturnValue({ dueItemId: due.id, dueDate: due.dueDate });
    useUIStore.getState().setActionToast(null);
    actions.clearDue.mockImplementation((target, rowId, actualAmount) => {
      const result = clearDueDomain(store.data, target, {
        date: today,
        newId: () => 'confirmed-liability-payment',
        ...(typeof rowId === 'string' ? { rowId } : {}),
        ...(typeof actualAmount === 'number' ? { actualAmount } : {}),
      });
      store.data = result.data;
      Object.assign(routeData, result.data);
      return result.entryId;
    });
    actions.undoClearDue.mockImplementation((target, entryId) => {
      store.data = undoClearDueDomain(store.data, target, entryId);
      Object.assign(routeData, store.data);
    });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(PaymentConfirmScreen));
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Paid' }).props.onPress();
        await Promise.resolve();
      });
      const dialog = renderer.root.findByProps({ testID: 'paid-amount-dialog' });
      await act(async () => {
        dialog.findByProps({ accessibilityLabel: 'Paid' }).props.onPress();
        await Promise.resolve();
      });

      expect(actions.clearDue).toHaveBeenCalledWith(
        { kind: 'liability', id: liability.id },
        due.source.slotId,
        due.amount,
      );
      expect(actions.addTransaction).not.toHaveBeenCalled();
      const updated = store.data.liabilities.find((candidate) => candidate.id === liability.id);
      if (!updated || updated.kind !== 'recurring') throw new Error('Recurring liability disappeared after payment.');
      expect(updated.payments).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'confirmed-liability-payment', kind: 'EMI', amount: due.amount }),
      ]));
      expect(store.data.transactions).toEqual(expect.arrayContaining([
        expect.objectContaining({
          type: 'expense',
          amount: due.amount,
          source: { kind: 'liability-payment', parentId: liability.id, entryId: 'confirmed-liability-payment' },
        }),
      ]));
      expect(pendingItems(store.data, monthKey(today), today).some((candidate) =>
        candidate.source.kind === 'liability' && candidate.source.parentId === liability.id,
      )).toBe(false);

      const undo = useUIStore.getState().actionToast?.onAction;
      if (!undo) throw new Error('Liability payment Undo action was not set.');
      act(() => undo());
      expect(actions.undoClearDue).toHaveBeenCalledWith(
        { kind: 'liability', id: liability.id },
        'confirmed-liability-payment',
      );
      expect(store.data).toEqual(data);
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousData);
      store.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      useUIStore.getState().setActionToast(previousToast);
      actions.clearDue.mockReset();
      actions.undoClearDue.mockReset();
    }
  });

  it('opens the paid-amount dialog from a Transactions due row without clearing on Not paid', async () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const store = useAppStore((state) => state);
    const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
      clearDue: jest.Mock;
    };
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousData = { ...routeData };
    const previousStoreData = store.data;
    const previousParams = routeParams();
    const previousMonth = useUIStore.getState().txMonth;
    const today = todayISO();
    const month = monthKey(today);
    const data = { ...emptyAppData(today), holdings: [makeInvestmentTestPlan()] };
    const due = pendingItems(data, month, today)[0];
    if (!due?.dueDate) throw new Error('Transactions fixture has no dated pending due.');
    Object.assign(routeData, data);
    store.data = data;
    useUIStore.getState().setTxMonth(month);
    routeParams.mockReturnValue({});
    actions.clearDue.mockClear();

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(TransactionsScreen));
      const dueRow = renderer.root.findAll((node) =>
        typeof node.props.testID === 'string' && node.props.testID.startsWith('pending-item-'),
      ).find((node) => node.props.testID === due.id || node.findAllByProps({
        accessibilityLabel: 'Paid',
      }).length > 0);
      if (!dueRow) throw new Error('Transactions pending row did not render.');
      await act(async () => {
        dueRow.findByProps({ accessibilityLabel: 'Paid' }).props.onPress();
        await Promise.resolve();
      });
      const dialog = renderer.root.findByProps({ testID: 'paid-amount-dialog' });
      expect(dialog.props.title).toBe(due.title);
      expect(dialog.props.dueAmount).toBe(due.amount);
      expect(dialog.props.dueDate).toBe(due.dueDate);
      await act(async () => {
        dialog.findByProps({ accessibilityLabel: 'Not paid' }).props.onPress();
        await Promise.resolve();
      });
      expect(renderer.root.findAllByProps({ testID: 'paid-amount-dialog' })).toHaveLength(0);
      expect(actions.clearDue).not.toHaveBeenCalled();
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousData);
      store.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      useUIStore.getState().setTxMonth(previousMonth);
      actions.clearDue.mockClear();
    }
  });

  it('records a linked planned investment from the Transactions row as a plan entry and undoes it', async () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const store = useAppStore((state) => state);
    const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
      clearDue: jest.Mock;
      undoClearDue: jest.Mock;
      addTransaction: jest.Mock;
    };
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousRouteData = { ...routeData };
    const previousStoreData = store.data;
    const previousParams = routeParams();
    const previousMonth = useUIStore.getState().txMonth;
    const previousToast = useUIStore.getState().actionToast;
    const today = todayISO();
    const month = monthKey(today);
    const plan = makeInvestmentTestPlan();
    const basePlan = budgetPlanFromLines([], {
      incomes: [],
      repeatMonthly: true,
      repeatFrom: month,
    });
    const investmentSection = basePlan.sections.find((section) =>
      section.type === 'invest' && !section.system,
    );
    if (!investmentSection) throw new Error('Investment budget section is missing.');
    const snapshot = monthBudgetFromLines(month, [{
      category: 'Monthly SIP investment',
      planned: plan.amount,
      dueDay: Number(today.slice(8, 10)),
    }], {
      incomes: [],
      source: 'plan',
      sections: basePlan.sections,
      linkedIncluded: true,
    });
    const linkedItem = snapshot.items[0];
    if (!linkedItem) throw new Error('Linked Budget item is missing from the month snapshot.');
    const linkedPlanItem = {
      ...linkedItem,
      sectionId: investmentSection.id,
      holdingId: plan.id,
    };
    const data: AppData = {
      ...emptyAppData(today),
      holdings: [plan],
      budgetPlan: {
        ...basePlan,
        items: [linkedPlanItem],
      },
      monthBudgets: [{ ...snapshot, items: [linkedPlanItem] }],
    };
    const linkedBudgetRow = pendingItems(data, month, today).find((item) =>
      item.source.kind === 'budget' && item.category === 'Monthly SIP investment',
    );
    if (!linkedBudgetRow) throw new Error('Linked Budget investment row is missing from Transactions.');
    Object.assign(routeData, data);
    store.data = data;
    useUIStore.getState().setTxMonth(month);
    routeParams.mockReturnValue({});
    useUIStore.getState().setActionToast(null);
    actions.clearDue.mockImplementation((target, rowId, actualAmount) => {
      const result = clearDueDomain(store.data, target, {
        date: today,
        newId: () => 'linked-plan-entry',
        ...(typeof rowId === 'string' ? { rowId } : {}),
        ...(typeof actualAmount === 'number' ? { actualAmount } : {}),
      });
      store.data = result.data;
      Object.assign(routeData, result.data);
      return result.entryId;
    });
    actions.undoClearDue.mockImplementation((target, entryId) => {
      store.data = undoClearDueDomain(store.data, target, entryId);
      Object.assign(routeData, store.data);
    });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(TransactionsScreen));
      const row = renderer.root.findByProps({ testID: `pending-item-${linkedBudgetRow.id}` });
      await act(async () => {
        row.findByProps({ accessibilityLabel: 'Paid' }).props.onPress();
        await Promise.resolve();
      });
      const dialog = renderer.root.findByProps({ testID: 'paid-amount-dialog' });
      await act(async () => {
        dialog.findByProps({ accessibilityLabel: 'Paid' }).props.onPress();
        await Promise.resolve();
      });

      expect(actions.clearDue).toHaveBeenCalledWith(
        { kind: 'plan', id: plan.id },
        expect.any(String),
        plan.amount,
      );
      expect(actions.addTransaction).not.toHaveBeenCalled();
      const updatedPlan = store.data.holdings.find((holding) => holding.id === plan.id);
      if (!updatedPlan || updatedPlan.kind !== 'plan') throw new Error('Linked plan disappeared after Paid.');
      expect(updatedPlan.logs).toHaveLength(1);
      expect(store.data.transactions).toEqual(expect.arrayContaining([
        expect.objectContaining({
          amount: plan.amount,
          source: { kind: 'holding-entry', parentId: plan.id, entryId: 'linked-plan-entry' },
        }),
      ]));
      expect(pendingItems(store.data, month, today).some((item) =>
        item.source.kind === 'plan' && item.source.parentId === plan.id,
      )).toBe(false);
      expect(pendingItems(store.data, month, today).some((item) =>
        item.source.kind === 'budget' && item.category === 'Monthly SIP investment',
      )).toBe(false);

      const undo = useUIStore.getState().actionToast?.onAction;
      if (!undo) throw new Error('Linked plan Undo action was not set.');
      act(() => undo());
      expect(actions.undoClearDue).toHaveBeenCalledWith(
        { kind: 'plan', id: plan.id },
        'linked-plan-entry',
      );
      expect(store.data).toEqual(data);
      expect(pendingItems(store.data, month, today).some((item) =>
        item.source.kind === 'budget' && item.category === 'Monthly SIP investment',
      )).toBe(true);
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      useUIStore.getState().setTxMonth(previousMonth);
      useUIStore.getState().setActionToast(previousToast);
      actions.clearDue.mockReset();
      actions.undoClearDue.mockReset();
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
      actions.clearDue.mockReset();
      actions.clearDue.mockImplementation((_target, _slotId, _amount) => {
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
      const singlePaidDialog = home.root.findByProps({ testID: 'paid-amount-dialog' });
      await act(async () => {
        singlePaidDialog.findByProps({ accessibilityLabel: 'Paid' }).props.onPress();
        await Promise.resolve();
      });
      expect(actions.clearDue).toHaveBeenCalledWith(
        { kind: 'plan', id: 'investment-plan-test' },
        expect.any(String),
        1_000,
      );
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
      await act(async () => {
        laterMarkPaid.props.onPress();
        await Promise.resolve();
      });
      expect(mockConfirmAsync).not.toHaveBeenCalled();
      const laterPaidDialog = home.root.findByProps({ testID: 'paid-amount-dialog' });
      expect(laterPaidDialog.props.title).toBe('Test plan');
      await act(async () => {
        laterPaidDialog.findByProps({ accessibilityLabel: 'Paid' }).props.onPress();
        await Promise.resolve();
      });
      expect(actions.clearDuesThrough).toHaveBeenCalledWith(
        { kind: 'plan', id: laterPlan.id },
        currentMonth + '-01',
        1_000,
      );
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
      expect(oneTimeActionContainer.findAllByProps({ label: 'Pay EMI' })).toHaveLength(1);
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
      expect(recurringActionContainer.findAllByProps({ label: 'Pay EMI' })).toHaveLength(1);
      expect(recurringActionContainer.findAllByProps({ label: 'Foreclosure' })).toHaveLength(1);
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
      monthBudgets: [monthBudgetFromLines(month, [
          { category: 'Food', planned: 300 },
          { category: 'Shopping', planned: 200 },
          { category: 'Other investments', planned: 75 },
        ], {
        incomes: [{ id: 'income', name: 'Income', category: 'Salary', amount: 1_000 }],
      })],
    };
    expect(pendingItems(data, month, today)).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'budget', title: 'Food', amount: 200 }),
    ]));
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
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:fixture-item-1`,
      )).toHaveLength(1);
      expect(pendingList.findAllByProps({ children: 'Paid' })).toHaveLength(3);
      expect(pendingList.findAllByProps({ children: 'Pay' })).toHaveLength(0);
      const firstDueRow = pendingList.find((node) =>
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:fixture-item-1`,
      );
      if (!firstDueRow) throw new Error('Filtered due row did not render.');
      expect(firstDueRow.props.accessibilityLabel).toContain('Food');
      expect(firstDueRow.props.accessibilityLabel).not.toContain('Overdue');
      expect(firstDueRow.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ borderBottomWidth: 1 }),
      ]));

      expect(renderer.root.findAll((node) =>
        node.findAllByType('text').some((text) => text.children.join(' ').startsWith('Review ')),
      )).toHaveLength(0);
      act(() => renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress());
      act(() => renderer.root.findByProps({ accessibilityLabel: 'Invested' }).props.onPress());
      expect(renderer.root.findAll((node) =>
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:fixture-item-3`,
      )).toHaveLength(1);
      expect(renderer.root.findAll((node) =>
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:fixture-item-1`,
      )).toHaveLength(0);
      const lastDueRow = renderer.root.find((node) =>
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:fixture-item-3`,
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
      expect(negativeBalance.findAll((node) => node.props.accessibilityLabel === '-₹1,000').length)
        .toBeGreaterThan(0);
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
      monthBudgets: [monthBudgetFromLines(month, [{ category: 'Food', planned: 300 }], {
        incomes: [{ id: 'income', name: 'Income', category: 'Salary', amount: 1_000 }],
      })],
    };
    Object.assign(routeData, data);
    store.data = data;
    act(() => useUIStore.getState().setTxMonth(month));
    mockFontScale = fontScale;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(TransactionsScreen));
      const row = renderer.root.find((node) =>
        node.type === 'view' && node.props.testID === `pending-item-budget:${month}:fixture-item-1`,
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
    const today = todayISO();
    const month = monthKey(today);
    const previousMonth = shiftMonth(month, -1);
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as ReturnType<typeof emptyAppData>;
    const previousRouteData = { ...routeData };
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const data = {
      ...emptyAppData(todayISO()),
      transactions: [
        { id: 'large-income', type: 'income' as const, amount: 123_456_789, category: 'Salary', note: 'Salary', date: today },
        { id: 'large-expense', type: 'expense' as const, amount: 12_345_678, category: 'Food', note: 'Food', date: today },
        { id: 'prior-expense', type: 'expense' as const, amount: 12_345_678, category: 'Food', note: 'Food', date: `${previousMonth}-11` },
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
        logs: [{ id: 'large-deposit', date: '2025-10-10', amount: 123_456_789, note: '', kind: 'Deposit' as const }],
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
      monthBudgets: [monthBudgetFromLines(month, [{ category: 'Food', planned: 123_456_789 }], {
        incomes: [{ id: 'income', name: 'Income', category: 'Salary' as const, amount: 123_456_789 }],
      })],
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
      expect(assetsLabels.some((label) =>
        label.startsWith(`Gain ${formatAmount(0, 'exact', 1)}`),
      )).toBe(true);
      expect(assetsLabels).toContain(`Invested, ${formatAmount(259_259_256, 'exact', 1)}`);
      expect(assetsLabels).toContain('Cash');
      expect(assetsLabels).not.toContain(`Cash, invested ${exactB}`);
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
        label.includes(`${exactB} spent of ${exactA}`),
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
    /form|money movement invalid|clear past dues|erase data/i.test(name),
  );

  it.each(formScreens)('%s exposes the shared Back action and receives its dirty state', async (_name, screen) => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(screen);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Form route did not render.');
    const close = renderer.root.findAllByProps({ accessibilityLabel: 'Back' })
      .find((node) => typeof node.props.isDirty === 'boolean');
    if (!close) throw new Error('The full-screen form Close action was not rendered.');
    expect(close.props.accessibilityRole).toBe('button');
    expect(close.props.onPress).toEqual(expect.any(Function));
    expect(typeof close.props.isDirty).toBe('boolean');
    act(() => renderer?.unmount());
  });

  it('keeps onboarding as a no-back entry form with its Continue footer', async () => {
    const renderer = renderScreen(React.createElement(OnboardingScreen));
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Back' })).toHaveLength(0);
    expect(renderer.root.findAll((node) => String(node.type) === 'text')
      .some((node) => node.children.join('') === 'Welcome to Wealth Wise')).toBe(true);
    expect(renderer.root.findAll((node) => String(node.type) === 'button')
      .some((node) => node.props.accessibilityLabel === 'Continue')).toBe(true);
    act(() => renderer.unmount());
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
    appData.monthBudgets = name === 'Budget spending' ? [monthBudgetFromLines(
      todayISO().slice(0, 7),
      [{ category: 'Food', planned: 500 }],
      { incomes: [{ id: 'income', name: 'Income', category: 'Salary' as const, amount: 1000 }] },
    )] : [];
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
      )).toHaveLength(name === 'Liability payments' ? 0 : 1);
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
      liabilities: [
        recurringA,
        oneTime,
        recurringB,
        {
          ...recurringA,
          id: 'filter-liability-closed',
          name: 'Closed recurring',
          settlement: { asOf: '2026-02-01', balance: 0 },
          closure: { date: '2026-02-01', paymentId: 'closed-payment' },
        },
      ],
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
      const closedChip = renderer.root.findAll((node) => String(node.type) === 'chip')
        .find((node) => node.props.accessibilityLabel === 'Closed');
      if (!closedChip) throw new Error('Closed liability filter did not render.');
      act(() => closedChip.props.onPress());
      expect(cardIds()).toEqual(['liability-card-filter-liability-closed']);
      const closedActionContainer = renderer.root.findByProps({
        testID: 'liability-card-actions-filter-liability-closed',
      });
      expect(closedActionContainer.findAllByProps({ label: 'Edit closure note' })).toHaveLength(1);
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

  it.each([1.3, 2])('keeps loan closure and closed-note screens accessible at font scale %s', async (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const store = useAppStore((state) => state);
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousRouteData = { ...routeData };
    const previousStoreData = store.data;
    const previousParams = routeParams();
    const previousFontScale = mockFontScale;
    const recurring: RecurringLiability = {
      id: 'closure-font-loan',
      kind: 'recurring',
      name: 'Closure font loan',
      type: 'Other',
      principal: 50_000,
      ratePct: 0,
      startDate: '2026-01-10',
      tenureMonths: 12,
      emi: 5_000,
      payments: [],
      settlement: null,
    };
    const closed: RecurringLiability = {
      ...recurring,
      payments: [{
        id: 'closed-font-payment',
        date: '2026-02-10',
        amount: 5_000,
        kind: 'Prepayment',
        note: 'Closing payment',
      }],
      id: 'closed-font-loan',
      closure: {
        date: '2026-02-10',
        paymentId: 'closed-font-payment',
        note: 'Settled with lender',
      },
      settlement: { asOf: '2026-02-10', balance: 0 },
    };
    const data: AppData = {
      ...emptyAppData(todayISO()),
      liabilities: [recurring, closed],
    };
    Object.assign(routeData, data);
    store.data = data;
    mockFontScale = fontScale;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      routeParams.mockReturnValue({ liabilityId: recurring.id });
      renderer = renderScreen(React.createElement(LiabilityClosureFormScreen));
      for (const label of ['Loan closure date', 'Amount paid to lender', 'Loan closure note']) {
        expect(renderer.root.findByProps({ accessibilityLabel: label })).toBeDefined();
      }
      expect(JSON.stringify(renderer.toJSON())).toContain('Outstanding on this date');
      act(() => renderer?.unmount());

      routeParams.mockReturnValue({ liabilityId: closed.id });
      renderer = renderScreen(React.createElement(LiabilityClosureNoteFormScreen));
      expect(renderer.root.findByProps({ accessibilityLabel: 'Closure note' }).props.value).toBe('Settled with lender');
      mockChoiceAsync.mockClear();
      await act(async () => {
        renderer?.root.findByProps({ accessibilityLabel: 'Delete loan' }).props.onPress();
        await Promise.resolve();
      });
      expect(mockChoiceAsync).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Delete closed loan?',
        choices: expect.arrayContaining([
          expect.objectContaining({ id: 'keep' }),
          expect.objectContaining({ id: 'delete', destructive: true }),
        ]),
      }));
      expect(renderer.root.findByProps({ accessibilityLabel: 'Save note' })).toBeDefined();
      act(() => renderer?.unmount());

      routeParams.mockReturnValue({ id: closed.id });
      renderer = renderScreen(React.createElement(LiabilityPaymentsScreen));
      const closureDate = formatDate('2026-02-10');
      expect(renderer.root.findAll((node) =>
        node.props.accessibilityRole === 'button'
        && typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith(`${closureDate},`),
      )).toHaveLength(0);
      const paymentsScreen = renderer;
      if (!paymentsScreen) throw new Error('Closed liability payments screen did not render.');
      const flatList = paymentsScreen.root.findAll((node) => String(node.type) === 'flatlist')[0];
      if (!flatList) throw new Error('Closed liability payment list did not render.');
      const closingPayment = closed.payments[0];
      if (!closingPayment) throw new Error('Closed liability payment fixture is missing.');
      const paymentRow = flatList.props.renderItem({
        item: closingPayment,
        index: 0,
        separators: {},
      });
      expect(paymentRow.type).toBe(jest.requireMock('react-native').View);
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      mockFontScale = previousFontScale;
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

  it('searches assets by trimmed case-insensitive name or type and composes with type filters', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousRouteData = { ...routeData };
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const assets: ManualHolding[] = [
      { id: 'gold-antique', kind: 'manual', name: 'Antique collection', type: 'Gold', invested: 1_000, value: 1_500, logs: [] },
      { id: 'gold-retirement', kind: 'manual', name: 'Retirement reserve', type: 'Gold', invested: 1_000, value: 1_100, logs: [] },
      { id: 'cash-type', kind: 'manual', name: 'Emergency cash', type: 'Cash', invested: 500, value: 500, logs: [] },
    ];
    const data: AppData = { ...emptyAppData(todayISO()), holdings: assets };
    Object.assign(routeData, data);
    store.data = data;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      const screen = renderScreen(React.createElement(AssetsScreen));
      renderer = screen;
      const search = screen.root.findByProps({ accessibilityLabel: 'Search assets' });
      act(() => search.props.onChangeText('  gOlD  '));
      const assetCards = () => screen.root.findAll((node) =>
        String(node.type) === 'pressable'
        && typeof node.props.testID === 'string'
        && node.props.testID.startsWith('asset-card-'),
      ).map((node) => node.props.testID) ?? [];
      expect(assetCards()).toEqual(['asset-card-manual-Antique collection', 'asset-card-manual-Retirement reserve']);

      act(() => screen.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress());
      const sortChip = screen.root.findAll((node) =>
        typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith('Sort:'),
      )[0];
      if (!sortChip) throw new Error('Asset sort control did not render with the filter panel.');
      act(() => sortChip.props.onPress());
      const nameOption = screen.root.findAll((node) =>
        String(node.type) === 'pressable'
        && node.findAll((child) => child.type === 'text' && child.children.includes('Name')).length > 0,
      )[0];
      if (!nameOption) throw new Error('Asset name sort option did not render.');
      act(() => nameOption.props.onPress());
      expect(assetCards()).toEqual(['asset-card-manual-Retirement reserve', 'asset-card-manual-Antique collection']);

      const cashChip = screen.root.findAll((node) => String(node.type) === 'chip')
        .find((node) => node.props.accessibilityLabel === 'Cash');
      if (!cashChip) throw new Error('Cash asset filter did not render.');
      act(() => cashChip.props.onPress());
      expect(screen.root.findAllByProps({ title: 'No matches' })).not.toHaveLength(0);

      act(() => screen.root.findByProps({ accessibilityLabel: 'Search assets' }).props.onChangeText(' CASH '));
      expect(assetCards()).toEqual(['asset-card-manual-Emergency cash']);
      act(() => screen.unmount());
      renderer = renderScreen(React.createElement(AssetsScreen));
      expect(renderer.root.findByProps({ accessibilityLabel: 'Search assets' }).props.value).toBe('');
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
    }
  });

  it.each([1.3, 2])('renders ledger-based asset totals and Cash/Bank details at font scale %s', (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousRouteData = { ...routeData };
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const previousFontScale = mockFontScale;
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousParams = routeParams();
    const today = todayISO();
    const assets: ManualHolding[] = [
      {
        id: 'return-fd',
        kind: 'manual',
        name: 'Fixed deposit',
        type: 'Fixed deposit',
        invested: 1_000,
        value: 1_100,
        valueAsOf: today,
        logs: [{
          id: 'backdated-deposit',
          date: addDays(today, -1),
          amount: 200,
          note: '',
          kind: 'Deposit',
        }],
      },
      {
        id: 'cash-balance',
        kind: 'manual',
        name: 'Cash reserve',
        type: 'Cash',
        invested: 500,
        value: 500,
        valueAsOf: today,
        logs: [{
          id: 'cash-deposit',
          date: today,
          amount: 100,
          note: '',
          kind: 'Deposit',
        }],
      },
      {
        id: 'bank-balance',
        kind: 'manual',
        name: 'Bank reserve',
        type: 'Savings account',
        invested: 1_000,
        value: 1_000,
        valueAsOf: today,
        logs: [{
          id: 'bank-withdrawal',
          date: today,
          amount: 100,
          note: '',
          kind: 'Withdrawal',
        }],
      },
    ];
    const data: AppData = { ...emptyAppData(today), holdings: assets };
    Object.assign(routeData, data);
    store.data = data;
    mockFontScale = fontScale;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(AssetsScreen));
      expect(renderer.root.findByProps({
        accessibilityLabel: `Invested, ${formatAmount(2_700, 'exact', 1)}`,
      })).toBeDefined();
      expect(renderer.root.findByProps({
        accessibilityLabel: `Gain, ${formatAmount(-100, 'exact', 1)}`,
      })).toBeDefined();

      const fixedCard = renderer.root.findByProps({ testID: 'asset-card-manual-Fixed deposit' });
      expect(fixedCard.findAllByProps({ label: 'Deposit' })).toHaveLength(0);
      expect(fixedCard.findAllByProps({ label: 'Withdraw' })).toHaveLength(1);
      expect(fixedCard.findAllByProps({ label: 'Entries' })).toHaveLength(1);
      expect(fixedCard.findAllByType('text')
        .some((node) => node.children.join('').includes(
          'Entries dated before the last valuation are assumed included in it.',
        ))).toBe(true);
      expect(fixedCard.findAllByType('text')
        .some((node) => node.children.join('').includes('Entries from earlier are kept.'))).toBe(true);

      for (const [testID, expectedLabel] of [
        ['asset-card-manual-Cash reserve', 'Invested'],
        ['asset-card-manual-Bank reserve', 'Invested'],
      ]) {
        const card = renderer.root.findByProps({ testID });
        const content = card.findAllByType('text').map((node) => node.children.join('')).join(' ');
        expect(content).toContain(expectedLabel);
        expect(content).not.toMatch(/No return yet|absolute|XIRR|CAGR|% of your assets/);
        expect(content).not.toContain('Deposited');
        expect(content).not.toContain('Withdrawn');
        expect(content).not.toContain('Gain');
      }

      const cashCard = renderer.root.findByProps({ testID: 'asset-card-manual-Cash reserve' });
      expect(cashCard.findByProps({ accessibilityLabel: 'Cash' })).toBeDefined();
      expect(cashCard.findByProps({
        accessibilityLabel: `Invested ${formatAmount(600, 'exact', 1)}`,
      })).toBeDefined();

      act(() => renderer?.unmount());
      renderer = undefined;
      routeParams.mockReturnValue({ id: 'return-fd' });
      renderer = renderScreen(React.createElement(InvestmentEntriesScreen));
      expect(renderer.root.findByProps({ accessibilityLabel: 'Record maturity payout' })).toBeDefined();
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Add investment entry' })).toHaveLength(0);
      expect(renderer.root.findAllByType('text')
        .some((node) => node.children.join('').includes('Schedule summary'))).toBe(false);

      act(() => renderer?.unmount());
      renderer = undefined;
      routeParams.mockReturnValue({ id: 'cash-balance' });
      renderer = renderScreen(React.createElement(InvestmentEntriesScreen));
      expect(renderer.root.findByProps({
        accessibilityLabel: `Balance ${formatAmount(500, 'exact', 1)}`,
      })).toBeDefined();
      expect(renderer.root.findByProps({
        accessibilityLabel: `Invested ${formatAmount(600, 'exact', 1)}`,
      })).toBeDefined();
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      mockFontScale = previousFontScale;
    }
  });

  it.each([1, 1.3, 2])('shows recurring installment counts and collapsible paid entries at font scale %s', (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const store = useAppStore((state) => state);
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousData = { ...routeData };
    const previousStoreData = store.data;
    const previousParams = routeParams();
    const previousFontScale = mockFontScale;
    const today = todayISO();
    const startMonth = shiftMonth(monthKey(today), -5);
    const lastPlanMonth = shiftMonth(startMonth, 3);
    const plan: PlanHolding = {
      ...makeInvestmentTestPlan(),
      startDate: `${startMonth}-01`,
      trackFrom: `${startMonth}-01`,
      tenureYears: 2,
      maturityDate: `${lastPlanMonth}-01`,
      logs: [
        ...[0, 1].map((index) => ({
          id: `paid-investment-${index}`,
          date: `${shiftMonth(startMonth, index)}-01`,
          amount: 1_000,
          note: `Paid investment ${index + 1}`,
          kind: 'Deposit' as const,
        })),
        {
          id: 'investment-withdrawal-mid',
          date: `${shiftMonth(startMonth, 2)}-15`,
          amount: 100,
          note: 'Withdrawal between scheduled months',
          kind: 'Withdrawal' as const,
        },
      ],
    };
    const liabilityStartMonth = shiftMonth(monthKey(today), -5);
    const liability: RecurringLiability = {
      id: 'entries-recurring-liability',
      kind: 'recurring',
      name: 'Entries EMI',
      type: 'Home loan',
      principal: 20_000,
      ratePct: 0,
      startDate: `${liabilityStartMonth}-01`,
      tenureMonths: 3,
      emi: 1_000,
      payments: [
        ...[1, 2].map((index) => ({
          id: `paid-emi-${index}`,
          date: `${shiftMonth(liabilityStartMonth, index)}-01`,
          amount: 1_000,
          note: `Paid EMI ${index}`,
          kind: 'EMI' as const,
        })),
        {
          id: 'liability-payment-after-final-emi',
          date: `${shiftMonth(liabilityStartMonth, 4)}-15`,
          amount: 500,
          note: 'Payment after final EMI date',
          kind: 'Payment' as const,
        },
      ],
      settlement: null,
    };
    mockFontScale = fontScale;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      Object.assign(routeData, { ...emptyAppData(today), holdings: [plan] });
      store.data = routeData;
      routeParams.mockReturnValue({ id: plan.id });
      renderer = renderScreen(React.createElement(InvestmentEntriesScreen));
      const investmentText = renderer.root.findAllByType('text')
        .map((node) => node.children.join('')).join(' ');
      const completedInvestmentMonths = renderer.root.findByProps({
        testID: 'completed-investment-months-cell',
      });
      const pendingInvestmentMonths = renderer.root.findByProps({
        testID: 'pending-investment-months-cell',
      });
      expect(completedInvestmentMonths.props.style[1]).toEqual(
        expect.objectContaining({ flex: 1, minWidth: 0 }),
      );
      expect(pendingInvestmentMonths.props.style[1]).toEqual(
        expect.objectContaining({ flex: 1, minWidth: 0 }),
      );
      expect(investmentText).toContain('Completed months');
      expect(investmentText).toContain('Pending months');
      expect(investmentText).not.toContain('Paid investment 1');
      expect(investmentText).not.toContain('Paid investment 2');
      expect(investmentText).not.toContain(formatDate(`${shiftMonth(lastPlanMonth, 1)}-01`));
      let investmentList = renderer.root.find((node) => String(node.type) === 'flatlist');
      const investmentRows = investmentList.props.data as {
        rowKind?: string;
        id: string;
        note?: string;
        date?: string;
        dueDate?: string;
      }[];
      const investmentTimeline = investmentRows.flatMap((row) =>
        row.rowKind === 'pending-plan' && row.dueDate
          ? [row.dueDate]
          : row.date ? [row.date] : [],
      );
      expect(investmentTimeline).toEqual([...investmentTimeline].sort((left, right) => right.localeCompare(left)));
      const pendingInvestmentRows = investmentRows.filter((row) => row.rowKind === 'pending-plan');
      expect(pendingInvestmentRows).toHaveLength(
        planSchedule(plan, today).rows.filter((row) => row.status !== 'paid').length,
      );
      expect(pendingInvestmentRows).toHaveLength(2);
      const pendingInvestmentRow = pendingInvestmentRows[0];
      if (!pendingInvestmentRow) throw new Error('Pending investment row is missing.');
      const pendingInvestmentView = renderScreen(investmentList.props.renderItem({
        item: pendingInvestmentRow,
        index: 0,
      }));
      expect(pendingInvestmentView.root.findAllByType('text')
        .map((node) => node.children.join(' ')).join(' ')).toContain('Pending investment');
      act(() => pendingInvestmentView.unmount());
      const paidInvestmentHeader = investmentRows.find((row) => row.rowKind === 'paid-investments-header');
      if (!paidInvestmentHeader) throw new Error('Paid investments section is missing.');
      const paidInvestmentToggle = renderScreen(investmentList.props.renderItem({
        item: paidInvestmentHeader,
        index: investmentRows.indexOf(paidInvestmentHeader),
      }));
      expect(paidInvestmentToggle.root.findByProps({ testID: 'paid-investments-toggle' })
        .props.accessibilityState).toEqual({ expanded: false });
      act(() => paidInvestmentToggle.root.findByProps({ testID: 'paid-investments-toggle' }).props.onPress());
      investmentList = renderer.root.find((node) => String(node.type) === 'flatlist');
      expect(investmentList.props.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ note: 'Paid investment 1' }),
      ]));
      act(() => paidInvestmentToggle.unmount());

      act(() => renderer?.unmount());
      renderer = undefined;
      Object.assign(routeData, { ...emptyAppData(today), liabilities: [liability] });
      store.data = routeData;
      routeParams.mockReturnValue({ id: liability.id });
      renderer = renderScreen(React.createElement(LiabilityPaymentsScreen));
      const liabilityText = renderer.root.findAllByType('text')
        .map((node) => node.children.join('')).join(' ');
      expect(liabilityText).toContain('Completed months');
      expect(liabilityText).toContain('Pending months');
      const completedEmiMonthsCell = renderer.root.findByProps({ testID: 'completed-emi-months-cell' });
      const pendingEmiMonthsCell = renderer.root.findByProps({ testID: 'pending-emi-months-cell' });
      expect(completedEmiMonthsCell.props.style[1]).toEqual(
        expect.objectContaining({ flex: 1, minWidth: 0 }),
      );
      expect(pendingEmiMonthsCell.props.style[1]).toEqual(
        expect.objectContaining({ flex: 1, minWidth: 0 }),
      );
      expect(renderer.root.findByProps({ testID: 'completed-emi-months' }).props.accessibilityLabel)
        .toBe('Completed 2 months');
      expect(renderer.root.findByProps({ testID: 'pending-emi-months' }).props.accessibilityLabel)
        .toBe('Pending 1 months');
      expect(liabilityText).not.toContain('Paid EMI 1');
      expect(liabilityText).not.toContain('Paid EMI 2');
      expect(liabilityText).not.toContain(formatDate(`${shiftMonth(liabilityStartMonth, 4)}-01`));
      let liabilityList = renderer.root.find((node) => String(node.type) === 'flatlist');
      const liabilityRows = liabilityList.props.data as {
        rowKind?: string;
        id: string;
        note?: string;
        dueDate?: string;
        date?: string;
      }[];
      const liabilityTimeline = liabilityRows.flatMap((row) =>
        row.rowKind === 'pending-emi' && row.dueDate
          ? [row.dueDate]
          : row.date ? [row.date] : [],
      );
      expect(liabilityTimeline).toEqual([...liabilityTimeline].sort((left, right) => right.localeCompare(left)));
      const pendingEmiRows = liabilityRows.filter((row) => row.rowKind === 'pending-emi');
      expect(pendingEmiRows).toHaveLength(1);
      const lastEmiDate = `${shiftMonth(liabilityStartMonth, liability.tenureMonths)}-01`;
      expect(pendingEmiRows.map((row) => row.dueDate)).toEqual(
        liabilitySchedule(liability, today).rows
          .filter((row) => row.status !== 'paid')
          .map((row) => row.dueDate),
      );
      expect(pendingEmiRows.every((row) => row.dueDate !== undefined && row.dueDate <= lastEmiDate)).toBe(true);
      expect(pendingEmiRows.map((row) => row.dueDate))
        .not.toContain(`${shiftMonth(liabilityStartMonth, 4)}-01`);
      const pendingEmiRow = pendingEmiRows[0];
      if (!pendingEmiRow) throw new Error('Pending EMI row is missing.');
      const pendingEmiView = renderScreen(liabilityList.props.renderItem({
        item: pendingEmiRow,
        index: 0,
      }));
      expect(pendingEmiView.root.findAllByType('text')
        .map((node) => node.children.join(' ')).join(' ')).toContain('Pending EMI');
      act(() => pendingEmiView.unmount());
      const paidEmisHeader = liabilityRows.find((row) => row.rowKind === 'paid-emis-header');
      if (!paidEmisHeader) throw new Error('Paid EMIs section is missing.');
      const paidEmisToggle = renderScreen(liabilityList.props.renderItem({
        item: paidEmisHeader,
        index: liabilityRows.indexOf(paidEmisHeader),
      }));
      expect(paidEmisToggle.root.findByProps({ testID: 'paid-emis-toggle' })
        .props.accessibilityState).toEqual({ expanded: false });
      act(() => paidEmisToggle.root.findByProps({ testID: 'paid-emis-toggle' }).props.onPress());
      liabilityList = renderer.root.find((node) => String(node.type) === 'flatlist');
      expect(liabilityList.props.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ note: 'Paid EMI 1' }),
      ]));
      act(() => paidEmisToggle.unmount());
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousData);
      store.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      mockFontScale = previousFontScale;
    }
  });

  it('searches liabilities by trimmed case-insensitive name or type alongside the kind filter', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousRouteData = { ...routeData };
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const oneTime: OneTimeLiability = {
      id: 'search-friend',
      kind: 'one-time',
      name: 'Friend loan',
      type: 'Borrowed money',
      principal: 1_000,
      ratePct: 0,
      startDate: '2026-01-01',
      dueDate: null,
      payments: [],
    };
    const other: OneTimeLiability = { ...oneTime, id: 'search-bank', name: 'Bank', type: 'Personal loan' };
    const data: AppData = { ...emptyAppData(todayISO()), liabilities: [other, oneTime] };
    Object.assign(routeData, data);
    store.data = data;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      const screen = renderScreen(React.createElement(LiabilitiesScreen));
      renderer = screen;
      act(() => screen.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress());
      const oneTimeChip = screen.root.findAll((node) => String(node.type) === 'chip')
        .find((node) => node.props.accessibilityLabel === 'One-time');
      if (!oneTimeChip) throw new Error('One-time liability filter did not render.');
      act(() => oneTimeChip.props.onPress());
      const search = screen.root.findByProps({ accessibilityLabel: 'Search liabilities' });
      act(() => search.props.onChangeText('  LOAN  '));
      const liabilityCards = () => screen.root.findAll((node) =>
        String(node.type) === 'pressable'
        && typeof node.props.testID === 'string'
        && node.props.testID.startsWith('liability-card-search-'),
      ).map((node) => node.props.testID) ?? [];
      const sortChip = screen.root.findAll((node) =>
        typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith('Sort:'),
      )[0];
      if (!sortChip) throw new Error('Liability sort control did not render with the filter panel.');
      act(() => sortChip.props.onPress());
      const nameOption = screen.root.findAll((node) =>
        String(node.type) === 'pressable'
        && node.findAll((child) => child.type === 'text' && child.children.includes('Name')).length > 0,
      )[0];
      if (!nameOption) throw new Error('Name sort option did not render.');
      act(() => nameOption.props.onPress());
      expect(liabilityCards()).toEqual(['liability-card-search-friend', 'liability-card-search-bank']);

      act(() => screen.root.findByProps({ accessibilityLabel: 'Search liabilities' }).props.onChangeText('  fRiEnD  '));
      expect(liabilityCards()).toEqual(['liability-card-search-friend']);
      act(() => screen.root.findByProps({ accessibilityLabel: 'Search liabilities' }).props.onChangeText('  personal loan '));
      expect(liabilityCards()).toEqual(['liability-card-search-bank']);
      act(() => screen.root.findByProps({ accessibilityLabel: 'Search liabilities' }).props.onChangeText('nothing'));
      expect(screen.root.findAllByProps({ testID: 'liability-no-matches' })).not.toHaveLength(0);
      act(() => screen.unmount());
      renderer = renderScreen(React.createElement(LiabilitiesScreen));
      expect(renderer.root.findByProps({ accessibilityLabel: 'Search liabilities' }).props.value).toBe('');
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
    }
  });

  it('searches goals by trimmed case-insensitive name and shows No matches', () => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousRouteData = { ...routeData };
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const goals: Goal[] = [
      { id: 'search-road-trip', name: 'Road trip', target: 100_000, saved: 10_000, year: 2028, links: [] },
      { id: 'search-japan-trip', name: 'Japan trip', target: 100_000, saved: 10_000, year: 2028, links: [] },
    ];
    const data: AppData = { ...emptyAppData(todayISO()), goals };
    Object.assign(routeData, data);
    store.data = data;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      const screen = renderScreen(React.createElement(GoalsScreen));
      renderer = screen;
      const search = screen.root.findByProps({ accessibilityLabel: 'Search goals' });
      act(() => search.props.onChangeText('  tRiP  '));
      const goalNames = () => screen.root.findAll((node) =>
        String(node.type) === 'pressable'
        && typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith('Edit '),
      ).map((node) => node.props.accessibilityLabel.slice(5).split(',')[0]) ?? [];
      expect(goalNames()).toEqual(['Road trip', 'Japan trip']);
      act(() => screen.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress());
      const sortChip = screen.root.findAll((node) =>
        typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith('Sort:'),
      )[0];
      if (!sortChip) throw new Error('Goal sort control did not render with the filter panel.');
      act(() => sortChip.props.onPress());
      const nameOption = screen.root.findAll((node) =>
        String(node.type) === 'pressable'
        && node.findAll((child) => child.type === 'text' && child.children.includes('Name')).length > 0,
      )[0];
      if (!nameOption) throw new Error('Goal name sort option did not render.');
      act(() => nameOption.props.onPress());
      expect(goalNames()).toEqual(['Japan trip', 'Road trip']);
      act(() => screen.root.findByProps({ accessibilityLabel: 'Search goals' }).props.onChangeText('not here'));
      expect(goalNames()).toHaveLength(0);
      expect(screen.root.findAll((node) =>
        String(node.type) === 'empty' && node.props.title === 'No matches',
      )).toHaveLength(1);
      act(() => screen.unmount());
      renderer = renderScreen(React.createElement(GoalsScreen));
      expect(renderer.root.findByProps({ accessibilityLabel: 'Search goals' }).props.value).toBe('');
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

  it('explains the first scheduled deposit and deposit tracking dates', () => {
    const renderer = renderScreen(React.createElement(InvestmentFormScreen));
    const dates = renderer.root.findAll((node) => String(node.type) === 'datefield');
    expect(dates[0]?.props).toMatchObject({
      accessibilityLabel: 'First scheduled contribution date',
      accessibilityHint: 'The first date on your recurring investment schedule.',
    });
    expect(dates[1]?.props).toMatchObject({
      accessibilityLabel: 'Scheduled deposit tracking start date',
      accessibilityHint: 'Only deposits due on or after this date count toward missed contributions.',
    });
    const helperText = renderer.root.findAllByType('text').map((node) => node.children.join(' ')).join(' ');
    expect(helperText).toContain('The plan schedule starts on this date.');
    expect(helperText).toContain('For an existing SIP, choose when you want WealthWise to start counting expected deposits.');
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

  it.each([1.3, 2])('keeps manual and recurring holdings on the same card, entries and form flow at font scale %s', (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousRouteData = { ...routeData };
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const previousFontScale = mockFontScale;
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousParams = routeParams();
    const today = todayISO();
    const ledgerEntries = [
      { id: 'scale-deposit-1', date: today, amount: 1_000, kind: 'Deposit' as const, note: '' },
      { id: 'scale-deposit-2', date: today, amount: 1_000, kind: 'Deposit' as const, note: '' },
      { id: 'scale-deposit-3', date: today, amount: 1_000, kind: 'Deposit' as const, note: '' },
      { id: 'scale-deposit-4', date: today, amount: 1_000, kind: 'Deposit' as const, note: '' },
      { id: 'scale-deposit-5', date: today, amount: 1_000, kind: 'Deposit' as const, note: '' },
      { id: 'scale-withdrawal', date: today, amount: 2_000, kind: 'Withdrawal' as const, note: '' },
    ];
    const holdings: (ManualHolding | PlanHolding)[] = [
      {
        id: 'scale-manual',
        kind: 'manual',
        name: 'Manual gold',
        type: 'Gold',
        invested: 10_000,
        value: 10_000,
        valueAsOf: today,
        valuationMethod: 'unitsPrice',
        latestPrice: 1,
        priceAsOf: today,
        logs: ledgerEntries,
      },
      {
        id: 'scale-plan',
        kind: 'plan',
        name: 'Recurring RD',
        type: 'Recurring deposit',
        frequency: 'monthly',
        amount: 1_000,
        ratePct: 5,
        stepUpPct: 0,
        tenureYears: 2,
        startDate: today,
        trackFrom: today,
        opening: 10_000,
        actualValue: null,
        actualValueDate: null,
        logs: ledgerEntries,
      },
    ];
    const data: AppData = { ...emptyAppData(today), holdings };
    Object.assign(routeData, data);
    store.data = data;
    mockFontScale = fontScale;
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    try {
      renderer = renderScreen(React.createElement(AssetsScreen));
      for (const name of ['Manual gold', 'Recurring RD']) {
        const card = renderer.root.findByProps({ testID: `asset-card-${name === 'Manual gold' ? 'manual' : 'plan'}-${name}` });
        expect(card.findAllByProps({ label: 'Deposit' })).toHaveLength(1);
        expect(card.findAllByProps({ label: 'Withdraw' })).toHaveLength(1);
        expect(card.findAllByProps({ label: 'Entries' })).toHaveLength(1);
        expect(card.findAllByProps({ label: 'Schedule' })).toHaveLength(0);
        expect(card.findAllByType('text').map((node) => node.children.join('')).join(' '))
          .toContain(formatAmount(13_000, 'exact', 1));
      }

      act(() => renderer?.unmount());
      renderer = undefined;
      for (const holding of holdings) {
        routeParams.mockReturnValue({ id: holding.id });
        renderer = renderScreen(React.createElement(InvestmentEntriesScreen));
        expect(renderer.root.findAllByProps({ label: 'Deposit' })).toHaveLength(1);
        expect(renderer.root.findAllByProps({ label: 'Withdraw' })).toHaveLength(1);
        expect(renderer.root.findAllByProps({ label: 'Entries' })).toHaveLength(0);
        const list = renderer.root.find((node) => String(node.type) === 'flatlist');
        if (holding.kind === 'plan') {
          expect(list.props.data.filter((row: { rowKind?: string }) => row.rowKind === 'pending-plan'))
            .toHaveLength(planSchedule(holding, today).rows.filter((row) => row.status !== 'paid').length);
          expect(list.props.data.some((row: { rowKind?: string }) =>
            row.rowKind === 'paid-investments-header',
          )).toBe(true);
        } else {
          expect(list.props.data).toHaveLength(7);
        }
        const openingRow = list.props.data[0];
        expect(openingRow).toMatchObject({ rowKind: 'opening' });
        const openingRenderer = renderScreen(list.props.renderItem({ item: openingRow, index: 0 }));
        const openingAmount = formatAmount(holding.kind === 'plan' ? holding.opening : holding.invested, 'exact', 1);
        expect(openingRenderer.root.findByProps({
          accessibilityLabel: `Opening ${openingAmount}`,
        })).toBeDefined();
        act(() => openingRenderer.unmount());
        expect(renderer.root.findByProps({
          accessibilityLabel: `Invested ${formatAmount(13_000, 'exact', 1)}`,
        })).toBeDefined();
        if (holding.kind === 'plan') {
          expect(renderer.root.findAll((node) =>
            typeof node.props.accessibilityLabel === 'string'
            && node.props.accessibilityLabel.startsWith('Recurring plan monthly'),
          )).not.toHaveLength(0);
          expect(renderer.root.findAllByProps({ label: 'Edit recurring plan' })).toHaveLength(0);
        }
        act(() => renderer?.unmount());
        renderer = undefined;

        const formParams = { id: holding.id };
        routeParams.mockReturnValue(formParams);
        renderer = renderScreen(React.createElement(InvestmentFormScreen));
        expect(renderer.root.findAllByProps({ label: 'Save' })).toHaveLength(1);
        expect(renderer.root.findAllByType(Dropdown).some((field) => field.props.label === 'Valuation method')).toBe(true);
        expect(renderer.root.findAllByType(ChoiceField).some((field) => field.props.label === 'Compounding')).toBe(true);
        if (holding.kind === 'plan') {
          expect(renderer.root.findAllByType(Dropdown).some((field) => field.props.label === 'Holding type')).toBe(true);
        } else {
          expect(renderer.root.findAllByType(ChoiceField).some((field) => field.props.label === 'Type')).toBe(true);
        }
        act(() => renderer?.unmount());
        renderer = undefined;

        renderer = renderScreen(React.createElement(HoldingValuationFormScreen));
        const valuationLabel = holding.id === 'scale-manual'
          ? 'Latest price per unit'
          : 'Confirmed holding value';
        const valuationDateLabel = holding.id === 'scale-manual' ? 'Price date' : 'Value date';
        expect(renderer.root.findAllByProps({
          accessibilityLabel: valuationLabel,
        })).toHaveLength(2);
        expect(renderer.root.findAllByProps({ accessibilityLabel: valuationDateLabel })).toHaveLength(2);
        act(() => renderer?.unmount());
        renderer = undefined;
      }
    } finally {
      act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      mockFontScale = previousFontScale;
    }
  });

  it('uses scheduled-deposit wording in the recurring holding due cleanup', () => {
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousParams = routeParams();
    const today = todayISO();
    const startDate = addDays(today, -32);
    const plan: PlanHolding = {
      id: 'due-cleanup-plan',
      kind: 'plan',
      name: 'Recurring RD',
      type: 'Recurring deposit',
      frequency: 'monthly',
      amount: 1_000,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate,
      trackFrom: startDate,
      opening: 0,
      actualValue: null,
      actualValueDate: null,
      logs: [],
    };
    store.data = { ...emptyAppData(today), holdings: [plan] };
    routeParams.mockReturnValue({ kind: 'plan', id: plan.id });
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(ClearDuesScreen));
      const text = renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' ');
      expect(text).toContain('scheduled deposits');
    } finally {
      act(() => renderer?.unmount());
      store.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
    }
  });

  it.each([1.3, 2])('uses capability-filtered investment and Budget form choices at font scale %s', (fontScale) => {
    const routeData = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousRouteData = { ...routeData };
    const store = useAppStore((state) => state);
    const previousStoreData = store.data;
    const previousFontScale = mockFontScale;
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const previousParams = routeParams();
    const today = todayISO();
    const fixed: ManualHolding = {
      id: 'capability-fixed',
      kind: 'manual',
      name: 'Fixed deposit',
      type: 'Fixed deposit',
      invested: 100,
      value: 100,
      valueAsOf: today,
      logs: [{ id: 'legacy-entry', date: today, amount: 10, kind: 'Deposit', note: '' }],
    };
    const budgetPlan = budgetPlanFromLines([], {
      incomes: [],
      repeatMonthly: true,
      repeatFrom: monthKey(today),
    });
    const investSection = { id: 'invest', name: 'Investments', type: 'invest' as const };
    budgetPlan.sections.push(investSection);
    const monthBudget = monthBudgetFromLines(monthKey(today), [], {
      incomes: budgetPlan.incomes,
      sections: budgetPlan.sections,
    });
    const data: AppData = {
      ...emptyAppData(today),
      holdings: [fixed, {
        id: 'capability-bank',
        kind: 'manual',
        name: 'Savings account',
        type: 'Savings account',
        invested: 100,
        value: 100,
        valueAsOf: today,
        logs: [],
      }],
      budgetPlan,
      monthBudgets: [monthBudget],
    };
    Object.assign(routeData, data);
    store.data = data;
    mockFontScale = fontScale;
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    try {
      routeParams.mockReturnValue({});
      const planRenderer = renderScreen(React.createElement(InvestmentFormScreen));
      renderer = planRenderer;
      const planType = planRenderer.root.findAllByType(Dropdown)
        .find((node) => node.props.label === 'Holding type');
      if (!planType) throw new Error('Recurring holding type field did not render.');
      expect(planType.props.options.some((option: { value: string }) => option.value === 'Fixed deposit')).toBe(false);

      act(() => planRenderer.unmount());
      renderer = undefined;
      routeParams.mockReturnValue({ id: fixed.id });
      const manualRenderer = renderScreen(React.createElement(InvestmentFormScreen));
      renderer = manualRenderer;
      const manualType = manualRenderer.root.findAllByType(ChoiceField)
        .find((field) => field.props.label === 'Type');
      if (!manualType) throw new Error('Manual holding type field did not render.');
      expect(manualType.props.choices).toContain('Fixed deposit');
      expect(manualRenderer.root.findAllByType('text')
        .some((node) => node.children.join('').includes('Entries from earlier are kept.'))).toBe(true);

      act(() => manualRenderer.unmount());
      renderer = undefined;
      routeParams.mockReturnValue({ holdingId: fixed.id });
      const entryRenderer = renderScreen(React.createElement(InvestmentEntryFormScreen));
      renderer = entryRenderer;
      const entryKind = entryRenderer.root.findAll((node) => String(node.type) === 'segmentedcontrol')[0];
      expect(entryKind?.props.options).toEqual([{ label: 'Maturity withdrawal', value: 'Withdrawal' }]);

      act(() => entryRenderer.unmount());
      renderer = undefined;
      routeParams.mockReturnValue({ id: fixed.id });
      const entriesRenderer = renderScreen(React.createElement(InvestmentEntriesScreen));
      renderer = entriesRenderer;
      expect(entriesRenderer.root.findByProps({ accessibilityLabel: 'Record maturity payout' })).toBeDefined();

      act(() => entriesRenderer.unmount());
      renderer = undefined;
      routeParams.mockReturnValue({ sectionId: 'invest', month: monthKey(today) });
      const budgetRenderer = renderScreen(React.createElement(BudgetItemFormScreen));
      renderer = budgetRenderer;
      const linkedAsset = budgetRenderer.root.findAllByType(Dropdown)
        .find((node) => node.props.label === 'Linked asset');
      if (!linkedAsset) throw new Error('Budget linked asset field did not render.');
      expect(linkedAsset.props.options.map((option: { value: string }) => option.value))
        .not.toContain(fixed.id);
      expect(linkedAsset.props.options.map((option: { value: string }) => option.value))
        .toContain('capability-bank');
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(routeData, previousRouteData);
      store.data = previousStoreData;
      routeParams.mockReturnValue(previousParams);
      mockFontScale = previousFontScale;
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
      const infoModal = renderer.root.findAll((node) =>
        String(node.type) === 'modal' && node.props.testID === undefined,
      )[0];
      expect(infoModal?.props.visible).toBe(false);
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
    'shows the %s budget line in its overview section',
    (category) => {
      const data = jest.requireMock('../../data/useAppData').useAppData() as {
        transactions: unknown[];
        monthBudgets?: unknown[];
      };
      const previousTransactions = data.transactions;
      const previousBudgets = data.monthBudgets;
      const month = todayISO().slice(0, 7);
      data.transactions = [];
      data.monthBudgets = [monthBudgetFromLines(month, ['Festival', 'Donation', 'Gifts'].map((lineCategory) => ({
          category: lineCategory,
          planned: 500,
        })), {
        incomes: [{ id: 'income', name: 'Income', category: 'Salary' as const, amount: 10_000 }],
      })];
      const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
      routeParams.mockReturnValue({ month });

      try {
        const renderer = renderScreen(React.createElement(BudgetScreen));
        const categoryRows = renderer.root.findAll((node) =>
          String(node.type) === 'view'
          &&
          node.props.testID === `budget-row-line:${month}:${category}`,
        );
        expect(categoryRows).toHaveLength(1);
        expect(categoryRows[0]?.findByProps({ accessibilityLabel: `Edit ${category}` })).toBeDefined();
      } finally {
        data.transactions = previousTransactions;
        data.monthBudgets = previousBudgets;
        routeParams.mockReturnValue({});
      }
    },
  );

  it('shows setup for an empty month and applies the plan for an unplanned future month', () => {
    const data = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const actions = jest.requireMock('../../data/useAppData').useAppActions() as {
      applyBudgetPlan: jest.Mock;
      saveAndApplyBudgetPlan: jest.Mock;
    };
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    const previous = {
      monthBudgets: data.monthBudgets,
      budgetPlan: data.budgetPlan,
      holdings: data.holdings,
      liabilities: data.liabilities,
      policies: data.policies,
      transactions: data.transactions,
    };
    const future = shiftMonth(monthKey(todayISO()), 1);
    data.monthBudgets = [];
    data.budgetPlan = null;
    data.holdings = [];
    data.liabilities = [];
    data.policies = [];
    data.transactions = [];
    routeParams.mockReturnValue({});
    router.push.mockClear();
    try {
      const empty = renderScreen(React.createElement(BudgetScreen));
      expect(empty.root.findByProps({ testID: 'budget-empty-state' })
        .findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain('No budget yet');
      act(() => empty.root.findByProps({ accessibilityLabel: 'Create budget' }).props.onPress());
      expect(actions.saveAndApplyBudgetPlan).toHaveBeenCalledWith(
        expect.objectContaining({ repeatMonthly: true, repeatFrom: monthKey(todayISO()), items: [] }),
        monthKey(todayISO()),
      );
      act(() => empty.unmount());

      data.budgetPlan = budgetPlanFromLines([{ category: 'Food', mode: 'amount', value: 200 }], {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 1_000 }],
      });
      routeParams.mockReturnValue({ month: future });
      actions.applyBudgetPlan.mockClear();
      const futureMonth = renderScreen(React.createElement(BudgetScreen));
      expect(futureMonth.root.findByProps({ testID: 'budget-empty-state' })
        .findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain('Not planned');
      expect(futureMonth.root.findAllByProps({ testID: 'budget-pace' })).toHaveLength(0);
      const apply = futureMonth.root.findByProps({ accessibilityLabel: `Apply plan to ${formatMonth(future)}` });
      act(() => apply.props.onPress());
      expect(actions.applyBudgetPlan).toHaveBeenCalledWith(future);
      act(() => futureMonth.unmount());
    } finally {
      Object.assign(data, previous);
      routeParams.mockReturnValue({});
    }
  });

  it.each([1, 1.3, 2])('renders overview and section Cards with responsive edit rows at font scale %s', (fontScale) => {
    mockFontScale = fontScale;
    const previousInsets = mockSafeAreaInsets;
    mockSafeAreaInsets = { top: 24, right: 0, bottom: 0, left: 0 };
    const data = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previous = { monthBudgets: data.monthBudgets, transactions: data.transactions };
    const month = monthKey(todayISO());
    data.transactions = [
      { id: 'salary', type: 'income', amount: 1_000, category: 'Salary', note: '', date: todayISO() },
      { id: 'borrowed', type: 'income', amount: 100, category: 'Borrowed', note: '', date: todayISO() },
      { id: 'food', type: 'expense', amount: 50, category: 'Food', note: '', date: todayISO() },
      { id: 'transport', type: 'expense', amount: 25, category: 'Transport', note: '', date: todayISO() },
    ];
    const snapshot = monthBudgetFromLines(month, [
      { category: 'Food', planned: 200 },
      {
        category: 'Quarterly maintenance',
        planned: 0,
        frequency: 'quarterly',
        firstDueMonth: month,
      },
      {
        category: 'Annual renewal',
        planned: 0,
        frequency: 'yearly',
        firstDueMonth: shiftMonth(month, -1),
      },
      { category: 'Transport', planned: 100 },
    ], {
      incomes: [{ id: 'income', name: 'Salary', category: 'Salary', amount: 1_000 }],
    });
    snapshot.otherIncomes = [{ id: 'borrowed', name: 'Borrowed', category: 'Borrowed', amount: 100 }];
    data.monthBudgets = [snapshot];
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    routeParams.mockReturnValue({ month });
    try {
      const renderer = renderScreen(React.createElement(BudgetScreen));
      const budgetHeader = renderer.root.findByType('header');
      expect(budgetHeader.findAllByProps({ accessibilityLabel: 'Add category' })).toHaveLength(1);
      expect(budgetHeader.findAllByProps({ accessibilityLabel: 'Edit budget' })).toHaveLength(0);
      const ids = renderer.root.findAll((node) =>
        String(node.type) === 'view' && typeof node.props.testID === 'string',
      ).map((node) => node.props.testID);
      const order = [
        'budget-cash-flow',
        'budget-overview-card',
        'budget-section-income',
        'budget-section-survival',
        'budget-section-savings-investments',
        'budget-section-wants',
        'budget-section-festival-donations-culture',
        'budget-section-unexpected-extras',
        'budget-section-debt-repayments',
        'budget-section-insurance',
      ];
      const positions = order.map((id) => ids.indexOf(id));
      expect(positions.every((position, index) => index === 0 || position > (positions[index - 1] ?? -1))).toBe(true);
      expect(renderer.root.findAll((node) => String(node.type) === 'card')).toHaveLength(10);
      expect(renderer.root.findByProps({ testID: 'budget-section-list' })).toBeDefined();
      const survival = renderer.root.findByProps({ testID: 'budget-section-survival' });
      expect(survival.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain('Survival (Needs)');
      expect(renderer.root.findByProps({ testID: 'budget-row-line:' + month + ':Food' })).toBeDefined();
      expect(renderer.root.findByProps({ testID: 'budget-row-other-income:borrowed' })).toBeDefined();
      const foodRow = renderer.root.findByProps({ testID: `budget-row-line:${month}:Food` });
      expect(foodRow.findByProps({ accessibilityLabel: 'Edit Food' })).toBeDefined();
      expect(foodRow.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain('Food');
      expect(renderer.root.findAll((node) =>
        ['badge', 'chip', 'progress'].includes(String(node.type)),
      )).toHaveLength(0);
      expect(renderer.root.findAllByProps({ testID: 'budget-plan-summary' })).toHaveLength(0);
      const sectionActions = survival.findByProps({ testID: 'budget-section-actions-survival' });
      for (const label of ['Rename section', 'Delete section', 'Add item']) {
        expect(sectionActions.findAll((node) =>
          String(node.type) === 'pressable' && node.props.accessibilityLabel === label,
        )).toHaveLength(1);
      }
      expect(sectionActions.findAll((node) => String(node.type) === 'pressable').every((button) => {
        const style = JSON.stringify(button.props.style);
        return style.includes('"width":44') && style.includes('"height":44')
          && typeof button.props.accessibilityHint === 'string';
      })).toBe(true);
      expect(sectionActions.findAll((node) =>
        node.props.name === 'edit-2' || node.props.name === 'trash-2' || node.props.name === 'plus',
      ).map((node) => node.props.name)).toEqual(['edit-2', 'trash-2', 'plus']);
      expect(survival.findAll((node) => String(node.type) === 'pressable'
        && node.props.accessibilityState?.expanded !== undefined)).toHaveLength(0);
      expect(survival.findAll((node) => String(node.type) === 'card')).toHaveLength(1);
      const foodRowText = foodRow.findAllByType('text').map((node) => node.children.join('')).join(' ');
      expect(foodRowText).toContain('Food');
      expect(foodRowText).toContain('50');
      expect(foodRow.findAllByType(AmountText).map((amount) => amount.props.value)).toEqual([50, 200]);
      expect(foodRow.findAll((node) => typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith('Food, '))[0]?.props.accessibilityLabel)
        .toBe(`Food, ${formatAmount(50, 'exact', 1)} of ${formatAmount(200, 'exact', 1)}`);
      const quarterlyRow = renderer.root.findByProps({
        testID: `budget-row-line:${month}:Quarterly maintenance`,
      });
      expect(quarterlyRow.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain('Quarterly maintenance · Quarterly');
      const annualRow = renderer.root.findByProps({
        testID: `budget-row-line:${month}:Annual renewal`,
      });
      expect(annualRow.findAllByType('text').map((node) => node.children.join('')).join(' '))
        .toContain(`Next due ${formatDate(`${shiftMonth(month, 11)}-01`).slice(2)}`);
      const transportRow = renderer.root.findByProps({ testID: `budget-row-line:${month}:Transport` });
      expect(JSON.stringify(foodRow.props.style)).toContain('"borderBottomWidth":1');
      expect(JSON.stringify(transportRow.props.style)).not.toContain('"borderBottomWidth":1');
      const sectionHeader = renderer.root.findByProps({ testID: 'budget-section-header-survival' });
      expect(JSON.stringify(sectionHeader.props.style)).toContain(
        `"flexDirection":"${fontScale >= 1.3 ? 'column' : 'row'}"`,
      );
      const sectionActionRow = renderer.root.findByProps({ testID: 'budget-section-actions-survival' });
      if (fontScale >= 1.3) {
        expect(JSON.stringify(sectionActionRow.props.style)).toContain('"alignSelf":"flex-end"');
      }
      const overviewCard = renderer.root.findByProps({ testID: 'budget-overview-card' });
      const overviewStyleText = overviewCard.findAll((node) => node.props.style !== undefined)
        .map((node) => JSON.stringify(node.props.style))
        .join(' ');
      expect(overviewStyleText).toContain('"padding":16');
      expect(renderer.root.findAllByProps({ testID: 'stacked-bar' })).toHaveLength(0);
      const pace = overviewCard.findByProps({ testID: 'budget-pace' });
      expect(pace.findByProps({ testID: 'pace-line-container' })).toBeDefined();
      expect(pace.findAll((node) => String(node.props.testID).startsWith('pace-section-toggle-')))
        .toHaveLength(0);
      expect(ids.indexOf('budget-pace')).toBeLessThan(ids.indexOf('budget-overview-table'));
      expect(ids.indexOf('budget-overview-table')).toBeLessThan(ids.indexOf('budget-section-list'));
      const header = renderer.root.findByProps({ testID: 'budget-overview-table-header' });
      expect(header.findAllByType('text').map((node) => node.children.join('')))
        .toEqual(['Actual', 'Planned']);
      const overviewAccessibility = renderer.root.findByProps({ testID: 'budget-overview-summary' }).props.accessibilityLabel;
      expect(overviewAccessibility).toContain('Income');
      expect(overviewAccessibility).toContain('Spending');
      const paceAccessibility = renderer.root.findByProps({ testID: 'pace-line-container' }).props.accessibilityLabel;
      expect(paceAccessibility).toContain('Spending pace through day');
      expect(paceAccessibility).toContain('actual');
      expect(paceAccessibility).toContain('planned by month end');
      expect(renderer.root.findByProps({ testID: 'budget-overview-summary' }).props.accessibilityLabel)
        .toBe(overviewAccessibility);
      expect(renderer.root.findByProps({ testID: 'budget-overview-metric-income' })
        .findAllByType(AmountText).map((amount) => amount.props.value)).toEqual([1_100, 1_100]);
      expect(renderer.root.findByProps({ testID: 'budget-overview-metric-spending' })
        .findAllByType(AmountText).map((amount) => amount.props.value)).toEqual([75, 300]);
      expect(['income', 'spending', 'investing', 'left'].map((name) =>
        renderer.root.findByProps({ testID: `budget-overview-metric-${name}` }),
      )).toHaveLength(4);
      expect(overviewCard.findAll((node) =>
        String(JSON.stringify(node.props.style)).includes('"position":"absolute"'),
      )).toHaveLength(0);
      const rowContainer = renderer.root.findAll((node) =>
        String(node.type) === 'view' && node.props.testID === `budget-row-line:${month}:Food`,
      )[0];
      if (!rowContainer) throw new Error('Food overview row did not render.');
      const expectedDirection = fontScale >= 1.3 ? 'column' : 'row';
      expect(rowContainer.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ flexDirection: expectedDirection }),
      ]));
    } finally {
      Object.assign(data, previous);
      routeParams.mockReturnValue({});
      mockFontScale = 1;
      mockSafeAreaInsets = previousInsets;
    }
  });

  it('opens plan item editing as a scoped budget-item route', async () => {
    const data = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    const month = monthKey(todayISO());
    const previous = { monthBudgets: data.monthBudgets, budgetPlan: data.budgetPlan };
    const snapshot = monthBudgetFromLines(month, [{ category: 'Food', planned: 200 }], {
      incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 10_000 }],
    });
    data.budgetPlan = budgetPlanFromLines([{ category: 'Food', mode: 'amount', value: 200 }], {
      incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 10_000 }],
      repeatMonthly: true,
      repeatFrom: month,
    });
    const snapshotItemId = snapshot.items.find((item) => item.name === 'Food')?.id;
    if (!snapshotItemId) throw new Error('Food snapshot item fixture missing.');
    data.monthBudgets = [snapshot];
    routeParams.mockReturnValue({ month });
    router.push.mockClear();

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      renderer = renderScreen(React.createElement(BudgetScreen));
      if (!renderer) throw new Error('Budget screen renderer was not created.');
      act(() => renderer?.root.findByProps({ accessibilityLabel: 'Edit Food' }).props.onPress());
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/budget-item-form',
        params: { month, sectionId: 'survival', itemId: snapshotItemId, scope: 'month' },
      });
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(data, previous);
      routeParams.mockReturnValue({});
    }
  });

  it('preserves the routed month, hides category management in past months, and keeps Cash flow labels', () => {
    const data = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousBudgets = data.monthBudgets;
    const month = '2026-09';
    data.monthBudgets = [monthBudgetFromLines(month, [], {
      incomes: [{ id: 'income', name: 'Income', category: 'Salary', amount: 1_000 }],
    })];
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    routeParams.mockReturnValue({ month });
    router.push.mockClear();
    try {
      const renderer = renderScreen(React.createElement(BudgetScreen));
      const header = renderer.root.findByType('header');
      expect(renderer.root.findByProps({ testID: 'budget-pace' })).toBeDefined();
      expect(header.findAllByProps({ accessibilityLabel: 'More options' })).toHaveLength(0);
      expect(header.findAllByProps({ accessibilityLabel: 'Add category' })).toHaveLength(0);
      expect(renderer.root.findAllByType('text').some((node) => node.children.join('') === formatMonth(month))).toBe(true);
      expect(renderer.root.findByProps({ accessibilityLabel: 'Opening balance' })).toBeDefined();
      expect(renderer.root.findByProps({ accessibilityLabel: 'Closing balance' })).toBeDefined();
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Back to Transactions' })).toHaveLength(0);
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Review' })).toHaveLength(0);
      expect(header.findAllByProps({ accessibilityLabel: 'Add category' })).toHaveLength(0);
    } finally {
      data.monthBudgets = previousBudgets;
      routeParams.mockReturnValue({});
    }
  });

  it('shows Today only off the current Budget month and returns to the current routed month', () => {
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const router = jest.requireMock('expo-router').router as { replace: jest.Mock };
    const current = monthKey(todayISO());
    const past = shiftMonth(current, -1);
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      routeParams.mockReturnValue({ month: current });
      renderer = renderScreen(React.createElement(BudgetScreen));
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Go to current month' })).toHaveLength(0);
      act(() => renderer?.unmount());

      routeParams.mockReturnValue({ month: past });
      router.replace.mockClear();
      renderer = renderScreen(React.createElement(BudgetScreen));
      const todayButton = renderer.root.findByProps({ accessibilityLabel: 'Go to current month' });
      expect(todayButton).toBeDefined();
      act(() => todayButton.props.onPress());
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/(tabs)/budget',
        params: { month: current },
      });
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Go to current month' })).toHaveLength(0);
    } finally {
      act(() => renderer?.unmount());
      routeParams.mockReturnValue({});
      router.replace.mockClear();
    }
  });

  it('limits forward navigation to 24 months and keeps past months read-only', () => {
    const data = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previousBudgets = data.monthBudgets;
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const current = monthKey(todayISO());
    const past = shiftMonth(current, -1);
    data.monthBudgets = [monthBudgetFromLines(past, [{ category: 'Food', planned: 500 }], {
      incomes: [{ id: 'income', name: 'Income', category: 'Salary', amount: 1_000 }],
    })];
    routeParams.mockReturnValue({ month: past });
    try {
      const pastRenderer = renderScreen(React.createElement(BudgetScreen));
      expect(pastRenderer.root.findAllByProps({ accessibilityLabel: 'Edit Food' })).toHaveLength(0);
      expect(pastRenderer.root.findAllByProps({ accessibilityLabel: 'Rename section' })).toHaveLength(0);
      expect(pastRenderer.root.findAllByProps({ accessibilityLabel: 'Delete section' })).toHaveLength(0);
      expect(pastRenderer.root.findAllByProps({ accessibilityLabel: 'Add item' })).toHaveLength(0);
      expect(pastRenderer.root.findAllByProps({ accessibilityLabel: 'Add income' })).toHaveLength(0);
      act(() => pastRenderer.unmount());

      routeParams.mockReturnValue({ month: shiftMonth(current, 24) });
      const futureRenderer = renderScreen(React.createElement(BudgetScreen));
      expect(futureRenderer.root.findByProps({ accessibilityLabel: 'Next month' }).props.disabled).toBe(true);
      act(() => futureRenderer.unmount());
    } finally {
      data.monthBudgets = previousBudgets;
      routeParams.mockReturnValue({});
    }
  });

  it('opens linked plan, liability, and policy rows in their edit routes', () => {
    const data = jest.requireMock('../../data/useAppData').useAppData() as AppData;
    const previous = {
      monthBudgets: data.monthBudgets,
      holdings: data.holdings,
      liabilities: data.liabilities,
      policies: data.policies,
      transactions: data.transactions,
    };
    const month = monthKey(todayISO());
    data.monthBudgets = [monthBudgetFromLines(month, [], {
      incomes: [{ id: 'income', name: 'Income', category: 'Salary', amount: 1_000 }],
    })];
    data.transactions = [];
    data.holdings = [{
      id: 'overview-plan',
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
    data.liabilities = [{
      id: 'overview-liability',
      kind: 'one-time',
      name: 'Friend loan',
      type: 'Borrowed money',
      principal: 500,
      ratePct: 0,
      startDate: `${month}-01`,
      dueDate: `${month}-15`,
      payments: [],
    }];
    data.policies = [{
      id: 'overview-policy',
      name: 'Health policy',
      insurer: 'Example',
      kind: 'health',
      premium: 60,
      frequency: 'monthly',
      startDate: `${month}-05`,
      status: 'active',
      premiumYears: 1,
      trackFrom: `${month}-05`,
      currentValue: null,
      valueAsOf: null,
      payments: [],
    }];
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    routeParams.mockReturnValue({ month });
    router.push.mockClear();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      const activeRenderer = renderScreen(React.createElement(BudgetScreen));
      renderer = activeRenderer;
      act(() => activeRenderer.root.findByProps({ accessibilityLabel: 'Edit Monthly SIP' }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({ pathname: '/investment-form', params: { id: 'overview-plan' } });
      act(() => activeRenderer.root.findByProps({ accessibilityLabel: 'Edit Friend loan' }).props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({ pathname: '/liability-form', params: { id: 'overview-liability' } });
      const policyRow = activeRenderer.root.findByProps({ accessibilityLabel: 'Edit Health premium' });
      act(() => policyRow.props.onPress());
      expect(router.push).toHaveBeenLastCalledWith({ pathname: '/policy-form', params: { id: 'overview-policy' } });
    } finally {
      if (renderer) act(() => renderer?.unmount());
      Object.assign(data, previous);
      routeParams.mockReturnValue({});
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

});
