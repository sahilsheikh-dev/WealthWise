export type RouteKind = 'tab' | 'stack' | 'form' | 'special';

export const ROUTE_KINDS: Readonly<Record<string, RouteKind>> = {
  '(tabs)/index': 'tab',
  '(tabs)/transactions': 'tab',
  '(tabs)/goals': 'tab',
  '(tabs)/budget': 'tab',
  'budget-income-form': 'form',
  'budget-item-form': 'form',
  'budget-section-form': 'form',
  about: 'stack',
  assets: 'stack',
  backup: 'stack',
  'clear-dues': 'form',
  'ef-allocation-form': 'form',
  'ef-bucket-form': 'form',
  'emergency-fund': 'stack',
  'erase-data': 'stack',
  'goal-form': 'form',
  'holding-valuation-form': 'form',
  insurance: 'stack',
  'investment-entries': 'stack',
  'investment-entry-form': 'form',
  'investment-form': 'form',
  'recurring-plan-stop-form': 'form',
  liabilities: 'stack',
  'liability-closure-form': 'form',
  'liability-closure-note-form': 'form',
  'liability-form': 'form',
  'liability-payment-form': 'form',
  'liability-payments': 'stack',
  'link-missing': 'stack',
  onboarding: 'special',
  'policy-form': 'form',
  'profile-form': 'form',
  'payment-confirm': 'stack',
  reminders: 'stack',
  security: 'stack',
  theme: 'stack',
  'transaction-form': 'form',
};

export function routeKindForPath(pathname: string): RouteKind {
  const normalized = pathname.split('?')[0]?.replace(/^\/+|\/+$/g, '') ?? '';
  if (normalized === '' || normalized === '(tabs)') return 'tab';
  const routeName = normalized.startsWith('(tabs)/')
    ? normalized.slice('(tabs)/'.length)
    : normalized;
  const grouped = normalized.startsWith('(tabs)/') ? `(tabs)/${routeName}` : routeName;
  const kind = ROUTE_KINDS[grouped] ?? ROUTE_KINDS[routeName] ?? ROUTE_KINDS[`(tabs)/${routeName}`];
  if (!kind) throw new Error(`No route kind is registered for "${pathname}".`);
  return kind;
}
