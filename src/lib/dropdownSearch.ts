export type SearchableDropdownOption = {
  value: string;
  title: string;
  group?: string;
};

function normalize(value: string): string {
  return value.normalize('NFKC').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function rank(title: string, query: string, words: readonly string[]): number {
  if (title === query) return 0;
  if (title.startsWith(query)) return 1;
  const titleWords = title.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (words.every((word) => titleWords.some((titleWord) => titleWord.startsWith(word)))) return 2;
  return 3;
}

export function filterAndRankDropdownOptions<T extends SearchableDropdownOption>(
  options: readonly T[],
  rawQuery: string,
): T[] {
  const query = normalize(rawQuery.trim());
  if (!query) return [...options];
  const words = query.split(/\s+/u);
  const custom = options.filter((option) => option.title.trim().toLowerCase() === 'custom' || option.value.toLowerCase() === 'custom');
  const matches = options
    .map((option, index) => ({ option, index, title: normalize(option.title) }))
    .filter(({ title }) => words.every((word) => title.includes(word)))
    .sort((a, b) => rank(a.title, query, words) - rank(b.title, query, words) || a.index - b.index)
    .map(({ option }) => option);
  return [...matches, ...custom.filter((option) => !matches.includes(option))];
}
