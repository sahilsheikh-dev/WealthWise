import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../ui';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import type { BudgetCategoryGroup } from '../../domain/schemas';

type BudgetCategory = BudgetCategoryGroup['categories'][number];

export function BudgetCategorySections({
  groups,
  renderCategory,
}: {
  groups: readonly BudgetCategoryGroup[];
  renderCategory: (category: BudgetCategory) => ReactNode;
}) {
  const { colors } = useTheme();
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(
    () => new Set(groups[0] ? [groups[0].id] : []),
  );

  const toggleGroup = (id: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.sections}>
      {groups.map((group) => {
        const expanded = expandedGroups.has(group.id);
        return (
          <View
            key={group.id}
            style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              testID={`budget-category-group-${group.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${expanded ? 'Hide' : 'Show'} ${group.name} budget categories`}
              accessibilityState={{ expanded }}
              onPress={() => toggleGroup(group.id)}
              style={styles.header}>
              <View style={styles.headerTitle}>
                <AppText weight="semibold" style={styles.groupName}>{group.name}</AppText>
                <AppText style={[typography.meta, { color: colors.primary }]}>
                  {expanded ? 'Hide categories' : `Show ${group.categories.length} categories`}
                </AppText>
              </View>
              <AppText style={[typography.meta, { color: colors.text3 }]}>{group.description}</AppText>
            </Pressable>
            {expanded ? (
              <View style={styles.categories}>
                {group.categories.map((category) => renderCategory(category))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: 10 },
  group: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, overflow: 'hidden' },
  header: { minHeight: 44, padding: 12, gap: 6 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  groupName: { flex: 1, flexShrink: 1 },
  categories: { paddingHorizontal: 12, paddingBottom: 12, gap: 12 },
});
