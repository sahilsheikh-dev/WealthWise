import { filterAndRankDropdownOptions } from '../dropdownSearch';

describe('filterAndRankDropdownOptions', () => {
  const options = [
    { value: 'contains', title: 'Big Blueberry' },
    { value: 'word', title: 'Orchard Berry' },
    { value: 'prefix', title: 'Berry Basketry' },
    { value: 'exact', title: 'Berry' },
    { value: 'same-rank', title: 'Berry Bowl' },
    { value: 'custom', title: 'Custom' },
  ];

  it('preserves original options for an empty or whitespace query', () => {
    expect(filterAndRankDropdownOptions(options, '')).toEqual(options);
    expect(filterAndRankDropdownOptions(options, '  ')).toEqual(options);
  });

  it('trims, ignores case and diacritics, and requires every word in any order', () => {
    const entries = [{ value: '1', title: 'Café au lait' }, { value: '2', title: 'Café' }];
    expect(filterAndRankDropdownOptions(entries, '  LAIT cafe  ')).toEqual([entries[0]]);
  });

  it('ranks exact, prefix, word starts, then contains and keeps ties stable', () => {
    expect(filterAndRankDropdownOptions(options, 'berry').map((option) => option.value))
      .toEqual(['exact', 'prefix', 'same-rank', 'word', 'contains', 'custom']);
  });

  it('filters titles only and preserves the supplied order for equal-ranked matches', () => {
    const entries = [
      { value: 'a', title: 'Other match', group: 'Berry group' },
      { value: 'b', title: 'Berry name', group: 'Other group' },
    ];
    expect(filterAndRankDropdownOptions(entries, 'berry').map((option) => option.value)).toEqual(['b']);
  });

  it('handles 500 options without dropping original-order matches', () => {
    const entries = Array.from({ length: 500 }, (_, index) => ({ value: String(index), title: `Option ${index}` }));
    expect(filterAndRankDropdownOptions(entries, 'option').map((option) => option.value)).toEqual(entries.map((option) => option.value));
  });

  it('pins a value-sentinel Custom even when its display title differs', () => {
    const entries = [{ value: 'custom', title: 'Add another' }, { value: 'x', title: 'Alpha' }];
    expect(filterAndRankDropdownOptions(entries, 'missing')).toEqual([entries[0]]);
  });
});
