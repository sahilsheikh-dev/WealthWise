import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { formatDate } from '../../lib/format';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { AppText } from '../ui';
import { FieldError } from './FieldError';

function dateFromISO(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 2000, (month ?? 1) - 1, day ?? 1);
}

function dateToISO(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function DateField({
  label = 'Date',
  value,
  onChange,
  maximumDate,
  error,
  accessibilityLabel = 'Transaction date',
  accessibilityHint,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  maximumDate: string;
  error?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(() => dateFromISO(value));
  const maximum = dateFromISO(maximumDate);

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      if (Platform.OS === 'android') setVisible(false);
      return;
    }
    if (!date) return;
    setSelected(date);
    onChange(dateToISO(date));
    if (Platform.OS === 'android') setVisible(false);
  };

  return (
    <View style={styles.field}>
      <AppText style={[typography.meta, { color: colors.text2 }]}>{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={error ? `Error: ${error}` : accessibilityHint}
        onPress={() => {
          setSelected(dateFromISO(value));
          setVisible(true);
        }}
        style={[styles.button, { backgroundColor: colors.surface, borderColor: error ? colors.err : colors.border }]}>
        <AppText>{formatDate(value)}</AppText>
      </Pressable>
      <FieldError message={error} />
      {Platform.OS === 'ios' ? (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
          <View style={styles.overlay}>
            <View style={[styles.pickerCard, { backgroundColor: colors.surface }]}>
              <DateTimePicker
                value={selected}
                mode="date"
                display="spinner"
                maximumDate={maximum}
                onChange={onDateChange}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done selecting date"
                onPress={() => setVisible(false)}
                style={[styles.done, { backgroundColor: colors.primaryDim }]}>
                <AppText weight="semibold" style={{ color: colors.primary }}>Done</AppText>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : visible ? (
        <DateTimePicker value={selected} mode="date" maximumDate={maximum} onChange={onDateChange} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  pickerCard: { padding: 16, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  done: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
});
