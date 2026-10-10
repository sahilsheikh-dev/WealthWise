import { THEME_IDS } from '../../domain/types';
import { contrastRatio } from '../contrast';
import { resolveTheme, themes, type ConcreteThemeId } from '../themes';
import type { ThemeColors } from '../tokens';

const colorKeys: (keyof ThemeColors)[] = [
  'bg', 'surface', 'surface2', 'surface3', 'border', 'text1', 'text2', 'text3',
  'primary', 'ok', 'err', 'info', 'purple', 'primaryDim', 'okDim', 'errDim', 'infoDim', 'purpleDim',
];
const concreteIds = THEME_IDS.filter((id): id is ConcreteThemeId => id !== 'system');

describe('theme palettes', () => {
  it('has one complete palette for each concrete theme with unique ids and labels', () => {
    expect(Object.keys(themes).sort()).toEqual([...concreteIds].sort());
    expect(new Set(Object.values(themes).map((theme) => theme.id)).size).toBe(concreteIds.length);
    expect(new Set(Object.values(themes).map((theme) => theme.label)).size).toBe(concreteIds.length);
    for (const id of concreteIds) {
      expect(themes[id].id).toBe(id);
      for (const key of colorKeys) expect(themes[id].colors[key]).toMatch(/^#[\da-f]{6}$/i);
    }
  });

  it.each(concreteIds)('%s palette meets text, tone, and icon contrast requirements', (id) => {
    const { colors } = themes[id];
    for (const text of [colors.text1, colors.text2, colors.text3]) {
      for (const background of [colors.bg, colors.surface, colors.surface2]) {
        expect(contrastRatio(text, background)).toBeGreaterThanOrEqual(4.5);
      }
    }
    for (const tone of [colors.primary, colors.ok, colors.err, colors.info, colors.purple]) {
      expect(contrastRatio(tone, colors.surface)).toBeGreaterThanOrEqual(4.5);
    }
    for (const [tone, dim] of [
      [colors.primary, colors.primaryDim], [colors.ok, colors.okDim], [colors.err, colors.errDim],
      [colors.info, colors.infoDim], [colors.purple, colors.purpleDim],
    ]) {
      expect(contrastRatio(tone, dim)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(colors.surface, colors.primary)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(colors.primary, colors.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('resolves system preference and concrete themes', () => {
    expect(resolveTheme('system', null)).toBe('light');
    expect(resolveTheme('system', 'light')).toBe('light');
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('midnight', 'light')).toBe('midnight');
  });
});
