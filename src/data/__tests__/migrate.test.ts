import { migratePersisted, PersistedVersionError } from '../migrate';

describe('migratePersisted', () => {
  it('passes the current persisted schema through unchanged', () => {
    const persisted = { data: { transactions: [] } };
    expect(migratePersisted(persisted, 1)).toBe(persisted);
  });

  it('throws a typed error for unknown and future versions', () => {
    expect(() => migratePersisted({}, 0)).toThrow(
      expect.objectContaining({ name: 'PersistedVersionError', reason: 'unknown-version' }),
    );
    expect(() => migratePersisted({}, 2)).toThrow(
      expect.objectContaining({ name: 'PersistedVersionError', reason: 'future-version' }),
    );
    expect(() => migratePersisted({}, -1)).toThrow(PersistedVersionError);
  });
});
