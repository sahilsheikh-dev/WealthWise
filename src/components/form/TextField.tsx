import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { FieldError } from './FieldError';

export function TextField({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  accessibilityLabel,
  maxLength,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  accessibilityLabel: string;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.text3}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
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
