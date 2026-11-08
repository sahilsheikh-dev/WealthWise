import { shouldNudge } from '../backupNudge';

describe('backup reminder boundaries', () => {
  const base = { recordCount: 5, today: '2026-10-31' };

  it('requires five records and nudges only after more than thirty days', () => {
    expect(shouldNudge({ ...base, recordCount: 4 })).toMatchObject({ show: false });
    expect(shouldNudge({ ...base, lastExportAt: '2026-10-01T00:00:00.000Z' })).toMatchObject({ show: false });
    expect(shouldNudge({ ...base, today: '2026-11-01', lastExportAt: '2026-10-01T00:00:00.000Z' }))
      .toMatchObject({ show: true, reason: 'stale', days: 31 });
    expect(shouldNudge(base)).toMatchObject({ show: true, reason: 'never' });
  });

  it('keeps a dismissed reminder hidden through its final day', () => {
    expect(shouldNudge({ ...base, nudgeDismissedUntil: '2026-10-31' })).toMatchObject({ show: false });
    expect(shouldNudge({ ...base, today: '2026-11-01', nudgeDismissedUntil: '2026-10-31' }))
      .toMatchObject({ show: true, reason: 'never' });
  });
});
