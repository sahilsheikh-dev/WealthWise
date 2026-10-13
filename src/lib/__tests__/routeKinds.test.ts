import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { ROUTE_KINDS, routeKindForPath } from '../routeKinds';

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    if (!entry.isFile() || !entry.name.endsWith('.tsx') || entry.name === '_layout.tsx' || entry.name === '+not-found.tsx') {
      return [];
    }
    return [relative(join(process.cwd(), 'app'), path).replaceAll(sep, '/').replace(/\.tsx$/, '')];
  });
}

describe('route kind registry', () => {
  it('registers every screen route under app', () => {
    expect(routeFiles(join(process.cwd(), 'app')).sort()).toEqual(Object.keys(ROUTE_KINDS).sort());
  });

  it('keeps the budget screen only under the tab group', () => {
    const routes = routeFiles(join(process.cwd(), 'app'));
    expect(routes).toContain('(tabs)/budget');
    expect(routes).not.toContain('budget');
  });

  it('normalizes path params and routes tab groups', () => {
    expect(routeKindForPath('/')).toBe('tab');
    expect(routeKindForPath('/(tabs)/transactions')).toBe('tab');
    expect(routeKindForPath('/goal-form?id=goal-1')).toBe('form');
    expect(routeKindForPath('/liabilities')).toBe('stack');
    expect(routeKindForPath('/onboarding')).toBe('special');
    expect(() => routeKindForPath('/missing')).toThrow('No route kind is registered');
  });
});
