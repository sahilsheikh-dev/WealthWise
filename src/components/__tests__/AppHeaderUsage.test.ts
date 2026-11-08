import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const appRoot = join(process.cwd(), 'app');
const noDefaultMenuScreens = new Set([
  'app/erase-data.tsx',
  'app/(tabs)/budget.tsx',
  'app/emergency-fund.tsx',
]);

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return entry.isFile() && entry.name.endsWith('.tsx') ? [path] : [];
  });
}

describe('AppHeader menu usage', () => {
  it('keeps the global menu enabled except on screens that explicitly opt out', () => {
    const usages = routeFiles(appRoot).flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return [...source.matchAll(/<AppHeader\b([\s\S]*?)\/>/g)].map((match) => ({
        file: file.replace(`${process.cwd()}/`, ''),
        props: match[1] ?? '',
      }));
    });
    expect(usages.length).toBeGreaterThan(0);
    for (const usage of usages) {
      if (noDefaultMenuScreens.has(usage.file)) {
        expect(usage.props).toContain('showDefaultMenu={false}');
      } else {
        expect(usage.props).not.toContain('showDefaultMenu={false}');
      }
    }
    expect(usages.map(({ file }) => file)).toContain('app/(tabs)/transactions.tsx');
    expect(usages.map(({ file }) => file)).toContain('app/(tabs)/goals.tsx');
    const budget = usages.find(({ file }) => file === 'app/(tabs)/budget.tsx');
    expect(budget?.props).toContain('showDefaultMenu={false}');
    const emergencyFund = usages.find(({ file }) => file === 'app/emergency-fund.tsx');
    expect(emergencyFund?.props).toContain('showDefaultMenu={false}');
    expect(emergencyFund?.props).toContain("label: 'Edit allocation'");
    expect(emergencyFund?.props).toContain("icon: 'edit-2'");
  });
});
