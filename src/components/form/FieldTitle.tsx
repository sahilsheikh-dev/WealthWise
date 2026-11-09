import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { AppText } from '../ui';

export function FieldTitle({ title, children }: PropsWithChildren<{ title: string }>) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText numberOfLines={1} style={[typography.meta, { color: colors.text2 }]}>{title}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
});
