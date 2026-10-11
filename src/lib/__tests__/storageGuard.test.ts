import { storageLevel, storageSummary, utf8ByteLength } from '../storageGuard';

describe('storageGuard', () => {
  it('reports byte lengths and level boundaries', () => {
    expect(utf8ByteLength('hello')).toBe(5);
    expect(storageLevel(1_000_000)).toBe('warn');
    expect(storageLevel(2_000_000)).toBe('critical');
    expect(storageSummary(340 * 1024)).toContain('340');
    expect(storageSummary(340 * 1024)).toContain('KB');
  });
});
