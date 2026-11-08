import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PendingItemActions } from '../PendingItemActions';
import type { PendingItem } from '../../domain/pending';

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
}));
jest.mock('../../data/store', () => ({
  useAppStore: Object.assign(() => null, { getState: () => ({ lastError: null, data: { transactions: [] } }) }),
}));
jest.mock('../../data/useAppData', () => ({ useAppActions: () => ({}) }));
jest.mock('../../data/uiStore', () => ({ useUIStore: (selector: (state: object) => unknown) =>
  selector({ setActionToast: jest.fn() }) }));
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
    title: 'Pending item',
    category,
    amount: 125,
    dueDate: '2026-10-10',
    status: 'upcoming',
    source,
    actionable: true,
  };
}

function pressPay(pending: PendingItem): void {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => { renderer = TestRenderer.create(<PendingItemActions item={pending} today="2026-10-12" />); });
  if (!renderer) throw new Error('Pending actions did not render.');
  act(() => renderer?.root.findByProps({ children: 'Pay' }).props.onPress());
}

describe('pending item Pay navigation', () => {
  beforeEach(() => mockRouterPush.mockClear());

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
