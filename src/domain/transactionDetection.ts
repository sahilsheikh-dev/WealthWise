import { effectiveMonthBudget } from './budget';
import { TRANSACTION_CATEGORIES } from './schemas';
import type { AppData, ISODate } from './types';

export const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
export const FINGERPRINT_EXPIRY_MS = 24 * 60 * 60 * 1000;
export const MAX_PENDING_DRAFTS = 25;
export const DEDUP_BUCKET_MS = 5 * 60 * 1000;

export type DetectionSourceApp = {
  packageName: string;
  label: string;
};

export const DEFAULT_DETECTION_SOURCE_APPS: readonly DetectionSourceApp[] = [
  { packageName: 'com.google.android.apps.nbu.paisa.user', label: 'Google Pay' },
  { packageName: 'com.phonepe.app', label: 'PhonePe' },
  { packageName: 'net.one97.paytm', label: 'Paytm' },
  { packageName: 'in.org.npci.upiapp', label: 'BHIM' },
  { packageName: 'in.amazon.mShop.android.shopping', label: 'Amazon Pay' },
  { packageName: 'com.google.android.apps.messaging', label: 'Google Messages' },
  { packageName: 'com.samsung.android.messaging', label: 'Samsung Messages' },
  { packageName: 'com.snapwork.hdfc', label: 'HDFC Bank' },
  { packageName: 'com.csam.icici.bank.imobile', label: 'ICICI iMobile' },
  { packageName: 'com.sbi.lotusintouch', label: 'SBI YONO' },
  { packageName: 'com.axis.mobile', label: 'Axis Mobile' },
  { packageName: 'com.msf.kbank.mobile', label: 'Kotak Mobile Banking' },
];

export type RawDetectedNotification = {
  packageName: string;
  title: string;
  text: string;
  postedAtMs: number;
};

export type PendingTransactionDraft = {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  date: ISODate;
  suggestedNote: string;
  sourcePackage: string;
  confidence: 'high' | 'medium';
  fingerprint: string;
  createdAtMs: number;
  expiresAtMs: number;
};

export type SeenDetectionFingerprint = {
  fingerprint: string;
  seenAtMs: number;
};

const HIDDEN_PATTERNS = [
  /^contents?\s+hidden$/i,
  /^notification\s+content\s+hidden$/i,
  /^sensitive\s+notification\s+content\s+hidden$/i,
  /^\d+\s+new\s+messages?$/i,
];

const IGNORE_PATTERNS = [
  /\botp\b/i,
  /\bone[- ]?time\s+password\b/i,
  /\bverification\s+code\b/i,
  /\bsecurity\s+code\b/i,
  /\bdo\s+not\s+share\b/i,
  /\bcvv\b/i,
  /\bmpin\b/i,
  /\bpre[- ]?approved\b/i,
  /\bapply\s+now\b/i,
  /\bcashback\s+up\s+to\b/i,
  /\bwin\s+up\s+to\b/i,
  /\bdiscount\b/i,
  /\bfailed\b/i,
  /\bdeclined\b/i,
  /\bunsuccessful\b/i,
  /\bcould\s+not\s+be\s+completed\b/i,
  /\brequest\s+for\b/i,
  /\brequested\s+(?:rs\.?|inr|₹|\$)/i,
  /\bpayment\s+request\b/i,
];

const CREDIT_VERBS = /\b(?:credited|received|deposited|refund(?:ed)?|cashback\s+credited|added\s+to\s+your)\b/i;
const DEBIT_VERBS = /\b(?:debited|spent|paid|sent|charged|withdrawn|purchased?|transferred|deducted)\b/i;
const BALANCE_ONLY = /\b(?:available\s+balance|avl\.?\s*bal|current\s+balance)\b/i;

const AMOUNT_PATTERN = /(?:₹|rs\.?|inr|\$|usd)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;

function fnv1a64Hex(input: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, '0');
}

function toISODateLocal(ms: number): ISODate {
  const date = new Date(ms);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function extractSuggestedNote(title: string, text: string, type: 'expense' | 'income'): string {
  const combined = `${title} ${text}`.replace(/\s+/g, ' ').trim();
  const merchantMatch = combined.match(/\b(?:to|at|from|via|towards)\s+([A-Za-z0-9][A-Za-z0-9 &._'-]{1,40})/i);
  let candidate = merchantMatch?.[1]?.trim() ?? title.trim();
  candidate = candidate
    .replace(/\b(?:debited|credited|your|on|using|with|ref|utr|upi|a\/c|acct|account|xx+\d+)\b.*$/i, '')
    .replace(/[0-9]{6,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!candidate || candidate.length < 2) {
    candidate = type === 'income' ? 'Detected credit' : 'Detected payment';
  }
  return candidate.slice(0, 80);
}

export function computeDetectionFingerprint(params: {
  type: 'expense' | 'income';
  amount: number;
  postedAtMs: number;
  suggestedNote: string;
}): string {
  const bucket = Math.floor(params.postedAtMs / DEDUP_BUCKET_MS);
  const normalizedNote = params.suggestedNote.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
  const cents = Math.round(params.amount * 100);
  return fnv1a64Hex(`${params.type}|${cents}|${bucket}|${normalizedNote}`);
}

export function parseTransactionNotification(
  input: RawDetectedNotification,
  nowMs: number,
  draftId: string,
): PendingTransactionDraft | null {
  const title = input.title.trim();
  const text = input.text.trim();
  const combined = `${title} ${text}`.replace(/\s+/g, ' ').trim();

  if (!combined || !input.packageName.trim()) return null;
  if (HIDDEN_PATTERNS.some((pattern) => pattern.test(title) || pattern.test(text))) return null;
  if (IGNORE_PATTERNS.some((pattern) => pattern.test(combined))) return null;

  const isCredit = CREDIT_VERBS.test(combined);
  const isDebit = DEBIT_VERBS.test(combined);
  if ((isCredit && isDebit) || (!isCredit && !isDebit)) {
    if (BALANCE_ONLY.test(combined)) return null;
    return null;
  }

  const amountMatch = combined.match(AMOUNT_PATTERN);
  if (!amountMatch?.[1]) return null;
  const parsedAmount = Number(amountMatch[1].replace(/,/g, ''));
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return null;

  const type: 'expense' | 'income' = isCredit ? 'income' : 'expense';
  const postedAtMs = Number.isFinite(input.postedAtMs) && input.postedAtMs > 0 ? input.postedAtMs : nowMs;
  const suggestedNote = extractSuggestedNote(title, text, type);
  const fingerprint = computeDetectionFingerprint({
    type,
    amount: parsedAmount,
    postedAtMs,
    suggestedNote,
  });

  return {
    id: draftId,
    type,
    amount: Math.round(parsedAmount * 100) / 100,
    date: toISODateLocal(postedAtMs),
    suggestedNote,
    sourcePackage: input.packageName.trim(),
    confidence: title.length > 0 && text.length > 0 ? 'high' : 'medium',
    fingerprint,
    createdAtMs: nowMs,
    expiresAtMs: nowMs + DRAFT_EXPIRY_MS,
  };
}

export function pruneExpiredDetectionState(
  drafts: readonly PendingTransactionDraft[],
  seenFingerprints: readonly SeenDetectionFingerprint[],
  nowMs: number,
): {
  drafts: PendingTransactionDraft[];
  seenFingerprints: SeenDetectionFingerprint[];
} {
  return {
    drafts: drafts.filter((draft) => draft.expiresAtMs > nowMs),
    seenFingerprints: seenFingerprints.filter(
      (entry) => nowMs - entry.seenAtMs <= FINGERPRINT_EXPIRY_MS,
    ),
  };
}

export function reconcileTransactionDrafts(
  existingDrafts: readonly PendingTransactionDraft[],
  existingSeen: readonly SeenDetectionFingerprint[],
  incoming: readonly RawDetectedNotification[],
  nowMs: number,
  createId: (index: number) => string,
): {
  drafts: PendingTransactionDraft[];
  seenFingerprints: SeenDetectionFingerprint[];
  addedDrafts: PendingTransactionDraft[];
} {
  const pruned = pruneExpiredDetectionState(existingDrafts, existingSeen, nowMs);
  const seenSet = new Set(pruned.seenFingerprints.map((item) => item.fingerprint));
  for (const draft of pruned.drafts) {
    seenSet.add(draft.fingerprint);
  }

  const addedDrafts: PendingTransactionDraft[] = [];
  const nextSeen = [...pruned.seenFingerprints];

  incoming.forEach((raw, index) => {
    const parsed = parseTransactionNotification(raw, nowMs, createId(index));
    if (!parsed) return;
    if (seenSet.has(parsed.fingerprint)) return;
    seenSet.add(parsed.fingerprint);
    addedDrafts.push(parsed);
    nextSeen.push({ fingerprint: parsed.fingerprint, seenAtMs: nowMs });
  });

  const combinedDrafts = [...addedDrafts.reverse(), ...pruned.drafts].slice(0, MAX_PENDING_DRAFTS);
  return {
    drafts: combinedDrafts,
    seenFingerprints: nextSeen,
    addedDrafts,
  };
}

export function incomeCategoriesForTransaction(
  data: AppData,
  month: string,
  today: ISODate,
): string[] {
  const { budget } = effectiveMonthBudget(data, month, today);
  const monthIncomeNames = (budget?.incomes ?? []).map((item) => item.name.trim()).filter(Boolean);
  const planIncomeNames = (data.budgetPlan?.incomes ?? []).map((item) => item.name.trim()).filter(Boolean);
  return [...new Set([
    ...monthIncomeNames,
    ...planIncomeNames,
    ...TRANSACTION_CATEGORIES.income,
  ])];
}
