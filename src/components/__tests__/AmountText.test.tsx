import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AmountText } from '../AmountText';

let mockFontScale = 1;

jest.mock('react-native', () => ({
  useWindowDimensions: () => ({ fontScale: mockFontScale }),
}));
jest.mock('../ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppText: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      ReactModule.createElement('text', props, children),
  };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: { primary: 'blue', ok: 'green', err: 'red', info: 'cyan', purple: 'purple', text2: 'gray' } }),
}));

describe('AmountText', () => {
  afterEach(() => { mockFontScale = 1; });

  it('uses the live font scale and retains the exact accessibility label', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<AmountText value={9_999_999.99} tier="row" />);
    });
    if (!renderer) throw new Error('AmountText renderer was not created.');
    expect(renderer.root.findByType('text').props.accessibilityLabel).toBe('₹1,00,00,000');
    expect(renderer.root.findByType('text').children).toEqual(['₹1,00,00,000']);

    mockFontScale = 1.5;
    act(() => {
      renderer?.update(<AmountText value={9_999_999.99} tier="row" />);
    });
    expect(renderer.root.findByType('text').props.accessibilityLabel).toBe('₹1,00,00,000');
    expect(renderer.root.findByType('text').children).toEqual(['₹1.00 Cr']);
  });
});
