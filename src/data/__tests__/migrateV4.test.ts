import { migratePersisted, migrateV3ToV4, migrateV4ToV5 } from '../migrate';
import { mockAppData } from '../../mock/data';
import { makeV4Fixture } from '../testFixtures/v1';

describe('migrate v3 to v4', () => {
  it('adds efAllocation null to a v3 blob without changing its existing fields', () => {
    const { efAllocation: _field, ...v3Data } = mockAppData;
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
    const v4Data = { ...mockAppData, efAllocation: allocation };
    expect(migrateV3ToV4(v4Data)).toEqual(v4Data);
  });

  it('chains earlier migrations through v5', () => {
    const { efAllocation: _field, ...v3Data } = mockAppData;
    const migrated = migratePersisted({ data: v3Data }, 3);
    expect(migrated).toMatchObject({
      data: {
        ...v3Data,
        goals: v3Data.goals.map((goal) => ({ ...goal, links: [] })),
        liabilities: v3Data.liabilities.map((liability) => liability.kind === 'recurring'
          ? { ...liability, settlement: null }
          : liability),
        policies: [],
        budget: null,
        efAllocation: null,
      },
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
    expect(migratePersisted({ data: v4, metadata: { retained: true } }, 4))
      .toEqual({ data: expected, metadata: { retained: true } });
  });

  it('rejects malformed v4 envelopes instead of returning partial data', () => {
    expect(() => migrateV4ToV5({ ...makeV4Fixture(), goals: [null] }))
      .toThrow(expect.objectContaining({ name: 'PersistedVersionError', fromVersion: 4, reason: 'unknown-version' }));
  });
});
