import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import OnboardingScreen from '../../../app/onboarding';
import ProfileFormScreen from '../../../app/profile-form';

const mockCompleteOnboarding = jest.fn();
const mockUpdateSettings = jest.fn();
const mockBack = jest.fn();
const mockSettings = { name: 'Demo', theme: 'system', monthlySalary: 20_000, onboarded: true };

jest.mock('expo-router', () => ({ router: { back: (...args: unknown[]) => mockBack(...args) } }));
jest.mock('../../components/ScreenErrorBoundary', () => ({ ScreenErrorBoundary: () => null }));
jest.mock('../../data/useAppData', () => ({
  useAppActions: () => ({
    completeOnboarding: (...args: unknown[]) => mockCompleteOnboarding(...args),
    updateSettings: (...args: unknown[]) => mockUpdateSettings(...args),
  }),
}));
jest.mock('../../data/store', () => {
  const useAppStore = (selector: (state: { data: { settings: typeof mockSettings } }) => unknown) =>
    selector({ data: { settings: mockSettings } });
  useAppStore.getState = () => ({ lastError: null });
  return { useAppStore };
});
jest.mock('../../lib/confirm', () => ({ confirmAsync: async () => true }));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => {
    const { themes } = jest.requireActual('../../theme/themes');
    return { colors: themes.light.colors, themeId: 'light', resolvedId: 'light', isDark: false, statusBar: 'dark' };
  },
}));
jest.mock('../../components/BrandMark', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return { BrandMark: () => ReactModule.createElement('brandmark') };
});
jest.mock('../../components/form/FormScreen', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    FormScreen: ({ title, children, footer }: { title: string; children: React.ReactNode; footer: React.ReactNode }) =>
      ReactModule.createElement('form', null,
        ReactModule.createElement('text', null, title),
        children,
        footer,
      ),
  };
});
jest.mock('../../components/form/TextField', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return { TextField: (props: Record<string, unknown>) => ReactModule.createElement('input', props) };
});
jest.mock('../../components/form/MoneyField', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return { MoneyField: (props: Record<string, unknown>) => ReactModule.createElement('moneyinput', props) };
});
jest.mock('../../components/ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  const Button = ({ label, ...props }: { label: string; [key: string]: unknown }) =>
    ReactModule.createElement('button', { ...props, accessibilityLabel: label }, label);
  return { AppText: node('text'), Button, Screen: node('screen') };
});
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    BackHandler: { addEventListener: () => ({ remove: jest.fn() }), exitApp: jest.fn() },
    Pressable: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      ReactModule.createElement('pressable', props, children),
    StyleSheet: { create: (styles: object) => styles },
    View: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      ReactModule.createElement('view', props, children),
  };
});

function renderScreen(screen: React.ReactElement) {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => { renderer = TestRenderer.create(screen); });
  if (!renderer) throw new Error('Form screen did not render.');
  return renderer;
}

describe('onboarding form', () => {
  beforeEach(() => {
    mockCompleteOnboarding.mockClear();
    mockUpdateSettings.mockClear();
    mockBack.mockClear();
  });

  it('submits a valid name and optional salary', async () => {
    const renderer = renderScreen(<OnboardingScreen />);
    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Your name' }).props.onChangeText(' Asha ');
      renderer.root.findByProps({ accessibilityLabel: 'Monthly take-home income' }).props.onChangeText('75000');
    });
    const continueButton = renderer.root.findByProps({ accessibilityLabel: 'Continue' });
    await act(async () => { await continueButton.props.onPress(); });
    expect(mockCompleteOnboarding).toHaveBeenCalledWith({ name: 'Asha', monthlySalary: 75_000 });
  });

  it('shows validation for invalid required name and lets the user skip', async () => {
    const renderer = renderScreen(<OnboardingScreen />);
    const continueButton = renderer.root.findByProps({ accessibilityLabel: 'Continue' });
    await act(async () => { await continueButton.props.onPress(); });
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Your name' }).props.error).toBe('Enter your name');
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Skip for now' }).props.onPress());
    expect(mockCompleteOnboarding).toHaveBeenCalledWith({ name: '', monthlySalary: null });
  });
});

describe('profile form', () => {
  it('renders existing profile data and saves a cleared salary', async () => {
    const renderer = renderScreen(<ProfileFormScreen />);
    expect(renderer.root.findAllByType('text').some((node) => node.children.includes('Profile'))).toBe(true);
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Monthly take-home income' }).props.onChangeText(''));
    const saveButton = renderer.root.findByProps({ accessibilityLabel: 'Save profile' });
    await act(async () => { await saveButton.props.onPress(); });
    expect(mockUpdateSettings).toHaveBeenCalledWith({ name: 'Demo', monthlySalary: null });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
