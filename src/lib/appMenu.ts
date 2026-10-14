export type AppMenuItem = {
  label: string;
  description?: string;
  icon: 'download' | 'lock' | 'user' | 'sliders' | 'link' | 'trash-2' | 'database' | 'alert-triangle' | 'edit' | 'calendar';
  destructive?: boolean;
  disabled?: boolean;
};

export function buildAppMenu({
  isDev,
  themeLabel,
}: {
  isDev: boolean;
  themeLabel: string;
}): AppMenuItem[] {
  const items: AppMenuItem[] = [
    { label: 'Budget history', icon: 'calendar' },
    { label: 'Backup and restore', icon: 'download' },
    { label: 'Security', icon: 'lock' },
    { label: 'Profile', icon: 'user' },
    { label: 'Theme', description: `Current theme: ${themeLabel}`, icon: 'sliders' },
  ];
  if (isDev) {
    items.push(
      { label: 'Load demo data', icon: 'database' },
      { label: 'Generate stress-test data', icon: 'database', destructive: true },
      { label: 'Simulate corrupt storage', icon: 'alert-triangle', destructive: true },
    );
  }
  items.push({ label: 'Erase all data', icon: 'trash-2', destructive: true });
  items.splice(items.length - 1, 0, { label: 'Month review', icon: 'calendar' });
  return items;
}
