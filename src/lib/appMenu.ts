export type AppMenuItem = {
  label: string;
  description?: string;
  icon: 'download' | 'lock' | 'user' | 'sliders' | 'link' | 'trash-2' | 'database' | 'alert-triangle' | 'edit-2' | 'calendar' | 'check-circle' | 'info';
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
    { label: 'Backup and restore', icon: 'download' },
    { label: 'Reminders', icon: 'calendar' },
    { label: 'Security', icon: 'lock' },
    { label: 'Profile', icon: 'user' },
    { label: 'Theme', description: `Current theme: ${themeLabel}`, icon: 'sliders' },
    { label: 'About', icon: 'info' },
  ];
  if (isDev) {
    items.push(
      { label: 'Load demo data (6 months)', icon: 'database' },
      { label: 'Load stress data (50y/100y/126y/dense)', icon: 'database', destructive: true },
      { label: 'Simulate corrupt storage', icon: 'alert-triangle', destructive: true },
    );
  }
  items.push({ label: 'Erase all data', icon: 'trash-2', destructive: true });
  return items;
}
