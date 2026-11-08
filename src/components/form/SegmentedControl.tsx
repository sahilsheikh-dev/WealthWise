import { Pressable, StyleSheet, View } from 'react-native';

import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { AppText } from '../ui';
import { FieldError } from './FieldError';

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
  size = 'regular',
}: {
  label?: string;
  value: T;
  options: readonly { label: string; value: T }[];
  onChange: (value: T) => void;
  error?: string;
  size?: 'regular' | 'compact';
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {label ? (
          <AppText style={[ typography.meta, styles.label, { color: colors.text2 } ]} numberOfLines={1} >
              {label}
          </AppText>
        ) : null}
      <View style={[
        styles.control,
        size === 'compact' ? styles.compactControl : undefined,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityHint={error ? `Error: ${error}` : undefined}
              accessibilityState={{ selected }}
              hitSlop={size === 'compact' ? 4 : undefined}
              onPress={() => onChange(option.value)}
              style={[
                styles.option,
                size === 'compact' ? styles.compactOption : undefined,
                selected && { backgroundColor: colors.primaryDim, borderColor: colors.primary },
              ]}>
              <AppText weight="semibold" style={[
                typography.chip,
                size === 'compact' ? styles.compactOptionText : undefined,
                { color: selected ? colors.primary : colors.text3 },
              ]} numberOfLines={1} >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    flexShrink: 0,
  },
  control: { minHeight: 48, flexDirection: 'row', gap: 5, padding: 4, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  compactControl: { minHeight: 40, gap: 3, padding: 2, borderRadius: 10 },
  option: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent', borderRadius: 11 },
  compactOption: { minHeight: 36, paddingHorizontal: 6, borderRadius: 8 },
  compactOptionText: { fontSize: 13 },
});
