import { buildAppMenu } from '../appMenu';

describe('buildAppMenu', () => {
  it('orders ordinary actions and development items without link-missing transactions', () => {
    expect(buildAppMenu({ isDev: false, themeLabel: 'Dark' }).map(({ label }) => label))
      .toEqual(['Backup and restore', 'Security', 'Profile', 'Theme', 'Erase all data']);
    const devItems = buildAppMenu({ isDev: true, themeLabel: 'System' });
    expect(devItems.map(({ label }) => label)).toEqual([
      'Backup and restore', 'Security', 'Profile', 'Theme',
      'Load demo data (4 months)', 'Generate stress-test data', 'Simulate corrupt storage', 'Erase all data',
    ]);
    expect(devItems.some(({ label }) => label === 'Budget')).toBe(false);
    expect(devItems.at(-1)).toMatchObject({ label: 'Erase all data', destructive: true });
    expect(devItems.find(({ label }) => label === 'Simulate corrupt storage'))
      .toMatchObject({ destructive: true });
  });
});
