import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import AboutScreen from '../../../app/about';
import { SCHEMA_VERSION } from '../../domain/schemas';

const mockOpenURL = jest.fn(async (_url: string) => undefined);
const mockConfirmAsync = jest.fn(async (_options: object) => true);

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { name: 'WealthWise', version: '1.2.0' } },
}));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (name: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(name, props, children);
  return {
    Alert: { alert: jest.fn() },
    Linking: { openURL: (...args: Parameters<typeof mockOpenURL>) => mockOpenURL(...args) },
    Pressable: node('pressable'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    View: node('view'),
  };
});
jest.mock('../../lib/confirm', () => ({
  confirmAsync: (...args: Parameters<typeof mockConfirmAsync>) => mockConfirmAsync(...args),
}));
jest.mock('../ScreenErrorBoundary', () => ({
  ScreenErrorBoundary: () => null,
}));
jest.mock('../AppHeader', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppHeader: ({ title }: { title: string }) => ReactModule.createElement('header', null, title),
  };
});
jest.mock('../ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const container = (name: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(name, props, children);
  return {
    AppText: container('text'),
    Card: container('card'),
    Screen: container('screen'),
    SectionTitle: container('section-title'),
  };
});

function renderAbout() {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => { renderer = TestRenderer.create(<AboutScreen />); });
  if (!renderer) throw new Error('About screen did not render.');
  return renderer;
}

describe('About screen', () => {
  beforeEach(() => {
    mockOpenURL.mockClear();
    mockConfirmAsync.mockReset().mockResolvedValue(true);
  });

  it('shows app metadata, verified project links, and one privacy statement', () => {
    const renderer = renderAbout();
    const text = renderer.root.findAllByType('text').map((node) => node.children.join('')).join('\n');
    expect(text).toContain('WealthWise');
    expect(text).toContain('Version 1.2.0');
    expect(text).toContain(`Data schema version ${SCHEMA_VERSION}`);
    expect(text).toContain('License: MIT');
    expect(text.match(/Data stays on this device; the app makes no network requests\./g)).toHaveLength(1);

    const links = renderer.root.findAll((node) =>
      String(node.type) === 'pressable' && node.props.accessibilityRole === 'link');
    expect(links.map((link) => link.props.accessibilityLabel)).toEqual([
      'Repository', 'Releases', 'Issues', 'CHANGELOG',
    ]);
    const urls = [
      'https://github.com/sahilsheikh-dev/WealthWise',
      'https://github.com/sahilsheikh-dev/WealthWise/releases',
      'https://github.com/sahilsheikh-dev/WealthWise/issues',
      'https://github.com/sahilsheikh-dev/WealthWise/blob/main/CHANGELOG.md',
    ];
    for (const [index, link] of links.entries()) {
      act(() => link.props.onPress());
      expect(mockOpenURL).toHaveBeenLastCalledWith(urls[index]);
    }
    act(() => renderer.unmount());
  });

  it('asks before opening the latest release page and does nothing on cancellation', async () => {
    mockConfirmAsync.mockResolvedValue(false);
    const renderer = renderAbout();
    const updateButton = renderer.root.findByProps({ accessibilityLabel: 'Check for updates' });
    await act(async () => {
      updateButton.props.onPress();
      await Promise.resolve();
    });
    expect(mockConfirmAsync).toHaveBeenCalledWith({
      title: 'Check for updates?',
      message: 'Your browser will open the GitHub latest-release page. The app will not check for updates itself.',
      confirmLabel: 'Open browser',
    });
    expect(mockOpenURL).not.toHaveBeenCalled();

    mockConfirmAsync.mockResolvedValue(true);
    await act(async () => {
      updateButton.props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockOpenURL).toHaveBeenCalledWith('https://github.com/sahilsheikh-dev/WealthWise/releases/latest');
    act(() => renderer.unmount());
  });
});
