import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, View } from 'react-native';

import { SectionHeaderRow } from '../SectionHeaderRow';

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: { text1: 'black', text3: 'gray' } }),
}));

function layout(width: number, height = 20) {
  return { nativeEvent: { layout: { width, height, x: 0, y: 0 } } };
}

describe('SectionHeaderRow', () => {
  it.each([
    [300, 100, 150, 120, 'row'],
    [270, 100, 150, 120, 'column'],
    [300, 200, 240, 120, 'column'],
  ] as const)('lays out at container %s and title width %s', (containerWidth, titleWidth, subtitleWidth, rightWidth, direction) => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <SectionHeaderRow title="Transactions" subtitle="Recent activity" right={<View testID="sort-chip" />} />,
      );
    });
    if (!renderer) throw new Error('Section header renderer was not created.');
    const text = renderer.root.findAllByType(Text);
    const views = renderer.root.findAllByType(View);
    act(() => {
      views[0]?.props.onLayout(layout(containerWidth));
      text[0]?.props.onLayout(layout(titleWidth));
      text[1]?.props.onLayout(layout(subtitleWidth));
      views.find((view, index) => index > 0 && typeof view.props.onLayout === 'function')
        ?.props.onLayout(layout(rightWidth, 44));
    });
    expect(renderer.root.findAllByType(View)[0]?.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ flexDirection: direction }),
    ]));
  });
});
