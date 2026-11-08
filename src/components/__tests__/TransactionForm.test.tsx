import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import TransactionFormScreen from '../../../app/transaction-form';
import { mockAppData } from '../../mock/data';
import { addInstrumentTransaction } from '../../domain/instruments';
import { filterTransactions, transactionCategoryLabel } from '../../domain/transactions';
import { budgetMonthView } from '../../domain/budget';
import { emptyAppData } from '../../domain/actions';
import type { Holding, Transaction } from '../../domain/types';

const mockData = { ...mockAppData, transactions: [] as Transaction[] };
const mockState = { data: mockData, lastError: null as string | null };
let mockParams: { id?: string; type?: string } = {};
const mockPush = jest.fn();
const mockBack = jest.fn();
let instrumentIdSequence = 0;
const mockSetTxMonth = jest.fn();
const mockSetLastCreatedInstrumentId = jest.fn();
const mockAddTransaction = jest.fn((input: Omit<Transaction, 'id'>) => {
  mockData.transactions.push({ ...input, id: 'new-transaction' });
});
const mockAddInstrumentTransaction = jest.fn((input: {
  kind: 'deposit' | 'withdrawal';
  instrumentId: string;
  amount: number;
  date: string;
  note: string;
}) => {
  const updated = addInstrumentTransaction(mockData, input, () => `new-${++instrumentIdSequence}`, '2026-10-13');
  Object.assign(mockData, updated);
});
const mockUpdateTransaction = jest.fn((id: string, input: Partial<Transaction>) => {
  const index = mockData.transactions.findIndex((transaction) => transaction.id === id);
  const transaction = mockData.transactions[index];
  if (index >= 0 && transaction) mockData.transactions[index] = { ...transaction, ...input };
});
const mockActions = {
  addTransaction: (...args: Parameters<typeof mockAddTransaction>) => mockAddTransaction(...args),
  addInstrumentTransaction: (...args: Parameters<typeof mockAddInstrumentTransaction>) =>
    mockAddInstrumentTransaction(...args),
  updateTransaction: (...args: Parameters<typeof mockUpdateTransaction>) => mockUpdateTransaction(...args),
};
const mockUIState = {
  setTxMonth: mockSetTxMonth,
  lastCreatedInstrumentId: null as string | null,
  setLastCreatedInstrumentId: mockSetLastCreatedInstrumentId,
};

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    back: (...args: unknown[]) => mockBack(...args),
  },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('../../data/store', () => {
  const useAppStore = (selector: (state: typeof mockState) => unknown) => selector(mockState);
  Object.assign(useAppStore, { getState: () => mockState });
  return { useAppStore };
});
jest.mock('../../data/uiStore', () => ({
  useUIStore: (selector: (state: typeof mockUIState) => unknown) => selector(mockUIState),
}));
jest.mock('../../data/useAppData', () => ({
  useAppActions: () => mockActions,
}));
jest.mock('../../lib/clock', () => ({ todayISO: () => '2026-10-13' }));
jest.mock('../../lib/confirm', () => ({ confirmAsync: jest.fn() }));
jest.mock('../../components/ScreenErrorBoundary', () => ({ ScreenErrorBoundary: () => null }));
jest.mock('../../components/form/FormScreen', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    FormScreen: ({ children, footer }: React.PropsWithChildren<{ footer: React.ReactNode }>) =>
      ReactModule.createElement('form', null, children, footer),
  };
});
jest.mock('../../components/form/ChoiceField', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    ChoiceField: (props: Record<string, unknown>) => ReactModule.createElement('choicefield', props),
  };
});
jest.mock('../../components/form/DateField', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    DateField: (props: Record<string, unknown>) => ReactModule.createElement('datefield', props),
  };
});
jest.mock('../../components/form/FormErrorBanner', () => ({ FormErrorBanner: () => null }));
jest.mock('../../components/form/MoneyField', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    MoneyField: (props: Record<string, unknown>) => ReactModule.createElement('moneyfield', props),
  };
});
jest.mock('../../components/form/ReadOnlyRow', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    ReadOnlyRow: (props: Record<string, unknown>) => ReactModule.createElement('readonly', props),
  };
});
jest.mock('../../components/form/SegmentedControl', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    SegmentedControl: (props: Record<string, unknown>) => ReactModule.createElement('segmented', props),
  };
});
jest.mock('../../components/form/TextField', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    TextField: (props: Record<string, unknown>) => ReactModule.createElement('textfield', props),
  };
});
jest.mock('../../components/ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppText: ({ children }: React.PropsWithChildren) => ReactModule.createElement('text', null, children),
    Button: (props: Record<string, unknown>) => ReactModule.createElement('button', props),
    EmptyState: () => null,
  };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: {
      bg: 'white',
      border: 'gray',
      err: 'red',
      surface: 'white',
      text1: 'black',
      text2: 'gray',
      text3: 'darkgray',
    },
  }),
}));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    View: ({ children }: React.PropsWithChildren) => ReactModule.createElement('view', null, children),
  };
});

describe('transaction add form', () => {
  beforeEach(() => {
    mockParams = {};
    instrumentIdSequence = 0;
    mockData.transactions.length = 0;
    mockData.holdings = [...mockAppData.holdings];
    mockData.monthBudgets = mockAppData.monthBudgets;
    mockState.lastError = null;
    mockPush.mockClear();
    mockBack.mockClear();
    mockSetTxMonth.mockClear();
    mockSetLastCreatedInstrumentId.mockClear();
    mockAddTransaction.mockClear();
    mockAddInstrumentTransaction.mockClear();
    mockUpdateTransaction.mockClear();
  });

  it.each([
    ['expense', 'expense'],
    ['income', 'income'],
    ['invest', 'invest'],
  ] as const)('saves a new %s transaction', async (type, expectedType) => {
    mockParams = { type };
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<TransactionFormScreen />);
    });
    if (!renderer) throw new Error('Transaction form renderer was not created.');

    const amount = renderer.root.findAll((node) => String(node.type) === 'moneyfield')[0];
    if (!amount) throw new Error('Amount input was not rendered.');
    await act(async () => {
      amount.props.onChangeText('1500');
    });
    if (type === 'invest') {
      const investment = renderer.root.findAll((node) => String(node.type) === 'choicefield')[0];
      if (!investment) throw new Error('Investment selector was not rendered.');
      const instrumentId = investment.props.choices.find((choice: string) => choice !== '__create-investment__');
      if (typeof instrumentId !== 'string') throw new Error('No investment choice was rendered.');
      await act(async () => {
        investment.props.onChange(instrumentId);
      });
    }

    await act(async () => {
      renderer?.root.findByProps({ label: 'Save' }).props.onPress();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    if (type === 'invest') {
      expect(mockAddInstrumentTransaction).toHaveBeenCalledWith(expect.objectContaining({
        kind: 'deposit',
        amount: 1_500,
      }));
    } else {
      expect(mockAddTransaction).toHaveBeenCalledWith(expect.objectContaining({
        type: expectedType,
        amount: 1_500,
      }));
    }
    expect(mockData.transactions.at(-1)?.type).toBe(expectedType);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it.each(['Festival', 'Donation', 'Gifts'] as const)('creates an expense in the %s category', async (category) => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<TransactionFormScreen />);
    });
    if (!renderer) throw new Error('Transaction form renderer was not created.');
    const categoryField = renderer.root.findAll((node) =>
      String(node.type) === 'choicefield' && node.props.label === 'Category',
    )[0];
    if (!categoryField) throw new Error('Expense category selector was not rendered.');
    expect(categoryField.props.choices).toContain(category);
    await act(async () => categoryField.props.onChange(category));
    const amount = renderer.root.findAll((node) => String(node.type) === 'moneyfield')[0];
    if (!amount) throw new Error('Amount input was not rendered.');
    await act(async () => amount.props.onChangeText('700'));
    await act(async () => {
      renderer?.root.findByProps({ label: 'Save' }).props.onPress();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mockAddTransaction).toHaveBeenCalledWith(expect.objectContaining({
      type: 'expense',
      category,
      amount: 700,
    }));
  });

  it.each([
    ['Mutual fund / SIP', 'invest-mf', 'Mutual fund / SIP'],
    ['Stocks / ETF', 'invest-stocks', 'Stocks / ETF'],
    ['Fixed deposit / RD', 'invest-fd', 'Fixed deposit'],
    ['Fixed deposit / RD', 'invest-rd', 'Recurring deposit'],
    ['Gold / Silver', 'invest-gold', 'Gold'],
    ['Other investments', 'invest-other', 'EPFO / PF'],
  ] as const)('stores, labels and budgets invest category %s end to end', async (category, instrumentId, holdingType) => {
    if (holdingType) {
      const holding: Holding = {
        id: instrumentId,
        kind: 'manual',
        name: category,
        type: holdingType,
        invested: 1_000,
        value: 1_000,
        logs: [],
      };
      mockData.holdings = [holding];
    } else {
      mockData.holdings = [];
    }
    mockData.transactions = [];
    mockData.monthBudgets = [{
      month: '2026-10',
      source: 'custom' as const,
      plannedIncome: 10_000,
      lines: [{ category, planned: 2_000 }],
    }];
    const base = emptyAppData('2026-10-01');
    mockData.efCustomBuckets = base.efCustomBuckets;
    mockData.efBucketLinks = base.efBucketLinks;
    mockData.efAllocation = base.efAllocation;
    mockData.goals = mockAppData.goals;

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<TransactionFormScreen />);
    });
    if (!renderer) throw new Error('Transaction form renderer was not created.');
    const formRenderer = renderer;
    const typeControl = renderer.root.findAll((node) => String(node.type) === 'segmented')[0];
    if (!typeControl) throw new Error('Transaction type selector was not rendered.');
    await act(async () => typeControl.props.onChange('invest'));
    const investment = renderer.root.findAll((node) =>
      String(node.type) === 'choicefield' && node.props.label === 'Invest in',
    )[0];
    if (!investment) throw new Error('Investment selector was not rendered.');
    await act(async () => investment.props.onChange(instrumentId));
    const amount = renderer.root.findAll((node) => String(node.type) === 'moneyfield')[0];
    if (!amount) throw new Error('Amount input was not rendered.');
    await act(async () => amount.props.onChangeText('150'));
    await act(async () => {
      formRenderer.root.findByProps({ label: 'Save' }).props.onPress();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const stored = mockData.transactions.at(-1);
    expect(stored).toMatchObject({ type: 'invest', category, amount: 150 });
    expect(stored).toBeDefined();
    if (!stored) throw new Error('Investment transaction was not stored.');
    expect(transactionCategoryLabel(stored.category, stored.type)).toBe(category);
    expect(filterTransactions(mockData.transactions, {
      month: '2026-10', type: 'invest', query: '', category,
    })).toContain(stored);
    const view = budgetMonthView(mockData, '2026-10');
    const matchingLine = view.lines.find((line) => line.category === category);
    const savingsGroup = view.unbudgetedByGroup.find((item) => item.groupId === 'savings-investments');
    expect((matchingLine?.actual ?? 0) + (savingsGroup?.amount ?? 0)).toBe(150);
  });

  it.each(['Eating out', 'Entertainment', 'Fashion', 'Culture', 'Unexpected'] as const)(
    'offers the new %s expense category',
    async (category) => {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      await act(async () => {
        renderer = TestRenderer.create(<TransactionFormScreen />);
      });
      if (!renderer) throw new Error('Transaction form renderer was not created.');
      const categoryField = renderer.root.findAll((node) =>
        String(node.type) === 'choicefield' && node.props.label === 'Category',
      )[0];
      if (!categoryField) throw new Error('Expense category selector was not rendered.');
      expect(categoryField.props.choices).toContain(category);
      expect(categoryField.props.choiceLabels[category]).toBe(
        category === 'Unexpected' ? 'Unexpected extras' : category,
      );
    },
  );

  it('offers and saves Rental as earned income', async () => {
    mockParams = { type: 'income' };
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => { renderer = TestRenderer.create(<TransactionFormScreen />); });
    if (!renderer) throw new Error('Transaction form renderer was not created.');
    const formRenderer = renderer;
    const categoryField = renderer.root.findAll((node) =>
      String(node.type) === 'choicefield' && node.props.label === 'Category',
    )[0];
    if (!categoryField) throw new Error('Income category selector was not rendered.');
    expect(categoryField.props.choices).toContain('Rental');
    await act(async () => categoryField.props.onChange('Rental'));
    const amount = renderer.root.findAll((node) => String(node.type) === 'moneyfield')[0];
    if (!amount) throw new Error('Amount input was not rendered.');
    await act(async () => amount.props.onChangeText('500'));
    await act(async () => {
      formRenderer.root.findByProps({ label: 'Save' }).props.onPress();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mockAddTransaction).toHaveBeenCalledWith(expect.objectContaining({
      type: 'income',
      category: 'Rental',
      amount: 500,
    }));
  });

  it('shows investment category as a derived read-only value', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<TransactionFormScreen />);
    });
    if (!renderer) throw new Error('Transaction form renderer was not created.');
    const formRenderer = renderer;
    const typeControl = renderer.root.findAll((node) => String(node.type) === 'segmented')[0];
    if (!typeControl) throw new Error('Transaction type selector was not rendered.');
    await act(async () => typeControl.props.onChange('invest'));
    const investment = renderer.root.findAll((node) =>
      String(node.type) === 'choicefield' && node.props.label === 'Invest in',
    )[0];
    if (!investment) throw new Error('Investment selector was not rendered.');
    const otherInvestmentId = Object.entries(investment.props.choiceLabels as Record<string, string>)
      .find(([, label]) => label.includes('EPFO'))?.[0];
    if (!otherInvestmentId) throw new Error('Other investment choice was not rendered.');
    await act(async () => investment.props.onChange(otherInvestmentId));
    expect(renderer.root.findAll((node) => String(node.type) === 'choicefield')
      .some((node) => node.props.label === 'Category')).toBe(false);
    expect(formRenderer.root.findAll((node) => String(node.type) === 'readonly')
      .some((node) => node.props.value === 'Other investments')).toBe(true);
  });

  it.each(['Festival', 'Donation', 'Gifts'] as const)('edits an expense into the %s category', async (category) => {
    mockData.transactions.push({
      id: 'editing',
      type: 'expense',
      amount: 200,
      category: 'Food',
      note: 'Old value',
      date: '2026-10-01',
    });
    mockParams = { id: 'editing' };
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<TransactionFormScreen />);
    });
    if (!renderer) throw new Error('Transaction form renderer was not created.');
    const categoryField = renderer.root.findAll((node) =>
      String(node.type) === 'choicefield' && node.props.label === 'Category',
    )[0];
    if (!categoryField) throw new Error('Expense category selector was not rendered.');
    expect(categoryField.props.choices).toContain(category);
    await act(async () => categoryField.props.onChange(category));
    await act(async () => {
      renderer?.root.findByProps({ label: 'Save' }).props.onPress();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mockUpdateTransaction).toHaveBeenCalledWith('editing', expect.objectContaining({
      type: 'expense',
      category,
    }));
  });
});
