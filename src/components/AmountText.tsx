import type { StyleProp, TextStyle } from 'react-native';
import { useWindowDimensions } from 'react-native';

import { formatINR } from '../lib/format';
import { formatAmount, type AmountTier } from '../lib/amountDisplay';
import { AppText } from './ui';
import { useTheme } from '../theme/useTheme';
import type { Tone } from '../theme/tokens';

export function AmountText({
  value,
  tier,
  tone,
  style,
  weight,
}: {
  value: number;
  tier: AmountTier;
  tone?: Tone;
  style?: StyleProp<TextStyle>;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}) {
  const { fontScale } = useWindowDimensions();
  const { colors } = useTheme();
  const color = tone ? {
    primary: colors.primary,
    ok: colors.ok,
    err: colors.err,
    info: colors.info,
    purple: colors.purple,
    neutral: colors.text2,
  }[tone] : undefined;
  return (
    <AppText
      style={[color ? { color } : undefined, style]}
      weight={weight}
      accessibilityLabel={formatINR(value)}>
      {formatAmount(value, tier, fontScale)}
    </AppText>
  );
}
