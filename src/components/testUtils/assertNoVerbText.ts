import type { ReactTestInstance } from 'react-test-renderer';

import { TEXT_ACTIONS_ALLOWED } from '../IconButton';

const EMPTY_STATE_CTA_TEXTS = new Set([
  'Add your monthly income to see cover',
  'Add your first investment',
  'Add a liability',
  'Add entry',
  'Add payment',
  'Add one more of tenure, interest rate or EMI so we can work out the rest',
]);

function flattenText(node: ReactTestInstance): string {
  return node.children.map((child) =>
    typeof child === 'string' ? child : flattenText(child),
  ).join('');
}

const HOME_QUICK_ACTIONS = new Set([
  'Add Transaction',
  'New Investment',
  'New Liability',
  'Log Emergency Fund',
  'Add custom option',
]);

export function assertNoVerbText(
  tree: ReactTestInstance,
  options: { screen?: 'home' } = {},
): void {
  const allowed = new Set<string>([
    ...TEXT_ACTIONS_ALLOWED.filter((text) => !HOME_QUICK_ACTIONS.has(text)),
    ...EMPTY_STATE_CTA_TEXTS,
  ]);
  if (options.screen === 'home') {
    for (const label of HOME_QUICK_ACTIONS) allowed.add(label);
  }
  const textNodes = new Set(tree.findAll((node) => node.type === 'text').map(flattenText));
  const forbidden = [...textNodes].filter((text) => {
    const value = text.trim();
    if (allowed.has(value)) return false;
    return /^(add|new)\b/i.test(value) || /^edit$/i.test(value) || /^delete$/i.test(value) || /^remove$/i.test(value);
  });
  if (forbidden.length > 0) {
    throw new Error(`Unapproved verb text in rendered screen: ${forbidden.join(', ')}`);
  }
}
