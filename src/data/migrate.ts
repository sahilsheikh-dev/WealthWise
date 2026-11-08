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

export function migrateV2ToV3(data: unknown): unknown {
  if (
    !isRecord(data) ||
    !isRecord(data.settings) ||
    !Array.isArray(data.transactions) ||
    !Array.isArray(data.goals) ||
    !Array.isArray(data.holdings) ||
    !Array.isArray(data.liabilities) ||
    !Array.isArray(data.efEntries)
  ) {
    throw new PersistedVersionError(2, 'unknown-version');
  }
  const settings = {
    ...data.settings,
    monthlySalary: null,
    onboarded: data.settings.name !== ''
      || data.transactions.length > 0
      || data.goals.some((goal) => !isRecord(goal) || goal.auto !== 'ef')
      || data.holdings.length > 0
      || data.liabilities.length > 0
      || data.efEntries.length > 0,
  };
  return { ...data, settings, efAllocation: null };
}

export function migrateV3ToV4(data: unknown): unknown {
  if (
    !isRecord(data) ||
    !isRecord(data.settings) ||
    !Array.isArray(data.transactions) ||
    !Array.isArray(data.goals) ||
    !Array.isArray(data.holdings) ||
    !Array.isArray(data.liabilities) ||
    !Array.isArray(data.efEntries)
  ) {
    throw new PersistedVersionError(3, 'unknown-version');
  }
  return {
    ...data,
    efAllocation: null,
  };
}

export function migratePersisted(persisted: unknown, fromVersion: number): unknown {
  if (fromVersion === SCHEMA_VERSION) return persisted;
  if (fromVersion > SCHEMA_VERSION) throw new PersistedVersionError(fromVersion, 'future-version');
  if (fromVersion < 0 || !Number.isInteger(fromVersion)) {
    throw new PersistedVersionError(fromVersion, 'unknown-version');
  }
  const migrateData = (data: unknown) => {
    let result = data;
    if (fromVersion === 1) result = migrateV1ToV2(result);
    if (fromVersion <= 2) result = migrateV2ToV3(result);
    if (fromVersion <= 3) result = migrateV3ToV4(result);
    return result;
  };
  if (isRecord(persisted) && 'data' in persisted) {
    return { ...persisted, data: migrateData(persisted.data) };
  }
  return migrateData(persisted);
}
