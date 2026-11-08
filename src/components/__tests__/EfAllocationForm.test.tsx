import React from 'react';
import { readFileSync } from 'node:fs';
import TestRenderer, { act } from 'react-test-renderer';

import EfAllocationFormScreen from '../../../app/ef-allocation-form';
import EfBucketFormScreen from '../../../app/ef-bucket-form';
import { SUGGESTED_EF_ALLOCATION, type EfAllocation } from '../../domain/efAllocation';
import { mockAppData } from '../../mock/data';
import type { AppData } from '../../domain/types';

const mockState: { data: AppData; lastError: string | null; writes: number } = {
  data: mockAppData,
  lastError: null,
  writes: 0,
};
const mockBack = jest.fn();
const mockPush = jest.fn();
let mockRouteParams: Record<string, string> = {};
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

jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
    push: (...args: unknown[]) => mockPush(...args),
  },
  useLocalSearchParams: () => mockRouteParams,
}));
jest.mock('../../data/store', () => {
  const useAppStore = (selector: (state: typeof mockState) => unknown) => selector(mockState);
  Object.assign(useAppStore, { getState: () => mockState });
  return { useAppStore };
});
jest.mock('../../data/useAppData', () => ({
  useAppActions: () => ({
    saveEfPlan: (...args: Parameters<typeof mockSaveEfPlan>) => mockSaveEfPlan(...args),
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
    FormScreen: ({ children, footer, stickyHeader, headerAction, ...props }: React.PropsWithChildren<{
      footer: React.ReactNode;
      stickyHeader?: React.ReactNode;
      headerAction?: { label: string; onPress: () => void; icon?: string; variant?: string };
    }>) => ReactModule.createElement('form', { ...props, stickyHeader }, stickyHeader,
        headerAction ? ReactModule.createElement('headeraction', headerAction) : null, children, footer),
  };
});
jest.mock('../../components/Dropdown', () => ({
  Dropdown: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('dropdown', props);
  },
}));
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
jest.mock('../../components/form/ReadOnlyRow', () => ({
  ReadOnlyRow: (props: Record<string, unknown>) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('readonlyrow', props);
  },
}));
jest.mock('../../components/ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(type, props, children);
  return { AppText: node('text'), Button: node('button'), Card: node('card'), EmptyState: node('empty-state') };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: { text3: 'gray', border: 'border', surface: 'surface', surface2: 'surface2', primary: 'blue' } }),
}));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(type, props, children);
  return {
    KeyboardAvoidingView: node('keyboard-avoiding-view'),
    Modal: node('modal'),
    Platform: { OS: 'ios' },
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
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

function renderBucketForm() {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => { renderer = TestRenderer.create(<EfBucketFormScreen />); });
  if (!renderer) throw new Error('Allocation item form renderer was not created.');
  return renderer;
}

describe('emergency-fund allocation form', () => {
  beforeEach(() => {
    mockState.data = { ...mockAppData, efAllocation: { ...SUGGESTED_EF_ALLOCATION, cash: 20, bank: 30 } };
    mockState.lastError = null;
    mockState.writes = 0;
    mockRouteParams = {};
    mockSaveEfPlan.mockClear();
    mockBack.mockClear();
    mockPush.mockClear();
    mockConfirmAsync.mockReset();
  });

  it('does not expose an expand-all control or legacy allocation reset actions', () => {
    const renderer = renderForm();
    expect(renderer.root.findAllByProps({ label: 'Show all buckets' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ label: 'Reset to suggested allocation' })).toHaveLength(0);
    for (const file of [
      require.resolve('../../../app/ef-allocation-form'),
      require.resolve('../../domain/efAllocationActions'),
      require.resolve('../../data/createAppStore'),
    ]) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/\b(?:use|apply)SuggestedMix\b|\bresetEfAllocation\b/);
    }
  });

  it('routes directly to the item form and edits fixed and custom items from the list', () => {
    mockState.data = {
      ...mockState.data,
      efCustomBuckets: [{
        id: 'custom-safe-box', name: 'Safe box', access: 'instant', marketLinked: false,
      }],
    };
    const renderer = renderForm();
    act(() => renderer.root.findByProps({ label: 'Add allocation item' }).props.onPress());
    expect(mockPush).toHaveBeenCalledWith('/ef-bucket-form');
    act(() => renderer.root.findByProps({ label: 'Edit Cash' }).props.onPress());
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/ef-bucket-form',
      params: { id: 'cash' },
    });
    act(() => renderer.root.findByProps({ label: 'Edit Safe box' }).props.onPress());
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/ef-bucket-form',
      params: { id: 'custom-safe-box' },
    });
    expect(renderer.root.findAll((node) => String(node.type) === 'modal'))
      .toHaveLength(1);
    expect(renderer.root.findAllByProps({ label: 'Remove Cash' })).toHaveLength(0);
    const source = readFileSync(require.resolve('../../../app/ef-allocation-form'), 'utf8');
    expect(source).not.toMatch(/availableFixedBuckets|addFixedBucket|Mutual funds \/ Bonds|Stock market|LIC \/ Insurance/);
  });

  it('links holdings and saves the complete allocation once', async () => {
    mockState.data = {
      ...mockState.data,
      efCustomBuckets: [{
        id: 'custom-safe-box', name: 'Safe box', access: 'instant', marketLinked: false,
      }],
      holdings: [{
        id: 'holding-current', kind: 'manual', name: 'Current account', type: 'Savings account',
        invested: 1_000, value: 1_000, logs: [],
      }],
    };
    const renderer = renderForm();
    const totalText = renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' ');
    expect(totalText).toContain('Total: 100.00%');
    expect(totalText).toContain('Remaining: 0.00%');

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
      links: { 'custom-safe-box': ['holding-current'], bank: ['holding-current'] },
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

  it('shows only the three requested default items when no allocation is saved', () => {
    mockState.data = { ...mockAppData, efAllocation: null, efCustomBuckets: [], efBucketLinks: {} };
    const renderer = renderForm();
    const source = readFileSync(require.resolve('../../../app/ef-allocation-form'), 'utf8');
    for (const [label, value] of [
      ['Cash', '10'],
      ['Bank account', '40'],
      ['FD / RD', '50'],
    ]) {
      expect(renderer.root.findByProps({ accessibilityLabel: `${label} allocation percentage` }).props.value)
        .toBe(value);
    }
    for (const label of ['Mutual funds / Bonds', 'Stock market', 'LIC / Insurance', 'Other']) {
      expect(renderer.root.findAllByProps({ accessibilityLabel: `${label} allocation percentage` })).toHaveLength(0);
    }
    expect(source).not.toMatch(/\b(?:use|apply)SuggestedMix\b/);
  });

  it('shows the invalid live total and disables Save before submission', async () => {
    const renderer = renderForm();
    const cashPercent = renderer.root.findByProps({ accessibilityLabel: 'Cash allocation percentage' });
    await act(async () => {
      cashPercent.props.onChangeText('19.99');
      await Promise.resolve();
    });

    expect(renderer.root.findByProps({ label: 'Save allocation' }).props.disabled).toBe(true);
    expect(renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' '))
      .toContain('Total: 99.99%');
    await act(async () => {
      renderer.root.findByProps({ label: 'Save allocation' }).props.onPress();
      await Promise.resolve();
    });
    expect(mockSaveEfPlan).not.toHaveBeenCalled();
    expect(mockState.writes).toBe(0);
    const errors = renderer.root.findAll((node) =>
      String(node.type) === 'formerror'
      && String(node.props.message).includes('Percentages must add up to 100%'));
    expect(errors.length).toBeGreaterThan(0);
  });

});

describe('emergency-fund allocation item form', () => {
  beforeEach(() => {
    mockState.data = {
      ...mockAppData,
      efAllocation: { ...SUGGESTED_EF_ALLOCATION, cash: 20, bank: 30 },
      efCustomBuckets: [],
    };
    mockState.lastError = null;
    mockState.writes = 0;
    mockRouteParams = {};
    mockSaveEfPlan.mockClear();
    mockBack.mockClear();
    mockConfirmAsync.mockReset();
  });

  it.each([1.3, 2])('renders the shared-shell add form fields and footer at simulated font scale %s', (fontScale) => {
    const renderer = renderBucketForm();
    expect(renderer.root.findByType('form').props.title).toBe('Allocation item');
    expect(renderer.root.findByProps({ accessibilityLabel: 'Allocation item title' }).props.maxLength).toBe(24);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Allocation item access speed' }).props.options)
      .toEqual([
        { value: 'instant', title: 'Instant' },
        { value: 'days', title: 'Within days' },
        { value: 'slow', title: 'Slow' },
      ]);
    expect(renderer.root.findByProps({ label: 'Market-linked' }).props.value).toBe(false);
    expect(renderer.root.findByProps({ label: 'Save' })).toBeDefined();
    expect(renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' '))
      .toContain('Market-linked: its value goes up and down with the market, for example stocks or equity funds');
    expect(fontScale).toBeGreaterThan(1);
  });

  it('validates title length and case-insensitive uniqueness', async () => {
    mockState.data = {
      ...mockState.data,
      efCustomBuckets: [{
        id: 'existing-custom', name: 'Safe box', access: 'instant', marketLinked: false,
      }],
    };
    const renderer = renderBucketForm();
    const title = renderer.root.findByProps({ accessibilityLabel: 'Allocation item title' });
    await act(async () => {
      title.props.onChangeText('cAsH');
      renderer.root.findByProps({ label: 'Save' }).props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(renderer.root.findAll((node) => String(node.type) === 'formerror'
      && String(node.props.message).includes('Allocation item titles must be unique.'))).toHaveLength(1);
    expect(mockSaveEfPlan).not.toHaveBeenCalled();

    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Allocation item title' })
        .props.onChangeText('this title is definitely too long');
      renderer.root.findByProps({ label: 'Save' }).props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(renderer.root.findAll((node) => String(node.type) === 'formerror'
      && String(node.props.message).includes('Title must be 1 to 24 characters.'))).toHaveLength(1);
    expect(mockState.writes).toBe(0);
  });

  it('adds a zero-percent item with the selected access and market-linked metadata in one write', async () => {
    const renderer = renderBucketForm();
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Allocation item title' }).props.onChangeText('Travel cash');
      renderer.root.findByProps({ accessibilityLabel: 'Allocation item access speed' }).props.onChange('days');
      renderer.root.findByProps({ label: 'Market-linked' }).props.onValueChange(true);
      renderer.root.findByProps({ label: 'Save' }).props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockSaveEfPlan).toHaveBeenCalledTimes(1);
    expect(mockSaveEfPlan).toHaveBeenCalledWith(expect.objectContaining({
      customBuckets: [{
        id: 'draft-1', name: 'Travel cash', access: 'days', marketLinked: true,
      }],
      allocation: expect.objectContaining({ 'draft-1': 0 }),
      links: mockState.data.efBucketLinks,
    }));
    expect(mockState.writes).toBe(1);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('edits an existing custom item without changing its ID', async () => {
    mockRouteParams = { id: 'custom-safe-box' };
    mockState.data = {
      ...mockState.data,
      efCustomBuckets: [{
        id: 'custom-safe-box', name: 'Safe box', access: 'instant', marketLinked: false,
      }],
    };
    const renderer = renderBucketForm();
    expect(renderer.root.findByType('form').props.title).toBe('Allocation item');
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Allocation item title' }).props.onChangeText('Travel cash');
      renderer.root.findByProps({ accessibilityLabel: 'Allocation item access speed' }).props.onChange('slow');
      renderer.root.findByProps({ label: 'Market-linked' }).props.onValueChange(true);
      renderer.root.findByProps({ label: 'Save' }).props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockSaveEfPlan).toHaveBeenCalledWith(expect.objectContaining({
      customBuckets: [{
        id: 'custom-safe-box', name: 'Travel cash', access: 'slow', marketLinked: true,
      }],
    }));
    expect(mockState.writes).toBe(1);
  });

  it('opens fixed items in the same form with their built-in title and metadata unchanged', async () => {
    mockRouteParams = { id: 'cash' };
    const renderer = renderBucketForm();
    expect(renderer.root.findByType('form').props.title).toBe('Allocation item');
    expect(renderer.root.findByProps({ label: 'Title', value: 'Cash' })).toBeDefined();
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Allocation item title' })).toHaveLength(0);
    expect(renderer.root.findByProps({ label: 'Access speed', value: 'Instant' })).toBeDefined();
    expect(renderer.root.findByProps({ label: 'Market-linked' }).props.disabled).toBe(true);
    await act(async () => {
      renderer.root.findByProps({ label: 'Save' }).props.onPress();
      await Promise.resolve();
    });
    expect(mockSaveEfPlan).not.toHaveBeenCalled();
    expect(mockState.writes).toBe(0);
  });

  it('confirms deleting an item, removes its grouping, and preserves linked goal assets', async () => {
    mockRouteParams = { id: 'custom-safe-box' };
    mockState.data = {
      ...mockState.data,
      efAllocation: {
        cash: 18, bank: 27, 'fd-rd': 31.5, 'mutual-funds-bonds': 13.5, 'custom-safe-box': 10,
      },
      efCustomBuckets: [{
        id: 'custom-safe-box', name: 'Safe box', access: 'instant', marketLinked: false,
      }],
      efBucketLinks: { 'custom-safe-box': ['holding-current'] },
    };
    const originalGoalLinks = mockState.data.goals.map((goal) => goal.links);
    mockConfirmAsync.mockResolvedValue(true);
    const renderer = renderBucketForm();
    await act(async () => {
      renderer.root.findByProps({ label: 'Remove allocation item' }).props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockConfirmAsync).toHaveBeenCalledWith({
      title: 'Remove allocation item?',
      message: 'Remove Safe box? Its linked assets stay linked to the emergency fund but are no longer grouped.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    expect(mockSaveEfPlan).toHaveBeenCalledTimes(1);
    expect(mockSaveEfPlan).toHaveBeenCalledWith(expect.objectContaining({
      customBuckets: [],
      links: {},
    }));
    expect(mockState.data.efAllocation).not.toHaveProperty('custom-safe-box');
    expect(Object.values(mockState.data.efAllocation ?? {}).reduce((total, value) => total + value, 0))
      .toBe(100);
    expect(mockState.data.goals.map((goal) => goal.links)).toEqual(originalGoalLinks);
    expect(mockState.writes).toBe(1);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('does not change allocation or linked assets when deletion is cancelled', async () => {
    mockRouteParams = { id: 'custom-safe-box' };
    mockState.data = {
      ...mockState.data,
      efCustomBuckets: [{
        id: 'custom-safe-box', name: 'Safe box', access: 'instant', marketLinked: false,
      }],
    };
    mockConfirmAsync.mockResolvedValue(false);
    const renderer = renderBucketForm();
    await act(async () => {
      renderer.root.findByProps({ label: 'Remove allocation item' }).props.onPress();
      await Promise.resolve();
    });
    expect(mockSaveEfPlan).not.toHaveBeenCalled();
    expect(mockState.writes).toBe(0);
  });
});
