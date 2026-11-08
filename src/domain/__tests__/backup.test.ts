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
import { makeV1Fixture, makeV2Fixture, makeV3Fixture, makeV4Fixture } from '../../data/testFixtures/v1';
import { SUGGESTED_EF_ALLOCATION } from '../efAllocation';

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
    expect(JSON.parse(text)).toMatchObject({ schemaVersion: 5 });
    await expect(parseBackup(text, { digest })).resolves.toMatchObject({
      ok: true, data: mockAppData, exportedAt: '2026-10-10T10:00:00.000Z',
      summary: { transactions: mockAppData.transactions.length },
    });
    expect(backupFileName('2026-10-10T10:05:00.000Z')).toBe('wealthwise-backup-20261010-1005Z.json');
  });

  it('round-trips a customized emergency-fund allocation', async () => {
    const customData = {
      ...mockAppData,
      efAllocation: { ...SUGGESTED_EF_ALLOCATION, cash: 20, bank: 30 },
    };
    const text = await createBackup(customData, { exportedAt: '2026-10-10T10:00:00.000Z', digest });
    await expect(parseBackup(text, { digest })).resolves.toMatchObject({
      ok: true,
      data: { efAllocation: customData.efAllocation },
    });

  });

  it('round-trips every v5 collection and new stored field', async () => {
    const policy = mockAppData.policies[0];
    const liability = mockAppData.liabilities.find((item) => item.kind === 'recurring');
    if (!policy || !liability || liability.kind !== 'recurring') throw new Error('Expected v5 fixtures.');
    const premium = { id: 'backup-policy-payment', date: '2026-10-01', amount: 900, note: 'October premium' };
    const data = {
      ...mockAppData,
      liabilities: mockAppData.liabilities.map((item) => item.id === liability.id ? {
        ...liability, settlement: { asOf: '2026-10-01', balance: 250_000 },
      } : item),
      policies: [{ ...policy, payments: [premium] }],
      transactions: [...mockAppData.transactions, {
        id: 'backup-policy-payment-tx', type: 'expense' as const, amount: premium.amount,
        category: 'Insurance', note: `${policy.name} premium`, date: premium.date,
        source: { kind: 'policy-payment' as const, parentId: policy.id, entryId: premium.id },
      }],
      budget: { plannedIncome: 72_000, lines: [{ category: 'Bills', planned: 4_000 }] },
    };
    const raw = await createBackup(data, { exportedAt: '2026-10-10T10:00:00.000Z', digest });
    await expect(parseBackup(raw, { digest })).resolves.toMatchObject({ ok: true, data });
  });

  it('validates v5 policy, settlement, due-date and budget import constraints', () => {
    const policy = mockAppData.policies[0];
    const recurring = mockAppData.liabilities.find((item) => item.kind === 'recurring');
    const oneTime = mockAppData.liabilities.find((item) => item.kind === 'one-time');
    if (!policy || !recurring || recurring.kind !== 'recurring' || !oneTime || oneTime.kind !== 'one-time') {
      throw new Error('Expected v5 mock records.');
    }
    const invalidDatas = [
      {
        ...mockAppData,
        liabilities: mockAppData.liabilities.map((item) => item.id === recurring.id
          ? { ...recurring, settlement: { asOf: '2026-03-31', balance: 10 } }
          : item),
      },
      {
        ...mockAppData,
        liabilities: mockAppData.liabilities.map((item) => item.id === oneTime.id
          ? { ...oneTime, dueDate: '2026-08-31' }
          : item),
      },
      { ...mockAppData, policies: [{ ...policy, frequency: 'single' as const, premiumYears: 1 }] },
      { ...mockAppData, policies: [{ ...policy, maturityDate: '2021-01-01' }] },
      { ...mockAppData, policies: [{ ...policy, kind: 'term' as const, currentValue: 1 }] },
      { ...mockAppData, policies: [{ ...policy, kind: 'ulip' as const, valueAsOf: null }] },
      { ...mockAppData, budget: { plannedIncome: null, lines: [{ category: 'Not allowed', planned: 1 }] } },
      { ...mockAppData, budget: { plannedIncome: null, lines: [
        { category: 'Food', planned: 1 }, { category: 'Food', planned: 2 },
      ] } },
    ];
    for (const invalid of invalidDatas) {
      expect(validateImportData(invalid).ok).toBe(false);
    }
    expect(validateImportData(null)).toMatchObject({ ok: false, reason: 'invalid-data' });
    expect(canonicalJson({ z: 1, m: 2, a: 3 })).toBe('{"a":3,"m":2,"z":1}');
    expect(canonicalJson(undefined)).toBe('null');
  });

  it('reports malformed and untrusted files with distinct reasons', async () => {
    await expect(parseBackup('{', { digest })).resolves.toMatchObject({ ok: false, reason: 'not-json' });
    await expect(parseBackup('{"app":"elsewhere"}', { digest })).resolves.toMatchObject({ ok: false, reason: 'not-a-backup' });
    const raw = await createBackup(mockAppData, { exportedAt: '2026-10-10T10:00:00.000Z', digest });
    const tampered = raw.replace('"amount": 47000', '"amount": 47001');
    await expect(parseBackup(tampered, { digest })).resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
    const newer = JSON.parse(raw) as Record<string, unknown>;
    newer.schemaVersion = 6;
    await expect(parseBackup(JSON.stringify(newer), { digest })).resolves.toMatchObject({ ok: false, reason: 'newer-version' });
    const futureFormat = await reChecksum(raw, (envelope) => { envelope.formatVersion = BACKUP_FORMAT_VERSION + 1; });
    await expect(parseBackup(futureFormat, { digest })).resolves.toMatchObject({ ok: false, reason: 'newer-version' });
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

  it('verifies a v1 data checksum before migration and imports the v3 result', async () => {
    const data = makeV1Fixture();
    const envelope = {
      app: 'wealthwise',
      formatVersion: 1,
      schemaVersion: 1,
      exportedAt: '2026-10-10T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(data)) },
      data,
    };
    const result = await parseBackup(JSON.stringify(envelope), { digest });
    expect(result).toMatchObject({
      ok: true,
      data: { settings: { monthlySalary: null, onboarded: true }, liabilities: [{ kind: 'recurring', type: 'Other' }] },
    });

    const corrupted = { ...envelope, checksum: { ...envelope.checksum, value: 'wrong' } };
    await expect(parseBackup(JSON.stringify(corrupted), { digest }))
      .resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
  });

  it('verifies v2 data as written before migrating and validates the v3 result', async () => {
    const data = makeV2Fixture();
    const envelope = {
      app: 'wealthwise',
      formatVersion: 1,
      schemaVersion: 2,
      exportedAt: '2026-10-10T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(data)) },
      data,
    };
    const result = await parseBackup(JSON.stringify(envelope), { digest });
    expect(result).toMatchObject({
      ok: true,
      data: {
        settings: { monthlySalary: null, onboarded: true },
        liabilities: [{ kind: 'recurring', type: 'Other' }],
      },
    });

    if (result.ok) {
      expect(result.data.settings.theme).toBe(data.settings.theme);
      expect(result.data.transactions).toEqual(data.transactions);
    }
    const corrupted = { ...envelope, checksum: { ...envelope.checksum, value: 'wrong' } };
    await expect(parseBackup(JSON.stringify(corrupted), { digest }))
      .resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
  });

  it.each([
    [3, makeV3Fixture],
    [4, makeV4Fixture],
  ] as const)('verifies the v%s checksum before migrating its data', async (schemaVersion, makeFixture) => {
    const data = makeFixture();
    const envelope = {
      app: 'wealthwise',
      formatVersion: 1,
      schemaVersion,
      exportedAt: '2026-10-10T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(data)) },
      data,
    };
    const result = await parseBackup(JSON.stringify(envelope), { digest });
    expect(result).toMatchObject({
      ok: true,
      data: { policies: [], budget: null, goals: expect.arrayContaining([expect.objectContaining({ links: [] })]) },
    });
    if (!result.ok) throw new Error('Expected old backup to import.');
    expect(result.data.transactions).toHaveLength(data.transactions.length);
    expect(result.data.liabilities[0]).toMatchObject({ settlement: null });

    const alteredChecksum = { ...envelope, checksum: { ...envelope.checksum, value: 'incorrect' } };
    await expect(parseBackup(JSON.stringify(alteredChecksum), { digest }))
      .resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
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
      data.transactions[0]!.source = { kind: 'holding-entry', parentId: 'missing', entryId: 'missing' };
    });
    await expect(parseBackup(orphan, { digest })).resolves.toMatchObject({ ok: false, reason: 'integrity' });
  });

  it('caps invalid-data issues and repairs only a missing emergency-fund goal', () => {
    const dataWithoutEfGoal = { ...mockAppData, goals: mockAppData.goals.filter((goal) => goal.auto !== 'ef') };
    const result = validateImportData(dataWithoutEfGoal);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.goals.some((goal) => goal.auto === 'ef')).toBe(true);
    const invalid = validateImportData({
      ...mockAppData,
      settings: { ...mockAppData.settings, name: 'x'.repeat(41) },
    });
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
      liabilities: [],
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
