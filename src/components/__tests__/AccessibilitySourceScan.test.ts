import fs from 'fs';
import path from 'path';

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(filePath);
    return entry.isFile() && entry.name.endsWith('.tsx') ? [filePath] : [];
  });
}

describe('P26-A accessibility source scan', () => {
  it('every Pressable outside protected row components has an accessibility role and label', () => {
    const roots = ['app', 'src/components'];
    const violations: string[] = [];
    for (const root of roots) {
      for (const filePath of sourceFiles(root)) {
        if (
          filePath === 'src/components/SortChip.tsx'
          || filePath === 'app/(tabs)/index.tsx'
          || filePath === 'app/(tabs)/budget.tsx'
          || filePath.includes('/__tests__/')
        ) continue;
        const source = fs.readFileSync(filePath, 'utf8');
        const pressablePattern = /<Pressable\b([^>]*)>/g;
        let match: RegExpExecArray | null;
        while ((match = pressablePattern.exec(source))) {
          const opening = match[1] ?? '';
          const position = source.slice(0, match.index).split('\n').length;
          if (!opening.includes('accessibilityRole=') || !opening.includes('accessibilityLabel=')) {
            violations.push(`${filePath}:${position}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
