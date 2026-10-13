import React from 'react';
import { readFileSync } from 'node:fs';
import TestRenderer, { act } from 'react-test-renderer';

import EfAllocationFormScreen from '../../../app/ef-allocation-form';
import { SUGGESTED_EF_ALLOCATION, type EfAllocation } from '../../domain/efAllocation';

const mockState: { data: { efAllocation: EfAllocation | null }; lastError: string | null } = {
  data: { efAllocation: { ...SUGGESTED_EF_ALLOCATION, cash: 20, bank: 30 } },
  lastError: null,
};
const mockBack = jest.fn();
const mockSetEfAllocation = jest.fn((allocation: EfAllocation) => {
  mockState.data.efAllocation = { ...allocation };
});
const mockResetEfAllocation = jest.fn(() => {
  mockState.data.efAllocation = null;
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
    setEfAllocation: (...args: Parameters<typeof mockSetEfAllocation>) => mockSetEfAllocation(...args),
    resetEfAllocation: (...args: Parameters<typeof mockResetEfAllocation>) => mockResetEfAllocation(...args),
  }),
}));
jest.mock('../../components/form/FormErrorBanner', () => ({ FormErrorBanner: () => null }));
jest.mock('../../components/ScreenErrorBoundary', () => ({
  ScreenErrorBoundary: () => null,
}));
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
jest.mock('../../components/ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppText: ({ children }: React.PropsWithChildren) => ReactModule.createElement('text', null, children),
    Button: (props: Record<string, unknown>) => ReactModule.createElement('button', props),
  };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: { text3: 'gray' } }),
}));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    View: ({ children }: React.PropsWithChildren) => ReactModule.createElement('view', null, children),
  };
});

describe('emergency-fund allocation suggestions', () => {
  beforeEach(() => {
    mockState.data.efAllocation = { ...SUGGESTED_EF_ALLOCATION, cash: 20, bank: 30 };
    mockSetEfAllocation.mockClear();
    mockResetEfAllocation.mockClear();
    mockBack.mockClear();
  });

  it('Use suggested mix saves the suggested percentages as the custom allocation', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<EfAllocationFormScreen />);
    });
    if (!renderer) throw new Error('Allocation form renderer was not created.');

    expect(renderer.root.findByProps({ label: 'Use suggested mix' })).toBeDefined();
    expect(renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' '))
      .toContain('Use suggested mix: saves the suggested percentages as your own, so they stay fixed.');

    act(() => renderer?.root.findByProps({ label: 'Use suggested mix' }).props.onPress());
    await act(async () => {
      renderer?.root.findByProps({ label: 'Save allocation' }).props.onPress();
      await Promise.resolve();
    });

    expect(mockSetEfAllocation).toHaveBeenCalledWith(SUGGESTED_EF_ALLOCATION);
    expect(mockState.data.efAllocation).toEqual(SUGGESTED_EF_ALLOCATION);
  });

  it('Reset to suggested allocation clears the stored custom mix', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<EfAllocationFormScreen />);
    });
    if (!renderer) throw new Error('Allocation form renderer was not created.');

    expect(renderer.root.findByProps({ label: 'Reset to suggested allocation' })).toBeDefined();
    expect(renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' '))
      .toContain("Reset to suggested: clears your custom mix and goes back to the app's suggestion.");
    act(() => renderer?.root.findByProps({ label: 'Reset to suggested allocation' }).props.onPress());

    expect(mockResetEfAllocation).toHaveBeenCalledTimes(1);
    expect(mockState.data.efAllocation).toBeNull();
  });

  it('has one rendered hint string for each distinct action', () => {
    const source = readFileSync(require.resolve('../../../app/ef-allocation-form'), 'utf8');
    expect(source.match(/Use suggested mix:/g)).toHaveLength(1);
    expect(source.match(/Reset to suggested:/g)).toHaveLength(1);
  });
});
