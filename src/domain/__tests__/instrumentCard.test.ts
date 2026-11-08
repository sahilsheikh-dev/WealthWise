import { buildInstrumentCardModel } from '../instrumentCard';
import { listInstruments } from '../instruments';
import { buildPortfolioRows } from '../portfolio';
import type { AppData } from '../types';
import { mockAppData } from '../../mock/data';

const context = {
  asOf: '2026-10-10',
  totalAssets: 500_000,
};

function rowFor(data: AppData, id: string) {
  const row = buildPortfolioRows(data, context.asOf).find((item) => item.id === id);
  if (!row) throw new Error(`Fixture row "${id}" missing.`);
  return row;
}

function textContent(segments: ({ text: string } | { amount: number })[]) {
  return segments.map((segment) =>
    'text' in segment ? segment.text : `amount:${segment.amount}`,
  ).join('');
}

describe('buildInstrumentCardModel', () => {
  it('uses only real holdings as investment instruments', () => {
    expect(listInstruments(mockAppData, context.asOf).map(({ id }) => id))
      .toEqual(mockAppData.holdings.map(({ id }) => id));
  });

  it('includes stale-value confirmation and exact manual actions', () => {
    const data = {
      ...mockAppData,
      holdings: mockAppData.holdings.map((holding) => holding.id === 'holding-fd'
        ? { ...holding, valueAsOf: '2026-01-01' }
        : holding),
    };
    const model = buildInstrumentCardModel(rowFor(data, 'holding-fd'), context);
    expect(model.valueCaption).toContain('Value not updated in');
    expect(model.statuses).toContainEqual({ label: 'Stale value', tone: 'neutral' });
    expect(model.headerAction.id).toBe('edit');
    expect(model.actions.map(({ id }) => id)).toEqual(['deposit', 'withdraw', 'entries', 'confirm']);
  });

  it('uses fresh manual value dates without stale actions', () => {
    const data = {
      ...mockAppData,
      holdings: mockAppData.holdings.map((holding) => holding.id === 'holding-fd'
        ? { ...holding, valueAsOf: '2026-10-01' }
        : holding),
    };
    const model = buildInstrumentCardModel(rowFor(data, 'holding-fd'), context);
    expect(model.valueCaption).toBe('Updated 1 Oct 2026');
    expect(model.statuses).toEqual([]);
    expect(model.actions.map(({ id }) => id)).toEqual(['deposit', 'withdraw', 'entries']);
  });

  it('shows unknown value dates and disables withdrawal for a zero-value manual holding', () => {
    const data = {
      ...mockAppData,
      holdings: mockAppData.holdings.map((holding) => holding.id === 'holding-pf'
        ? { ...holding, value: 0, invested: 0, valueAsOf: undefined }
        : holding),
    };
    const model = buildInstrumentCardModel(rowFor(data, 'holding-pf'), context);
    expect(model.valueCaption).toBe('Value date unknown');
    expect(model.actions.find(({ id }) => id === 'withdraw')).toMatchObject({ disabled: true });
  });

  it('shows next due and schedule actions for a plan, with overdue and completed states', () => {
    const overdueData = {
      ...mockAppData,
      holdings: mockAppData.holdings.map((holding) => holding.id === 'holding-sip'
        ? { ...holding, trackFrom: '2026-01-01', logs: [] }
        : holding),
    };
    const overdueRow = rowFor(overdueData, 'holding-sip');
    const overdue = buildInstrumentCardModel(overdueRow, { ...context, asOf: '2026-06-15' });
    expect(overdue.nextLine).toBeDefined();
    expect(textContent(overdue.nextLine ?? [])).toMatch(/^Next:/);
    expect(overdue.nextLine?.some((segment) => 'amount' in segment)).toBe(true);
    expect(overdue.behindLine).toMatch(/\d+ behind/);
    expect(overdue.statuses.some(({ label }) => label.includes('overdue'))).toBe(true);
    expect(overdue.headerAction.id).toBe('edit');
    expect(overdue.actions.map(({ id }) => id)).toEqual(['deposit', 'withdraw', 'schedule']);

    const completedData = {
      ...mockAppData,
      holdings: mockAppData.holdings.map((holding) => holding.id === 'holding-sip'
        ? {
          ...holding,
          tenureYears: 1,
          startDate: '2020-01-01',
          trackFrom: '2020-01-01',
          logs: Array.from({ length: 12 }, (_, index) => ({
            id: `completed-${index}`,
            date: `2020-${String(index + 1).padStart(2, '0')}-01`,
            amount: holding.kind === 'plan' ? holding.amount : 0,
            note: '',
            kind: 'Deposit' as const,
          })),
        }
        : holding),
    };
    const completed = buildInstrumentCardModel(rowFor(completedData, 'holding-sip'), { ...context, asOf: '2026-10-10' });
    expect(completed.statuses).toContainEqual({ label: 'Completed', tone: 'ok' });
    expect(completed.nextLine).toBeUndefined();
  });

  it('supports estimated plan values and rejects rows without their holding', () => {
    const data = {
      ...mockAppData,
      holdings: mockAppData.holdings.map((holding) => holding.id === 'holding-sip'
        ? { ...holding, actualValue: null, actualValueDate: null }
        : holding),
    };
    expect(buildInstrumentCardModel(rowFor(data, 'holding-sip'), context).valueCaption).toBe('Estimated value');
    expect(() => buildInstrumentCardModel({
      id: 'missing', kind: 'manual', name: 'Missing', type: 'Other',
      invested: 0, value: 0, gain: 0, gainPct: null,
    }, context)).toThrow('missing its holding');
  });

  it('covers untracked plan snapshots and negative manual holdings without an asset total', () => {
    const planData = {
      ...mockAppData,
      holdings: mockAppData.holdings.map((holding) => holding.id === 'holding-sip'
        ? { ...holding, actualValue: 12_000, actualValueDate: '2026-10-01' }
        : holding),
    };
    const planRow = rowFor(planData, 'holding-sip');
    const plan = buildInstrumentCardModel({ ...planRow, value: 0 }, { ...context, totalAssets: 0 });
    expect(plan.valueCaption).toBe('Actual value as of 1 Oct 2026');
    expect(plan.actions.find(({ id }) => id === 'withdraw'))
      .toMatchObject({ disabled: true, accessibilityHint: 'Nothing to withdraw' });

    const lossData = {
      ...mockAppData,
      holdings: mockAppData.holdings.map((holding) => holding.id === 'holding-cash'
        ? { ...holding, invested: 1_000, value: 500, valueAsOf: '2026-10-01',
          logs: [{ id: 'loss-deposit', date: '2025-10-01', amount: 1_000, note: '', kind: 'Deposit' as const }] }
        : holding),
    };
    const loss = buildInstrumentCardModel(
      rowFor(lossData, 'holding-cash'),
      { ...context, totalAssets: 0 },
    );
    expect(loss.progressPct).toBe(0);
    expect(loss.description[0]).toEqual({ text: 'Loss ' });
  });

});
