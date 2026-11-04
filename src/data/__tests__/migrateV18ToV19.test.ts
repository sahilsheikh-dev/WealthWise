import { makeV1Fixture } from '../testFixtures/v1';
import { makeV9Fixture } from '../testFixtures/v9';
import { makeV10Fixture } from '../testFixtures/v10';
import { makeV11Fixture } from '../testFixtures/v11';
import { makeV12Fixture } from '../testFixtures/v12';
import { migratePersisted, migrateV18ToV19 } from '../migrate';
import { mockAppData } from '../../mock/data';
import { buildDemoData } from '../../mock/demoData';
import { ledgerValue } from '../../domain/holdingLedger';
import { holdingValue } from '../../domain/portfolio';
import { netWorth } from '../../domain/summary';
import { appDataSchema } from '../../domain/schemas';
import type { AppData, LedgerHolding } from '../../domain/types';

const today = '2026-11-04';

function migrationOptions() {
  let nextId = 0;
  return { today, newId: () => `migration-entry-${nextId++}` };
}

function migratedHoldings(data: AppData): LedgerHolding[] {
  const result = migrateV18ToV19(data, migrationOptions());
  if (typeof result !== 'object' || result === null || !('holdings' in result)) {
    throw new Error('Migration did not return holdings.');
  }
  return result.holdings as LedgerHolding[];
}

function expectValuesPreserved(data: AppData) {
  const beforeValues = data.holdings.map((holding) => holdingValue(holding, today));
  const afterHoldings = migratedHoldings(data);
  const afterValues = afterHoldings.map((holding) => ledgerValue(holding, today));
  expect(afterValues).toEqual(beforeValues);

  const before = netWorth(data, today);
  const afterAssets = afterValues.reduce((sum, value) => sum + value, 0);
  expect(afterAssets - before.liabilities).toBe(before.netWorth);
}

describe('v18 to v19 holding ledger migration', () => {
  it('preserves values and net worth for mock and demo holdings', () => {
    expectValuesPreserved(mockAppData);
    expectValuesPreserved(buildDemoData(today));
  });

  it('preserves values across every available older-version fixture', () => {
    const options = migrationOptions();
    const fixtures: [number, unknown][] = [
      [1, makeV1Fixture()],
      [9, makeV9Fixture()],
      [10, makeV10Fixture()],
      [11, makeV11Fixture()],
      [12, makeV12Fixture()],
    ];

    for (const [version, fixture] of fixtures) {
      const current = appDataSchema.parse(migratePersisted(fixture, version, options));
      expectValuesPreserved(current);
    }
  });

  it('maps plan log matches to exact recurring slot dates', () => {
    const current = appDataSchema.parse(
      migratePersisted(makeV1Fixture(), 1, migrationOptions()),
    );
    const plan = migratedHoldings(current).find((holding) => holding.id === 'legacy-plan');

    expect(plan?.entries.find((entry) => entry.id === 'legacy-log')?.slotDate).toBe('2026-08-01');
  });

  it('creates an opening deposit and a value adjustment for manual holdings', () => {
    const current = appDataSchema.parse(
      migratePersisted(makeV1Fixture(), 1, migrationOptions()),
    );
    const oldHolding = current.holdings.find((item) => item.id === 'legacy-manual');
    const holding = migratedHoldings(current).find((item) => item.id === 'legacy-manual');
    if (!oldHolding) throw new Error('Legacy manual fixture is missing.');

    expect(holding?.entries[0]).toMatchObject({
      date: today,
      kind: 'deposit',
      amount: 900,
      note: 'Opening',
    });
    expect(holding?.entries.at(-1)).toMatchObject({
      kind: 'valueUpdate',
      amount: holdingValue(oldHolding, today) - 900,
    });
  });
});
