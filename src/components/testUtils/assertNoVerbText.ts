import type { ReactTestInstance } from 'react-test-renderer';

import { TEXT_ACTIONS_ALLOWED } from '../IconButton';

const EMPTY_STATE_CTA_TEXTS = new Set([
  'Add expenses to calculate your 3-month minimum',
  'Add your first investment',
  'Add a liability',
  'Add entry',
  'Add payment',
]);

function flattenText(node: ReactTestInstance): string {
  return node.children.map((child) =>
    typeof child === 'string' ? child : flattenText(child),
  ).join('');
}

export function assertNoVerbText(tree: ReactTestInstance): void {
  const allowed = new Set<string>([...TEXT_ACTIONS_ALLOWED, ...EMPTY_STATE_CTA_TEXTS]);
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
