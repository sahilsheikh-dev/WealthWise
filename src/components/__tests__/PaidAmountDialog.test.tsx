import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PaidAmountDialog } from '../PaidAmountDialog';

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: { text2: '#666', border: '#ccc', surface: '#fff' } }),
}));

jest.mock('../form/DateField', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    DateField: (props: Record<string, unknown>) => ReactModule.createElement('date-field', props),
  };
});

jest.mock('../form/MoneyField', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    MoneyField: (props: Record<string, unknown>) => ReactModule.createElement('money-field', props),
  };
});

jest.mock('../TopAnchoredSheet', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    TopAnchoredSheet: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
      visible ? ReactModule.createElement('sheet', null, children) : null,
  };
});

describe('PaidAmountDialog', () => {
  it('renders paid amount and payment date defaulting to today', () => {
    const onPaid = jest.fn();
    const onNotPaid = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <PaidAmountDialog
          visible={true}
          title="Electricity bill"
          dueAmount={150}
          dueDate="2026-11-20"
          defaultDate="2026-11-22"
          onPaid={onPaid}
          onNotPaid={onNotPaid}
        />,
      );
    });

    if (!renderer) throw new Error('Renderer not initialized');

    const moneyField = renderer.root.findByProps({ accessibilityLabel: 'Paid amount' });
    expect(moneyField.props.value).toBe('150');

    const dateField = renderer.root.findByProps({ accessibilityLabel: 'Payment date' });
    expect(dateField.props.value).toBe('2026-11-22');
    expect(dateField.props.label).toBe('Payment date');
  });

  it('submits with modified amount and modified payment date', () => {
    const onPaid = jest.fn();
    const onNotPaid = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <PaidAmountDialog
          visible={true}
          title="Internet bill"
          dueAmount={60}
          dueDate="2026-11-15"
          defaultDate="2026-11-22"
          onPaid={onPaid}
          onNotPaid={onNotPaid}
        />,
      );
    });

    if (!renderer) throw new Error('Renderer not initialized');

    const moneyField = renderer.root.findByProps({ accessibilityLabel: 'Paid amount' });
    const dateField = renderer.root.findByProps({ accessibilityLabel: 'Payment date' });

    act(() => {
      moneyField.props.onChangeText('65');
      dateField.props.onChange('2026-11-18');
    });

    const paidButton = renderer.root.findAll((node) => node.props.label === 'Paid')[0];
    act(() => {
      paidButton?.props.onPress();
    });

    expect(onPaid).toHaveBeenCalledWith(65, '2026-11-18');
    expect(onNotPaid).not.toHaveBeenCalled();
  });

  it('rejects invalid payment date or amount', () => {
    const onPaid = jest.fn();
    const onNotPaid = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <PaidAmountDialog
          visible={true}
          title="Water bill"
          dueAmount={40}
          defaultDate="2026-11-22"
          onPaid={onPaid}
          onNotPaid={onNotPaid}
        />,
      );
    });

    if (!renderer) throw new Error('Renderer not initialized');

    const moneyField = renderer.root.findByProps({ accessibilityLabel: 'Paid amount' });
    const dateField = renderer.root.findByProps({ accessibilityLabel: 'Payment date' });

    // Invalid amount
    act(() => {
      moneyField.props.onChangeText('0');
    });
    const paidButton = renderer.root.findAll((node) => node.props.label === 'Paid')[0];
    act(() => {
      paidButton?.props.onPress();
    });
    expect(onPaid).not.toHaveBeenCalled();

    // Invalid date
    act(() => {
      moneyField.props.onChangeText('40');
      dateField.props.onChange('invalid-date');
    });
    act(() => {
      paidButton?.props.onPress();
    });
    expect(onPaid).not.toHaveBeenCalled();
  });

  it('calls onNotPaid when cancelled', () => {
    const onPaid = jest.fn();
    const onNotPaid = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <PaidAmountDialog
          visible={true}
          title="Rent"
          dueAmount={1000}
          onPaid={onPaid}
          onNotPaid={onNotPaid}
        />,
      );
    });

    if (!renderer) throw new Error('Renderer not initialized');

    const notPaidButton = renderer.root.findAll((node) => node.props.label === 'Not paid')[0];
    act(() => {
      notPaidButton?.props.onPress();
    });

    expect(onNotPaid).toHaveBeenCalled();
    expect(onPaid).not.toHaveBeenCalled();
  });
});
