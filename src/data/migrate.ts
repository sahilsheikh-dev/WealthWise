import { SCHEMA_VERSION } from '../domain/schemas';

export class PersistedVersionError extends Error {
  constructor(readonly fromVersion: number, readonly reason: 'unknown-version' | 'future-version') {
    super(`Cannot migrate persisted data from version ${fromVersion}`);
    this.name = 'PersistedVersionError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateV1ToV2(data: unknown): unknown {
  if (
    !isRecord(data) ||
    !Array.isArray(data.loans) ||
    !Array.isArray(data.holdings) ||
    !Array.isArray(data.transactions) ||
    'liabilities' in data
  ) {
    throw new PersistedVersionError(1, 'unknown-version');
  }
  const holdings = data.holdings.map((holding) => {
    if (!isRecord(holding)) throw new PersistedVersionError(1, 'unknown-version');
    if (holding.kind === 'manual') return { ...holding, logs: [] };
    if (holding.kind === 'plan' && Array.isArray(holding.logs)) {
      return {
        ...holding,
        logs: holding.logs.map((entry) =>
          isRecord(entry) ? { ...entry, kind: 'Deposit' } : entry,
        ),
      };
    }
    return holding;
  });
  const liabilities = data.loans.map((loan) => {
    if (!isRecord(loan) || !Array.isArray(loan.payments)) {
      throw new PersistedVersionError(1, 'unknown-version');
    }
    return {
      ...loan,
      kind: 'recurring',
      type: 'Other',
      payments: loan.payments.map((payment) => {
        if (!isRecord(payment)) throw new PersistedVersionError(1, 'unknown-version');
        return { ...payment, kind: payment.kind === 'Prepayment' ? 'Prepayment' : 'EMI' };
      }),
    };
  });
  const transactions = data.transactions.map((transaction) => {
    if (!isRecord(transaction) || !isRecord(transaction.source)) return transaction;
    const kind = transaction.source.kind;
    const migratedKind = kind === 'plan-log'
      ? 'holding-entry'
      : kind === 'loan-payment'
        ? 'liability-payment'
        : kind;
    return { ...transaction, source: { ...transaction.source, kind: migratedKind } };
  });
  const { loans: _loans, ...rest } = data;
  return { ...rest, holdings, liabilities, transactions };
}

export function migratePersisted(persisted: unknown, fromVersion: number): unknown {
  if (fromVersion === SCHEMA_VERSION) return persisted;
  if (fromVersion > SCHEMA_VERSION) throw new PersistedVersionError(fromVersion, 'future-version');
  if (fromVersion < 0 || !Number.isInteger(fromVersion)) {
    throw new PersistedVersionError(fromVersion, 'unknown-version');
  }
  if (fromVersion !== 1) throw new PersistedVersionError(fromVersion, 'unknown-version');

  if (isRecord(persisted) && 'data' in persisted) {
    return { ...persisted, data: migrateV1ToV2(persisted.data) };
  }
  return migrateV1ToV2(persisted);
}
