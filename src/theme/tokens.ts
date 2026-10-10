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
