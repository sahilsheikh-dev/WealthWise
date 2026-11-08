import { buildAppMenu } from '../appMenu';

describe('buildAppMenu', () => {
  it('orders ordinary actions and conditionally includes link and development items', () => {
    expect(buildAppMenu({ hasUnlinked: false, isDev: false, themeLabel: 'Dark' }).map(({ label }) => label))
      .toEqual(['Backup and restore', 'Security', 'Profile', 'Theme', 'Month review', 'Erase all data']);
    expect(buildAppMenu({ hasUnlinked: true, isDev: false, themeLabel: 'Light' }).map(({ label }) => label))
      .toEqual(['Backup and restore', 'Security', 'Profile', 'Theme', 'Link missing transactions', 'Month review', 'Erase all data']);
    const devItems = buildAppMenu({ hasUnlinked: false, isDev: true, themeLabel: 'System' });
    expect(devItems.map(({ label }) => label)).toEqual([
      'Backup and restore', 'Security', 'Profile', 'Theme',
      'Load demo data', 'Generate stress-test data', 'Simulate corrupt storage', 'Month review', 'Erase all data',
    ]);
    expect(devItems.at(-1)).toMatchObject({ label: 'Erase all data', destructive: true });
    expect(devItems.find(({ label }) => label === 'Simulate corrupt storage'))
      .toMatchObject({ destructive: true });
  });
});
