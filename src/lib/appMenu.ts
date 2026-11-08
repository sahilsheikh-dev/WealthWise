export type AppMenuItem = {
  label: string;
  description?: string;
  icon: 'download' | 'lock' | 'user' | 'sliders' | 'link' | 'trash-2' | 'database' | 'alert-triangle' | 'edit';
  destructive?: boolean;
  disabled?: boolean;
};

export function buildAppMenu({
  hasUnlinked,
  isDev,
  themeLabel,
}: {
  hasUnlinked: boolean;
  isDev: boolean;
  themeLabel: string;
}): AppMenuItem[] {
  const items: AppMenuItem[] = [
    { label: 'Backup and restore', icon: 'download' },
    { label: 'Security', icon: 'lock' },
    { label: 'Profile', icon: 'user' },
    { label: 'Theme', description: `Current theme: ${themeLabel}`, icon: 'sliders' },
  ];
  if (hasUnlinked) items.push({ label: 'Link missing transactions', icon: 'link' });
  if (isDev) {
    items.push(
      { label: 'Load demo data', icon: 'database' },
      { label: 'Generate stress-test data', icon: 'database', destructive: true },
      { label: 'Simulate corrupt storage', icon: 'alert-triangle', destructive: true },
    );
  }
  items.push({ label: 'Erase all data', icon: 'trash-2', destructive: true });
  return items;
}
