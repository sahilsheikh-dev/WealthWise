import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import { SortChip } from '../src/components/SortChip';
import { SectionHeaderRow } from '../src/components/SectionHeaderRow';
import { AppText, Card, EmptyState, Screen } from '../src/components/ui';
import { useAppData } from '../src/data/useAppData';
import { useSort } from '../src/data/useSort';
import { budgetHistory } from '../src/domain/budget';
import { formatINR, formatMonth } from '../src/lib/format';
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
    <Screen>
      <AppHeader title="Budget history" />
      <SectionHeaderRow
        title="Budget history"
        right={<SortChip options={SORT_OPTIONS.budgetHistory} spec={sorting.spec} onChange={sorting.setSpec} />}
      />
      {rows.length === 0 ? <EmptyState title="No budget history yet" subtitle="Stored budgets and transactions will appear here." /> : null}
      {rows.map((row) => (
        <Pressable
          key={row.month}
          accessibilityRole="button"
          accessibilityLabel={`Open budget for ${formatMonth(row.month)}`}
          onPress={() => router.push({ pathname: '/budget', params: { month: row.month } })}>
          <Card style={styles.card}>
            <View style={styles.top}>
              <View style={{ flex: 1 }}>
                <AppText weight="semibold">{formatMonth(row.month)}</AppText>
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  {row.templateName}{row.customized ? ' · Customized' : ''}
                </AppText>
              </View>
              <AppText weight="semibold">{formatINR(row.closing)}</AppText>
            </View>
            <AppText style={[typography.meta, { color: colors.text2 }]}>
              Earned {formatINR(row.actualEarned)} · Spent {formatINR(row.actualSpend)} · Invested {formatINR(row.actualInvested)}
            </AppText>
            <AppText style={[typography.meta, { color: colors.text3 }]}>
              {row.savingsRatePct === null ? 'Savings rate unavailable' : `Savings rate ${row.savingsRatePct.toFixed(1)}%`}
              {' · '}{row.outstanding.count} outstanding
            </AppText>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
});
