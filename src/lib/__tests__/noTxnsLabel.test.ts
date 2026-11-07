import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const sourceRoots = ['app', 'src'];
const testFile = 'src/lib/__tests__/noTxnsLabel.test.ts';
const legacyLabel = ['T', 'xns'].join('');
const visibleLabelPattern = new RegExp(
  `(?:label|title|accessibilityLabel)\\s*[:=]\\s*(['"\`])${legacyLabel}\\1|>\\s*${legacyLabel}\\s*<`,
);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

describe('visible tab label terminology', () => {
  it('does not use the superseded short label in app or src', () => {
    const violations = sourceRoots.flatMap((root) =>
      sourceFiles(join(process.cwd(), root))
        .filter((path) => relative(process.cwd(), path) !== testFile)
        .filter((path) => visibleLabelPattern.test(readFileSync(path, 'utf8')))
        .map((path) => relative(process.cwd(), path)),
    );

    expect(violations).toEqual([]);
  });
});
