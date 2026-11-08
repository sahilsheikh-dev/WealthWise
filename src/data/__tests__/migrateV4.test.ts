import { migratePersisted, migrateV3ToV4, migrateV4ToV5, migrateV5ToV6 } from '../migrate';
import { makeV3Fixture, makeV4Fixture } from '../testFixtures/v1';

describe('migrate v3 to v4', () => {
  it('adds efAllocation null to a v3 blob without changing its existing fields', () => {
    const v3Data = makeV3Fixture();
    const result = migrateV3ToV4(v3Data);
    expect(result).toEqual({ ...v3Data, efAllocation: null });
  });

  it('preserves a stored allocation when migrating a v4-shaped blob', () => {
    const allocation = {
      cash: 10,
      bank: 40,
      'fd-rd': 35,
      'mutual-funds-bonds': 15,
      stocks: 0,
      insurance: 0,
      other: 0,
    };
    const v4Data = { ...makeV4Fixture(), efAllocation: allocation };
    expect(migrateV3ToV4(v4Data)).toEqual(v4Data);
  });

  it('chains earlier migrations through v5', () => {
    const v3Data = makeV3Fixture();
    const migrated = migratePersisted({ data: v3Data }, 3, {
      today: '2026-10-10',
      newId: () => 'migrated-chain-fund',
    }) as { data: Record<string, unknown> };
    expect(migrated.data).not.toHaveProperty('efEntries');
    expect(migrated.data).toMatchObject({
      efAllocation: null,
      efCustomBuckets: [],
      efBucketLinks: {},
      holdings: expect.arrayContaining([
        expect.objectContaining({ id: 'migrated-chain-fund', value: 500 }),
      ]),
    });
  });

  it('adds v5 defaults to v4 without changing any existing values', () => {
    const v4 = makeV4Fixture();
    const expected = {
      ...v4,
      goals: v4.goals.map((goal) => ({ ...goal, links: [] })),
      liabilities: v4.liabilities.map((liability) => ({ ...liability, settlement: null })),
      policies: [],
      budget: null,
    };
    expect(migrateV4ToV5(v4)).toEqual(expected);
    const migrated = migratePersisted({ data: v4, metadata: { retained: true } }, 4, {
      today: '2026-10-10',
      newId: () => 'migrated-v4-fund',
    }) as { data: Record<string, unknown>; metadata: { retained: boolean } };
    expect(migrated.metadata).toEqual({ retained: true });
    expect(migrated.data).toMatchObject({
      goals: expect.arrayContaining([
        expect.objectContaining({
          auto: 'ef',
          links: [{ instrumentId: 'migrated-v4-fund', share: 100 }],
        }),
      ]),
      liabilities: expected.liabilities,
      policies: [],
      budget: null,
      efCustomBuckets: [],
      efBucketLinks: {},
      holdings: expect.arrayContaining([
        expect.objectContaining({ id: 'migrated-v4-fund', value: 500 }),
      ]),
    });
    expect(migrated.data).not.toHaveProperty('efEntries');
  });

  it('rejects malformed v4 envelopes instead of returning partial data', () => {
    expect(() => migrateV4ToV5({ ...makeV4Fixture(), goals: [null] }))
      .toThrow(expect.objectContaining({ name: 'PersistedVersionError', fromVersion: 4, reason: 'unknown-version' }));
  });

  it('adds only empty custom allocation fields to v5 data', () => {
    const v5 = {
      ...makeV4Fixture(),
      goals: makeV4Fixture().goals.map((goal) => ({ ...goal, links: [] })),
      liabilities: makeV4Fixture().liabilities.map((liability) => ({ ...liability, settlement: null })),
      policies: [],
      budget: null,
    };
    expect(migrateV5ToV6(v5)).toEqual({ ...v5, efCustomBuckets: [], efBucketLinks: {} });
  });
});
