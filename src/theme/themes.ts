import type { ThemeId } from '../domain/types';
import type { ThemeColors } from './tokens';

export type ConcreteThemeId = Exclude<ThemeId, 'system'>;
export type ThemePalette = {
  id: ConcreteThemeId;
  label: string;
  description: string;
  isDark: boolean;
  statusBar: 'light' | 'dark';
  colors: ThemeColors;
};

export const themes: Record<ConcreteThemeId, ThemePalette> = {
  light: {
    id: 'light', label: 'Light', description: 'Clean and bright', isDark: false, statusBar: 'dark',
    colors: {
      bg: '#ffffff', surface: '#ffffff', surface2: '#f4f4f5', surface3: '#e4e4e7', border: '#e4e4e7',
      text1: '#09090b', text2: '#52525b', text3: '#6b6b73', primary: '#4f46e5',
      ok: '#15803d', err: '#b91c1c', info: '#0369a1', purple: '#7e22ce',
      primaryDim: '#e0e7ff', okDim: '#dcfce7', errDim: '#fee2e2', infoDim: '#e0f2fe', purpleDim: '#f3e8ff',
    },
  },
  dark: {
    id: 'dark', label: 'Dark', description: 'Pure black for OLED screens', isDark: true, statusBar: 'light',
    colors: {
      bg: '#000000', surface: '#0a0a0a', surface2: '#141414', surface3: '#1f1f1f', border: '#262626',
      text1: '#fafafa', text2: '#a1a1aa', text3: '#8a8a93', primary: '#818cf8',
      ok: '#4ade80', err: '#f87171', info: '#60a5fa', purple: '#c4b5fd',
      primaryDim: '#292554', okDim: '#052e16', errDim: '#450a0a', infoDim: '#082f49', purpleDim: '#2e1065',
    },
  },
  sky: {
    id: 'sky', label: 'Sky', description: 'A calm blue canvas', isDark: false, statusBar: 'dark',
    colors: {
      bg: '#f0f7ff', surface: '#ffffff', surface2: '#e6f1fc', surface3: '#d5e6f8', border: '#cfe3f7',
      text1: '#0b1f33', text2: '#3d5a75', text3: '#536d86', primary: '#0369a1',
      ok: '#166534', err: '#b91c1c', info: '#075985', purple: '#6b21a8',
      primaryDim: '#dbeafe', okDim: '#dcfce7', errDim: '#fee2e2', infoDim: '#e0f2fe', purpleDim: '#f3e8ff',
    },
  },
  mint: {
    id: 'mint', label: 'Mint', description: 'A fresh green canvas', isDark: false, statusBar: 'dark',
    colors: {
      bg: '#f0faf4', surface: '#ffffff', surface2: '#e4f5eb', surface3: '#d3eddd', border: '#c8e9d5',
      text1: '#0b2a1b', text2: '#3b5e4a', text3: '#536f60', primary: '#047857',
      ok: '#166534', err: '#b91c1c', info: '#075985', purple: '#6b21a8',
      primaryDim: '#d1fae5', okDim: '#dcfce7', errDim: '#fee2e2', infoDim: '#e0f2fe', purpleDim: '#f3e8ff',
    },
  },
  blush: {
    id: 'blush', label: 'Blush', description: 'A soft rose canvas', isDark: false, statusBar: 'dark',
    colors: {
      bg: '#fff5f6', surface: '#ffffff', surface2: '#fde8eb', surface3: '#f9d6dc', border: '#f6cfd5',
      text1: '#2a0f14', text2: '#6b3a43', text3: '#85565f', primary: '#be123c',
      ok: '#166534', err: '#b91c1c', info: '#075985', purple: '#6b21a8',
      primaryDim: '#ffe4e6', okDim: '#dcfce7', errDim: '#fee2e2', infoDim: '#e0f2fe', purpleDim: '#f3e8ff',
    },
  },
  midnight: {
    id: 'midnight', label: 'Midnight', description: 'Deep navy for low-light use', isDark: true, statusBar: 'light',
    colors: {
      bg: '#0b1220', surface: '#111a2e', surface2: '#172238', surface3: '#223050', border: '#25324f',
      text1: '#eaf0ff', text2: '#a9b6d3', text3: '#8493b3', primary: '#60a5fa',
      ok: '#4ade80', err: '#f87171', info: '#60a5fa', purple: '#c4b5fd',
      primaryDim: '#172554', okDim: '#052e16', errDim: '#450a0a', infoDim: '#082f49', purpleDim: '#2e1065',
    },
  },
};

export function resolveTheme(preference: ThemeId, osScheme: 'light' | 'dark' | null): ConcreteThemeId {
  if (preference !== 'system') return preference;
  return osScheme === 'dark' ? 'dark' : 'light';
}
