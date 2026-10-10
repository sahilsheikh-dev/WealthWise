import { buildHomeMenu } from '../homeMenu';

describe('buildHomeMenu', () => {
  it('keeps production actions in order and includes link only when entries are unlinked', () => {
    const labels = buildHomeMenu({ hasUnlinked: false, isDev: false, themeLabel: 'Dark' }).map(({ label }) => label);
    expect(labels).toEqual([
      'Backup and restore',
      'Security',
      'Your name',
      'Theme (Dark)',
      'Erase all data',
    ]);
    expect(buildHomeMenu({ hasUnlinked: true, isDev: false, themeLabel: 'System' }).map(({ label }) => label))
      .toContain('Link missing transactions');
  });

  it('places developer actions after production actions and omits them in production', () => {
    const menu = buildHomeMenu({ hasUnlinked: false, isDev: true, themeLabel: 'Light' });
    expect(menu.slice(-2).map(({ label }) => label)).toEqual(['Load demo data', 'Simulate corrupt storage']);
    expect(buildHomeMenu({ hasUnlinked: false, isDev: false, themeLabel: 'Light' })
      .some(({ label }) => label === 'Load demo data')).toBe(false);
  });
});
