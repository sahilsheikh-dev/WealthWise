import { buildInstrumentCardModel } from '../instrumentCard';
import { buildPortfolioRows } from '../portfolio';
import type { AppData } from '../types';
import { mockAppData } from '../../mock/data';

const context = {
  asOf: '2026-10-10',
  totalAssets: 500_000,
  monthlyExpenseBaseline: 25_000,
  emergencyEntryCount: mockAppData.efEntries.length,
};

function rowFor(data: AppData, id: string) {
  const row = buildPortfolioRows(data, context.asOf).find((item) => item.id === id);
  if (!row) throw new Error(`Fixture row "${id}" missing.`);
  return row;
}

describe('buildInstrumentCardModel', () => {
  it('builds an emergency fund model with percentage, coverage and the required actions', () => {
    const model = buildInstrumentCardModel(rowFor(mockAppData, 'auto-ef'), context);
    expect(model).toMatchObject({
      kind: 'auto-ef',
      subtitle: 'Emergency fund, auto-synced',
      progressCaption: expect.stringMatching(/% of your assets/),
      description: expect.stringMatching(/months of expenses covered/),
    });
    expect(model.actions.map(({ id }) => id)).toEqual(['deposit', 'withdraw', 'entries', 'edit']);
  });

  it('uses no-baseline copy and disables withdrawals when the emergency fund has no value', () => {
    const data = { ...mockAppData, efEntries: [] };
    const model = buildInstrumentCardModel(rowFor(data, 'auto-ef'), {
      ...context,
      totalAssets: 0,
      monthlyExpenseBaseline: 0,
    });
    expect(model.description).toBe('Log expenses to see months covered');
    expect(model.progressPct).toBe(0);
    expect(model.actions.find(({ id }) => id === 'withdraw')).toMatchObject({
      disabled: true,
      accessibilityHint: 'Nothing to withdraw',
    });
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
    expect(model.actions.map(({ id }) => id)).toEqual(['deposit', 'withdraw', 'entries', 'confirm', 'edit']);
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
    expect(model.actions.map(({ id }) => id)).toEqual(['deposit', 'withdraw', 'entries', 'edit']);
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
    expect(overdue.nextLine).toMatch(/^Next:/);
    expect(overdue.behindLine).toMatch(/\d+ behind/);
    expect(overdue.statuses.some(({ label }) => label.includes('overdue'))).toBe(true);
    expect(overdue.actions.map(({ id }) => id)).toEqual(['deposit', 'withdraw', 'schedule', 'edit']);

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
});
