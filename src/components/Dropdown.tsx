import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { AppText } from './ui';
import { TopAnchoredSheet } from './TopAnchoredSheet';

export type DropdownOption = {
  value: string;
  title: string;
  group?: string;
};

export function Dropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const groups = [...new Set(options.map((option) => option.group).filter((group): group is string => Boolean(group)))];

  return (
    <>
      <View style={styles.field}>
        <AppText style={[typography.meta, { color: colors.text2 }]}>{label}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ expanded: open }}
          accessibilityHint={error ? `Error: ${error}` : undefined}
          onPress={() => setOpen(true)}
          style={[styles.control, { borderColor: error ? colors.err : colors.border, backgroundColor: colors.surface }]}
          testID="dropdown-control">
          <AppText style={[typography.meta, styles.selectedTitle, { color: selected ? colors.text1 : colors.text3 }]}>
            {selected?.title ?? placeholder ?? label}
          </AppText>
          <Feather name="chevron-down" size={18} color={colors.text2} />
        </Pressable>
        {error ? <AppText style={[typography.meta, { color: colors.err }]}>{error}</AppText> : null}
      </View>
      <TopAnchoredSheet
        visible={open}
        onClose={() => setOpen(false)}
        sheetTestID="dropdown-sheet"
        contentStyle={styles.sheet}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          contentContainerStyle={styles.options}>
          {groups.length > 0
            ? (
              <>
                {groups.map((group) => (
                  <View key={group}>
                    <AppText style={[typography.meta, styles.group, { color: colors.text2 }]}>{group}</AppText>
                    {options.filter((option) => option.group === group).map((option) => (
                      <DropdownRow
                        key={option.value}
                        option={option}
                        selected={option.value === value}
                        onSelect={() => {
                          onChange(option.value);
                          setOpen(false);
                        }}
                      />
                    ))}
                  </View>
                ))}
                {options.filter((option) => option.group === undefined).map((option) => (
                  <DropdownRow
                    key={option.value}
                    option={option}
                    selected={option.value === value}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  />
                ))}
              </>
            )
            : options.map((option) => (
              <DropdownRow
                key={option.value}
                option={option}
                selected={option.value === value}
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              />
            ))}
        </ScrollView>
      </TopAnchoredSheet>
    </>
  );
}

function DropdownRow({
  option,
  selected,
  onSelect,
}: {
  option: DropdownOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={option.title}
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={[styles.option, { minHeight: Math.max(44, 44 * fontScale), borderBottomColor: colors.border }]}>
      <AppText style={[typography.meta, styles.optionTitle]}>{option.title}</AppText>
      {selected ? <Feather name="check" size={18} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  control: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedTitle: { flex: 1 },
  sheet: { paddingHorizontal: 16, paddingBottom: 12 },
  options: { paddingBottom: 8 },
  group: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },
  option: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  optionTitle: { flex: 1, flexShrink: 1 },
});
