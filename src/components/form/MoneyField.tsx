import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { formatINRCompact } from '../../lib/format';
import { useTheme } from '../../theme/useTheme';
import { AppText } from '../ui';
import { FieldError } from './FieldError';
import { HelperText } from './HelperText';

function cleanMoney(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [integer = '', ...fractionParts] = cleaned.split('.');
  const fraction = fractionParts.join('').slice(0, 2);
  return fractionParts.length > 0 ? `${integer}.${fraction}` : integer;
}

function grouped(value: string): string {
  const numeric = Number(value);
  if (!value || !Number.isFinite(numeric)) return value;
  return new Intl.NumberFormat('en-IN',{maximumFractionDigits: 2,}).format(numeric);
}

export function MoneyField({
  value,
  label,
  onChangeText,
  onBlur,
  error,
  accessibilityLabel,
  size = 'regular',
}: {
  value: string;
  label?: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  accessibilityLabel?: string;
  size?: 'regular' | 'compact';
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const amount = Number(value);
  return (
    <View style={styles.field}>
      <View style={[
        styles.inputWrap,
        size === 'compact' ? styles.compactInputWrap : undefined,
        { backgroundColor: colors.surface, borderColor: error ? colors.err : colors.border },
      ]}>
        <AppText weight="semibold" style={[styles.currency, { color: colors.text3 }]}>₹</AppText>
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label ?? 'Amount in rupees'}
          accessibilityHint={error ? `Error: ${error}` : undefined}
          hitSlop={size === 'compact' ? 4 : undefined}
          keyboardType="decimal-pad"
          placeholder={label}
          placeholderTextColor={colors.text3}
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
          style={[styles.input, size === 'compact' ? styles.compactInput : undefined, { color: colors.text1 }]}
        />
      </View>
      {Number.isFinite(amount) && amount >= 100_000
        ? <HelperText>= {formatINRCompact(amount)}</HelperText>
        : null}
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  inputWrap: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14 },
  compactInputWrap: { minHeight: 40, borderRadius: 10, paddingHorizontal: 10 },
  currency: { fontSize: 15, marginRight: 8 },
  input: { flex: 1, minHeight: 46, paddingVertical: 8, fontFamily: 'Montserrat_500Medium', fontSize: 14 },
  compactInput: { minHeight: 38, paddingVertical: 4, fontSize: 13 },
});
