import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../ui';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { FieldError } from './FieldError';

function cleanMoney(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [integer = '', ...fractionParts] = cleaned.split('.');
  const fraction = fractionParts.join('').slice(0, 2);
  return fractionParts.length > 0 ? `${integer}.${fraction}` : integer;
}

function grouped(value: string): string {
  const numeric = Number(value);
  if (!value || !Number.isFinite(numeric)) return value;
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(numeric);
}

export function MoneyField({
  value,
  onChangeText,
  onBlur,
  error,
  accessibilityLabel = 'Amount in rupees',
}: {
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <AppText style={[typography.meta, { color: colors.text2 }]}>Amount</AppText>
      <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: error ? colors.err : colors.border }]}>
        <AppText weight="semibold" style={[styles.currency, { color: colors.text3 }]}>₹</AppText>
        <TextInput
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={error ? `Error: ${error}` : undefined}
          keyboardType="decimal-pad"
          value={focused ? value : grouped(value)}
          onFocus={() => {
            setFocused(true);
            onChangeText(cleanMoney(value.replaceAll(',', '')));
          }}
          onChangeText={(text) => onChangeText(cleanMoney(text))}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          style={[styles.input, { color: colors.text1 }]}
        />
      </View>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  inputWrap: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14 },
  currency: { fontSize: 15, marginRight: 8 },
  input: { flex: 1, minHeight: 46, paddingVertical: 8, fontFamily: 'Montserrat_500Medium', fontSize: 14 },
});
