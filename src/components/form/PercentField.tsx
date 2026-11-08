import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../ui';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { FieldError } from './FieldError';

export function PercentField({
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
      <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: error ? colors.err : colors.border }]}>
        <TextInput
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={error ? `Error: ${error}` : undefined}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={(input) => {
            const cleaned = input.replace(/[^\d.]/g, '');
            const [whole = '', ...fractions] = cleaned.split('.');
            onChangeText(fractions.length ? `${whole}.${fractions.join('').slice(0, 2)}` : whole);
          }}
          onBlur={onBlur}
          style={[styles.input, { color: colors.text1 }]}
        />
        <AppText style={{ color: colors.text3 }}>%</AppText>
      </View>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  inputWrap: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14 },
  input: { flex: 1, minHeight: 46, paddingVertical: 8, fontFamily: 'Montserrat_500Medium', fontSize: 14 },
});
