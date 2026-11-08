import { mockAppData } from '../data';

describe('portfolio sample valuation dates', () => {
  it('sets the fixed-deposit date and leaves the EPFO value date unknown', () => {
    const epfo = mockAppData.holdings.find((holding) => holding.id === 'holding-pf');
    const fd = mockAppData.holdings.find((holding) => holding.id === 'holding-fd');
    expect(epfo).toMatchObject({ kind: 'manual', name: 'EPFO - PF' });
    expect(epfo?.kind === 'manual' ? epfo.valueAsOf : undefined).toBeUndefined();
    expect(fd).toMatchObject({ kind: 'manual', valueAsOf: '2026-06-01' });
  });
});
