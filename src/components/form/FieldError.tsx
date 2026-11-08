import { StyleSheet } from 'react-native';

import { AppText } from '../ui';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export function FieldError({ message }: { message?: string }) {
  const { colors } = useTheme();
  if (!message) return null;
  return (
    <AppText accessibilityRole="alert" style={[typography.meta, styles.error, { color: colors.err }]}>
      {message}
    </AppText>
  );
}

const styles = StyleSheet.create({
  error: { marginTop: 4, marginLeft: 2 },
});
