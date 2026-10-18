import { Pressable, StyleSheet, View } from 'react-native';

import type { BudgetCategoryChoiceSection } from '../domain/budgetCategories';
import { formatAmount } from '../lib/amountDisplay';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { AppText } from './ui';

export function budgetCategoryHint(planned: number, actual: number): string {
  if (planned <= 0) return 'No budget';
  const left = planned - actual;
  return left < 0
    ? `Over by ${formatAmount(Math.abs(left), 'exact', 1)}`
    : `Left ${formatAmount(left, 'exact', 1)} of ${formatAmount(planned, 'exact', 1)}`;
}

export function BudgetCategoryPicker({
  sections,
  value,
  labels,
  extraCategories = [],
  onChange,
}: {
  sections: readonly BudgetCategoryChoiceSection[];
  value: string;
  labels: Readonly<Record<string, string>>;
  extraCategories?: readonly string[];
  onChange: (category: string) => void;
}) {
  const { colors } = useTheme();
  const extra = extraCategories.filter((category) =>
    !sections.some((section) => section.categories.some((choice) => choice.category === category)),
  );

  return (
    <View style={styles.sections} testID="budget-category-picker">
      {sections.map((section) => (
        <View key={section.id} style={styles.section} testID={`category-section-${section.id}`}>
          <AppText weight="semibold" style={[typography.meta, { color: colors.text2 }]}>{section.name}</AppText>
          {section.categories.map((choice) => (
            <CategoryOption
              key={choice.category}
              category={choice.category}
              label={labels[choice.category] ?? choice.category}
              hint={budgetCategoryHint(choice.planned, choice.actual)}
              selected={value === choice.category}
              onPress={() => onChange(choice.category)}
            />
          ))}
        </View>
      ))}
      {extra.length > 0 ? (
        <View style={styles.section} testID="category-section-other">
          <AppText weight="semibold" style={[typography.meta, { color: colors.text2 }]}>Other</AppText>
          {extra.map((category) => (
            <CategoryOption
              key={category}
              category={category}
              label={labels[category] ?? category}
              hint="No budget"
              selected={value === category}
              onPress={() => onChange(category)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function CategoryOption({
  category,
  label,
  hint,
  selected,
  onPress,
}: {
  category: string;
  label: string;
  hint: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${label}, ${hint}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        { backgroundColor: selected ? colors.primaryDim : colors.surface, borderColor: colors.border },
      ]}
      testID={`budget-category-${category}`}>
      <View style={styles.optionText}>
        <AppText style={typography.meta}>{label}</AppText>
        <AppText style={[typography.meta, { color: colors.text3 }]}>{hint}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sections: { gap: 10 },
  section: { gap: 6 },
  option: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  optionText: { flex: 1, gap: 2 },
});
