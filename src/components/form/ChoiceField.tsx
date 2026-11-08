import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Chip } from '../ui';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { FieldError } from './FieldError';

export function ChoiceField({
  label,
  value,
  choices,
  onChange,
  error,
}: {
  label: string;
  value: string;
  choices: readonly string[];
  onChange: (value: string) => void;
  error?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText style={[typography.meta, { color: colors.text2 }]}>{label}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
        {choices.map((choice) => (
          <Chip
            key={choice}
            label={choice}
            selected={value === choice}
            accessibilityLabel={`${label}: ${choice}`}
            accessibilityHint={error ? `Error: ${error}` : undefined}
            onPress={() => onChange(choice)}
          />
        ))}
      </ScrollView>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  choices: { gap: 8, paddingVertical: 2 },
});
