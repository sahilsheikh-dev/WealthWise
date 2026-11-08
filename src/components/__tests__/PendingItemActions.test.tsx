import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PendingItemActions } from '../PendingItemActions';
import type { PendingItem } from '../../domain/pending';

const mockRouterPush = jest.fn();
const mockConfirmAsync = jest.fn();
const mockSetActionToast = jest.fn();
const mockStoreState = {
  lastError: null as string | null,
  data: { transactions: [] as { id: string; amount: number; date: string; source?: { kind: string; parentId: string; entryId: string } }[] },
};
const mockActions = {
  addTransaction: jest.fn((input: { amount: number; date: string }) => {
    mockStoreState.data.transactions.push({ id: 'budget-transaction', ...input });
  }),
  deleteTransaction: jest.fn((id: string) => {
    mockStoreState.data.transactions = mockStoreState.data.transactions.filter((transaction) => transaction.id !== id);
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
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  return {
    Alert: { alert: jest.fn() },
    StyleSheet: { create: (styles: object) => styles },
    View: node('view'),
  };
});

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
    pressPay(item({ kind: 'budget', category: 'Other investments' }, 'Other investments'));
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
    expect(mockConfirmAsync).toHaveBeenCalledWith({
      title: 'Clear dues?',
      message: 'Clear 3 dues through 10 Dec 2026? This includes 2 earlier dues, ₹250 total.',
      confirmLabel: 'Clear due',
    });
    expect(mockActions.clearDuesThrough).toHaveBeenCalledWith(
      { kind: 'plan', id: 'sip-1' },
      '2026-12-10',
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
    const planned = item({ kind: 'budget', category: 'Food' });
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
