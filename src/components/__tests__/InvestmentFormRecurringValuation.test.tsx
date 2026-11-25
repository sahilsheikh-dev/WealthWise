import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import InvestmentFormScreen from '../../../app/investment-form';
import { useAppStore } from '../../data/store';
import { emptyAppData } from '../../domain/actions';
import type { AppData, PlanHolding } from '../../domain/types';

jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: {} }));
jest.mock('react-native-safe-area-context', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: any) => ReactModule.createElement('safe-area-provider', null, children),
    SafeAreaView: ({ children, ...props }: any) => ReactModule.createElement('safe-area-view', props, children),
  };
});
jest.mock('../../components/form/FormScreen', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    FormScreen: ({ children, footer, title, ...props }: any) =>
      ReactModule.createElement('formscreen', { title, ...props }, children, footer),
  };
});
jest.mock('../../components/form/FormSection', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    FormSection: ({ children, title, ...props }: any) =>
      ReactModule.createElement('formsection', { title, ...props }, children),
  };
});

const mockRouteParams = jest.fn();
jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => mockRouteParams(),
}));

jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    Feather: ({ name }: { name: string }) => ReactModule.createElement('icon', { name }),
    Ionicons: ({ name }: { name: string }) => ReactModule.createElement('icon', { name }),
  };
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

describe('InvestmentFormScreen recurring asset dynamic valuation', () => {
  const today = '2026-11-23';

  function setupStore(holdings: any[] = []) {
    const data: AppData = { ...emptyAppData(today), holdings };
    act(() => {
      useAppStore.setState({ data, lastError: null });
    });
    mockRouteParams.mockReturnValue({});
  }

  it('places Valuation section immediately below Holding type (Basics section) in recurring form', () => {
    setupStore();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(React.createElement(InvestmentFormScreen));
    });

    const root = renderer!.root;
    const sections = root.findAllByType('formsection' as any);
    expect(sections.length).toBeGreaterThanOrEqual(3);

    // Section 0 is Basics (contains Name and Holding type)
    expect(sections[0].props.title).toBe('Basics');
    expect(sections[0].findAllByProps({ label: 'Holding type' }).length).toBeGreaterThan(0);

    // Section 1 is Valuation (immediately below Holding type)
    expect(sections[1].props.title).toBe('Valuation');
    expect(sections[1].findAllByProps({ label: 'Valuation method' }).length).toBeGreaterThan(0);

    // Section 2 is Contribution, Section 3 is Dates
    expect(sections[2].props.title).toBe('Contribution');
    expect(sections[3].props.title).toBe('Dates');

    act(() => renderer?.unmount());
  });

  it('switches valuation fields dynamically based on valuationMethod in recurring form', () => {
    const plan: PlanHolding = {
      id: 'sip-units',
      kind: 'plan',
      name: 'Nifty 50 SIP',
      type: 'Mutual fund / SIP',
      frequency: 'monthly',
      amount: 5000,
      ratePct: 12,
      stepUpPct: 0,
      tenureYears: 10,
      startDate: '2026-01-01',
      trackFrom: '2026-01-01',
      opening: 15000,
      actualValue: 15000,
      actualValueDate: today,
      valuationMethod: 'unitsPrice',
      unitCount: 100,
      latestPrice: 150,
      priceAsOf: today,
      logs: [],
    };
    setupStore([plan]);
    mockRouteParams.mockReturnValue({ id: plan.id });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(React.createElement(InvestmentFormScreen));
    });

    const root = renderer!.root;
    const valuationSection = root.findAllByType('formsection' as any)
      .find((s) => s.props.title === 'Valuation');
    expect(valuationSection).toBeDefined();

    // In unitsPrice mode, shows Unit price and Units purchased
    expect(valuationSection!.findAllByProps({ label: 'Unit price' }).length).toBeGreaterThan(0);
    expect(valuationSection!.findAllByProps({ label: 'Units purchased' }).length).toBeGreaterThan(0);

    act(() => renderer?.unmount());
  });

  it('renders accrual fields in Valuation section for accrual recurring plan', () => {
    const plan: PlanHolding = {
      id: 'rd-accrual',
      kind: 'plan',
      name: 'Post Office RD',
      type: 'Recurring deposit',
      frequency: 'monthly',
      amount: 2000,
      ratePct: 7,
      stepUpPct: 0,
      tenureYears: 5,
      startDate: '2026-01-01',
      trackFrom: '2026-01-01',
      opening: 10000,
      actualValue: 10000,
      actualValueDate: today,
      valuationMethod: 'accrual',
      compounding: 'quarterly',
      maturityDate: '2031-01-01',
      logs: [],
    };
    setupStore([plan]);
    mockRouteParams.mockReturnValue({ id: plan.id });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(React.createElement(InvestmentFormScreen));
    });

    const root = renderer!.root;
    const valuationSection = root.findAllByType('formsection' as any)
      .find((s) => s.props.title === 'Valuation');
    expect(valuationSection).toBeDefined();

    // In accrual mode, shows Compounding and Maturity date in Valuation section
    expect(valuationSection!.findAllByProps({ label: 'Compounding' }).length).toBeGreaterThan(0);
    expect(valuationSection!.findAllByProps({ label: 'Maturity date (YYYY-MM-DD)' }).length).toBeGreaterThan(0);

    act(() => renderer?.unmount());
  });

  it('renders balance fields in Valuation section for balance recurring plan', () => {
    const plan: PlanHolding = {
      id: 'chit-fund-plan',
      kind: 'plan',
      name: 'Chit Fund',
      type: 'Other',
      frequency: 'monthly',
      amount: 5000,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 2,
      startDate: '2026-01-01',
      trackFrom: '2026-01-01',
      opening: 25000,
      actualValue: null,
      actualValueDate: null,
      valuationMethod: 'balance',
      logs: [],
    };
    setupStore([plan]);
    mockRouteParams.mockReturnValue({ id: plan.id });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(React.createElement(InvestmentFormScreen));
    });

    const root = renderer!.root;
    const valuationSection = root.findAllByType('formsection' as any)
      .find((s) => s.props.title === 'Valuation');
    expect(valuationSection).toBeDefined();

    // In balance mode, shows Opening balance
    expect(valuationSection!.findAllByProps({ label: 'Opening balance' }).length).toBeGreaterThan(0);

    act(() => renderer?.unmount());
  });
});
