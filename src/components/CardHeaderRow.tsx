import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconButton } from './IconButton';

export function CardHeaderRow({
  title,
  subtitle,
  value,
  valueCaption,
  editLabel,
  onEdit,
  style,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  valueCaption?: ReactNode;
  editLabel?: string;
  onEdit?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titleBlock}>
        {title}
        {subtitle}
      </View>
      <View style={styles.valueBlock}>
        {value}
        {valueCaption}
      </View>
      {editLabel && onEdit ? <IconButton icon="edit-2" label={editLabel} onPress={onEdit} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  titleBlock: { flex: 1, minWidth: 0, gap: 3 },
  valueBlock: { maxWidth: '42%', alignItems: 'flex-end', gap: 3 },
});
