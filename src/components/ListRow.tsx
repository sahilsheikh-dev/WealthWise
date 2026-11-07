import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconButton } from './IconButton';

export function ListRow({
  children,
  onPress,
  onEdit,
  editLabel,
  accessibilityLabel,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  onEdit?: () => void;
  editLabel?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const content = onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.content}>
      {children}
    </Pressable>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <View style={[styles.row, style]}>
      {content}
      {onEdit && editLabel ? <IconButton icon="edit-2" label={editLabel} onPress={onEdit} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  content: { flex: 1, minWidth: 0 },
});
