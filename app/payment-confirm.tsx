import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { AppHeader } from '../src/components/AppHeader';
import { PendingItemActions } from '../src/components/PendingItemActions';
import { AppText, Button, Card, Screen, SectionTitle } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { monthKey, isValidISO } from '../src/domain/dates';
import { pendingItems } from '../src/domain/pending';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { formatDate } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function PaymentConfirmScreen() {
  const { colors } = useTheme();
  const data = useAppStore((state) => state.data);
  const { dueItemId, dueDate } = useLocalSearchParams<{ dueItemId?: string; dueDate?: string }>();
  const today = todayISO();
  const validTarget = typeof dueItemId === 'string'
    && dueItemId.length > 0
    && typeof dueDate === 'string'
    && isValidISO(dueDate);
  const item = useMemo(() => {
    if (!validTarget || typeof dueDate !== 'string' || typeof dueItemId !== 'string') return undefined;
    return pendingItems(data, monthKey(dueDate), today).find((candidate) =>
      candidate.id === dueItemId && candidate.dueDate === dueDate);
  }, [data, dueDate, dueItemId, today, validTarget]);

  return (
    <Screen>
      <AppHeader title="Payment reminder" showBack />
      {validTarget && !item ? (
        <>
          <SectionTitle>Already cleared</SectionTitle>
          <Card>
            <AppText style={[typography.meta, { color: colors.text2 }]}>
              This reminder is no longer outstanding.
            </AppText>
          </Card>
          <Button label="Close" onPress={() => router.back()} />
        </>
      ) : !item ? (
        <>
          <SectionTitle>Reminder unavailable</SectionTitle>
          <Card>
            <AppText style={[typography.meta, { color: colors.text2 }]}>
              This reminder does not contain a valid due.
            </AppText>
          </Card>
          <Button label="Close" onPress={() => router.back()} />
        </>
      ) : (
        <>
          <SectionTitle>Was this paid?</SectionTitle>
          <Card>
            <AppText weight="bold" style={typography.h1}>{item.title}</AppText>
            <AppText style={[typography.meta, { color: colors.text2 }]}>
              Due {item.dueDate ? formatDate(item.dueDate) : 'date unavailable'}
            </AppText>
            <AppText weight="semibold" style={[typography.h1, styles.amount]}>
              {formatAmount(item.amount, 'exact', 1)}
            </AppText>
            <PendingItemActions
              item={item}
              today={today}
              compact
              comfortable
              actionLabel="Paid"
              onClose={() => router.back()}
            />
          </Card>
          <Button label="Not paid" onPress={() => router.back()} style={styles.notPaid} />
        </>
      )}
    </Screen>
  );
}

const styles = {
  amount: { marginTop: 16, marginBottom: 18 },
  notPaid: { marginHorizontal: 20, marginTop: 10 },
};
