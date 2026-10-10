import { migratePersisted, migrateV1ToV2, PersistedVersionError } from '../migrate';
import { makeV1Fixture } from '../testFixtures/v1';

describe('schema migration', () => {
  it('migrates a v1 database to the exact v2 shape', () => {
    const v1 = makeV1Fixture();
    const legacyPlan = v1.holdings.find((holding) => holding.kind === 'plan')!;
    const expected = {
      settings: v1.settings,
      transactions: [
        { ...v1.transactions[0]!, source: { ...v1.transactions[0]!.source!, kind: 'holding-entry' } },
        { ...v1.transactions[1]!, source: { ...v1.transactions[1]!.source!, kind: 'liability-payment' } },
        v1.transactions[2],
      ],
      goals: v1.goals,
      holdings: [
        { ...v1.holdings[0], logs: [] },
        { ...legacyPlan, logs: [{ ...legacyPlan.logs[0]!, kind: 'Deposit' }] },
      ],
      liabilities: [{
        ...v1.loans[0]!,
        kind: 'recurring',
        type: 'Other',
        payments: [{ ...v1.loans[0]!.payments[0]!, kind: 'EMI' }],
      }],
      efEntries: v1.efEntries,
    };
    expect(migratePersisted({ data: v1 }, 1)).toEqual({ data: expected });
    expect(migrateV1ToV2(v1)).toEqual(expected);
  });

  it('rejects v2 input passed to the v1 migration and unknown or future versions', () => {
    const v2 = migrateV1ToV2(makeV1Fixture());
    expect(() => migrateV1ToV2(v2)).toThrow(PersistedVersionError);
    expect(() => migratePersisted({}, 0)).toThrow(
      expect.objectContaining({ name: 'PersistedVersionError', reason: 'unknown-version' }),
    );
    expect(() => migratePersisted({}, 3)).toThrow(
      expect.objectContaining({ name: 'PersistedVersionError', reason: 'future-version' }),
    );
    expect(() => migratePersisted({}, -1)).toThrow(PersistedVersionError);
  });

  it('passes the current persisted schema through unchanged', () => {
    const persisted = { data: { liabilities: [] } };
    expect(migratePersisted(persisted, 2)).toBe(persisted);
  });
});
