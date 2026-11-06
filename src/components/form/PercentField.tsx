import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { AppText } from '../ui';
import { FieldError } from './FieldError';

export function PercentField({
  label, value, onChangeText, onBlur, error, accessibilityLabel,
  size = 'regular',
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  accessibilityLabel?: string;
  size?: 'regular' | 'compact';
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <View style={[
        styles.inputWrap,
        size === 'compact' ? styles.compactInputWrap : undefined,
        { backgroundColor: colors.surface, borderColor: error ? colors.err : colors.border },
      ]}>
        <AppText style={[styles.percentIcon, { color: colors.text3 }]}>
          %
        </AppText>
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label ?? 'Percentage'}
          accessibilityHint={error ? `Error: ${error}` : undefined}
          hitSlop={size === 'compact' ? 4 : undefined}
          keyboardType="decimal-pad"
          value={value}
          placeholder={label}
          placeholderTextColor={colors.text3}
          onChangeText={(input) => {
            const cleaned = input.replace(/[^\d.]/g, '');
            const [whole = '', ...fractions] = cleaned.split('.');
            onChangeText(fractions.length ? `${whole}.${fractions.join('').slice(0, 2)}` : whole);
          }}
          onBlur={onBlur}
          style={[styles.input, size === 'compact' ? styles.compactInput : undefined, { color: colors.text1 }]}
        />
      </View>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  inputWrap: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14 },
  compactInputWrap: { minHeight: 40, borderRadius: 10, paddingHorizontal: 10 },
  percentIcon: { marginRight: 10 },
  input: { flex: 1, minHeight: 46, paddingVertical: 8, fontFamily: 'Montserrat_500Medium', fontSize: 14 },
  compactInput: { minHeight: 38, paddingVertical: 4, fontSize: 13 },
});
