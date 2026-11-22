import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PendingItemActions } from '../PendingItemActions';
import type { PendingItem } from '../../domain/pending';

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
}));

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: { text2: '#222', text3: '#666' } }),
}));

jest.mock('../ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppText: ({ children }: { children?: React.ReactNode }) => ReactModule.createElement('text', null, children),
    Button: ({ label, ...props }: { label: string; [key: string]: unknown }) =>
      ReactModule.createElement('button', props, label),
  };
});

const mockClearDue = jest.fn();
const mockClearDuesThrough = jest.fn();
const mockAddTransaction = jest.fn();
const mockSetActionToast = jest.fn();

let capturedPaidDialogProps: {
  visible: boolean;
  onPaid: (amount: number, date: string) => void;
  onNotPaid: () => void;
} | null = null;

jest.mock('../PaidAmountDialog', () => {
  return {
    PaidAmountDialog: (props: {
      visible: boolean;
      onPaid: (amount: number, date: string) => void;
      onNotPaid: () => void;
    }) => {
      capturedPaidDialogProps = props;
      return null;
    },
  };
});

const mockState = {
  lastError: null as string | null,
  data: {
    transactions: [] as {
      id: string;
      amount: number;
      date: string;
      source?: { kind: string; parentId: string; entryId: string };
    }[],
    holdings: [
      { id: 'holding-manual', kind: 'manual' as const, name: 'Index Fund', type: 'Stocks / ETF', entries: [] },
    ],
  },
};

jest.mock('../../data/store', () => ({
  useAppStore: {
    getState: () => mockState,
  },
}));

jest.mock('../../data/useAppData', () => ({
  useAppActions: () => ({
    clearDue: (...args: unknown[]) => mockClearDue(...args),
    clearDuesThrough: (...args: unknown[]) => mockClearDuesThrough(...args),
    addTransaction: (...args: unknown[]) => {
      mockAddTransaction(...args);
      mockState.data.transactions.push({ id: 'tx-new', amount: 100, date: '2026-11-15' });
    },
  }),
}));

jest.mock('../../data/uiStore', () => ({
  useUIStore: () => mockSetActionToast,
}));

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    Alert: { alert: jest.fn() },
    StyleSheet: { create: (styles: object) => styles },
    View: ({ children, ...props }: { children?: React.ReactNode }) =>
      ReactModule.createElement('view', props, children),
  };
});

describe('PendingItemActions payment date forwarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedPaidDialogProps = null;
    mockState.data.transactions = [];
  });

  it('passes selected payment date to addTransaction when clearing unlinked budget item', async () => {
    const item: PendingItem = {
      id: 'budget:2026-11:groceries',
      kind: 'budget',
      title: 'Groceries',
      category: 'Food',
      amount: 150,
      status: 'due-today',
      source: { kind: 'budget', category: 'Food', type: 'expense', month: '2026-11' },
      actionable: true,
    };

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <PendingItemActions item={item} today="2026-11-22" compact={false} />,
      );
    });

    if (!renderer) throw new Error('Renderer not initialized');

    // Trigger open dialog
    const clearButton = renderer.root.findAll((node) => node.props.label === 'Clear due')[0];
    act(() => {
      clearButton?.props.onPress();
    });

    expect(capturedPaidDialogProps?.visible).toBe(true);

    // Call onPaid with custom amount and custom date
    act(() => {
      capturedPaidDialogProps?.onPaid(140, '2026-11-10');
    });

    expect(mockAddTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 140,
        category: 'Food',
        date: '2026-11-10',
      }),
    );
  });

  it('passes selected payment date to clearDue when clearing manual holding budget item', async () => {
    mockClearDue.mockReturnValue('entry-1');
    mockState.data.transactions.push({
      id: 'tx-holding',
      amount: 500,
      date: '2026-11-05',
      source: { kind: 'holding-entry', parentId: 'holding-manual', entryId: 'entry-1' },
    });

    const item: PendingItem = {
      id: 'budget:2026-11:investment-item',
      kind: 'budget',
      title: 'Investment Item',
      category: 'Investments',
      amount: 500,
      status: 'due-today',
      source: { kind: 'budget', category: 'Investments', type: 'invest', month: '2026-11', holdingId: 'holding-manual' },
      actionable: true,
    };

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <PendingItemActions item={item} today="2026-11-22" compact={false} />,
      );
    });

    if (!renderer) throw new Error('Renderer not initialized');

    const clearButton = renderer.root.findAll((node) => node.props.label === 'Clear due')[0];
    act(() => {
      clearButton?.props.onPress();
    });

    act(() => {
      capturedPaidDialogProps?.onPaid(500, '2026-11-05');
    });

    expect(mockClearDue).toHaveBeenCalledWith(
      { kind: 'holding', id: 'holding-manual' },
      undefined,
      500,
      'Investment Item',
      '2026-11-05',
    );
  });

  it('passes selected payment date to clearDue when clearing policy due', async () => {
    mockClearDue.mockReturnValue('entry-policy-1');
    mockState.data.transactions.push({
      id: 'tx-policy',
      amount: 250,
      date: '2026-11-01',
      source: { kind: 'policy-payment', parentId: 'policy-1', entryId: 'entry-policy-1' },
    });

    const item: PendingItem = {
      id: 'due:policy:policy-1:slot-1',
      kind: 'due',
      title: 'Life Insurance',
      category: 'Insurance premium',
      amount: 250,
      dueDate: '2026-11-01',
      status: 'due-today',
      source: { kind: 'policy', parentId: 'policy-1', slotId: 'slot-1' },
      actionable: true,
    };

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <PendingItemActions item={item} today="2026-11-22" compact={false} />,
      );
    });

    if (!renderer) throw new Error('Renderer not initialized');

    const clearButton = renderer.root.findAll((node) => node.props.label === 'Clear due')[0];
    act(() => {
      clearButton?.props.onPress();
    });

    act(() => {
      capturedPaidDialogProps?.onPaid(250, '2026-11-01');
    });

    expect(mockClearDue).toHaveBeenCalledWith(
      { kind: 'policy', id: 'policy-1' },
      'slot-1',
      250,
      undefined,
      '2026-11-01',
    );
  });
});
