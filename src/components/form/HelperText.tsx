import { StyleSheet } from 'react-native';

import { AppText } from '../ui';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export function HelperText({ children, tone = 'neutral' }: React.PropsWithChildren<{ tone?: 'neutral' | 'warning' }>) {
  const { colors } = useTheme();
  return <AppText style={[typography.meta, styles.text, { color: tone === 'warning' ? colors.err : colors.text3 }]}>{children}</AppText>;
}

const styles = StyleSheet.create({ text: { lineHeight: 17 } });
