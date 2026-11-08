import { emptyAppData } from '../actions';
import { addPlan, stopPlan, resumePlan } from '../planActions';
import { planSchedule } from '../schedule';

const input = {
  name: 'Monthly SIP',
  type: 'Mutual fund / SIP' as const,
  frequency: 'monthly' as const,
  amount: 5_000,
  ratePct: 0,
  stepUpPct: 0,
  tenureYears: 5,
  startDate: '2026-01-01',
  trackFrom: '2026-01-01',
  opening: 73_000,
  actualValue: 81_000,
  actualValueDate: '2026-05-31',
  valuationMethod: 'unitsPrice' as const,
};

describe('P29-X recurring plan stop and resume', () => {
  it('cuts future dues inclusively and preserves value, entries and links', () => {
    let data = addPlan(emptyAppData('2026-05-31'), input, () => 'plan');
    data = {
      ...data,
      goals: [{ id: 'goal', name: 'Goal', target: 100_000, year: 2030, saved: 81_000, links: [{ instrumentId: 'plan', share: 100 }] }],
      holdings: data.holdings.map((holding) => holding.kind === 'plan'
        ? {
          ...holding,
          logs: [
            { id: 'open', date: '2026-01-01', amount: 73_000, note: '', kind: 'Deposit' as const },
            { id: 'due-1', date: '2026-02-01', amount: 2_000, note: '', kind: 'Deposit' as const },
            { id: 'due-2', date: '2026-03-01', amount: 2_000, note: '', kind: 'Deposit' as const },
            { id: 'due-3', date: '2026-04-01', amount: 2_000, note: '', kind: 'Deposit' as const },
            { id: 'due-4', date: '2026-05-01', amount: 2_000, note: '', kind: 'Deposit' as const },
          ],
        }
        : holding),
    };
    const before = data.holdings[0];
    data = stopPlan(data, 'plan', '2026-05-31', '2026-05-31');
    const stopped = data.holdings[0];
    expect(stopped).toMatchObject({ id: 'plan', stopDate: '2026-05-31', actualValue: 81_000, logs: before?.kind === 'plan' ? before.logs : [] });
    if (!stopped || stopped.kind !== 'plan') throw new Error('Expected plan holding');
    expect(planSchedule(stopped, '2026-05-31').rows.every((row) => row.dueDate <= '2026-05-31')).toBe(true);
    expect(data.goals[0]?.links).toEqual([{ instrumentId: 'plan', share: 100 }]);

    data = resumePlan(data, 'plan');
    const resumed = data.holdings[0];
    expect(resumed?.kind === 'plan' ? resumed.stopDate : 'present').toBeUndefined();
    expect(resumed?.kind === 'plan' ? resumed.actualValue : null).toBe(81_000);
    expect(resumed?.kind === 'plan' ? resumed.logs.length : 0).toBe(5);
  });

  it('rejects stopping before the last paid entry or after today', () => {
    let data = addPlan(emptyAppData('2026-05-31'), input, () => 'plan');
    data = {
      ...data,
      holdings: data.holdings.map((holding) => holding.kind === 'plan'
        ? { ...holding, logs: [{ id: 'paid', date: '2026-05-01', amount: 5_000, note: '', kind: 'Deposit' }] }
        : holding),
    };
    expect(() => stopPlan(data, 'plan', '2026-04-30', '2026-05-31')).toThrow('before the last paid entry');
    expect(() => stopPlan(data, 'plan', '2026-06-01', '2026-05-31')).toThrow('future');
  });
});
