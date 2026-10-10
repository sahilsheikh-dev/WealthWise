import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import EfEntryFormScreen from '../../../app/ef-entry-form';

const mockAddEfEntry = jest.fn();
const mockBack = jest.fn();
const mockState = {
  data: {
    settings: { name: '', theme: 'system' as const },
    transactions: [],
    goals: [],
    holdings: [],
    liabilities: [],
    efEntries: [{ id: 'deposit', date: '2026-10-10', amount: 10_000, note: '' }],
  },
  lastError: null,
};

jest.mock('expo-router', () => ({
  router: { back: (...args: unknown[]) => mockBack(...args) },
  useLocalSearchParams: () => ({ kind: 'Withdrawal' }),
}));
jest.mock('../../../src/data/store', () => {
  const useAppStore = (selector: (state: typeof mockState) => unknown) => selector(mockState);
  Object.assign(useAppStore, { getState: () => mockState });
  return { useAppStore };
});
jest.mock('../../../src/data/useAppData', () => ({
  useAppActions: () => ({ addEfEntry: (...args: unknown[]) => mockAddEfEntry(...args) }),
}));
jest.mock('../../../src/lib/clock', () => ({ todayISO: () => '2026-10-10' }));
jest.mock('../../../src/lib/confirm', () => ({ confirmAsync: jest.fn() }));
jest.mock('../../../src/components/ScreenErrorBoundary', () => ({ ScreenErrorBoundary: () => null }));
jest.mock('../../../src/components/form/FormScreen', () => ({
  FormScreen: ({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('form', null, children, footer);
  },
}));
jest.mock('../../../src/components/form/DateField', () => ({
  DateField: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('datefield', props);
  },
}));
jest.mock('../../../src/components/form/FormErrorBanner', () => ({ FormErrorBanner: () => null }));
jest.mock('../../../src/components/form/MoneyField', () => ({
  MoneyField: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('moneyfield', props);
  },
}));
jest.mock('../../../src/components/form/ReadOnlyRow', () => ({ ReadOnlyRow: () => null }));
jest.mock('../../../src/components/form/SegmentedControl', () => ({
  SegmentedControl: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('segmented', props);
  },
}));
jest.mock('../../../src/components/form/TextField', () => ({
  TextField: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('textfield', props);
  },
}));
jest.mock('../../../src/components/ui', () => ({
  Button: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('button', props);
  },
  EmptyState: () => null,
}));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    View: ({ children }: { children: React.ReactNode }) => ReactModule.createElement('view', null, children),
  };
});

describe('Emergency fund withdrawal form', () => {
  beforeEach(() => {
    mockAddEfEntry.mockClear();
    mockBack.mockClear();
  });

  it('prefills withdrawal mode and submits a valid same-day partial withdrawal', async () => {
    const rendererRef: { current?: TestRenderer.ReactTestRenderer } = {};
    act(() => {
      rendererRef.current = TestRenderer.create(<EfEntryFormScreen />);
    });
    const renderer = rendererRef.current;
    if (!renderer) throw new Error('Emergency fund form renderer was not created.');
    const segmented = renderer.root.findAll((node) => String(node.type) === 'segmented')[0];
    if (!segmented) throw new Error('Entry kind control was not rendered.');
    expect(segmented.props.value).toBe('Withdrawal');
    const amount = renderer.root.findAll((node) => String(node.type) === 'moneyfield')[0];
    if (!amount) throw new Error('Amount field was not rendered.');
    act(() => amount.props.onChangeText('5000'));
    const save = renderer.root.findByProps({ label: 'Save' });
    await act(async () => {
      save.props.onPress();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mockAddEfEntry).toHaveBeenCalledWith({
      amount: -5_000,
      date: '2026-10-10',
      note: '',
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
