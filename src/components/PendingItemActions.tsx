import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { useAppStore } from '../data/store';
import { useAppActions } from '../data/useAppData';
import { pendingTransactionType, type PendingItem } from '../domain/pending';
import type { DueTarget } from '../domain/dues';
import { formatAmount } from '../lib/amountDisplay';
import { useUIStore } from '../data/uiStore';
import { AppText, Button } from './ui';

export function PendingItemActions({
  item,
  today,
  onClose,
}: {
  item: PendingItem;
  today: string;
  onClose?: () => void;
}) {
  const actions = useAppActions();
  const setActionToast = useUIStore((state) => state.setActionToast);

  const pay = () => {
    onClose?.();
    if (item.source.kind === 'plan') {
      router.push({
        pathname: '/investment-entry-form',
        params: {
          holdingId: item.source.parentId,
          kind: 'Deposit',
          date: today,
          amount: String(item.amount),
        },
      });
      return;
    }
    if (item.source.kind === 'liability') {
      router.push({
        pathname: '/liability-payment-form',
        params: {
          liabilityId: item.source.parentId,
          kind: item.source.paymentKind,
          date: today,
          amount: String(item.amount),
        },
      });
      return;
    }
    router.push({
      pathname: '/transaction-form',
      params: {
        type: pendingTransactionType(item),
        category: item.category,
        date: today,
        amount: String(item.amount),
        pending: '1',
      },
    });
  };

  const clear = () => {
    if (!item.actionable) return;
    let undo: (() => void) | undefined;
    let clearedAmount = item.amount;
    if (item.source.kind === 'budget') {
      actions.addTransaction({
        type: pendingTransactionType(item),
        amount: item.amount,
        category: item.category,
        note: '',
        date: today,
      });
      const state = useAppStore.getState();
      if (state.lastError) {
        Alert.alert('Could not clear planned item', state.lastError);
        return;
      }
      const transaction = state.data.transactions.at(-1);
      if (!transaction) {
        Alert.alert('Could not clear planned item', 'The transaction was not created.');
        return;
      }
      clearedAmount = transaction.amount;
      undo = () => {
        actions.deleteTransaction(transaction.id);
        const error = useAppStore.getState().lastError;
        if (error) Alert.alert('Could not undo planned item', error);
      };
    } else {
      const source = item.source;
      if (source.kind !== 'plan' && source.kind !== 'liability') return;
      const target: DueTarget = { kind: source.kind, id: source.parentId };
      const entryId = actions.clearDue(target, source.slotId);
      const state = useAppStore.getState();
      if (!entryId || state.lastError) {
        Alert.alert('Could not clear due', state.lastError ?? 'The due could not be recorded.');
        return;
      }
      const sourceKind = source.kind === 'plan' ? 'holding-entry' : 'liability-payment';
      const transaction = state.data.transactions.find((row) =>
        row.source?.kind === sourceKind
        && row.source.parentId === source.parentId
        && row.source.entryId === entryId);
      if (!transaction) {
        Alert.alert('Could not clear due', 'The linked transaction was not created.');
        return;
      }
      clearedAmount = transaction.amount;
      undo = () => {
        actions.undoClearDue(target, entryId);
        const error = useAppStore.getState().lastError;
        if (error) Alert.alert('Could not undo payment', error);
      };
    }
    setActionToast({
      message: `Marked ${formatAmount(clearedAmount, 'exact', 1)} as paid`,
      actionLabel: 'Undo',
      onAction: undo,
    });
    onClose?.();
  };

  return item.actionable ? (
    <View style={styles.actions}>
      <Button label="Pay" icon="credit-card" onPress={pay} />
      <Button label="Clear due" icon="check" onPress={clear} />
    </View>
  ) : (
    <View style={styles.later}>
      <AppText style={styles.laterText}>After earlier dues</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  later: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  laterText: { opacity: 0.65 },
});
