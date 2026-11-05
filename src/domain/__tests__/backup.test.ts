import {
  BACKUP_FORMAT_VERSION,
  MAX_BACKUP_CHARS,
  backupFileName,
  canonicalJson,
  createBackup,
  encryptedBackupFileName,
  parseBackup,
  summarizeData,
  validateImportData,
} from '../backup';
import { mockAppData } from '../../mock/data';
import { makeV1Fixture, makeV2Fixture, makeV3Fixture, makeV4Fixture, makeV5Fixture, makeV6Fixture } from '../../data/testFixtures/v1';
import { SUGGESTED_EF_ALLOCATION } from '../efAllocation';
import { SCHEMA_VERSION } from '../schemas';
import { addInvestmentEntry } from '../investmentActions';
import { addLiability, closeRecurringLiability } from '../liabilityActions';
import { budgetPlanFromLines, monthBudgetFromLines } from '../../testFixtures/budget';
import { makeV9Fixture } from '../../data/testFixtures/v9';
import { makeV10Fixture } from '../../data/testFixtures/v10';
import { makeV11Fixture } from '../../data/testFixtures/v11';
import { makeV12Fixture } from '../../data/testFixtures/v12';
import { decryptBackup, encryptBackup } from '../backupCrypto';

const { createHash } = jest.requireActual<{
  createHash: (algorithm: string) => { update: (text: string) => { digest: (encoding: 'hex') => string } };
}>('crypto');
const digest = async (text: string) => createHash('sha256').update(text).digest('hex');
let migratedId = 0;
const migrationOptions = {
  digest,
  today: '2026-10-10',
  newId: () => `backup-migrated-${++migratedId}`,
};
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
    expect(JSON.parse(text)).toMatchObject({ schemaVersion: 21 });
    await expect(parseBackup(text, { digest })).resolves.toMatchObject({
      ok: true, data: mockAppData, exportedAt: '2026-10-10T10:00:00.000Z',
      summary: { transactions: mockAppData.transactions.length },
    });

    expect(backupFileName('2026-10-10T10:05:00.000Z')).toBe('wealthwise-backup-20261010-1005Z.json');
    expect(encryptedBackupFileName('2026-10-10T10:05:00.000Z'))
      .toBe('wealthwise-backup-20261010-1005Z-encrypted.json');
  });

  it('accepts historical backup dates from 1900 and rejects dates before that floor', () => {
    const transaction = mockAppData.transactions[0];
    if (!transaction) throw new Error('Expected transaction fixture.');
    expect(validateImportData({
      ...mockAppData,
      transactions: [{ ...transaction, date: '1900-01-01' }],
    }).ok).toBe(true);
    expect(validateImportData({
      ...mockAppData,
      transactions: [{ ...transaction, date: '1899-12-31' }],
    })).toMatchObject({ ok: false, reason: 'invalid-data' });
  });

  it('refuses exports that import would normalize or that have an invalid timestamp', async () => {
    const withoutEmergencyGoal = {
      ...mockAppData,
      goals: mockAppData.goals.filter((goal) => goal.auto !== 'ef'),
    };
    await expect(createBackup(withoutEmergencyGoal, {
      exportedAt: '2026-10-10T10:00:00.000Z',
      digest,
    })).rejects.toThrow('would change when imported; export was cancelled before writing a file');
    await expect(createBackup(mockAppData, { exportedAt: 'not-a-date', digest }))
      .rejects.toThrow('export timestamp is invalid; no file was written');
  });

  it('refuses an oversized export before a backup string can be returned', async () => {
    const transaction = mockAppData.transactions[0];
    if (!transaction) throw new Error('Expected transaction fixture.');
    const data = {
      ...mockAppData,
      transactions: Array.from({ length: 35_000 }, (_, index) => ({
        ...transaction,
        id: `large-${index}`,
        note: 'x'.repeat(150),
      })),
    };

    await expect(createBackup(data, {
      exportedAt: '2026-10-10T10:00:00.000Z',
      digest,
    })).rejects.toThrow('import limit is 5,000,000 characters. No file was written.');
  });

  it('round-trips typed insurance premium categories through current backups', async () => {
    const transaction = {
      id: 'typed-premium',
      type: 'expense' as const,
      amount: 1_000,
      category: 'Health premium',
      note: 'Health policy premium',
      date: '2026-10-10',
    };
    const data = { ...mockAppData, transactions: [...mockAppData.transactions, transaction] };
    const text = await createBackup(data, { exportedAt: '2026-10-10T10:00:00.000Z', digest });
    const imported = await parseBackup(text, { digest });
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.message}`);
    expect(imported.data.transactions).toContainEqual(transaction);
  });

  it('verifies v7 checksums before migrating backups to schema nine', async () => {
    const { budgetPlan, monthBudgets, ...rest } = mockAppData;
    const oldData = {
      ...rest,
      budgetTemplates: [{
        id: 'legacy-plan',
        name: 'Legacy plan',
        plannedIncome: budgetPlan?.incomes.reduce((sum, income) => sum + income.amount, 0) ?? null,
        lines: budgetPlan?.items.map((item) => ({
          category: item.name,
          mode: item.mode,
          value: item.value,
          ...(item.dueDay === undefined ? {} : { dueDay: item.dueDay }),
        })) ?? [],
      }],
      defaultBudgetTemplateId: 'legacy-plan',
      monthBudgets: (monthBudgets ?? []).map(({
        source: _source, linkedIncluded: _linked, incomes, sections: _sections, items, ...snapshot
      }) => ({
        ...snapshot,
        lines: items.map((item) => ({
          category: item.name,
          planned: item.value,
          ...(item.dueDay === undefined ? {} : { dueDay: item.dueDay }),
        })),
        plannedIncome: incomes.reduce((sum, income) => sum + income.amount, 0),
        templateId: 'legacy-plan',
        templateName: 'Legacy plan',
        customized: false,
        linkedIncluded: true,
      })),
    };
    const checksum = await digest(canonicalJson(oldData));
    const envelope = {
      app: 'wealthwise',
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: 7,
      exportedAt: '2026-10-13T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: checksum },
      data: oldData,
    };
    const imported = await parseBackup(JSON.stringify(envelope), migrationOptions);
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.message}`);
    expect(imported.data.budgetPlan).toMatchObject({ repeatMonthly: false, repeatFrom: null });
    expect(imported.data.monthBudgets?.[0]?.linkedIncluded).toBe(false);
    expect(imported.data).not.toHaveProperty('budgetTemplates');

    const tampered = { ...envelope, data: { ...oldData, settings: { ...oldData.settings, name: 'tampered' } } };
    await expect(parseBackup(JSON.stringify(tampered), migrationOptions))
      .resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
  });

  it('verifies v8 checksums as written before migrating income totals', async () => {
    const data = {
      ...mockAppData,
      budgetPlan: {
        plannedIncome: 15_000,
        lines: [{ category: 'Food', mode: 'amount' as const, value: 2_000 }],
        repeatMonthly: true,
        repeatFrom: '2026-11',
      },
      monthBudgets: [{
        month: '2026-10',
        source: 'custom' as const,
        plannedIncome: 12_000,
        lines: [{ category: 'Food', planned: 1_000 }],
      }],
    };
    const checksum = await digest(canonicalJson(data));
    const envelope = {
      app: 'wealthwise',
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: 8,
      exportedAt: '2026-10-13T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: checksum },
      data,
    };
    const imported = await parseBackup(JSON.stringify(envelope), migrationOptions);
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.message}`);
    expect(imported.data.budgetPlan?.incomes).toEqual([
      expect.objectContaining({ name: 'Salary', category: 'Business', amount: 15_000, day: 1 }),
    ]);
    expect(imported.data.monthBudgets?.[0]?.incomes).toEqual([
      expect.objectContaining({ name: 'Income', category: 'Business', amount: 12_000 }),
    ]);
    const tampered = { ...envelope, data: { ...data, settings: { ...data.settings, name: 'changed' } } };
    await expect(parseBackup(JSON.stringify(tampered), migrationOptions))
      .resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
  });

  it('verifies v10 checksums as written before migrating policy fields', async () => {
    const oldData = makeV10Fixture();
    const envelope = {
      app: 'wealthwise',
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: 10,
      exportedAt: '2026-10-13T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(oldData)) },
      data: oldData,
    };
    const imported = await parseBackup(JSON.stringify(envelope), migrationOptions);
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.message}`);
    expect(imported.data.policies[0]).toMatchObject({
      kind: 'life-savings',
      status: 'active',
      sumAssured: 500_000,
      endDate: '2042-01-15',
    });

    const tampered = { ...envelope, data: { ...oldData, settings: { ...oldData.settings, name: 'changed' } } };
    await expect(parseBackup(JSON.stringify(tampered), migrationOptions))
      .resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
  });

  it('verifies v11 backup bytes and removes superseded cover goals during migration', async () => {
    const data = makeV11Fixture();
    const envelope = {
      app: 'wealthwise',
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: 11,
      exportedAt: '2026-10-10T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(data)) },
      data,
    };
    const imported = await parseBackup(JSON.stringify(envelope), migrationOptions);
    expect(imported).toMatchObject({ ok: true });
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.message}`);
    expect(imported.data).not.toHaveProperty('coverGoals');
    const tampered = { ...envelope, data: { ...data, settings: { ...data.settings, name: 'Tampered' } } };
    await expect(parseBackup(JSON.stringify(tampered), migrationOptions))
      .resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
  });

  it('verifies v12 backup bytes before adding monthly recurrence defaults', async () => {
    const data = makeV12Fixture();
    const envelope = {
      app: 'wealthwise',
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: 12,
      exportedAt: '2026-10-10T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(data)) },
      data,
    };
    const imported = await parseBackup(JSON.stringify(envelope), migrationOptions);
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.message}`);
    expect(imported.data.budgetPlan?.items.every((item) =>
      item.frequency === 'monthly' && item.firstDueMonth === undefined,
    )).toBe(true);
    expect(imported.data.monthBudgets?.every((budget) =>
      budget.items.every((item) => item.frequency === 'monthly' && item.firstDueMonth === undefined),
    )).toBe(true);

    const recurrenceData = {
      ...mockAppData,
      budgetPlan: mockAppData.budgetPlan && {
        ...mockAppData.budgetPlan,
        items: mockAppData.budgetPlan.items.map((item) => item.name === 'Food'
          ? { ...item, frequency: 'quarterly' as const, firstDueMonth: '2026-10' }
          : item),
      },
    };
    const backup = await createBackup(recurrenceData, {
      exportedAt: '2026-10-10T10:00:00.000Z', digest,
    });
    await expect(parseBackup(backup, { digest })).resolves.toMatchObject({
      ok: true,
      data: recurrenceData,
    });

    const tampered = {
      ...envelope,
      data: { ...data, settings: { ...data.settings, name: 'Tampered' } },
    };
    await expect(parseBackup(JSON.stringify(tampered), migrationOptions))
      .resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
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

  it('round-trips a manual holding snapshot adjustment through backup export and import', async () => {
    const holding = mockAppData.holdings.find((item) =>
      item.kind === 'manual' && item.id === 'holding-cash');
    if (!holding || holding.kind !== 'manual' || !holding.valueAsOf) {
      throw new Error('Expected a dated manual holding.');
    }
    const data = addInvestmentEntry(mockAppData, holding.id, {
      date: holding.valueAsOf,
      amount: 125,
      note: 'Snapshot-day deposit',
      kind: 'Deposit',
    }, (() => {
      let index = 0;
      return () => `snapshot-round-trip-${++index}`;
    })(), '2026-10-16');
    const raw = await createBackup(data, {
      exportedAt: '2026-10-16T10:00:00.000Z',
      digest,
    });
    const imported = await parseBackup(raw, { digest });
    if (!imported.ok) {
      throw new Error(`${imported.reason}: ${imported.issues?.join('; ') ?? imported.message}`);
    }
    const restored = imported.data.holdings.find((item) => item.id === holding.id);
    if (!restored || restored.kind !== 'manual') throw new Error('Manual holding was not restored.');
    expect(restored.logs.at(-1)).toMatchObject({
      amount: 125,
      date: holding.valueAsOf,
      snapshotAdjustment: 125,
    });
    expect(restored.value).toBe(holding.value + 125);
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

  it('round trips v10 backups containing user-managed budget items and expense categories', async () => {
    const categories = ['Eating out', 'Entertainment', 'Fashion', 'Culture', 'Unexpected'] as const;
    const data = {
      ...mockAppData,
      transactions: [
        ...mockAppData.transactions,
        {
          id: 'legacy-invest-other',
          type: 'invest' as const,
          amount: 50,
          category: 'Other',
          note: 'Legacy category',
          date: '2026-10-11',
        },
        ...categories.map((category, index) => ({
          id: `backup-category-${index}`,
          type: 'expense' as const,
          amount: 100 + index,
          category,
          note: category,
          date: '2026-10-12',
        })),
      ],
      budgetPlan: budgetPlanFromLines(categories.map((category) => ({
        category, mode: 'amount' as const, value: 100,
      })), {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 10_000 }],
      }),
      monthBudgets: [monthBudgetFromLines('2026-10', categories.map((category) => ({
        category, planned: 100,
      })), {
        source: 'plan',
        incomes: [{ id: 'income', name: 'Income', category: 'Salary' as const, amount: 10_000 }],
      })],
    };
    expect(SCHEMA_VERSION).toBe(21);
    const raw = await createBackup(data, { exportedAt: '2026-10-13T10:00:00.000Z', digest });
    const result = await parseBackup(raw, { digest });
    if (!result.ok) throw new Error(`${result.reason}: ${result.issues?.join('; ') ?? result.message}`);
    expect(result).toMatchObject({
      ok: true,
      data: {
        transactions: expect.arrayContaining([
          ...categories.map((category) => expect.objectContaining({ category })),
          expect.objectContaining({ id: 'legacy-invest-other', type: 'invest', category: 'Other' }),
        ]),
        budgetPlan: { items: expect.arrayContaining(categories.map((category) => expect.objectContaining({ name: category }))) },
        monthBudgets: [{ items: expect.arrayContaining(categories.map((category) => expect.objectContaining({ name: category }))) }],
      },
    });
  });

  it('verifies a v9 checksum over the original data before migrating its budget lines', async () => {
    const oldData = makeV9Fixture(mockAppData) as Record<string, unknown>;
    const checksum = await digest(canonicalJson(oldData));
    const envelope = {
      app: 'wealthwise',
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: 9,
      exportedAt: '2026-10-13T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: checksum },
      data: oldData,
    };
    const imported = await parseBackup(JSON.stringify(envelope), migrationOptions);
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.issues?.join('; ') ?? imported.message}`);
    expect(imported.data.budgetPlan?.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Food', sectionId: 'survival' })]),
    );
    const tampered = { ...envelope, data: { ...oldData, settings: { ...mockAppData.settings, name: 'changed' } } };
    await expect(parseBackup(JSON.stringify(tampered), migrationOptions))
      .resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
  });

  it('round trips custom emergency-fund options and refuses schema version twenty', async () => {
    const emergencyGoal = mockAppData.goals.find((goal) => goal.auto === 'ef');
    const linkedHoldingId = emergencyGoal?.links[0]?.instrumentId;
    if (!linkedHoldingId) throw new Error('Expected a linked emergency-fund asset.');
    const data = {
      ...mockAppData,
      efCustomBuckets: [{ id: 'home-safe', name: 'Home safe', access: 'instant' as const, marketLinked: false }],
      efBucketLinks: { 'home-safe': [linkedHoldingId] },
      efAllocation: {
        cash: 0, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15,
        stocks: 0, insurance: 0, other: 0, 'home-safe': 10,
      },
    };
    const raw = await createBackup(data, { exportedAt: '2026-10-13T10:00:00.000Z', digest });
    const imported = await parseBackup(raw, { digest });
    expect(imported).toMatchObject({
      ok: true,
      data: {
        efCustomBuckets: data.efCustomBuckets,
        efBucketLinks: data.efBucketLinks,
        efAllocation: data.efAllocation,
      },
    });
    const future = JSON.parse(raw) as { schemaVersion: number };
    future.schemaVersion = 22;
    await expect(parseBackup(JSON.stringify(future), { digest }))
      .resolves.toMatchObject({ ok: false, reason: 'newer-version' });
  });

  it.each([13, 14])('imports a v%s backup and drops its superseded cover goals', async (schemaVersion) => {
    const data = {
      ...mockAppData,
      coverGoals: [
        { type: 'term-life', targetMode: 'income-multiple', targetValue: 10 },
        { type: 'health', targetMode: 'amount' },
        { type: 'motor', targetMode: 'active-only' },
        { type: 'home', targetMode: 'active-only' },
        { type: 'other', targetMode: 'active-only' },
      ],
    };
    const envelope = {
      app: 'wealthwise',
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion,
      exportedAt: '2026-10-13T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(data)) },
      data,
    };
    const imported = await parseBackup(JSON.stringify(envelope), migrationOptions);
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.issues?.join('; ') ?? imported.message}`);
    expect(imported.data.budgetPlan).toEqual(data.budgetPlan);
    expect(imported.data.monthBudgets).toEqual(data.monthBudgets);
    expect(imported.data).not.toHaveProperty('coverGoals');
  });

  it('imports a v15 backup and separates its legacy combined holding type', async () => {
    const data = {
      ...mockAppData,
      holdings: [
        ...mockAppData.holdings,
        {
          id: 'legacy-unstarted',
          kind: 'manual' as const,
          name: 'Legacy deposit',
          type: 'FD / RD',
          invested: 1_000,
          value: 1_050,
          logs: [],
        },
      ],
    };
    const envelope = {
      app: 'wealthwise',
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: 15,
      exportedAt: '2026-10-13T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(data)) },
      data,
    };
    const imported = await parseBackup(JSON.stringify(envelope), migrationOptions);
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.issues?.join('; ') ?? imported.message}`);
    expect(imported.data.holdings.at(-1)).toMatchObject({
      id: 'legacy-unstarted',
      type: 'Fixed deposit',
      invested: 1_000,
      value: 1_050,
      logs: [],
    });
  });

  it('imports a v16 backup while dropping only the retired insurance-goal fields', async () => {
    const data = {
      ...mockAppData,
      coverGoals: [{ id: 'legacy-cover', name: 'Legacy', kind: 'health', target: { mode: 'none' } }],
      policies: mockAppData.policies.map((policy) => ({ ...policy, coverGoalId: 'legacy-cover' })),
    };
    const envelope = {
      app: 'wealthwise',
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: 16,
      exportedAt: '2026-10-13T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(data)) },
      data,
    };
    const imported = await parseBackup(JSON.stringify(envelope), migrationOptions);
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.issues?.join('; ') ?? imported.message}`);
    expect(imported.data).toEqual(mockAppData);
    expect(imported.data).not.toHaveProperty('coverGoals');
    expect(imported.data.policies.every((policy) => !('coverGoalId' in policy))).toBe(true);
  });

  it('imports a v17 backup and pins its existing premium to the FIFO-matched due date', async () => {
    const policy = mockAppData.policies[0];
    if (!policy) throw new Error('Expected the policy backup fixture.');
    const payment = { id: 'legacy-premium', date: '2026-10-08', amount: 18_000, note: '' };
    const data = {
      ...mockAppData,
      policies: [{ ...policy, payments: [payment] }],
      transactions: [...mockAppData.transactions, {
        id: 'legacy-premium-transaction',
        type: 'expense' as const,
        amount: payment.amount,
        category: 'Insurance',
        note: 'Future Builder premium',
        date: payment.date,
        source: { kind: 'policy-payment' as const, parentId: policy.id, entryId: payment.id },
      }],
    };
    const envelope = {
      app: 'wealthwise',
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: 17,
      exportedAt: '2026-10-13T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(data)) },
      data,
    };
    const imported = await parseBackup(JSON.stringify(envelope), migrationOptions);
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.issues?.join('; ') ?? imported.message}`);
    expect(imported.data.policies[0]?.payments).toEqual([
      { ...payment, dueDate: '2026-01-15' },
    ]);
  });

  it('round-trips an encrypted v20 backup with a settled policy slot and linked investment item', async () => {
    const holding = mockAppData.holdings.find((item) => item.kind === 'manual');
    if (!holding) throw new Error('Expected a manual holding for the linked investment backup.');
    const plan = budgetPlanFromLines(
      [{ category: 'Mutual fund / SIP', value: 1_000 }],
      { incomes: mockAppData.budgetPlan?.incomes ?? [] },
    );
    const item = plan.items[0];
    if (!item) throw new Error('Expected an investment item in the linked backup.');
    const loanData = addLiability(mockAppData, {
      kind: 'recurring',
      type: 'Other',
      name: 'Encrypted closure loan',
      principal: 50_000,
      ratePct: 0,
      tenureMonths: 12,
      emi: 5_000,
      startDate: '2026-01-10',
    }, () => 'encrypted-closure-loan');
    const closedData = closeRecurringLiability(loanData, 'encrypted-closure-loan', {
      date: '2026-10-10',
      amountPaid: 50_000,
      note: 'Encrypted backup closure',
      writeOffConfirmed: false,
    }, {
      today: '2026-10-13',
      newId: (() => {
        let next = 0;
        return () => `closure-record-${++next}`;
      })(),
    });
    const data = {
      ...closedData,
      policies: closedData.policies.map((policy) => ({
        ...policy,
        payments: [{
          id: 'settled-premium',
          date: '2026-11-04',
          amount: 18_000,
          note: '',
          dueDate: '2026-11-07',
        }],
      })),
      budgetPlan: { ...plan, items: [{ ...item, holdingId: holding.id }] },
    };
    const raw = await createBackup(data, { exportedAt: '2026-10-13T10:00:00.000Z', digest });
    expect(JSON.parse(raw)).toMatchObject({ schemaVersion: 21 });
    const passphrase = 'a sufficiently long backup passphrase';
    const encrypted = await encryptBackup(raw, passphrase, {
      salt: Uint8Array.from({ length: 16 }, (_, index) => index),
      nonce: Uint8Array.from({ length: 12 }, (_, index) => index + 16),
      kdf: { name: 'scrypt', params: { N: 2 ** 15, r: 8, p: 1, dkLen: 32 } },
    });

    const decrypted = await decryptBackup(encrypted, passphrase);
    const imported = await parseBackup(decrypted, { digest });
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.issues?.join('; ') ?? imported.message}`);
    expect(imported.data.budgetPlan?.items).toEqual([
      expect.objectContaining({ id: item.id, holdingId: holding.id }),
    ]);
    expect(imported.data.policies[0]?.payments).toEqual([
      expect.objectContaining({ id: 'settled-premium', dueDate: '2026-11-07' }),
    ]);
    expect(imported.data.liabilities.find((liability) => liability.id === 'encrypted-closure-loan'))
      .toMatchObject({
        closure: { date: '2026-10-10', note: 'Encrypted backup closure' },
        settlement: { asOf: '2026-10-10', balance: 0 },
      });
  });

  it('rejects imported closure metadata without a matching zero settlement', () => {
    const loanData = addLiability(mockAppData, {
      kind: 'recurring',
      type: 'Other',
      name: 'Invalid closure loan',
      principal: 50_000,
      ratePct: 0,
      tenureMonths: 12,
      emi: 5_000,
      startDate: '2026-01-10',
    }, () => 'invalid-closure-loan');
    const closedData = closeRecurringLiability(loanData, 'invalid-closure-loan', {
      date: '2026-10-10',
      amountPaid: 50_000,
      writeOffConfirmed: false,
    }, { today: '2026-10-13', newId: (() => {
      let next = 0;
      return () => `invalid-closure-record-${++next}`;
    })() });
    const imported = validateImportData({
      ...closedData,
      liabilities: closedData.liabilities.map((liability) =>
        liability.id === 'invalid-closure-loan' && liability.kind === 'recurring'
          ? { ...liability, settlement: { asOf: '2026-10-10', balance: 1 } }
          : liability),
    });
    expect(imported).toMatchObject({ ok: false, reason: 'invalid-data' });
  });

  it('imports an encrypted legacy v18 backup without changing its holdings', async () => {
    const raw = await createBackup(mockAppData, {
      exportedAt: '2026-10-13T10:00:00.000Z',
      digest,
    });
    const envelope = JSON.parse(raw) as { schemaVersion: number };
    envelope.schemaVersion = 18;
    const passphrase = 'a sufficiently long backup passphrase';
    const encrypted = await encryptBackup(JSON.stringify(envelope), passphrase, {
      salt: Uint8Array.from({ length: 16 }, (_, index) => index),
      nonce: Uint8Array.from({ length: 12 }, (_, index) => index + 16),
      kdf: { name: 'scrypt', params: { N: 2 ** 15, r: 8, p: 1, dkLen: 32 } },
    });
    const importedText = await decryptBackup(encrypted, passphrase);
    const imported = await parseBackup(importedText, {
      digest,
      today: '2026-11-05',
      newId: () => 'unused',
    });
    if (!imported.ok) throw new Error(`${imported.reason}: ${imported.issues?.join('; ') ?? imported.message}`);
    expect(imported.data.holdings).toEqual(mockAppData.holdings);
  });

  it('rejects hand-broken custom bucket links and allocation keys as integrity failures', () => {
    const bucket = { id: 'custom-safe', name: 'Safe reserve', access: 'days' as const, marketLinked: false };
    const brokenLink = validateImportData({
      ...mockAppData,
      efCustomBuckets: [bucket],
      efBucketLinks: { 'custom-safe': ['missing-holding'] },
    });
    expect(brokenLink).toMatchObject({ ok: false, reason: 'integrity' });
    if (!brokenLink.ok) expect(brokenLink.issues.join(' ')).toContain('existing holding');

    const brokenAllocation = validateImportData({
      ...mockAppData,
      efAllocation: { ...SUGGESTED_EF_ALLOCATION, missing: 0 },
    });
    expect(brokenAllocation).toMatchObject({ ok: false, reason: 'integrity' });
    if (!brokenAllocation.ok) expect(brokenAllocation.issues.join(' ')).toContain('unknown option');
  });

  it('validates v6 policy, settlement, due-date and budget import constraints', () => {
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
      { ...mockAppData, policies: [{ ...policy, policyNumber: 'P'.repeat(31) }] },
      { ...mockAppData, policies: [{ ...policy, endDate: policy.startDate }] },
      { ...mockAppData, policies: [{ ...policy, kind: 'term-life' as const, currentValue: 1 }] },
      { ...mockAppData, policies: [{ ...policy, kind: 'ulip' as const, valueAsOf: null }] },
      { ...mockAppData, budget: { plannedIncome: null, lines: [
        { category: 'Food', planned: 1 }, { category: 'Food', planned: 2 },
      ] } },
    ];
    for (const invalid of invalidDatas) {
      expect(validateImportData(invalid).ok).toBe(false);
    }
    expect(validateImportData({
      ...mockAppData,
      budget: { plannedIncome: null, lines: [{ category: 'Domestic help', planned: 1 }] },
    }).ok).toBe(true);
    expect(validateImportData(null)).toMatchObject({ ok: false, reason: 'invalid-data' });
    expect(canonicalJson({ z: 1, m: 2, a: 3 })).toBe('{"a":3,"m":2,"z":1}');
    expect(canonicalJson(undefined)).toBe('null');
  });

  it('validates a budget plan and month snapshots on backup import', () => {
    const budgetData = {
      ...mockAppData,
      budgetPlan: budgetPlanFromLines([{ category: 'Food', mode: 'percent', value: 25, dueDay: 31 }], {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 10_000 }],
      }),
      monthBudgets: [monthBudgetFromLines('2026-10', [{ category: 'Food', planned: 2_500, dueDay: 31 }], {
        source: 'plan',
        incomes: [{ id: 'income', name: 'Income', category: 'Salary', amount: 10_000 }],
        linkedIncluded: true,
      })],
    };
    expect(validateImportData(budgetData)).toMatchObject({ ok: true });

    const invalidData = [
      {
        ...budgetData,
        budgetPlan: { ...budgetData.budgetPlan, items: [{ ...budgetData.budgetPlan.items[0]!, value: 101 }] },
      },
      {
        ...budgetData,
        budgetPlan: { ...budgetData.budgetPlan, items: [{ ...budgetData.budgetPlan.items[0]!, mode: 'amount', value: 1, dueDay: 0 }] },
      },
      {
        ...budgetData,
        budgetPlan: { ...budgetData.budgetPlan, items: [{ ...budgetData.budgetPlan.items[0]!, sectionId: 'missing-section' }] },
      },
      {
        ...budgetData,
        budgetPlan: { ...budgetData.budgetPlan, items: [{ ...budgetData.budgetPlan.items[0]!, sectionId: 'wants' }] },
      },
      {
        ...budgetData,
        budgetPlan: { ...budgetData.budgetPlan, items: [
          ...budgetData.budgetPlan.items,
          { ...budgetData.budgetPlan.items[0]!, id: 'duplicate-id' },
        ] },
      },
      {
        ...budgetData,
        monthBudgets: [{ ...budgetData.monthBudgets[0]!, items: [{ ...budgetData.monthBudgets[0]!.items[0]!, sectionId: 'missing-section' }] }],
      },
      {
        ...budgetData,
        monthBudgets: [{ ...budgetData.monthBudgets[0]!, items: [{ ...budgetData.monthBudgets[0]!.items[0]!, dueDay: 32 }] }],
      },
      {
        ...budgetData,
        monthBudgets: [{ ...budgetData.monthBudgets[0]!, items: [
          ...budgetData.monthBudgets[0]!.items,
          { ...budgetData.monthBudgets[0]!.items[0]!, id: 'duplicate-id' },
        ] }],
      },
    ];
    for (const invalid of invalidData) expect(validateImportData(invalid)).toMatchObject({ ok: false, reason: 'invalid-data' });
  });

  it('reports malformed and untrusted files with distinct reasons', async () => {
    await expect(parseBackup('{', { digest })).resolves.toMatchObject({ ok: false, reason: 'not-json' });
    await expect(parseBackup('{"app":"elsewhere"}', { digest })).resolves.toMatchObject({ ok: false, reason: 'not-a-backup' });
    const raw = await createBackup(mockAppData, { exportedAt: '2026-10-10T10:00:00.000Z', digest });
    const tampered = raw.replace('"amount": 47000', '"amount": 47001');
    await expect(parseBackup(tampered, { digest })).resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
    const newer = JSON.parse(raw) as Record<string, unknown>;
    newer.schemaVersion = 22;
    await expect(parseBackup(JSON.stringify(newer), { digest })).resolves.toMatchObject({ ok: false, reason: 'newer-version' });
    const futureFormat = await reChecksum(raw, (envelope) => { envelope.formatVersion = BACKUP_FORMAT_VERSION + 1; });
    await expect(parseBackup(futureFormat, { digest })).resolves.toMatchObject({ ok: false, reason: 'newer-version' });
    await expect(parseBackup('x'.repeat(MAX_BACKUP_CHARS + 1), { digest }))
      .resolves.toMatchObject({ ok: false, reason: 'too-large' });
    const oldSchema = await reChecksum(raw, (envelope) => { envelope.schemaVersion = 0; });
    await expect(parseBackup(oldSchema, { digest })).resolves.toMatchObject({ ok: false, reason: 'unsupported-version' });
    const oldFormat = await reChecksum(raw, (envelope) => { envelope.formatVersion = 0; });
    await expect(parseBackup(oldFormat, { digest })).resolves.toMatchObject({ ok: false, reason: 'unsupported-version' });
    const invalidMigrated = {
      app: 'wealthwise',
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: 1,
      exportedAt: '2026-10-10T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(null)) },
      data: null,
    };
    await expect(parseBackup(JSON.stringify(invalidMigrated), { digest }))
      .resolves.toMatchObject({ ok: false, reason: 'unsupported-version' });
    await expect(parseBackup(raw.replace('2026-10-10T10:00:00.000Z', '2026-10-10T10:00:00.000+01:00'), { digest }))
      .resolves.toMatchObject({ ok: false, reason: 'not-a-backup' });
    expect(() => backupFileName('not a date')).toThrow('Invalid export date');
  });

  it('verifies a v1 data checksum before migration and imports the v7 result', async () => {
    const data = makeV1Fixture();
    const envelope = {
      app: 'wealthwise',
      formatVersion: 1,
      schemaVersion: 1,
      exportedAt: '2026-10-10T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(data)) },
      data,
    };
    const result = await parseBackup(JSON.stringify(envelope), migrationOptions);
    expect(result).toMatchObject({
      ok: true,
      data: { settings: { monthlySalary: null, onboarded: true }, liabilities: [{ kind: 'recurring', type: 'Other' }] },
    });

    const corrupted = { ...envelope, checksum: { ...envelope.checksum, value: 'wrong' } };
    await expect(parseBackup(JSON.stringify(corrupted), migrationOptions))
      .resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
  });

  it('verifies v2 data as written before migrating and validates the v7 result', async () => {
    const data = makeV2Fixture();
    const envelope = {
      app: 'wealthwise',
      formatVersion: 1,
      schemaVersion: 2,
      exportedAt: '2026-10-10T10:00:00.000Z',
      checksum: { algorithm: 'sha256', value: await digest(canonicalJson(data)) },
      data,
    };
    const result = await parseBackup(JSON.stringify(envelope), migrationOptions);
    expect(result).toMatchObject({
      ok: true,
      data: {
        settings: { monthlySalary: null, onboarded: true },
        liabilities: [{ kind: 'recurring', type: 'Other' }],
      },
    });

    if (result.ok) {
      expect(result.data.settings.theme).toBe(data.settings.theme);
      expect(result.data.transactions).toHaveLength(data.transactions.length);
      expect(result.data.transactions[0]).toEqual(data.transactions[0]);
      expect(result.data.transactions.at(-1)).toMatchObject({
        id: 'legacy-ef-tx',
        type: 'invest',
        category: 'Other investments',
      });
      expect(result.data.transactions.at(-1)).not.toHaveProperty('source');
    }
    const corrupted = { ...envelope, checksum: { ...envelope.checksum, value: 'wrong' } };
    await expect(parseBackup(JSON.stringify(corrupted), migrationOptions))
      .resolves.toMatchObject({ ok: false, reason: 'checksum-mismatch' });
  });

  it.each([
    [3, makeV3Fixture],
    [4, makeV4Fixture],
    [5, makeV5Fixture],
    [6, makeV6Fixture],
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
    const result = await parseBackup(JSON.stringify(envelope), migrationOptions);
    expect(result).toMatchObject({
      ok: true,
      data: {
        policies: [],
        budget: null,
        goals: expect.arrayContaining([expect.objectContaining({ auto: 'ef', links: expect.any(Array) })]),
      },
    });
    if (!result.ok) throw new Error('Expected old backup to import.');
    expect(result.data.transactions).toHaveLength(data.transactions.length);
    expect(result.data.liabilities[0]).toMatchObject({ settlement: null });

    const alteredChecksum = { ...envelope, checksum: { ...envelope.checksum, value: 'incorrect' } };
    await expect(parseBackup(JSON.stringify(alteredChecksum), migrationOptions))
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
    });
    expect(noFinancialHistory).toMatchObject({ ok: true });
    if (noFinancialHistory.ok) expect(noFinancialHistory.data.goals[0]?.year).toBe(2002);
    expect(summarizeData({ ...mockAppData, transactions: [] })).toMatchObject({
      firstDate: null, lastDate: null,
    });
    expect(BACKUP_FORMAT_VERSION).toBe(1);
  });
});
