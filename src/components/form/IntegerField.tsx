import { StyleSheet, TextInput, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { FieldError } from './FieldError';

export function IntegerField({
  label, value, onChangeText, onBlur, error, accessibilityLabel, icon,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  accessibilityLabel: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <View
        style={[ styles.inputContainer, { backgroundColor: colors.surface, borderColor: error ? colors.err : colors.border }]}
      >
        <Ionicons
          name={icon ?? 'calculator'}
          size={18}
          color={colors.text3}
          style={styles.icon}
        />

        <TextInput
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={error ? `Error: ${error}` : undefined}
          keyboardType="number-pad"
          value={value}
          placeholder={label}
          placeholderTextColor={colors.text3}
          onChangeText={(input) => onChangeText(input.replace(/[^\d]/g, ''))}
          onBlur={onBlur}
          style={[
            styles.input,
            { color: colors.text1 },
          ]}
        />
      </View>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  inputContainer: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14 },
  icon: { marginRight: 10 },
  input: { flex: 1, minHeight: 46, paddingVertical: 0, fontFamily: 'Montserrat_500Medium', fontSize: 14 },
});