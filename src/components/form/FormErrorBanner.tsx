import { StyleSheet, View } from 'react-native';

import { AppText } from '../ui';
import { useTheme } from '../../theme/useTheme';

export function FormErrorBanner({ message }: { message: string | null }) {
  const { colors } = useTheme();
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: colors.errDim }]}>
      <AppText style={{ color: colors.err }}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { minHeight: 44, justifyContent: 'center', padding: 12, borderRadius: 12 },
});
