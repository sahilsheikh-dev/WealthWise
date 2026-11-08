import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
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

  it('announces exact figures while showing compact hero, tile and row amounts', () => {
    const cases = [
      { value: 12_34_56_789, tier: 'tile' as const, display: '₹12.35 Cr' },
      { value: 12_34_56_789, tier: 'row' as const, display: '₹12.35 Cr' },
      { value: 1_23_45_678, tier: 'row' as const, display: '₹1.23 Cr' },
    ];
    for (const { value, tier, display } of cases) {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => {
        renderer = TestRenderer.create(<AmountText value={value} tier={tier} />);
      });
      if (!renderer) throw new Error('AmountText renderer was not created.');
      expect(renderer.root.findByType('text').props.accessibilityLabel).toBe(
        value === 12_34_56_789 ? '₹12,34,56,789' : '₹1,23,45,678',
      );
      expect(renderer.root.findByType('text').children).toEqual([display]);
      act(() => renderer?.unmount());
    }
  });

  it('scans app and component sources for direct amount formatting outside the allowlist', () => {
    const workspaceRoot = path.resolve(__dirname, '../../..');
    const allowed = new Set([
      path.join(workspaceRoot, 'src/components/AmountText.tsx'),
      path.join(workspaceRoot, 'src/components/form/MoneyField.tsx'),
    ]);
    const files = [
      ...collectSourceFiles(path.join(workspaceRoot, 'app')),
      ...collectSourceFiles(path.join(workspaceRoot, 'src/components')),
    ].filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`) && !file.endsWith('.test.tsx') && !file.endsWith('.test.ts'));
    const violations: string[] = [];

    for (const file of files) {
      if (allowed.has(file)) continue;
      const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node)) {
          const expression = node.expression;
          const directFormatter = ts.isIdentifier(expression)
            && (expression.text === 'formatINR' || expression.text === 'formatINRShort');
          const localeFormatter = ts.isPropertyAccessExpression(expression)
            && expression.name.text === 'toLocaleString'
            && node.arguments.some((argument) =>
              ts.isStringLiteral(argument) && argument.text === 'en-IN');
          if (directFormatter || localeFormatter) {
            const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
            violations.push(`${path.relative(workspaceRoot, file)}:${line + 1}`);
          }
        }
        if (ts.isNewExpression(node)
          && node.expression.getText(source) === 'Intl.NumberFormat'
          && node.arguments?.some((argument) => ts.isStringLiteral(argument) && argument.text === 'en-IN')) {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
          violations.push(`${path.relative(workspaceRoot, file)}:${line + 1}`);
        }
        node.forEachChild(visit);
      };
      visit(source);
    }

    expect(violations).toEqual([]);
  });
});

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    return entry.isFile() && /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}
