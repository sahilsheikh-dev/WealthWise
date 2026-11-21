import { emptyAppData } from '../actions';
import { updateHoldingPrice, updateHoldingValue, valueStaleness } from '../holdingActions';
import { holdingValue } from '../portfolio';
import { goalSavedFor } from '../goalLinks';
import { netWorth } from '../summary';
import { appDataSchema } from '../schemas';
import { planValue } from '../sip';
import { migratePersisted } from '../../data/migrate';
import { makeV1Fixture, makeV2Fixture, makeV3Fixture, makeV4Fixture, makeV5Fixture, makeV6Fixture } from '../../data/testFixtures/v1';
import { makeV9Fixture } from '../../data/testFixtures/v9';
import { makeV10Fixture } from '../../data/testFixtures/v10';
import { makeV11Fixture } from '../../data/testFixtures/v11';
import { makeV12Fixture } from '../../data/testFixtures/v12';
import { buildDemoData } from '../../mock/demoData';
import { mockAppData } from '../../mock/data';
import type { Holding, InvestmentEntry, ISODate, ManualHolding, PlanHolding } from '../types';
import { configuredHoldingValue, suggestedValuationMethod } from '../valuation';

function manual(overrides: Partial<ManualHolding> = {}): ManualHolding {
  return {
    id: 'holding',
    kind: 'manual',
    name: 'Holding',
    type: 'Fixed deposit',
    invested: 100_000,
    value: 100_000,
    valueAsOf: '2025-01-01',
    logs: [],
    ...overrides,
  };
}

function entry(id: string, date: string, amount: number, price: number): InvestmentEntry {
  return { id, date, kind: 'Deposit', amount, price, note: '' };
}

function independentQuarterly(amount: number, ratePct: number, days: number): number {
  const years = days / 365;
  return amount * (1 + ratePct / 400) ** (4 * years);
}

function legacyHoldingValue(holding: Holding, asOf: ISODate): number {
  if (holding.kind === 'plan') return planValue(holding, asOf);
  const snapshotDate = holding.valueAsOf;
  const baseValue = snapshotDate ? holding.value : holding.invested;
  const applicableEntries = holding.logs
    .filter((item) => item.date <= asOf && (!snapshotDate || item.date > snapshotDate))
    .reduce((total, item) => total + (item.kind === 'Deposit' ? item.amount : -item.amount), 0);
  return Math.max(0, baseValue + applicableEntries);
}

describe('configured holding valuation', () => {
  it('suggests the method for every holding type without changing legacy values', () => {
    expect(suggestedValuationMethod('Cash', false)).toBe('balance');
    expect(suggestedValuationMethod('Savings account', false)).toBe('balanceInterest');
    expect(suggestedValuationMethod('Fixed deposit', false)).toBe('manual');
    expect(suggestedValuationMethod('Fixed deposit', false, 0)).toBe('accrual');
    expect(suggestedValuationMethod('Recurring deposit', false)).toBe('manual');
    expect(suggestedValuationMethod('EPFO / PF', false, 8)).toBe('accrual');
    expect(suggestedValuationMethod('Other', true)).toBe('manual');
    for (const type of ['Mutual fund / SIP', 'Stocks / ETF', 'Gold', 'Silver'] as const) {
      expect(suggestedValuationMethod(type, false)).toBe('manual');
      expect(suggestedValuationMethod(type, true)).toBe('unitsPrice');
    }

    const holding = manual({ valuationMethod: undefined });
    for (const method of [undefined, 'balance', 'balanceInterest', 'manual'] as const) {
      expect(configuredHoldingValue({ ...holding, valuationMethod: method }, '2025-02-01', 123))
        .toBe(123);
    }
  });

  it('preserves legacy values until a valuation method is configured', () => {
    const legacy = manual({ value: 101_000, valueAsOf: '2025-01-01', logs: [
      { id: 'entry', date: '2025-02-01', amount: 3_000, kind: 'Deposit', note: '' },
    ] });
    expect(holdingValue(legacy, '2025-03-01')).toBe(104_000);
    expect(suggestedValuationMethod('Recurring deposit', false, 6.5)).toBe('accrual');
    expect(suggestedValuationMethod('Mutual fund / SIP', false)).toBe('manual');
    expect(suggestedValuationMethod('Mutual fund / SIP', true)).toBe('unitsPrice');
  });

  it('matches an independent actual-days/365 quarterly accrual oracle', () => {
    const fd = manual({
      valuationMethod: 'accrual',
      ratePct: 7,
      compounding: 'quarterly',
      valueAsOf: '2025-01-01',
    });

    const afterEightMonths = holdingValue(fd, '2025-09-01');
    const expectedEightMonths = independentQuarterly(100_000, 7, 243);
    expect(Math.abs(afterEightMonths - expectedEightMonths)).toBeLessThan(0.01);
    expect(Math.abs(afterEightMonths - 104_735)).toBeLessThan(10);
    expect(holdingValue(fd, '2026-01-01')).toBeCloseTo(
      independentQuarterly(100_000, 7, 365),
      2,
    );
    expect(holdingValue({ ...fd, maturityDate: '2025-09-01' }, '2026-01-01'))
      .toBeCloseTo(afterEightMonths, 2);
  });

  it('uses legacy values for incomplete or future snapshots and accrues dated plan openings', () => {
    const legacy = manual({ valuationMethod: 'accrual', ratePct: undefined });
    expect(holdingValue(legacy, '2025-02-01')).toBe(100_000);

    const futureSnapshot = manual({
      valuationMethod: 'accrual', ratePct: 7, valueAsOf: '2025-03-01',
    });
    expect(holdingValue(futureSnapshot, '2025-02-01')).toBe(100_000);

    const noSnapshot = manual({
      valuationMethod: 'accrual', ratePct: 7, valueAsOf: undefined, compounding: 'simple',
    });
    expect(holdingValue(noSnapshot, '2025-01-01')).toBe(100_000);
    expect(holdingValue(noSnapshot, '2026-01-01')).toBe(100_000);

    const plan: PlanHolding = {
      id: 'plan-opening', kind: 'plan', name: 'Plan', type: 'Recurring deposit',
      frequency: 'monthly', amount: 1_000, ratePct: 7, stepUpPct: 0, tenureYears: 1,
      startDate: '2025-01-01', trackFrom: '2025-01-01', opening: 10_000,
      actualValue: null, actualValueDate: null, valuationMethod: 'accrual', compounding: 'simple',
      logs: [
        { id: 'past', date: '2025-01-02', amount: 1_000, kind: 'Deposit', note: '' },
        { id: 'future', date: '2025-02-02', amount: 1_000, kind: 'Deposit', note: '' },
      ],
    };
    expect(holdingValue(plan, '2025-01-02')).toBeCloseTo(11_001.92, 2);
  });

  it('keeps post-maturity snapshots and applies later entries without more accrual', () => {
    const fd = manual({
      valuationMethod: 'accrual',
      ratePct: 7,
      compounding: 'quarterly',
      maturityDate: '2025-12-31',
      value: 110_000,
      valueAsOf: '2026-01-01',
      logs: [
        { id: 'later-deposit', date: '2026-02-01', amount: 5_000, kind: 'Deposit', note: '' },
        { id: 'later-withdrawal', date: '2026-03-01', amount: 2_000, kind: 'Withdrawal', note: '' },
      ],
    });
    expect(holdingValue(fd, '2026-06-01')).toBe(113_000);
  });

  it('accrues each recurring deposit independently using the selected convention', () => {
    const rd: PlanHolding = {
      id: 'rd', kind: 'plan', name: 'RD', type: 'Recurring deposit',
      frequency: 'monthly', amount: 5_000, ratePct: 6.5, stepUpPct: 0, tenureYears: 1,
      startDate: '2025-01-02', trackFrom: '2025-01-02', opening: 0,
      actualValue: null, actualValueDate: null, valuationMethod: 'accrual', compounding: 'quarterly',
      logs: Array.from({ length: 12 }, (_, index) => ({
        id: `rd-${index}`, date: `2025-${String(index + 1).padStart(2, '0')}-02`,
        amount: 5_000, kind: 'Deposit' as const, note: '',
      })),
    };
    const expected = rd.logs.reduce((sum, item) => {
      const days = (Date.parse('2026-01-01T00:00:00Z') - Date.parse(`${item.date}T00:00:00Z`)) / 86_400_000;
      return sum + independentQuarterly(item.amount, 6.5, days);
    }, 0);
    expect(Math.abs(holdingValue(rd, '2026-01-01') - expected)).toBeLessThan(0.01);
    expect(Math.abs(holdingValue(rd, '2026-01-01') - 62_140)).toBeLessThan(10);
  });

  it('values priced SIP and gold deposits using units and the latest hand-entered price', () => {
    const sip = manual({
      type: 'Mutual fund / SIP', invested: 0, value: 0,
      valuationMethod: 'unitsPrice', latestPrice: 53.2, priceAsOf: '2025-04-01',
      logs: [
        entry('sip-1', '2025-01-01', 5_000, 50),
        entry('sip-2', '2025-02-01', 5_000, 52.5),
        entry('sip-3', '2025-03-01', 5_000, 51),
      ],
    });

    const units = 5_000 / 50 + 5_000 / 52.5 + 5_000 / 51;
    expect(units).toBeCloseTo(293.28, 2);
    expect(holdingValue(sip, '2025-04-01')).toBeCloseTo(15_602, 0);
    const gold = manual({
      type: 'Gold', invested: 0, value: 0,
      valuationMethod: 'unitsPrice', latestPrice: 7_200, priceAsOf: '2025-02-01',
      logs: [entry('gold-buy', '2025-01-01', 60_000, 6_000)],
    });
    expect(holdingValue(gold, '2025-02-01')).toBe(72_000);
  });

  it('falls back until a usable hand-entered price date and clamps negative units', () => {
    const unpriced = manual({
      valuationMethod: 'unitsPrice', latestPrice: undefined, priceAsOf: '2025-01-01',
    });
    expect(holdingValue(unpriced, '2025-02-01')).toBe(100_000);

    const undated = manual({
      valuationMethod: 'unitsPrice', latestPrice: 12, priceAsOf: undefined,
    });
    expect(holdingValue(undated, '2025-02-01')).toBe(100_000);

    const futurePrice = manual({
      valuationMethod: 'unitsPrice', latestPrice: 12, priceAsOf: '2025-03-01',
    });
    expect(holdingValue(futurePrice, '2025-02-01')).toBe(100_000);

    const openingAtCurrentPrice = manual({
      invested: 1_000, value: 900, valuationMethod: 'unitsPrice',
      latestPrice: 12, priceAsOf: '2025-02-01',
      logs: [
        entry('later', '2025-03-01', 500, 10),
        { id: 'exit', date: '2025-02-01', amount: 2_000, kind: 'Withdrawal', note: '' },
      ],
    });
    expect(holdingValue(openingAtCurrentPrice, '2025-02-01')).toBe(0);
  });

  it('reduces priced units at a withdrawal entry price and resets accrual after confirmation', () => {
    const priced = manual({
      invested: 0, value: 0, valuationMethod: 'unitsPrice',
      latestPrice: 12, priceAsOf: '2025-02-01',
      logs: [
        entry('buy', '2025-01-01', 1_000, 10),
        { id: 'sell', date: '2025-02-01', amount: 250, price: 12, kind: 'Withdrawal', note: '' },
      ],
    });

    expect(holdingValue(priced, '2025-02-01')).toBeCloseTo((100 - 250 / 12) * 12, 8);

    const confirmed = updateHoldingValue({
      ...emptyAppData('2025-01-01'),
      holdings: [manual({ valuationMethod: 'accrual', ratePct: 7, compounding: 'quarterly' })],
    }, 'holding', 105_000, '2025-09-01', 'accrual');
    const saved = confirmed.holdings[0];
    if (!saved || saved.kind !== 'manual') throw new Error('Expected the manual holding');
    expect(holdingValue(saved, '2026-09-01')).toBeCloseTo(
      independentQuarterly(105_000, 7, 365),
      2,
    );
  });

  it('updates plan snapshots and prices immutably, and rejects unknown holding ids', () => {
    const plan: PlanHolding = {
      id: 'value-plan', kind: 'plan', name: 'Plan', type: 'Mutual fund / SIP',
      frequency: 'monthly', amount: 1_000, ratePct: 0, stepUpPct: 0, tenureYears: 1,
      startDate: '2025-01-01', trackFrom: '2025-01-01', opening: 0,
      actualValue: null, actualValueDate: null, logs: [],
    };
    const otherHolding = manual({ id: 'value-manual' });
    const data = { ...emptyAppData('2025-01-01'), holdings: [plan, otherHolding] };
    const valued = updateHoldingValue(data, plan.id, 12_000, '2025-02-01');
    expect(valued.holdings[0]).toMatchObject({
      kind: 'plan', actualValue: 12_000, actualValueDate: '2025-02-01', valuationMethod: 'manual',
    });
    expect(valued.holdings[1]).toEqual(otherHolding);
    expect(data.holdings).toEqual([plan, otherHolding]);
    const priced = updateHoldingPrice(data, plan.id, 53.2, '2025-03-01');
    expect(priced.holdings[0]).toMatchObject({
      latestPrice: 53.2, priceAsOf: '2025-03-01', valuationMethod: 'unitsPrice',
    });
    expect(priced.holdings[1]).toEqual(otherHolding);
    expect(() => updateHoldingValue(data, 'missing', 1, '2025-01-01')).toThrow();
    expect(() => updateHoldingPrice(data, 'missing', 1, '2025-01-01')).toThrow();
  });

  it('flags manual and unit prices after 91 days', () => {
    expect(valueStaleness('2025-01-01', '2025-04-02').days).toBe(91);
    expect(valueStaleness('2025-01-01', '2025-04-02').stale).toBe(true);
  });

  it('preserves asset, net-worth, goal and emergency-bucket values for demo, mock and old fixtures', () => {
    const asOf = '2026-11-05';
    const fixtures: { label: string; version: number; data: unknown }[] = [
      { label: 'mock', version: 19, data: mockAppData },
      { label: 'demo', version: 19, data: buildDemoData(asOf) },
      { label: 'v1', version: 1, data: makeV1Fixture() },
      { label: 'v2', version: 2, data: makeV2Fixture() },
      { label: 'v3', version: 3, data: makeV3Fixture() },
      { label: 'v4', version: 4, data: makeV4Fixture() },
      { label: 'v5', version: 5, data: makeV5Fixture() },
      { label: 'v6', version: 6, data: makeV6Fixture() },
      { label: 'v9', version: 9, data: makeV9Fixture(mockAppData) },
      { label: 'v10', version: 10, data: makeV10Fixture() },
      { label: 'v11', version: 11, data: makeV11Fixture() },
      { label: 'v12', version: 12, data: makeV12Fixture() },
    ];
    let migrationId = 0;

    for (const fixture of fixtures) {
      const migrated = fixture.version === 19
        ? fixture.data
        : migratePersisted(fixture.data, fixture.version, {
          today: asOf,
          newId: () => `valuation-migration-${fixture.label}-${++migrationId}`,
        });
      const data = appDataSchema.parse(migrated);
      const beforeValues = new Map(data.holdings.map((holding) => [
        holding.id,
        legacyHoldingValue(holding, asOf),
      ]));
      const afterValues = new Map(data.holdings.map((holding) => [
        holding.id,
        holdingValue(holding, asOf),
      ]));
      const beforeAssets = [...beforeValues.values()].reduce((sum, value) => sum + value, 0);
      const afterAssets = [...afterValues.values()].reduce((sum, value) => sum + value, 0);
      const beforeNetWorth = beforeAssets - netWorth(data, asOf).liabilities;
      const afterNetWorth = netWorth(data, asOf).netWorth;
      const beforeGoals = data.goals.map((goal) => ({
        id: goal.id,
        saved: goal.links.length === 0
          ? goal.auto === 'ef' ? 0 : goal.saved
          : goal.links.reduce((saved, link) => {
            const value = beforeValues.get(link.instrumentId);
            if (value !== undefined) return saved + value;
            const policy = data.policies.find((item) => item.id === link.instrumentId);
            return saved + (policy?.kind === 'life-savings' || policy?.kind === 'ulip'
              ? policy.currentValue ?? 0
              : 0);
          }, 0),
      }));
      const afterGoals = data.goals.map((goal) => ({
        id: goal.id,
        saved: goalSavedFor(goal, data, asOf),
      }));
      const emergencyGoal = data.goals.find((goal) => goal.auto === 'ef');
      const emergencyIds = new Set(emergencyGoal?.links.map((link) => link.instrumentId) ?? []);
      const beforeEmergencyAvailable = Object.fromEntries(Object.entries(data.efBucketLinks).map(([bucketId, holdingIds]) => [
        bucketId,
        holdingIds.reduce((sum, id) => sum + (emergencyIds.has(id) ? beforeValues.get(id) ?? 0 : 0), 0),
      ]));
      const afterEmergencyAvailable = Object.fromEntries(Object.entries(data.efBucketLinks).map(([bucketId, holdingIds]) => [
        bucketId,
        holdingIds.reduce((sum, id) => {
          const holding = data.holdings.find((item) => item.id === id);
          return sum + (emergencyIds.has(id) && holding ? holdingValue(holding, asOf) : 0);
        }, 0),
      ]));

      expect(data.holdings.every((holding) => holding.valuationMethod === undefined)).toBe(true);
      expect(afterValues).toEqual(beforeValues);
      expect(afterAssets).toBe(beforeAssets);
      expect(afterNetWorth).toBe(beforeNetWorth);
      expect(afterGoals).toEqual(beforeGoals);
      expect(afterEmergencyAvailable).toEqual(beforeEmergencyAvailable);
    }
  });
});
