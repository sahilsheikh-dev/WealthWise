import { StyleSheet, View } from 'react-native';

import { AppText } from '../ui';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export function FormSection({ title, children }: React.PropsWithChildren<{ title: string }>) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <AppText weight="semibold" style={[typography.meta, { color: colors.primary }]}>{title}</AppText>
      <View style={styles.fields}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({ section: { gap: 10 }, fields: { gap: 14 } });
