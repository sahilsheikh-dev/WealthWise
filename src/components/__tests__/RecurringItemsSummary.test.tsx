import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { RecurringItemsSummary } from '../form/RecurringItemsSummary';
import type { BudgetCommitment } from '../../domain/budget';

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    View: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      ReactModule.createElement('view', props, children),
  };
});

jest.mock('../AmountText', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AmountText: (props: Record<string, unknown>) => ReactModule.createElement('amounttext', props),
  };
});

jest.mock('../ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppText: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      ReactModule.createElement('text', props, children),
  };
});

describe('RecurringItemsSummary', () => {
  it('lists scheduled items as read-only monthly amounts', () => {
    const items: BudgetCommitment[] = [
      {
        kind: 'plan',
        id: 'sip',
        name: 'Index SIP',
        category: 'Mutual fund / SIP',
        dueDate: '2026-03-10',
        plannedAmount: 2_500,
        status: 'upcoming',
        paidAmount: 0,
      },
      {
        kind: 'policy',
        id: 'health-cover',
        name: 'Health cover',
        category: 'Insurance',
        dueDate: '2026-03-20',
        plannedAmount: 1_200,
        status: 'upcoming',
        paidAmount: 0,
      },
    ];
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<RecurringItemsSummary items={items} />); });
    if (!renderer) throw new Error('Recurring items summary did not render.');
    const text = renderer.root.findAllByType('text')
      .map((node) => node.children.map(String).join(''));
    expect(text).toEqual(expect.arrayContaining([
      'Recurring items (automatic)',
      'Index SIP',
      'Mutual fund / SIP · 10 Mar 2026',
      'Health cover',
      'Insurance · 20 Mar 2026',
    ]));
    expect(renderer.root.findAll((node) => String(node.type) === 'amounttext').map((node) => ({
      value: node.props.value,
      tier: node.props.tier,
    }))).toEqual([
      { value: 2_500, tier: 'row' },
      { value: 1_200, tier: 'row' },
    ]);
    expect(renderer.root.findAllByType('button')).toHaveLength(0);
    act(() => renderer?.unmount());
  });
});
