import {
  BACKUP_FORMAT_VERSION,
  MAX_BACKUP_CHARS,
  backupFileName,
  canonicalJson,
  createBackup,
  parseBackup,
  summarizeData,
  validateImportData,
} from '../backup';
import { mockAppData } from '../../mock/data';

const { createHash } = jest.requireActual<{
  createHash: (algorithm: string) => { update: (text: string) => { digest: (encoding: 'hex') => string } };
}>('crypto');
const digest = async (text: string) => createHash('sha256').update(text).digest('hex');
const reChecksum = async (raw: string, change: (envelope: Record<string, unknown>) => void) => {
  const envelope = JSON.parse(raw) as Record<string, unknown>;
  change(envelope);
  const checksum = envelope.checksum as { algorithm: string; value: string };
  checksum.value = await digest(canonicalJson(envelope.data));
  return JSON.stringify(envelope);
};

describe('backup validation and serialization', () => {
  it('canonicalizes recursively and creates a pretty-printed backup', async () => {
    expect(canonicalJson({ z: 1, nested: { b: 2, a: 1 }, a: undefined })).toBe('{"nested":{"a":1,"b":2},"z":1}');
    expect(canonicalJson([undefined, 1])).toBe('[1]');
    const text = await createBackup(mockAppData, { exportedAt: '2026-10-10T10:00:00.000Z', digest });
    expect(text).toContain('\n  "app": "wealthwise"');
    await expect(parseBackup(text, { digest })).resolves.toMatchObject({
      ok: true, data: mockAppData, exportedAt: '2026-10-10T10:00:00.000Z',
      summary: { transactions: mockAppData.transactions.length },
    });
    expect(backupFileName('2026-10-10T10:05:00.000Z')).toBe('wealthwise-backup-20261010-1005Z.json');
  });

  it('reports malformed and untrusted files with distinct reasons', async () => {
    await expect(parseBackup('{', { digest })).resolves.toMatchObject({ ok: false, reason: 'not-json' });
    await expect(parseBackup('{"app":"elsewhere"}', { digest })).resolves.toMatchObject({ ok: false, reason: 'not-a-backup' });
    const raw = await createBackup(mockAppData, { exportedAt: '2026-10-10T10:00:00.000Z', digest });
    const tampered = raw.replace('"amount": 47000', '"amount": 47001');
    await expect(parseBackup(tampered, { digest })).resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
    const newer = JSON.parse(raw) as Record<string, unknown>;
    newer.schemaVersion = 99;
    newer.formatVersion = 2;
    await expect(parseBackup(JSON.stringify(newer), { digest })).resolves.toMatchObject({ ok: false, reason: 'newer-version' });
    await expect(parseBackup('x'.repeat(MAX_BACKUP_CHARS + 1), { digest }))
      .resolves.toMatchObject({ ok: false, reason: 'too-large' });
    const oldSchema = await reChecksum(raw, (envelope) => { envelope.schemaVersion = 0; });
    await expect(parseBackup(oldSchema, { digest })).resolves.toMatchObject({ ok: false, reason: 'unsupported-version' });
    const oldFormat = await reChecksum(raw, (envelope) => { envelope.formatVersion = 0; });
    await expect(parseBackup(oldFormat, { digest })).resolves.toMatchObject({ ok: false, reason: 'unsupported-version' });
    await expect(parseBackup(raw.replace('2026-10-10T10:00:00.000Z', '2026-10-10T10:00:00.000+01:00'), { digest }))
      .resolves.toMatchObject({ ok: false, reason: 'not-a-backup' });
    expect(() => backupFileName('not a date')).toThrow('Invalid export date');
  });

  it('distinguishes invalid values from broken record integrity after recomputing checksum', async () => {
    const raw = await createBackup(mockAppData, { exportedAt: '2026-10-10T10:00:00.000Z', digest });
    const invalid = await reChecksum(raw, (envelope) => {
      const data = envelope.data as typeof mockAppData;
      data.transactions[0]!.amount = -1;
    });
    await expect(parseBackup(invalid, { digest })).resolves.toMatchObject({ ok: false, reason: 'invalid-data' });

    const orphan = await reChecksum(raw, (envelope) => {
      const data = envelope.data as typeof mockAppData;
      data.transactions[0]!.source = { kind: 'plan-log', parentId: 'missing', entryId: 'missing' };
    });
    await expect(parseBackup(orphan, { digest })).resolves.toMatchObject({ ok: false, reason: 'integrity' });
  });

  it('caps invalid-data issues and repairs only a missing emergency-fund goal', () => {
    const dataWithoutEfGoal = { ...mockAppData, goals: mockAppData.goals.filter((goal) => goal.auto !== 'ef') };
    const result = validateImportData(dataWithoutEfGoal);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.goals.some((goal) => goal.auto === 'ef')).toBe(true);
    const invalid = validateImportData({ ...mockAppData, settings: { name: 'x'.repeat(81), theme: 'dark' } });
    expect(invalid).toMatchObject({ ok: false, reason: 'invalid-data' });
    if (!invalid.ok) expect(invalid.issues.length).toBeLessThanOrEqual(10);
    const invalidSnapshot = validateImportData({
      ...mockAppData,
      holdings: [{
        ...mockAppData.holdings.find((holding) => holding.kind === 'plan')!,
        actualValue: 100, actualValueDate: null,
      }],
    });
    expect(invalidSnapshot).toMatchObject({ ok: false, reason: 'invalid-data' });
    const noFinancialHistory = validateImportData({
      ...mockAppData,
      transactions: [],
      goals: [],
      holdings: [],
      loans: [],
      efEntries: [],
    });
    expect(noFinancialHistory).toMatchObject({ ok: true });
    if (noFinancialHistory.ok) expect(noFinancialHistory.data.goals[0]?.year).toBe(2002);
    expect(summarizeData({ ...mockAppData, transactions: [] })).toMatchObject({
      firstDate: null, lastDate: null,
    });
    expect(BACKUP_FORMAT_VERSION).toBe(1);
  });
});
