import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import HoldingValuationFormScreen from '../../../app/holding-valuation-form';
import { useAppStore } from '../../data/store';
import { emptyAppData } from '../../domain/actions';
import type { AppData, ManualHolding } from '../../domain/types';

jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: {} }));
jest.mock('../../components/form/FormScreen', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    FormScreen: ({ children, footer, title, ...props }: any) =>
      ReactModule.createElement('formscreen', { title, ...props }, children, footer),
  };
});

const mockRouteParams = jest.fn();
jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => mockRouteParams(),
}));

jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return { Feather: ({ name }: { name: string }) => ReactModule.createElement('icon', { name }) };
});

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: {
      border: 'gray',
      text1: '#000',
      text2: 'gray',
      text3: '#888',
      err: 'red',
      surface: 'white',
      primary: '#007AFF',
      primaryMuted: '#E5F1FF',
      card: '#f9f9f9',
    },
  }),
}));

describe('HoldingValuationFormScreen dynamic forms', () => {
  const today = '2026-11-23';

  function setupHolding(holding: ManualHolding) {
    const data: AppData = { ...emptyAppData(today), holdings: [holding] };
    act(() => {
      useAppStore.setState({ data, lastError: null });
    });
    mockRouteParams.mockReturnValue({ id: holding.id });
  }

  it('renders unit price update screen for unitsPrice holding', async () => {
    setupHolding({
      id: 'stock-holding',
      kind: 'manual',
      name: 'Infy',
      type: 'Stocks / ETF',
      invested: 15_000,
      value: 15_000,
      valuationMethod: 'unitsPrice',
      unitCount: 10,
      latestPrice: 1_500,
      priceAsOf: today,
      logs: [],
    });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(React.createElement(HoldingValuationFormScreen));
    });

    const root = renderer!.root;
    expect(root.findAllByProps({ title: 'Update unit price' }).length).toBeGreaterThan(0);
    expect(root.findAllByProps({ label: 'Latest price per unit' }).length).toBeGreaterThan(0);
    expect(root.findAllByProps({ label: 'Price date' }).length).toBeGreaterThan(0);

    const updateSpy = jest.spyOn(useAppStore.getState().actions, 'updateHoldingPrice');
    const saveButton = root.findByProps({ label: 'Save' });
    await act(async () => {
      await saveButton.props.onPress();
    });

    expect(updateSpy).toHaveBeenCalledWith('stock-holding', 1500, today);
    act(() => renderer?.unmount());
  });

  it('renders accrual update screen for accrual holding', async () => {
    setupHolding({
      id: 'fd-holding',
      kind: 'manual',
      name: 'HDFC FD',
      type: 'Fixed deposit',
      invested: 100_000,
      value: 100_000,
      valuationMethod: 'accrual',
      ratePct: 7,
      compounding: 'yearly',
      valueAsOf: today,
      logs: [],
    });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(React.createElement(HoldingValuationFormScreen));
    });

    const root = renderer!.root;
    expect(root.findAllByProps({ title: 'Update interest valuation' }).length).toBeGreaterThan(0);
    expect(root.findAllByProps({ label: 'Confirmed value' }).length).toBeGreaterThan(0);

    const updateSpy = jest.spyOn(useAppStore.getState().actions, 'updateHoldingValue');
    const saveButton = root.findByProps({ label: 'Save' });
    await act(async () => {
      await saveButton.props.onPress();
    });

    expect(updateSpy).toHaveBeenCalledWith('fd-holding', 100000, today, 'accrual');
    act(() => renderer?.unmount());
  });

  it('renders reconcile balance screen for balance holding', async () => {
    setupHolding({
      id: 'cash-holding',
      kind: 'manual',
      name: 'Cash in wallet',
      type: 'Cash',
      invested: 5_000,
      value: 5_000,
      valuationMethod: 'balance',
      logs: [],
    });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(React.createElement(HoldingValuationFormScreen));
    });

    const root = renderer!.root;
    expect(root.findAllByProps({ title: 'Reconcile balance' }).length).toBeGreaterThan(0);
    expect(root.findAllByProps({ label: 'Reconciled balance' }).length).toBeGreaterThan(0);

    const updateSpy = jest.spyOn(useAppStore.getState().actions, 'updateHoldingValue');
    const saveButton = root.findByProps({ label: 'Save' });
    await act(async () => {
      await saveButton.props.onPress();
    });

    expect(updateSpy).toHaveBeenCalledWith('cash-holding', 5000, today, 'balance');
    act(() => renderer?.unmount());
  });
});
