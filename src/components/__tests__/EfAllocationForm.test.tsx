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
jest.mock('../../components/AmountText', () => ({
  AmountText: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('amount', props);
  },
}));
jest.mock('../../components/form/FormErrorBanner', () => ({ FormErrorBanner: () => null }));
jest.mock('../../components/ScreenErrorBoundary', () => ({ ScreenErrorBoundary: () => null }));
jest.mock('../../components/form/FormScreen', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    FormScreen: ({ children, footer }: React.PropsWithChildren<{ footer: React.ReactNode }>) =>
      ReactModule.createElement('form', null, children, footer),
  };
});
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
  });

  it('Use suggested mix keeps the suggested percentages and custom allocation reset behavior', async () => {
    const renderer = renderForm();
    expect(renderer.root.findByProps({ label: 'Use suggested mix' })).toBeDefined();
    expect(renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' '))
      .toContain('Use suggested mix: saves the suggested percentages as your own, so they stay fixed.');
    act(() => renderer.root.findByProps({ label: 'Use suggested mix' }).props.onPress());
    await act(async () => {
      renderer.root.findByProps({ label: 'Save allocation' }).props.onPress();
      await Promise.resolve();
    });
    expect(mockSaveEfPlan).toHaveBeenCalledWith(expect.objectContaining({ allocation: SUGGESTED_EF_ALLOCATION }));
    expect(mockState.writes).toBe(1);

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
    const nameField = renderer.root.findByProps({ accessibilityLabel: 'New custom option name' });
    await act(async () => {
      nameField.props.onChangeText('Safe box');
      await Promise.resolve();
    });
    await act(async () => {
      renderer.root.findByProps({ label: 'Add custom option' }).props.onPress();
      await Promise.resolve();
    });
    expect(renderer.root.findByProps({ accessibilityLabel: 'Safe box option name' })).toBeDefined();
    const totalText = renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' ');
    expect(totalText).toContain('Total: 100.0%');
    expect(totalText).toContain('Remaining: 0.0%');

    await act(async () => {
      renderer.root.findByProps({ label: 'Link investments: Safe box' }).props.onPress();
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
      renderer.root.findByProps({ label: 'Link investments: Bank account' }).props.onPress();
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

  it('keeps action and totals rows responsive to font scaling and provides live, wrapping layout', () => {
    const source = readFileSync(require.resolve('../../../app/ef-allocation-form'), 'utf8');
    const totals = source.match(/totals: \{([^}]+)\}/)?.[1] ?? '';
    const customActions = source.match(/customActions: \{([^}]+)\}/)?.[1] ?? '';
    expect(totals).toContain('flexWrap: \'wrap\'');
    expect(totals).toContain('minHeight: 44');
    expect(customActions).toContain('flexWrap: \'wrap\'');
  });

  it('keeps exactly one copy of both existing guidance strings', () => {
    const source = readFileSync(require.resolve('../../../app/ef-allocation-form'), 'utf8');
    expect(source.match(/Use suggested mix:/g)).toHaveLength(1);
    expect(source.match(/Reset to suggested:/g)).toHaveLength(1);
  });
});
