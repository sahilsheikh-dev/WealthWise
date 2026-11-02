import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PendingItemActions } from '../PendingItemActions';
import type { PendingItem } from '../../domain/pending';

const mockRouterPush = jest.fn();
const mockConfirmAsync = jest.fn();
const mockSetActionToast = jest.fn();
const mockStoreState = {
  lastError: null as string | null,
  data: {
    transactions: [] as {
      id: string;
      amount: number;
      date: string;
      type?: 'income' | 'expense' | 'invest';
      category?: string;
      note?: string;
      source?: { kind: string; parentId: string; entryId: string };
    }[],
    budgetPlan: null as { items: { name: string; holdingId?: string }[] } | null,
    monthBudgets: [] as { month: string; items: { name: string; holdingId?: string }[] }[],
    holdings: [] as {
      id: string;
      kind: 'manual' | 'plan';
      name: string;
      type: string;
      logs: { id: string; date: string; amount: number; kind: 'Deposit' | 'Withdrawal'; note: string }[];
    }[],
  },
};
const mockActions = {
  addTransaction: jest.fn((input: {
    type: 'income' | 'expense' | 'invest';
    amount: number;
    category: string;
    note: string;
    date: string;
  }) => {
    mockStoreState.data.transactions.push({ id: 'budget-transaction', ...input });
  }),
  deleteTransaction: jest.fn((id: string) => {
    mockStoreState.data.transactions = mockStoreState.data.transactions.filter((transaction) => transaction.id !== id);
  }),
  addInvestmentEntry: jest.fn((holdingId: string, input: {
    date: string;
    amount: number;
    kind: 'Deposit' | 'Withdrawal';
    note: string;
  }) => {
    const holding = mockStoreState.data.holdings.find((item) => item.id === holdingId);
    if (!holding) return;
    const entryId = `investment-entry-${holding.logs.length + 1}`;
    holding.logs.push({ ...input, id: entryId });
    mockStoreState.data.transactions.push({
      id: `investment-transaction-${entryId}`,
      type: input.kind === 'Deposit' ? 'invest' : 'income',
      amount: input.amount,
      category: input.kind === 'Deposit' ? 'Other' : 'Withdrawal',
      note: input.kind === 'Deposit' ? `${holding.name} deposit` : `${holding.name} withdrawal`,
      date: input.date,
      source: { kind: 'holding-entry', parentId: holdingId, entryId },
    });
  }),
  deleteInvestmentEntry: jest.fn((holdingId: string, entryId: string) => {
    const holding = mockStoreState.data.holdings.find((item) => item.id === holdingId);
    if (!holding) return;
    holding.logs = holding.logs.filter((entry) => entry.id !== entryId);
    mockStoreState.data.transactions = mockStoreState.data.transactions.filter((transaction) =>
      transaction.source?.kind !== 'holding-entry'
      || transaction.source.parentId !== holdingId
      || transaction.source.entryId !== entryId);
  }),
  clearDue: jest.fn(),
  clearDuesThrough: jest.fn((_target: unknown, _dueDate: string) => {
    mockStoreState.data.transactions = [
      { id: 'clear-1', amount: 80, date: '2026-10-12', source: { kind: 'holding-entry', parentId: 'sip-1', entryId: 'entry-1' } },
      { id: 'clear-2', amount: 80, date: '2026-10-12', source: { kind: 'holding-entry', parentId: 'sip-1', entryId: 'entry-2' } },
      { id: 'clear-3', amount: 90, date: '2026-10-12', source: { kind: 'holding-entry', parentId: 'sip-1', entryId: 'entry-3' } },
    ];
    return ['entry-1', 'entry-2', 'entry-3'];
  }),
  undoClearDue: jest.fn(),
  undoClearDuesThrough: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
}));
jest.mock('../../data/store', () => ({
  useAppStore: Object.assign(() => null, { getState: () => mockStoreState }),
}));
jest.mock('../../data/useAppData', () => ({ useAppActions: () => mockActions }));
jest.mock('../../data/uiStore', () => ({ useUIStore: (selector: (state: object) => unknown) =>
  selector({ setActionToast: mockSetActionToast }) }));
jest.mock('../../domain/dues', () => ({
  duesThroughPreview: () => ({ count: 3, amount: 250 }),
}));
jest.mock('../../lib/confirm', () => ({
  confirmAsync: (...args: unknown[]) => mockConfirmAsync(...args),
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
jest.mock('../PaidAmountDialog', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    PaidAmountDialog: ({ visible, dueAmount, onPaid, onNotPaid }: {
      visible: boolean;
      dueAmount: number;
      onPaid: (amount: number) => void;
      onNotPaid: () => void;
    }) => {
      ReactModule.useEffect(() => {
        if (!visible) return;
        // Exercise the shared paid-dialog callback while keeping this suite focused on action writes.
        onPaid(dueAmount);
      }, [visible, dueAmount, onPaid]);
      if (!visible) return null;
      return ReactModule.createElement('view', null,
        ReactModule.createElement('button', { onPress: () => onPaid(dueAmount) }, 'Paid'),
        ReactModule.createElement('button', { onPress: onNotPaid }, 'Not paid'),
      );
    },
  };
});
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  return {
    Alert: { alert: jest.fn() },
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1, absoluteFill: {} },
    View: node('view'),
    TextInput: node('text-input'),
    ScrollView: node('scroll-view'),
    Modal: node('modal'),
    Pressable: node('pressable'),
    Keyboard: { addListener: () => ({ remove: jest.fn() }) },
    KeyboardAvoidingView: node('keyboard-avoiding-view'),
    Platform: { OS: 'ios' },
    useWindowDimensions: () => ({ height: 800, fontScale: 1 }),
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

function item(source: PendingItem['source'], category = 'Food'): PendingItem {
  return {
    id: 'pending',
    kind: source.kind === 'budget' ? 'budget' : 'due',
    title: 'Scheduled item',
    category,
    amount: 125,
    dueDate: '2026-10-10',
    status: 'upcoming',
    source,
    actionable: true,
  };
}

beforeEach(() => {
  mockRouterPush.mockClear();
  mockConfirmAsync.mockReset();
  mockSetActionToast.mockReset();
  mockStoreState.lastError = null;
  mockStoreState.data.transactions = [];
  mockStoreState.data.budgetPlan = null;
  mockStoreState.data.monthBudgets = [];
  mockStoreState.data.holdings = [];
  Object.values(mockActions).forEach((action) => action.mockClear());
  mockActions.clearDuesThrough.mockImplementation(() => {
    mockStoreState.data.transactions = [
      { id: 'clear-1', amount: 80, date: '2026-10-12', source: { kind: 'holding-entry', parentId: 'sip-1', entryId: 'entry-1' } },
      { id: 'clear-2', amount: 80, date: '2026-10-12', source: { kind: 'holding-entry', parentId: 'sip-1', entryId: 'entry-2' } },
      { id: 'clear-3', amount: 90, date: '2026-10-12', source: { kind: 'holding-entry', parentId: 'sip-1', entryId: 'entry-3' } },
    ];
    return ['entry-1', 'entry-2', 'entry-3'];
  });
});

function pressPay(pending: PendingItem): void {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => { renderer = TestRenderer.create(<PendingItemActions item={pending} today="2026-10-12" />); });
  if (!renderer) throw new Error('Pending actions did not render.');
  act(() => renderer?.root.findByProps({ children: 'Pay' }).props.onPress());
}

describe('pending item Pay navigation', () => {
  it('opens the investment-entry form with the selected plan and prefilled deposit', () => {
    pressPay(item({ kind: 'plan', parentId: 'sip-1', slotId: 'slot-1' }, 'Mutual fund / SIP'));
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/investment-entry-form',
      params: { holdingId: 'sip-1', kind: 'Deposit', date: '2026-10-12', amount: '125' },
    });
  });

  it('opens the liability-payment form with the selected liability and payment kind', () => {
    pressPay(item({
      kind: 'liability',
      parentId: 'loan-1',
      slotId: 'slot-1',
      paymentKind: 'EMI',
    }));
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/liability-payment-form',
      params: { liabilityId: 'loan-1', kind: 'EMI', date: '2026-10-12', amount: '125' },
    });
  });

  it('opens a budget transaction with its category, amount, date, and pending-only investment mode', () => {
    pressPay(item({ kind: 'budget', category: 'Other investments', type: 'invest' }, 'Other investments'));
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/transaction-form',
      params: {
        type: 'invest',
        category: 'Other investments',
        date: '2026-10-12',
        amount: '125',
        pending: '1',
      },
    });
  });
});

describe('later due and planned item actions', () => {
  it('clears a manual Insurance budget due as an expense in Insurance', () => {
    const due = item({ kind: 'budget', category: 'Insurance', type: 'expense' }, 'Insurance');
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<PendingItemActions item={due} today="2026-10-12" />);
    });
    if (!renderer) throw new Error('Insurance budget actions did not render.');
    const clearButton = renderer.root.findAllByType('button')
      .find((button) => button.children.join('') === 'Clear due');
    if (!clearButton) throw new Error('Insurance budget clear action was not rendered.');
    act(() => clearButton.props.onPress());
    expect(mockActions.addTransaction).toHaveBeenCalledWith({
      type: 'expense',
      amount: 125,
      category: 'Insurance',
      note: '',
      date: '2026-10-12',
    });
    expect(mockStoreState.data.transactions.at(-1)).toMatchObject({
      type: 'expense',
      amount: 125,
      category: 'Insurance',
      date: '2026-10-12',
    });
  });

  it('uses the Transactions Paid label for a direct oldest-due clear and offers Undo', () => {
    mockActions.clearDue.mockImplementation(() => {
      mockStoreState.data.transactions = [{
        id: 'cleared-entry',
        amount: 125,
        date: '2026-10-12',
        source: { kind: 'holding-entry', parentId: 'sip-1', entryId: 'cleared-entry' },
      }];
      return 'cleared-entry';
    });
    const due = item({ kind: 'plan', parentId: 'sip-1', slotId: 'slot-1' });
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <PendingItemActions item={due} today="2026-10-12" compact actionLabel="Paid" />,
      );
    });
    if (!renderer) throw new Error('Compact due action did not render.');
    expect(renderer.root.findAllByType('button').map((button) => button.children.join('')))
      .toEqual(['Paid']);
    act(() => renderer?.root.findByType('button').props.onPress());
    expect(mockActions.clearDue).toHaveBeenCalledWith({ kind: 'plan', id: 'sip-1' }, 'slot-1', 125);
    expect(mockConfirmAsync).not.toHaveBeenCalled();
    expect(mockSetActionToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Marked ₹125 as paid',
      actionLabel: 'Undo',
      onAction: expect.any(Function),
    }));
    const toast = mockSetActionToast.mock.calls[0]?.[0] as { onAction: () => void };
    toast.onAction();
    expect(mockActions.undoClearDue).toHaveBeenCalledWith({ kind: 'plan', id: 'sip-1' }, 'cleared-entry');
  });

  it('supports the Received label for income dues', () => {
    const due = item({ kind: 'budget', category: 'Food', type: 'expense' });
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <PendingItemActions item={due} today="2026-10-12" compact actionLabel="Received" />,
      );
    });
    if (!renderer) throw new Error('Compact income action did not render.');
    expect(renderer.root.findAllByType('button').map((button) => button.children.join('')))
      .toEqual(['Received']);
  });

  it('clears a compact budget row directly as Marked as paid and offers undo', () => {
    const planned = item({ kind: 'budget', category: 'Food', type: 'expense' });
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<PendingItemActions item={planned} today="2026-10-12" compact />); });
    if (!renderer) throw new Error('Compact budget actions did not render.');
    expect(renderer.root.findAllByType('button').map((button) => button.children.join('')))
      .toEqual(['Marked as paid']);
    act(() => renderer?.root.findByType('button').props.onPress());
    expect(mockActions.addTransaction).toHaveBeenCalledWith({
      type: 'expense',
      amount: 125,
      category: 'Food',
      note: '',
      date: '2026-10-12',
    });

    expect(mockSetActionToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Marked ₹125 as paid',
      actionLabel: 'Undo',
      onAction: expect.any(Function),
    }));
    const toast = mockSetActionToast.mock.calls[0]?.[0] as { onAction: () => void };
    toast.onAction();
    expect(mockActions.deleteTransaction).toHaveBeenCalledWith('budget-transaction');
  });

  it('clears a linked manual investment budget item with one holding entry and exact Undo', () => {
    const original = {
      transactions: [] as typeof mockStoreState.data.transactions,
      budgetPlan: { items: [{ name: 'Emergency cash', holdingId: 'manual-cash' }] },
      monthBudgets: [] as typeof mockStoreState.data.monthBudgets,
      holdings: [{
        id: 'manual-cash',
        kind: 'manual' as const,
        name: 'Cash reserve',
        type: 'Cash',
        logs: [] as typeof mockStoreState.data.holdings[number]['logs'],
      }],
    };
    mockStoreState.data.transactions = [...original.transactions];
    mockStoreState.data.budgetPlan = {
      items: original.budgetPlan.items.map((budgetItem) => ({ ...budgetItem })),
    };
    mockStoreState.data.monthBudgets = [...original.monthBudgets];
    mockStoreState.data.holdings = original.holdings.map((holding) => ({
      ...holding,
      logs: [...holding.logs],
    }));

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <PendingItemActions
          item={item({ kind: 'budget', category: 'Emergency cash', type: 'invest' }, 'Emergency cash')}
          today="2026-10-12"
          compact
        />,
      );
    });
    if (!renderer) throw new Error('Linked budget actions did not render.');
    act(() => {
      renderer?.root.findByProps({ children: 'Marked as paid' }).props.onPress();
    });

    expect(mockActions.addInvestmentEntry).toHaveBeenCalledTimes(1);
    expect(mockActions.addInvestmentEntry).toHaveBeenCalledWith('manual-cash', {
      date: '2026-10-12',
      amount: 125,
      kind: 'Deposit',
      note: 'Scheduled item',
    });
    expect(mockActions.addTransaction).not.toHaveBeenCalled();
    expect(mockStoreState.data.holdings[0]?.logs).toMatchObject([{
      kind: 'Deposit', amount: 125, date: '2026-10-12', note: 'Scheduled item',
    }]);
    expect(mockStoreState.data.transactions).toMatchObject([{
      type: 'invest', amount: 125, date: '2026-10-12',
      source: { kind: 'holding-entry', parentId: 'manual-cash', entryId: 'investment-entry-1' },
    }]);

    const toast = mockSetActionToast.mock.calls[0]?.[0] as { onAction: () => void };
    act(() => toast.onAction());
    expect(mockActions.deleteInvestmentEntry).toHaveBeenCalledTimes(1);
    expect(mockActions.deleteInvestmentEntry).toHaveBeenCalledWith('manual-cash', 'investment-entry-1');
    expect(mockStoreState.data).toEqual(original);
  });

  it('records an income due as one Received transaction with undo', () => {
    const due = item({ kind: 'income', incomeId: 'salary-1' }, 'Salary');
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <PendingItemActions item={due} today="2026-10-12" compact actionLabel="Received" />,
      );
    });
    if (!renderer) throw new Error('Income due actions did not render.');
    act(() => renderer?.root.findByType('button').props.onPress());
    expect(mockActions.addTransaction).toHaveBeenCalledTimes(1);
    expect(mockActions.addTransaction).toHaveBeenCalledWith({
      type: 'income',
      amount: 125,
      category: 'Salary',
      note: 'Scheduled item',
      date: '2026-10-12',
    });
    expect(mockSetActionToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Received ₹125',
      actionLabel: 'Undo',
      onAction: expect.any(Function),
    }));
    const toast = mockSetActionToast.mock.calls[0]?.[0] as { onAction: () => void };
    act(() => toast.onAction());
    expect(mockActions.deleteTransaction).toHaveBeenCalledWith('budget-transaction');
  });

  it('uses the compact paid action for later dues and confirms the exact clear-through preview', async () => {
    mockConfirmAsync.mockResolvedValue(true);
    const laterDue = {
      ...item({ kind: 'plan', parentId: 'sip-1', slotId: 'slot-3' }, 'Mutual fund / SIP'),
      dueDate: '2026-12-10',
      actionable: false,
    };
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<PendingItemActions item={laterDue} today="2026-10-12" compact />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Compact later-due actions did not render.');
    expect(renderer.root.findAllByType('button').map((button) => button.children.join('')))
      .toEqual(['Marked as paid']);
    await act(async () => {
      renderer?.root.findByType('button').props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockConfirmAsync).not.toHaveBeenCalled();
    expect(mockActions.clearDuesThrough).toHaveBeenCalledWith(
      { kind: 'plan', id: 'sip-1' },
      '2026-12-10',
      125,
    );
  });

  it('asks before clearing later installments, records one through action and provides one undo', async () => {
    mockConfirmAsync.mockResolvedValue(true);
    const laterDue = {
      ...item({ kind: 'plan', parentId: 'sip-1', slotId: 'slot-3' }, 'Mutual fund / SIP'),
      dueDate: '2026-12-10',
      actionable: false,
    };
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<PendingItemActions item={laterDue} today="2026-10-12" />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Later due actions did not render.');
    expect(renderer.root.findAllByType('button').map((button) => button.children.join('')))
      .toEqual(['Clear due']);
    await act(async () => {
      renderer?.root.findAllByProps({ children: 'Clear due' })[0]?.props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockConfirmAsync).not.toHaveBeenCalled();
    expect(mockActions.clearDuesThrough).toHaveBeenCalledWith(
      { kind: 'plan', id: 'sip-1' },
      '2026-12-10',
      125,
    );
    expect(mockSetActionToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Marked ₹250 as paid',
      actionLabel: 'Undo',
      onAction: expect.any(Function),
    }));
    const toast = mockSetActionToast.mock.calls[0]?.[0] as { onAction: () => void };
    toast.onAction();
    expect(mockActions.undoClearDuesThrough).toHaveBeenCalledWith(
      { kind: 'plan', id: 'sip-1' },
      ['entry-1', 'entry-2', 'entry-3'],
    );
  });

  it('clears a planned budget row as a transaction and offers undo', () => {
    const planned = item({ kind: 'budget', category: 'Food', type: 'expense' });
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<PendingItemActions item={planned} today="2026-10-12" />); });
    if (!renderer) throw new Error('Budget actions did not render.');
    act(() => renderer?.root.findAllByProps({ children: 'Clear due' })[0]?.props.onPress());
    expect(mockActions.addTransaction).toHaveBeenCalledWith({
      type: 'expense',
      amount: 125,
      category: 'Food',
      note: '',
      date: '2026-10-12',
    });
    expect(mockStoreState.data.transactions).toEqual([
      { id: 'budget-transaction', amount: 125, date: '2026-10-12', type: 'expense', category: 'Food', note: '' },
    ]);
    expect(mockSetActionToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Marked ₹125 as paid',
      actionLabel: 'Undo',
    }));
    const toast = mockSetActionToast.mock.calls[0]?.[0] as { onAction: () => void };
    act(() => toast.onAction());
    expect(mockActions.deleteTransaction).toHaveBeenCalledWith('budget-transaction');
    expect(mockStoreState.data.transactions).toEqual([]);
  });
});
