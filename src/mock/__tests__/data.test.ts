import { mockAppData } from '../data';
import { pendingItems } from '../../domain/pending';

describe('portfolio sample valuation dates', () => {
  it('sets the fixed-deposit date and leaves the EPFO value date unknown', () => {
    const epfo = mockAppData.holdings.find((holding) => holding.id === 'holding-pf');
    const fd = mockAppData.holdings.find((holding) => holding.id === 'holding-fd');
    expect(epfo).toMatchObject({ kind: 'manual', name: 'EPFO - PF' });
    expect(epfo?.kind === 'manual' ? epfo.valueAsOf : undefined).toBeUndefined();
    expect(fd).toMatchObject({ kind: 'manual', valueAsOf: '2026-06-01' });
  });

  describe('pending-item demo coverage', () => {
    it('includes an overdue due, a future due, and a stored applied budget month', () => {
      const october = pendingItems(mockAppData, '2026-10', '2026-10-15');
      const november = pendingItems(mockAppData, '2026-11', '2026-10-15');

      expect(october).toEqual(expect.arrayContaining([
        expect.objectContaining({ title: 'Retirement fund', status: 'overdue' }),
        expect.objectContaining({ title: 'Food', kind: 'budget', status: 'planned' }),
      ]));
      expect(november).toEqual(expect.arrayContaining([
        expect.objectContaining({ title: 'Retirement fund', status: 'upcoming' }),
        expect.objectContaining({ title: 'Bank EMI', status: 'upcoming' }),
      ]));
      expect(mockAppData.monthBudgets?.find((row) => row.month === '2026-10'))
        .toMatchObject({ source: 'plan' });
    });
  });
});
