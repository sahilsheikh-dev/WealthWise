import { storageLevel, storageSummary, utf8ByteLength } from '../storageGuard';

describe('storageGuard', () => {
  it('reports byte lengths and level boundaries', () => {
    expect(utf8ByteLength('hello')).toBe(5);
    expect(utf8ByteLength('₹🙂')).toBe(7);
    expect(storageLevel(999_999)).toBe('ok');
    expect(storageLevel(1_000_000)).toBe('warn');
    expect(storageLevel(1_599_999)).toBe('warn');
    expect(storageLevel(1_600_000)).toBe('critical');
    expect(storageSummary(8)).toContain('B');
    expect(storageSummary(340 * 1024)).toContain('340');
    expect(storageSummary(340 * 1024)).toContain('KB');
    expect(storageSummary(1_600_000)).toContain('MB');
  });
});
