import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';

import { filterAndRankDropdownOptions } from '../lib/dropdownSearch';
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
  searchable = true,
}: {
  label: string;
  value: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  accessibilityLabel: string;
  searchable?: boolean;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(
    () => searchable ? filterAndRankDropdownOptions(options, query) : [...options],
    [options, query, searchable],
  );
  const customOptions = filteredOptions.filter((option) =>
    option.title.trim().toLocaleLowerCase() === 'custom' || option.value.toLocaleLowerCase() === 'custom',
  );
  const visibleOptions = filteredOptions.filter((option) => !customOptions.includes(option));
  const groups = [...new Set(visibleOptions.map((option) => option.group).filter((group): group is string => Boolean(group)))];
  const matchCount = visibleOptions.length;

  useEffect(() => {
    if (open && searchable && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(`${matchCount} results`);
    }
  }, [matchCount, open, query, searchable]);

  return (
    <>
      <View style={styles.field}>
        <AppText style={[typography.meta, { color: colors.text2 }]}>{label}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ expanded: open }}
          accessibilityHint={error ? `Error: ${error}` : undefined}
          onPress={() => {
            setQuery('');
            setOpen(true);
          }}
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
        centered
        contentStyle={styles.sheet}>
        {searchable ? (
          <View style={styles.searchWrap}>
            <AppText style={[typography.meta, { color: colors.text2 }]}>Search</AppText>
            <View style={[styles.searchControl, { borderColor: colors.border }]}>
              <TextInput
                accessibilityLabel="Search"
                autoFocus={false}
                placeholder="Search"
                placeholderTextColor={colors.text3}
                value={query}
                onChangeText={setQuery}
                style={[typography.meta, styles.searchInput, { color: colors.text1 }]}
                returnKeyType="search"
              />
              {query.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  onPress={() => setQuery('')}
                  style={styles.clearButton}>
                  <Feather name="x" size={18} color={colors.text2} />
                </Pressable>
              ) : null}
            </View>
            {Platform.OS === 'android' ? (
              <AppText key={`results-${query}`} accessibilityLiveRegion="polite" style={styles.announcement}>{`${matchCount} results`}</AppText>
            ) : null}
          </View>
        ) : null}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          contentContainerStyle={styles.options}>
          {query.trim().length > 0 && matchCount === 0 ? (
            <AppText accessibilityLiveRegion="polite" style={[typography.meta, styles.noMatches, { color: colors.text2 }]}>No matches</AppText>
          ) : null}
          {groups.length > 0
            ? (
              <>
                {groups.map((group) => (
                  <View key={group}>
                    <AppText style={[typography.meta, styles.group, { color: colors.text2 }]}>{group}</AppText>
                    {visibleOptions.filter((option) => option.group === group).map((option) => (
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
                {visibleOptions.filter((option) => option.group === undefined).map((option) => (
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
            : visibleOptions.map((option) => (
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
          {customOptions.map((option) => (
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
  sheet: { paddingHorizontal: 16, paddingBottom: 12, flexShrink: 1 },
  searchWrap: { paddingBottom: 8, gap: 4 },
  searchControl: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingLeft: 10 },
  searchInput: { flex: 1, minHeight: 44, paddingVertical: 4 },
  clearButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  announcement: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  noMatches: { padding: 16, textAlign: 'center' },
  options: { paddingBottom: 8 },
  group: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },
  option: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  optionTitle: { flex: 1, flexShrink: 1 },
});
