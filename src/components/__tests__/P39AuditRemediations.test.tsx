import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import {
  isSQLiteFallbackActive,
  markSQLiteFallbackActive,
  resetSQLiteFallbackForTests,
  SQLITE_FALLBACK_WARNING,
  subscribeSQLiteFallback,
} from '../../data/sqliteFallback';
import { closeRouteSafely, singleParam } from '../../lib/routeParams';
import { StorageErrorBanner } from '../StorageErrorBanner';

let mockSearchParams: Record<string, string | string[] | undefined> = {};

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
    canGoBack: jest.fn(() => false),
  },
  useLocalSearchParams: () => mockSearchParams,
  usePathname: () => '/payment-confirm',
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('../form/FormScreen', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require('react-native');
  return {
    FormScreen: ({ title, onClose, footer, children }: {
      title: string;
      onClose: () => void;
      footer?: React.ReactNode;
      children: React.ReactNode;
    }) => (
      <View>
        <Text>{title}</Text>
        <Pressable accessibilityLabel="Close" onPress={onClose} />
        {children}
        {footer}
      </View>
    ),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockRouter = require('expo-router').router as {
  back: jest.Mock;
  replace: jest.Mock;
  push: jest.Mock;
  canGoBack: jest.Mock;
};

const mockStoreState = {
  storageError: null as string | null,
  storageWarning: null as string | null,
  lastError: null as string | null,
  data: {
    holdings: [],
    liabilities: [],
    goals: [],
    transactions: [],
    policies: [],
    efAllocation: { liquidCash: 0, savingsAccount: 0, fixedDeposits: 0, custom: {} },
    efCustomBuckets: [],
    efLinks: {},
    settings: { onboarded: true, name: 'Test' },
    budgetPlan: { sections: [], items: [], income: [] },
    monthBudgets: [],
  },
  actions: {
    dismissStorageError: jest.fn(() => {
      mockStoreState.storageError = null;
    }),
    dismissStorageWarning: jest.fn(() => {
      mockStoreState.storageWarning = null;
    }),
    reportStorageWarning: jest.fn((message: string) => {
      mockStoreState.storageWarning = message;
    }),
  },
};

jest.mock('../../data/store', () => {
  const useAppStore = (selector: (s: typeof mockStoreState) => unknown) => selector(mockStoreState);
  useAppStore.getState = () => mockStoreState;
  return { useAppStore };
});

jest.mock('../../data/useAppData', () => ({
  useAppActions: () => mockStoreState.actions,
  useAppStore: (selector: (s: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: {
      bg: '#ffffff',
      surface: '#f8fafc',
      surface2: '#f1f5f9',
      text1: '#0f172a',
      text2: '#475569',
      line: '#cbd5e1',
      primary: '#2563eb',
      primaryDim: '#dbeafe',
      ok: '#16a34a',
      okDim: '#dcfce7',
      err: '#dc2626',
      errDim: '#fee2e2',
      info: '#0284c7',
      infoDim: '#e0f2fe',
      purple: '#7c3aed',
      purpleDim: '#f3e8ff',
    },
    isDark: false,
  }),
}));

function visibleText(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAll((node) => typeof node.props.children === 'string')
    .map((node) => String(node.props.children))
    .join(' ');
}

describe('P39-H-R1 audit remediations', () => {
  beforeEach(() => {
    resetSQLiteFallbackForTests();
    mockStoreState.storageError = null;
    mockStoreState.storageWarning = null;
    mockStoreState.lastError = null;
    mockSearchParams = {};
    mockRouter.back.mockClear();
    mockRouter.replace.mockClear();
    mockRouter.canGoBack.mockReturnValue(false);
    mockStoreState.actions.dismissStorageError.mockClear();
    mockStoreState.actions.dismissStorageWarning.mockClear();
  });

  describe('1. SQLite fallback warning', () => {
    it('notifies subscribers when SQLite falls back to legacy storage', () => {
      const listener = jest.fn();
      const unsubscribe = subscribeSQLiteFallback(listener);
      expect(isSQLiteFallbackActive()).toBe(false);
      markSQLiteFallbackActive();
      expect(isSQLiteFallbackActive()).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      markSQLiteFallbackActive();
      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();
    });

    it('renders non-intrusive fallback warning without implying data loss and dismisses cleanly', () => {
      mockStoreState.storageWarning = SQLITE_FALLBACK_WARNING;
      let renderer!: TestRenderer.ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(React.createElement(StorageErrorBanner));
      });
      const text = visibleText(renderer);
      expect(text).toContain('Primary database unavailable; using backup local storage. Your data is preserved.');
      expect(text).not.toContain('could not be saved');

      const dismissButton = renderer.root.findByProps({ accessibilityLabel: 'Dismiss storage warning' });
      act(() => {
        dismissButton.props.onPress();
      });
      expect(mockStoreState.actions.dismissStorageWarning).toHaveBeenCalledTimes(1);
      act(() => renderer.unmount());
    });

    it('keeps write error precedence over fallback warning', () => {
      mockStoreState.storageWarning = SQLITE_FALLBACK_WARNING;
      mockStoreState.storageError = 'Disk full';
      let renderer!: TestRenderer.ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(React.createElement(StorageErrorBanner));
      });
      expect(visibleText(renderer)).toContain('Your last change could not be saved.');
      act(() => renderer.unmount());
    });
  });

  describe('2. Explicit modal route registrations', () => {
    it('registers all five previously implicit modal form routes in app/_layout.tsx', () => {
      const layout = readFileSync(join(process.cwd(), 'app/_layout.tsx'), 'utf8');
      for (const routeName of [
        'ef-allocation-form',
        'holding-valuation-form',
        'liability-closure-form',
        'liability-closure-note-form',
        'recurring-plan-stop-form',
      ]) {
        expect(layout).toContain(`<Stack.Screen name="${routeName}" options={{ presentation: 'modal' }} />`);
      }
    });
  });

  describe('3. Deep-link parameter handling', () => {
    it('normalizes params and closes safely on cold deep-link launch vs back stack', () => {
      expect(singleParam(undefined)).toBeUndefined();
      expect(singleParam('   ')).toBeUndefined();
      expect(singleParam([' id-1 ', 'id-2'])).toBe('id-1');

      mockRouter.canGoBack.mockReturnValue(false);
      closeRouteSafely('/assets');
      expect(mockRouter.replace).toHaveBeenCalledWith('/assets');
      expect(mockRouter.back).not.toHaveBeenCalled();

      mockRouter.canGoBack.mockReturnValue(true);
      closeRouteSafely('/assets');
      expect(mockRouter.back).toHaveBeenCalledTimes(1);
    });

    it('renders safe fallback UI and navigates to a safe route when opened with missing/invalid params', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const HoldingValuationFormScreen = require('../../../app/holding-valuation-form').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const RecurringPlanStopFormScreen = require('../../../app/recurring-plan-stop-form').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const LiabilityClosureFormScreen = require('../../../app/liability-closure-form').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const PaymentConfirmScreen = require('../../../app/payment-confirm').default;

      mockSearchParams = { id: 'nonexistent', liabilityId: 'nonexistent', dueItemId: '', dueDate: 'invalid' };

      for (const [Component, expectedText, fallback] of [
        [HoldingValuationFormScreen, 'Holding not found', '/assets'],
        [RecurringPlanStopFormScreen, 'Plan not found', '/assets'],
        [LiabilityClosureFormScreen, 'Open recurring liability not found', '/liabilities'],
        [PaymentConfirmScreen, 'Reminder unavailable', '/(tabs)'],
      ] as const) {
        mockRouter.replace.mockClear();
        let renderer!: TestRenderer.ReactTestRenderer;
        act(() => {
          renderer = TestRenderer.create(React.createElement(Component));
        });
        expect(visibleText(renderer)).toContain(expectedText);
        const closeBtn = renderer.root.findAll(
          (n) => (n.props.accessibilityLabel === 'Close' || n.props.label === 'Close')
            && (typeof n.props.onPress === 'function' || typeof n.props.onClose === 'function'),
        )[0];
        const handler = closeBtn?.props.onClose ?? closeBtn?.props.onPress;
        if (typeof handler === 'function') {
          act(() => handler());
          expect(mockRouter.replace).toHaveBeenCalledWith(fallback);
        }
        act(() => renderer.unmount());
      }
    });
  });

  describe('4. Development-only stress data', () => {
    it('avoids static value import of stressData in createAppStore.ts while keeping Demo Mode intact', () => {
      const source = readFileSync(join(process.cwd(), 'src/data/createAppStore.ts'), 'utf8');
      expect(source).not.toMatch(/^import\s+\{[^}]*\bcreateStressData\b[^}]*\}\s+from\s+'\.\.\/domain\/stressData';/m);
      expect(source).toContain("import { buildDemoData } from '../mock/demoData';");
      expect(source).toContain("require('../domain/stressData')");
    });
  });
});
