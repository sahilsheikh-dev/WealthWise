import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { useAppStore } from '../data/store';
import { useAppActions } from '../data/useAppData';
import { duesThroughPreview, type DueTarget } from '../domain/dues';
import { pendingActionLabel, pendingTransactionType, type PendingItem } from '../domain/pending';
import { formatAmount } from '../lib/amountDisplay';
import { useUIStore } from '../data/uiStore';
import { Button } from './ui';
import { PaidAmountDialog } from './PaidAmountDialog';

export function PendingItemActions({
  item,
  today,
  onClose,
  compact = false,
  comfortable = false,
  actionLabel,
}: {
  item: PendingItem;
  today: string;
  onClose?: () => void;
  compact?: boolean;
  comfortable?: boolean;
  actionLabel?: string;
}) {
  const actions = useAppActions();
  const setActionToast = useUIStore((state) => state.setActionToast);
  const [paidDialogVisible, setPaidDialogVisible] = useState(false);

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

  const clear = (actualAmount = item.amount) => {
    if (!item.actionable) return;
    let undo: (() => void) | undefined;
    let clearedAmount = item.amount;
    if (item.source.kind === 'budget' || item.source.kind === 'income') {
      const budget = useAppStore.getState().data;
      const linkedItem = [
        ...(budget.budgetPlan?.items ?? []),
        ...(budget.monthBudgets?.filter((snapshot) => snapshot.month === today.slice(0, 7)).flatMap((snapshot) => snapshot.items) ?? []),
      ].find((candidate) => candidate.name === item.category && candidate.holdingId);
      const linkedHolding = linkedItem
        ? budget.holdings.find((holding) => holding.id === linkedItem.holdingId)
        : undefined;
      if (linkedHolding?.kind === 'manual') {
        actions.addInvestmentEntry(linkedHolding.id, {
          date: today,
          amount: actualAmount,
          kind: 'Deposit',
          note: item.title,
        });
        const state = useAppStore.getState();
        if (state.lastError) {
          Alert.alert('Could not clear planned item', state.lastError);
          return;
        }
        const transaction = state.data.transactions.findLast((row) =>
          row.source?.kind === 'holding-entry'
          && row.source.parentId === linkedHolding.id
          && row.date === today
          && row.amount === actualAmount);
        if (!transaction) {
          Alert.alert('Could not clear planned item', 'The linked holding entry was not created.');
          return;
        }
        clearedAmount = actualAmount;
        undo = () => {
          if (!transaction.source || transaction.source.kind !== 'holding-entry') return;
          actions.deleteInvestmentEntry(linkedHolding.id, transaction.source.entryId);
        };
      } else {
      actions.addTransaction({
        type: pendingTransactionType(item),
        amount: actualAmount,
        category: item.category,
        note: item.source.kind === 'income' ? item.title : '',
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
      }
    } else {
      const source = item.source;
      if (source.kind !== 'plan' && source.kind !== 'liability' && source.kind !== 'policy') return;
      const target: DueTarget = { kind: source.kind, id: source.parentId };
      const entryId = actions.clearDue(target, source.slotId, actualAmount);
      const state = useAppStore.getState();
      if (!entryId || state.lastError) {
        Alert.alert('Could not clear due', state.lastError ?? 'The due could not be recorded.');
        return;
      }
      const sourceKind = source.kind === 'plan'
        ? 'holding-entry'
        : source.kind === 'liability'
          ? 'liability-payment'
          : 'policy-payment';
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
      message: pendingTransactionType(item) === 'income'
        ? `Received ${formatAmount(clearedAmount, 'exact', 1)}`
        : `Marked ${formatAmount(clearedAmount, 'exact', 1)} as paid`,
      actionLabel: 'Undo',
      onAction: undo,
    });
    onClose?.();
  };

  const clearThrough = async (actualAmount = item.amount) => {
    if (item.source.kind !== 'plan' && item.source.kind !== 'liability' && item.source.kind !== 'policy') return;
    if (!item.dueDate) {
      Alert.alert('Could not clear due', 'This due does not have a scheduled date.');
      return;
    }
    const target: DueTarget = { kind: item.source.kind, id: item.source.parentId };
    const preview = duesThroughPreview(useAppStore.getState().data, target, item.dueDate, today);
    if (preview.count === 0) {
      Alert.alert('Could not clear due', 'There are no unpaid dues through this date.');
      return;
    }
    const entryIds = actions.clearDuesThrough(target, item.dueDate, actualAmount);
    const state = useAppStore.getState();
    if (!entryIds || state.lastError) {
      Alert.alert('Could not clear due', state.lastError ?? 'The dues could not be recorded.');
      return;
    }
    const sourceKind = target.kind === 'plan'
      ? 'holding-entry'
      : target.kind === 'liability'
        ? 'liability-payment'
        : 'policy-payment';
    const transactions = entryIds.map((entryId) => state.data.transactions.find((row) =>
      row.source?.kind === sourceKind
      && row.source.parentId === target.id
      && row.source.entryId === entryId));
    if (transactions.some((transaction) => transaction === undefined)) {
      Alert.alert('Could not clear due', 'A linked transaction was not created for every payment.');
      return;
    }
    const total = transactions.reduce((sum, transaction) => sum + (transaction?.amount ?? 0), 0);
    setActionToast({
      message: `Marked ${formatAmount(total, 'exact', 1)} as paid`,
      actionLabel: 'Undo',
      onAction: () => {
        actions.undoClearDuesThrough(target, entryIds);
        const error = useAppStore.getState().lastError;
        if (error) Alert.alert('Could not undo payments', error);
      },
    });
    onClose?.();
  };

  if (compact) {
    return (
      <>
        <PaidAmountDialog
          visible={paidDialogVisible}
          title={item.title}
          dueAmount={item.amount}
          dueDate={item.dueDate}
          onPaid={(amount) => {
            setPaidDialogVisible(false);
            if (item.actionable) clear(amount);
            else void clearThrough(amount);
          }}
          onNotPaid={() => setPaidDialogVisible(false)}
        />
        <View style={styles.actions}>
        <Button
          label={actionLabel ?? pendingActionLabel(pendingTransactionType(item))}
          icon={actionLabel ? undefined : 'check'}
          onPress={() => {
            setPaidDialogVisible(true);
          }}
          style={comfortable ? styles.comfortableCompactButton : styles.compactButton}
        />
        </View>
      </>
    );
  }

  const dialog = (
    <PaidAmountDialog
      visible={paidDialogVisible}
      title={item.title}
      dueAmount={item.amount}
      dueDate={item.dueDate}
      onPaid={(amount) => {
        setPaidDialogVisible(false);
        if (item.actionable) clear(amount);
        else void clearThrough(amount);
      }}
      onNotPaid={() => setPaidDialogVisible(false)}
    />
  );

  return (
    <>
      {dialog}
      {item.kind === 'budget' ? (
    <View style={styles.actions}>
      <Button label="Pay" icon="credit-card" onPress={pay} />
      <Button label="Clear due" icon="check" onPress={() => setPaidDialogVisible(true)} style={styles.compactButton} />
    </View>
  ) : item.actionable ? (
    <View style={styles.actions}>
      <Button label="Pay" icon="credit-card" onPress={pay} />
      <Button label="Clear due" icon="check" onPress={() => setPaidDialogVisible(true)} style={styles.compactButton} />
    </View>
  ) : (
    <View style={styles.actions}>
      <Button label="Clear due" icon="check" onPress={() => setPaidDialogVisible(true)} style={styles.compactButton} />
    </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  compactButton: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 6 },
  comfortableCompactButton: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 8 },
});
