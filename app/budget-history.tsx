import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { SortChip } from '../src/components/SortChip';
import { AppText, Card, ChipRow, DetailTabBar, EmptyState, Screen } from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { useSort } from '../src/data/useSort';
import { budgetHistory } from '../src/domain/budget';
import { formatAmount } from '../src/lib/amountDisplay';
import { formatMonth } from '../src/lib/format';
import { SORT_OPTIONS } from '../src/lib/sorting';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function BudgetHistoryScreen() {
  const data = useAppData();
  const sorting = useSort('budgetHistory');
  const { colors } = useTheme();
  const rows = sorting.sort(budgetHistory(data));
  return (
    <Screen scroll={false}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Budget history" />
        <ChipRow>
          <SortChip options={SORT_OPTIONS.budgetHistory} spec={sorting.spec} onChange={sorting.setSpec} />
        </ChipRow>
        {rows.length === 0 ? <EmptyState title="No budget history yet" subtitle="Stored budgets and transactions will appear here." /> : null}
        {rows.map((row) => (
          <Pressable
            key={row.month}
            accessibilityRole="button"
            accessibilityLabel={`Open budget for ${formatMonth(row.month)}, closing balance ${formatAmount(row.closing, 'exact', 1)}`}
            onPress={() => router.push({ pathname: '/(tabs)/budget', params: { month: row.month } })}>
            <Card style={styles.card}>
              <View style={styles.top}>
                <View style={{ flex: 1 }}>
                  <AppText weight="semibold">{formatMonth(row.month)}</AppText>
                  <AppText style={[typography.meta, { color: colors.text3 }]}>
                    {row.templateName}{row.customized ? ' · Customized' : ''}
                  </AppText>
                </View>
                <AppText weight="semibold" accessibilityLabel={`Closing balance ${formatAmount(row.closing, 'exact', 1)}`}>
                  <AmountText value={row.closing} tier="row" />
                </AppText>
              </View>
              <AppText
                style={[typography.meta, { color: colors.text2 }]}
                accessibilityLabel={`Earned ${formatAmount(row.actualEarned, 'exact', 1)} · Spent ${formatAmount(row.actualSpend, 'exact', 1)} · Invested ${formatAmount(row.actualInvested, 'exact', 1)}`}>
                Earned <AmountText value={row.actualEarned} tier="row" /> · Spent <AmountText value={row.actualSpend} tier="row" /> · Invested <AmountText value={row.actualInvested} tier="row" />
              </AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>
                {row.savingsRatePct === null ? 'Savings rate unavailable' : `Savings rate ${row.savingsRatePct.toFixed(1)}%`}
                {' · '}{row.outstanding.count} outstanding
              </AppText>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
      <DetailTabBar active="Budget" placement="flow" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 16 },
  card: { gap: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
});
