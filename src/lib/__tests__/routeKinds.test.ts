import { readFileSync, readdirSync } from 'node:fs';
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
    const routes = routeFiles(join(process.cwd(), 'app'));
    expect(routes.sort()).toEqual(Object.keys(ROUTE_KINDS).sort());
    expect(ROUTE_KINDS).not.toHaveProperty('money-movement-form');
    const tabs = Object.entries(ROUTE_KINDS)
      .filter(([, kind]) => kind === 'tab')
      .map(([route]) => route)
      .sort();
    expect(tabs).toEqual([
      '(tabs)/budget',
      '(tabs)/goals',
      '(tabs)/index',
      '(tabs)/transactions',
    ]);
    for (const route of routes.filter((path) => ROUTE_KINDS[path] !== 'tab')) {
      const source = readFileSync(join(process.cwd(), 'app', `${route}.tsx`), 'utf8');
      expect(source).not.toMatch(/DetailTabBar|<BottomTabBar|bottom-tab-bar/);
    }
  });

  it('leaves no removed movement-sheet copy or route in the Transactions screen', () => {
    const source = readFileSync(join(process.cwd(), 'app/(tabs)/transactions.tsx'), 'utf8');
    expect(source).not.toMatch(/Record money movement|What happened\?|Money from friend or family|Repaid a friend or loan|Took money out of savings or investments|Used my own funds|money-movement-form/);
  });

  it('keeps the budget screen only under the tab group', () => {
    const routes = routeFiles(join(process.cwd(), 'app'));
    expect(routes).toContain('(tabs)/budget');
    expect(routes).not.toContain('budget');
    expect(routes).not.toContain('budget-setup');
    expect(routes).not.toContain('budget-month-form');
    expect(ROUTE_KINDS).not.toHaveProperty('budget-setup');
    expect(ROUTE_KINDS).not.toHaveProperty('budget-month-form');
    expect(() => routeKindForPath('/budget-setup')).toThrow('No route kind is registered');
    expect(() => routeKindForPath('/budget-month-form')).toThrow('No route kind is registered');
    expect(routes).not.toContain('month-review');
    expect(ROUTE_KINDS).not.toHaveProperty('month-review');
    expect(() => routeKindForPath('/month-review')).toThrow('No route kind is registered');
  });

  it('normalizes path params and routes tab groups', () => {
    expect(routeKindForPath('/')).toBe('tab');
    expect(routeKindForPath('/(tabs)/transactions')).toBe('tab');
    expect(routeKindForPath('/goal-form?id=goal-1')).toBe('form');
    expect(routeKindForPath('/liabilities')).toBe('stack');
    expect(routeKindForPath('/insurance')).toBe('stack');
    expect(routeKindForPath('/reminders')).toBe('stack');
    expect(routeKindForPath('/payment-confirm?dueItemId=due-1')).toBe('stack');
    expect(() => routeKindForPath('/cover-goal-form?type=health')).toThrow('No route kind is registered');
    expect(routeKindForPath('/budget-section-form?month=2026-10')).toBe('form');
    expect(routeKindForPath('/budget-item-form?sectionId=pets')).toBe('form');
    expect(routeKindForPath('/budget-income-form?month=2026-10')).toBe('form');
    expect(routeKindForPath('/onboarding')).toBe('special');
    expect(() => routeKindForPath('/missing')).toThrow('No route kind is registered');
  });

  it('configures local notification support without changing app identifiers', () => {
    const config = JSON.parse(readFileSync(join(process.cwd(), 'app.json'), 'utf8')) as {
      expo: { plugins: unknown[]; slug: string; ios: { bundleIdentifier: string }; android: { package: string } };
    };
    expect(config.expo.plugins).toContain('expo-notifications');
    expect(config.expo.slug).toBe('WealthWise');
    expect(config.expo.ios.bundleIdentifier).toBe('com.begawo.WealthWise');
    expect(config.expo.android.package).toBe('com.begawo.WealthWise');
  });
});
