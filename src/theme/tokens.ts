export type Tone = 'primary' | 'ok' | 'err' | 'info' | 'purple' | 'neutral';

export type ThemeColors = {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  text1: string;
  text2: string;
  text3: string;
  primary: string;
  ok: string;
  err: string;
  info: string;
  purple: string;
  primaryDim: string;
  okDim: string;
  errDim: string;
  infoDim: string;
  purpleDim: string;
};

export const darkColors: ThemeColors = {
  bg: '#080808',
  surface: '#111111',
  surface2: '#181818',
  surface3: '#242424',
  border: '#262626',
  text1: '#f2f2f2',
  text2: '#a0a0a0',
  text3: '#6c6c6c',
  primary: '#c9a84c',
  ok: '#2ecc71',
  err: '#e53935',
  info: '#4a9eff',
  purple: '#8b7cf6',
  primaryDim: '#c9a84c22',
  okDim: '#0e2a1a',
  errDim: '#2a0e0e',
  infoDim: '#0a1a2a',
  purpleDim: '#16103a',
};

export const lightColors: ThemeColors = {
  bg: '#f4f5f9',
  surface: '#ffffff',
  surface2: '#f1f3f9',
  surface3: '#e3e7f1',
  border: '#e3e6ef',
  text1: '#0f172a',
  text2: '#475569',
  text3: '#7a879b',
  primary: '#c9a84c',
  ok: '#16a34a',
  err: '#dc2626',
  info: '#2563eb',
  purple: '#7c3aed',
  primaryDim: '#f6efe0',
  okDim: '#e8f7ee',
  errDim: '#fdecec',
  infoDim: '#eaf1ff',
  purpleDim: '#f1edff',
};

export const radii = {
  card: 18,
  item: 14,
  pill: 12,
  button: 14,
  sheet: 22,
} as const;

export const typography = {
  h1: { fontSize: 22, fontFamily: 'Montserrat_700Bold', letterSpacing: -0.5 },
  big: { fontSize: 30, fontFamily: 'Montserrat_700Bold', letterSpacing: -1 },
  label: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold' },
  name: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold' },
  meta: { fontSize: 11, fontFamily: 'Montserrat_500Medium' },
  amount: { fontSize: 14, fontFamily: 'Montserrat_700Bold' },
  chip: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold' },
  navLabel: { fontSize: 10, lineHeight: 14, fontFamily: 'Montserrat_600SemiBold' },
} as const;
