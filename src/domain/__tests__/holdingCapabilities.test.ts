import { emptyAppData } from '../actions';
import { holdingCapabilities } from '../holdingCapabilities';
import { validateIntegrity } from '../links';
import { addPlan, updatePlan } from '../planActions';
import { appDataSchema } from '../schemas';
import { HOLDING_TYPES } from '../types';

describe('holding capabilities', () => {
  it('defines entry, recurring and return capabilities for every holding type', () => {
    expect(Object.fromEntries(HOLDING_TYPES.map((type) => [type, holdingCapabilities(type)]))).toEqual({
      'Mutual fund / SIP': { entries: true, recurring: true, returns: true },
      'Stocks / ETF': { entries: true, recurring: true, returns: true },
      'Fixed deposit': { entries: false, recurring: false, returns: true },
      'Recurring deposit': { entries: true, recurring: true, returns: true },
      'EPFO / PF': { entries: true, recurring: true, returns: true },
      'Savings account': { entries: true, recurring: true, returns: false },
      Cash: { entries: true, recurring: true, returns: false },
      Gold: { entries: true, recurring: true, returns: true },
      Silver: { entries: true, recurring: true, returns: true },
      Other: { entries: true, recurring: true, returns: true },
    });
  });

  it('rejects adding or changing a plan to a one-time holding type', () => {
    const data = emptyAppData('2026-10-10');
    const input = {
      name: 'Monthly plan',
      type: 'Mutual fund / SIP' as const,
      frequency: 'monthly' as const,
      amount: 100,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate: '2026-10-10',
      trackFrom: '2026-10-10',
      opening: 0,
      actualValue: null,
      actualValueDate: null,
    };

    expect(() => addPlan(data, { ...input, type: 'Fixed deposit' }, () => 'invalid'))
      .toThrow('Fixed deposit does not support a recurring deposit schedule.');

    const plan = addPlan(data, input, () => 'plan');
    expect(() => updatePlan(plan, 'plan', { type: 'Fixed deposit' }))
      .toThrow('Fixed deposit does not support a recurring deposit schedule.');
    expect(plan.holdings[0]?.type).toBe('Mutual fund / SIP');
  });

  it('rejects persisted plans with a one-time holding type', () => {
    const data = emptyAppData('2026-10-10');
    data.holdings = [{
      id: 'legacy-fixed-plan',
      kind: 'plan',
      name: 'Invalid legacy plan',
      type: 'Fixed deposit',
      frequency: 'monthly',
      amount: 100,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate: '2026-10-10',
      trackFrom: '2026-10-10',
      opening: 0,
      actualValue: null,
      actualValueDate: null,
      logs: [],
    }];

    expect(() => appDataSchema.parse(data))
      .toThrow('Fixed deposit does not support a recurring deposit schedule.');
  });

  it('flags a persisted Budget schedule linked to a fixed deposit', () => {
    const data = emptyAppData('2026-10-10');
    data.holdings = [{
      id: 'fixed',
      kind: 'manual',
      name: 'Fixed deposit',
      type: 'Fixed deposit',
      invested: 100,
      value: 100,
      valueAsOf: '2026-10-10',
      logs: [],
    }];
    data.budgetPlan = {
      sections: [{ id: 'invest', name: 'Investments', type: 'invest' }],
      incomes: [],
      repeatMonthly: true,
      repeatFrom: '2026-10',
      items: [{
        id: 'item',
        sectionId: 'invest',
        name: 'FD schedule',
        mode: 'amount',
        value: 100,
        frequency: 'monthly',
        firstDueMonth: '2026-10',
        holdingId: 'fixed',
      }],
    };
    data.monthBudgets = [{
      month: '2026-10',
      source: 'custom',
      linkedIncluded: true,
      incomes: [],
      sections: [{ id: 'invest', name: 'Investments', type: 'invest' }],
      items: [{
        id: 'snapshot-item',
        sectionId: 'invest',
        name: 'FD snapshot schedule',
        mode: 'amount',
        value: 100,
        frequency: 'monthly',
        firstDueMonth: '2026-10',
        holdingId: 'fixed',
      }],
    }];

    expect(validateIntegrity(data)).toContainEqual(expect.objectContaining({
      code: 'one-time-budget-link',
      path: ['budgetPlan', 'items', 0, 'holdingId'],
    }));
    expect(validateIntegrity(data)).toContainEqual(expect.objectContaining({
      code: 'one-time-budget-link',
      path: ['monthBudgets', 0, 'items', 0, 'holdingId'],
    }));
  });
});
