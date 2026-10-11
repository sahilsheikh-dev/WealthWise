import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import AssetsScreen from '../../../app/assets';
import BackupScreen from '../../../app/backup';
import EfEntryFormScreen from '../../../app/ef-entry-form';
import GoalFormScreen from '../../../app/goal-form';
import InvestmentEntryFormScreen from '../../../app/investment-entry-form';
import InvestmentFormScreen from '../../../app/investment-form';
import LiabilityFormScreen from '../../../app/liability-form';
import LiabilityPaymentFormScreen from '../../../app/liability-payment-form';
import LinkMissingScreen from '../../../app/link-missing';
import SecurityScreen from '../../../app/security';
import ThemeScreen from '../../../app/theme';
import TransactionFormScreen from '../../../app/transaction-form';
import { assertNoVerbText } from '../testUtils/assertNoVerbText';

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
  };
});

jest.mock('../../data/useAppData', () => {
  const mockData = {
    settings: { name: 'Demo', theme: 'system', monthlySalary: 40000, onboarded: true },
    transactions: [],
    goals: [],
    holdings: [],
    liabilities: [],
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
    AppHeader: ({ title }: { title: string }) => ReactModule.createElement('text', null, title),
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
  return {
    AppText: node('text'),
    Button,
    Card: node('card'),
    Chip: node('chip'),
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
    FormScreen: ({ title, children }: { title: string; children?: React.ReactNode }) =>
      ReactModule.createElement('screen', null, ReactModule.createElement('text', null, title), children),
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
    DateField: ({ label }: { label: string }) => ReactModule.createElement('text', null, label),
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
  return {
    Alert: { alert: jest.fn() },
    KeyboardAvoidingView: node('keyboard-avoiding-view'),
    Platform: { OS: 'ios' },
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    StyleSheet: { create: (styles: object) => styles },
    Switch: node('switch'),
    Text: node('text'),
    TextInput: node('textinput'),
    TouchableOpacity: node('touchableopacity'),
    View: node('view'),
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
    ['Backup', React.createElement(BackupScreen)],
    ['Assets', React.createElement(AssetsScreen)],
    ['Theme', React.createElement(ThemeScreen)],
    ['Link missing', React.createElement(LinkMissingScreen)],
    ['Goal form create', React.createElement(GoalFormScreen)],
    ['Goal form edit', React.createElement(GoalFormScreen)],
    ['Transaction form create', React.createElement(TransactionFormScreen)],
    ['Transaction form edit', React.createElement(TransactionFormScreen)],
    ['Liability form create', React.createElement(LiabilityFormScreen)],
    ['Liability form edit', React.createElement(LiabilityFormScreen)],
    ['Liability payment form create', React.createElement(LiabilityPaymentFormScreen)],
    ['Liability payment form edit', React.createElement(LiabilityPaymentFormScreen)],
    ['Investment form create', React.createElement(InvestmentFormScreen)],
    ['Investment form edit', React.createElement(InvestmentFormScreen)],
    ['Investment entry form create', React.createElement(InvestmentEntryFormScreen)],
    ['Investment entry form edit', React.createElement(InvestmentEntryFormScreen)],
    ['Emergency fund entry form create', React.createElement(EfEntryFormScreen)],
    ['Emergency fund entry form edit', React.createElement(EfEntryFormScreen)],
  ];

  it.each(screens)('%s renders without verb text', (_name, screen) => {
    const renderer = renderScreen(screen);
    assertNoVerbText(renderer.root);
  });
});
