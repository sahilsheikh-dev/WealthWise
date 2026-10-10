export type HomeMenuItem = {
  label: string;
  icon: 'download' | 'lock' | 'user' | 'sliders' | 'link' | 'trash-2' | 'database' | 'alert-triangle' | 'edit';
  destructive?: boolean;
  disabled?: boolean;
};

export function buildHomeMenu({
  hasUnlinked,
  isDev,
  themeLabel,
}: {
  hasUnlinked: boolean;
  isDev: boolean;
  themeLabel: string;
}): HomeMenuItem[] {
  const items: HomeMenuItem[] = [
    { label: 'Backup and restore', icon: 'download' },
    { label: 'Security', icon: 'lock' },
    { label: 'Your name', icon: 'user' },
    { label: `Theme (${themeLabel})`, icon: 'sliders' },
  ];
  if (hasUnlinked) items.push({ label: 'Link missing transactions', icon: 'link' });
  items.push({ label: 'Erase all data', icon: 'trash-2', destructive: true });
  if (isDev) {
    items.push(
      { label: 'Load demo data', icon: 'database' },
      { label: 'Simulate corrupt storage', icon: 'alert-triangle', destructive: true },
    );
  }
  return items;
}
