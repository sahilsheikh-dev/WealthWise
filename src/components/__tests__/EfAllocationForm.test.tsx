import React from 'react';
import { readFileSync } from 'node:fs';
import TestRenderer, { act } from 'react-test-renderer';

import EfAllocationFormScreen from '../../../app/ef-allocation-form';
import { SUGGESTED_EF_ALLOCATION, type EfAllocation } from '../../domain/efAllocation';
import { mockAppData } from '../../mock/data';
import type { AppData } from '../../domain/types';

const mockState: { data: AppData; lastError: string | null; writes: number } = {
  data: mockAppData,
  lastError: null,
  writes: 0,
};
const mockBack = jest.fn();
const mockConfirmAsync = jest.fn<Promise<boolean>, [unknown]>();
const mockSaveEfPlan = jest.fn((plan: {
  customBuckets: AppData['efCustomBuckets'];
  allocation: EfAllocation;
  links: AppData['efBucketLinks'];
}) => {
  mockState.data = {
    ...mockState.data,
    efCustomBuckets: plan.customBuckets,
    efAllocation: plan.allocation,
    efBucketLinks: plan.links,
  };
  mockState.writes += 1;
});
const mockResetEfAllocation = jest.fn(() => {
  mockState.data = { ...mockState.data, efAllocation: null };
});

jest.mock('expo-router', () => ({
  router: { back: (...args: unknown[]) => mockBack(...args) },
}));
jest.mock('../../data/store', () => {
  const useAppStore = (selector: (state: typeof mockState) => unknown) => selector(mockState);
  Object.assign(useAppStore, { getState: () => mockState });
  return { useAppStore };
});
jest.mock('../../data/useAppData', () => ({
  useAppActions: () => ({
    saveEfPlan: (...args: Parameters<typeof mockSaveEfPlan>) => mockSaveEfPlan(...args),
    resetEfAllocation: (...args: Parameters<typeof mockResetEfAllocation>) => mockResetEfAllocation(...args),
  }),
}));
jest.mock('../../lib/confirm', () => ({
  confirmAsync: (...args: [unknown]) => mockConfirmAsync(...args),
}));
jest.mock('../../components/AmountText', () => ({
  AmountText: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('amount', props);
  },
}));
jest.mock('../../components/form/FormErrorBanner', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    FormErrorBanner: ({ message }: { message: string }) =>
      ReactModule.createElement('formerror', { message }),
  };
});
jest.mock('../../components/ScreenErrorBoundary', () => ({ ScreenErrorBoundary: () => null }));
jest.mock('../../components/form/FormScreen', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    FormScreen: ({ children, footer, stickyHeader, headerAction }: React.PropsWithChildren<{
      footer: React.ReactNode;
      stickyHeader?: React.ReactNode;
      headerAction?: { label: string; onPress: () => void; icon?: string; variant?: string };
    }>) =>
      ReactModule.createElement('form', { stickyHeader }, stickyHeader,
        headerAction ? ReactModule.createElement('headeraction', headerAction) : null, children, footer),
  };
});
jest.mock('../../components/IconButton', () => ({
  IconButton: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('iconbutton', props);
  },
}));
jest.mock('../../components/form/HelperText', () => ({
  HelperText: ({ children }: React.PropsWithChildren) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('text', null, children);
  },
}));
jest.mock('../../components/form/TextField', () => ({
  TextField: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('textfield', props);
  },
}));
jest.mock('../../components/form/ChoiceField', () => ({
  ChoiceField: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('choicefield', props);
  },
}));
jest.mock('../../components/form/SegmentedControl', () => ({
  SegmentedControl: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('segmented', props);
  },
}));
jest.mock('../../components/form/SwitchRow', () => ({
  SwitchRow: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('switchrow', props);
  },
}));
jest.mock('../../components/ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(type, props, children);
  return { AppText: node('text'), Button: node('button'), Card: node('card') };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: { text3: 'gray', border: 'border', surface: 'surface', surface2: 'surface2', primary: 'blue' } }),
}));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(type, props, children);
  return {
    Modal: node('modal'),
    Pressable: node('pressable'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    TextInput: node('textinput'),
    View: node('view'),
  };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));

function renderForm() {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => { renderer = TestRenderer.create(<EfAllocationFormScreen />); });
  if (!renderer) throw new Error('Allocation form renderer was not created.');
  return renderer;
}

describe('emergency-fund allocation form', () => {
  beforeEach(() => {
    mockState.data = { ...mockAppData, efAllocation: { ...SUGGESTED_EF_ALLOCATION, cash: 20, bank: 30 } };
    mockState.lastError = null;
    mockState.writes = 0;
    mockSaveEfPlan.mockClear();
    mockResetEfAllocation.mockClear();
    mockBack.mockClear();
    mockConfirmAsync.mockReset();
  });

  it('keeps reset-to-default behavior and removes the old suggested-mix control', () => {
    const renderer = renderForm();
    expect(renderer.root.findAllByProps({ label: 'Use suggested mix' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ label: 'Show all buckets' })).toHaveLength(0);

    const resetRenderer = renderForm();
    expect(resetRenderer.root.findAllByType('text').map((node) => node.children.join('')).join(' '))
      .toContain("Reset to suggested: clears your custom mix and goes back to the app's suggestion.");
    act(() => resetRenderer.root.findByProps({ label: 'Reset to suggested allocation' }).props.onPress());
    expect(mockResetEfAllocation).toHaveBeenCalledTimes(1);
    expect(mockState.data.efAllocation).toBeNull();
  });

  it('adds a custom option, shows live totals, links holdings, and saves the complete plan once', async () => {
    mockState.data = {
      ...mockState.data,
      holdings: [{
        id: 'holding-current', kind: 'manual', name: 'Current account', type: 'Savings account',
        invested: 1_000, value: 1_000, logs: [],
      }],
    };
    const renderer = renderForm();
    act(() => renderer.root.findByProps({ label: 'Add allocation item' }).props.onPress());
    act(() => renderer.root.findByProps({ label: 'Custom' }).props.onPress());
    const nameField = renderer.root.findByProps({ accessibilityLabel: 'New custom option name' });
    await act(async () => {
      nameField.props.onChangeText('Safe box');
      await Promise.resolve();
    });
    await act(async () => {
      renderer.root.findByProps({ label: 'Add custom option' }).props.onPress();
      await Promise.resolve();
    });
    expect(renderer.root.findAllByType('text').some((node) => node.children.join('') === 'Safe box')).toBe(true);
    const totalText = renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' ');
    expect(totalText).toContain('Total: 100.0%');
    expect(totalText).toContain('Remaining: 0.0%');

    await act(async () => {
      renderer.root.findByProps({ label: 'Link assets: Safe box' }).props.onPress();
      await Promise.resolve();
    });
    const picker = renderer.root.findByProps({ accessibilityRole: 'checkbox' });
    expect(picker.props.accessibilityLabel).toBe('Current account, ₹1,000');
    await act(async () => {
      picker.props.onPress();
      await Promise.resolve();
    });
    expect(renderer.root.findByProps({ accessibilityRole: 'checkbox' }).props.accessibilityState.checked).toBe(true);
    await act(async () => {
      renderer.root.findByProps({ label: 'Done linking investments' }).props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      renderer.root.findByProps({ label: 'Link assets: Bank account' }).props.onPress();
      await Promise.resolve();
    });
    const fixedPicker = renderer.root.findByProps({ accessibilityRole: 'checkbox' });
    await act(async () => {
      fixedPicker.props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      renderer.root.findByProps({ label: 'Done linking investments' }).props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      renderer.root.findByProps({ label: 'Save allocation' }).props.onPress();
      await Promise.resolve();
    });

    expect(mockSaveEfPlan).toHaveBeenCalledTimes(1);
    expect(mockSaveEfPlan).toHaveBeenCalledWith(expect.objectContaining({
      customBuckets: [expect.objectContaining({ name: 'Safe box', access: 'instant', marketLinked: false })],
      links: { 'draft-1': ['holding-current'], bank: ['holding-current'] },
    }));
    expect(mockState.writes).toBe(1);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('keeps a sticky total bar, compact fields, and the header add action', () => {
    const renderer = renderForm();
    const form = renderer.root.findByType('form');
    expect(form.props.stickyHeader).toBeDefined();
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Show all buckets' })).toHaveLength(0);
    expect(renderer.root.findByProps({ label: 'Add allocation item' }).props).toMatchObject({
      icon: 'plus',
      variant: 'default',
    });
    const cashPercent = renderer.root.findByProps({ accessibilityLabel: 'Cash allocation percentage' });
    expect(cashPercent.props.size).toBe('compact');
  });

  it('shows only the four existing default items when no allocation is saved', () => {
    mockState.data = { ...mockAppData, efAllocation: null, efCustomBuckets: [], efBucketLinks: {} };
    const renderer = renderForm();
    const source = readFileSync(require.resolve('../../../app/ef-allocation-form'), 'utf8');
    for (const [label, value] of [
      ['Cash', '10'],
      ['Bank account', '40'],
      ['FD / RD', '35'],
      ['Mutual funds / Bonds', '15'],
    ]) {
      expect(renderer.root.findByProps({ accessibilityLabel: `${label} allocation percentage` }).props.value)
        .toBe(value);
    }
    for (const label of ['Stock market', 'LIC / Insurance', 'Other']) {
      expect(renderer.root.findAllByProps({ accessibilityLabel: `${label} allocation percentage` })).toHaveLength(0);
    }
    expect(source).not.toMatch(/Use suggested mix|suggested mix/i);
  });

  it('offers missing predefined items from the header', () => {
    const renderer = renderForm();
    act(() => renderer.root.findByProps({ label: 'Add allocation item' }).props.onPress());
    expect(renderer.root.findByProps({ label: 'Stock market' })).toBeDefined();
    act(() => renderer.root.findByProps({ label: 'Stock market' }).props.onPress());
    expect(renderer.root.findByProps({ accessibilityLabel: 'Stock market allocation percentage' }).props.value).toBe('0');
  });

  it('confirms deletion without moving its allocation and keeps a live total', async () => {
    mockConfirmAsync.mockResolvedValue(true);
    const renderer = renderForm();
    await act(async () => {
      renderer.root.findByProps({ label: 'Remove Cash' }).props.onPress();
      await Promise.resolve();
    });
    expect(mockConfirmAsync).toHaveBeenCalledWith({
      title: 'Remove allocation item?',
      message: 'Remove Cash? Its linked assets stay linked to the emergency fund but are no longer grouped.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Cash allocation percentage' })).toHaveLength(0);
    expect(renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' '))
      .toContain('Remaining: 20.0%');
  });

  it('rejects saving unless the live allocation total is exactly 100%', async () => {
    mockConfirmAsync.mockResolvedValue(true);
    const renderer = renderForm();
    await act(async () => {
      renderer.root.findByProps({ label: 'Remove Cash' }).props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      renderer.root.findByProps({ label: 'Save allocation' }).props.onPress();
      await Promise.resolve();
    });
    expect(mockSaveEfPlan).not.toHaveBeenCalled();
    const errors = renderer.root.findAll((node) =>
      String(node.type) === 'formerror'
      && String(node.props.message).includes('Percentages must add up to 100%'));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('keeps an item when removal is dismissed', async () => {
    mockConfirmAsync.mockResolvedValue(false);
    const renderer = renderForm();
    await act(async () => {
      renderer.root.findByProps({ label: 'Remove Cash' }).props.onPress();
      await Promise.resolve();
    });
    expect(renderer.root.findByProps({ accessibilityLabel: 'Cash allocation percentage' })).toBeDefined();
  });

  it('labels and explains the market-linked toggle', () => {
    const renderer = renderForm();
    act(() => renderer.root.findByProps({ label: 'Add allocation item' }).props.onPress());
    act(() => renderer.root.findByProps({ label: 'Custom' }).props.onPress());
    const text = renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' ');
    expect(renderer.root.findAllByProps({ label: 'Market-linked' }).length).toBeGreaterThan(0);
    expect(text).toContain('Market-linked: its value goes up and down with the market, for example stocks or equity funds');
  });

  it('keeps exactly one copy of reset guidance and no suggested-mix text', () => {
    const source = readFileSync(require.resolve('../../../app/ef-allocation-form'), 'utf8');
    expect(source).not.toMatch(/Use suggested mix|suggested mix/i);
    expect(source.match(/Reset to suggested:/g)).toHaveLength(1);
  });
});
