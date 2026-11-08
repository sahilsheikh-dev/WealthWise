import { migratePersisted, migrateV3ToV4 } from '../migrate';
import { mockAppData } from '../../mock/data';

describe('migrate v3 to v4', () => {
  it('adds efAllocation null without altering the rest of the data', () => {
    const result = migrateV3ToV4(mockAppData) as typeof mockAppData & { efAllocation: null };
    expect(result.efAllocation).toBeNull();
    expect(result.transactions).toEqual(mockAppData.transactions);
    expect(result.goals).toEqual(mockAppData.goals);
    expect(result.settings).toEqual(mockAppData.settings);
  });

  it('chains earlier migrations through v4', () => {
    const migrated = migratePersisted({ data: mockAppData }, 3) as { data: typeof mockAppData & { efAllocation: null } };
    expect(migrated.data.efAllocation).toBeNull();
  });
});
