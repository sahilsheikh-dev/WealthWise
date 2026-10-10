import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../ui';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { FieldError } from './FieldError';

export function IntegerField({
  label, value, onChangeText, onBlur, error, accessibilityLabel,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText style={[typography.meta, { color: colors.text2 }]}>{label}</AppText>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        keyboardType="number-pad"
        value={value}
        onChangeText={(input) => onChangeText(input.replace(/[^\d]/g, ''))}
        onBlur={onBlur}
        style={[styles.input, { color: colors.text1, backgroundColor: colors.surface, borderColor: error ? colors.err : colors.border }]}
      />
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  input: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14, fontFamily: 'Montserrat_500Medium', fontSize: 14 },
});
