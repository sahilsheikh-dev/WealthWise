import { SCHEMA_VERSION } from '../domain/schemas';

export class PersistedVersionError extends Error {
  constructor(readonly fromVersion: number, readonly reason: 'unknown-version' | 'future-version') {
    super(`Cannot migrate persisted data from version ${fromVersion}`);
    this.name = 'PersistedVersionError';
  }
}

export function migratePersisted<T>(persisted: T, fromVersion: number): T {
  if (fromVersion === SCHEMA_VERSION) return persisted;
  if (fromVersion > SCHEMA_VERSION) throw new PersistedVersionError(fromVersion, 'future-version');
  if (fromVersion < 0 || !Number.isInteger(fromVersion)) {
    throw new PersistedVersionError(fromVersion, 'unknown-version');
  }
  if (fromVersion !== 1) throw new PersistedVersionError(fromVersion, 'unknown-version');
  return migrateV1ToV2(persisted) as T;
}

export function migrateV1ToV2(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) throw new PersistedVersionError(1, 'unknown-version');
  const value = data as Record<string, unknown>;
  const oldLoans = Array.isArray(value.loans) ? value.loans : [];
  const holdings = Array.isArray(value.holdings) ? value.holdings.map((holding) => {
    if (typeof holding !== 'object' || holding === null) return holding;
    const item = holding as Record<string, unknown>;
    if (item.kind === 'manual') return { ...item, logs: [] };
    if (item.kind !== 'plan' || !Array.isArray(item.logs)) return item;
    return { ...item, logs: item.logs.map((log) => ({ ...(log as object), kind: 'Deposit' })) };
  }) : [];
  const transactions = Array.isArray(value.transactions) ? value.transactions.map((transaction) => {
    if (typeof transaction !== 'object' || transaction === null) return transaction;
    const item = transaction as Record<string, unknown>;
    const source = item.source as Record<string, unknown> | undefined;
    if (!source) return item;
    const kind = source.kind === 'plan-log' ? 'holding-entry' : source.kind === 'loan-payment' ? 'liability-payment' : source.kind;
    return { ...item, source: { ...source, kind } };
  }) : [];
  const liabilities = oldLoans.map((loan) => {
    const item = loan as Record<string, unknown>;
    return { ...item, kind: 'recurring', type: 'Other', payments: Array.isArray(item.payments) ? item.payments.map((payment) => ({ ...(payment as object), kind: (payment as Record<string, unknown>).kind ?? 'EMI' })) : [] };
  });
  const { loans: _loans, ...rest } = value;
  return { ...rest, holdings, transactions, liabilities };
}
