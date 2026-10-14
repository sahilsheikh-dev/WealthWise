import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
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

  it('keeps the header hidden until the subtitle width is measured', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <SectionHeaderRow title="Transactions" subtitle="Recent activity" right={<View testID="sort-chip" />} />,
      );
    });
    if (!renderer) throw new Error('Section header renderer was not created.');
    const container = () => renderer?.root.findAllByType(View)[0];
    const text = renderer.root.findAllByType(Text);
    const views = renderer.root.findAllByType(View);

    expect(container()?.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ opacity: 0 }),
    ]));
    act(() => {
      container()?.props.onLayout(layout(360));
      text[0]?.props.onLayout(layout(120));
      views.find((view, index) => index > 0 && typeof view.props.onLayout === 'function')
        ?.props.onLayout(layout(100, 44));
    });
    expect(container()?.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ opacity: 0 }),
    ]));

    act(() => text[1]?.props.onLayout(layout(170)));
    expect(container()?.props.style).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ opacity: 0 }),
    ]));
  });

  it('stacks when font-scale-2.0 measurements exceed the available width', () => {
    const fontScale = 2;
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
      views[0]?.props.onLayout(layout(360));
      text[0]?.props.onLayout(layout(60 * fontScale));
      text[1]?.props.onLayout(layout(110 * fontScale));
      views.find((view, index) => index > 0 && typeof view.props.onLayout === 'function')
        ?.props.onLayout(layout(80 * fontScale, 88));
    });
    expect(renderer.root.findAllByType(View)[0]?.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ flexDirection: 'column' }),
    ]));
  });

  it('requires SectionHeaderRow for every SortChip except the Transactions filter-row placement', () => {
    const appDirectory = path.resolve(__dirname, '../../../app');
    const files = collectTsxFiles(appDirectory);
    let checkedChips = 0;
    let transactionFilterRowChips = 0;

    for (const file of files) {
      const isTransactionsRoute = file === path.join(appDirectory, '(tabs)/transactions.tsx');
      const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const visit = (node: ts.Node, insideSectionHeader: boolean, insideTransactionFilterRow: boolean): void => {
        if (ts.isJsxElement(node)) {
          const tag = node.openingElement.tagName.getText(source);
          const insideHeader = insideSectionHeader || tag === 'SectionHeaderRow';
          const isTransactionFilterRow = node.openingElement.attributes.properties.some((attribute) =>
            ts.isJsxAttribute(attribute)
            && attribute.name.getText(source) === 'testID'
            && attribute.initializer
            && ts.isStringLiteral(attribute.initializer)
            && attribute.initializer.text === 'transaction-filter-row',
          );
          const insideFilterRow = insideTransactionFilterRow || isTransactionFilterRow;
          visit(node.openingElement, insideHeader, insideFilterRow);
          node.children.forEach((child) => visit(child, insideHeader, insideFilterRow));
          visit(node.closingElement, insideHeader, insideFilterRow);
          return;
        }
        if (ts.isJsxSelfClosingElement(node)) {
          const tag = node.tagName.getText(source);
          const insideHeader = insideSectionHeader || tag === 'SectionHeaderRow';
          if (tag === 'SortChip') {
            checkedChips += 1;
            if (isTransactionsRoute && insideTransactionFilterRow) {
              transactionFilterRowChips += 1;
              expect(insideSectionHeader).toBe(false);
            } else {
              if (!insideSectionHeader) {
                throw new Error(`${path.relative(appDirectory, file)} SortChip is outside SectionHeaderRow.`);
              }
            }
          }
          node.attributes.properties.forEach((attribute) =>
            visit(attribute, insideHeader, insideTransactionFilterRow));
          return;
        }
        node.forEachChild((child) => visit(child, insideSectionHeader, insideTransactionFilterRow));
      };
      visit(source, false, false);
    }

    expect(checkedChips).toBeGreaterThan(0);
    expect(transactionFilterRowChips).toBe(1);
  });
});

function collectTsxFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTsxFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.tsx') ? [entryPath] : [];
  });
}
