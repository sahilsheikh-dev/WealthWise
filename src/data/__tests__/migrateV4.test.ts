import { migratePersisted, migrateV3ToV4 } from '../migrate';
import { mockAppData } from '../../mock/data';

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

  it('chains earlier migrations through v4', () => {
    const { efAllocation: _field, ...v3Data } = mockAppData;
    const migrated = migratePersisted({ data: v3Data }, 3);
    expect(migrated).toEqual({ data: { ...v3Data, efAllocation: null } });
  });
});
