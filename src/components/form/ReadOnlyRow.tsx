import { StyleSheet, View } from 'react-native';

import { AppText } from '../ui';
import { useTheme } from '../../theme/useTheme';

export function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface2 }]}>
      <AppText style={[styles.label, { color: colors.text3 }]}>{label}</AppText>
      <AppText style={styles.value}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({ row: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, gap: 4 }, label: { fontSize: 11 }, value: { fontSize: 13 } });
