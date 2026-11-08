import { StyleSheet } from 'react-native';

import { AppText } from '../ui';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export function HelperText({
  children,
  tone = 'neutral',
  accessibilityHint,
}: React.PropsWithChildren<{
  tone?: 'neutral' | 'warning';
  accessibilityHint?: string;
}>) {
  const { colors } = useTheme();
  return (
    <AppText
      accessibilityHint={accessibilityHint}
      style={[typography.meta, styles.text, { color: tone === 'warning' ? colors.err : colors.text3 }]}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({ text: { lineHeight: 17 } });
