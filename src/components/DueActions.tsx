import { router, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { useAppStore } from '../data/store';
import { useAppActions } from '../data/useAppData';
import type { DueTarget } from '../domain/dues';
import { formatINR } from '../lib/format';
import { confirmAsync } from '../lib/confirm';
import { ActionToast } from './ActionToast';
import { Button } from './ui';

export function DueActions({
  target,
  pendingCount,
  nextAmount,
}: {
  target: DueTarget;
  pendingCount: number;
  nextAmount: number;
}) {
  const actions = useAppActions();
  const inProgress = useRef(false);
  const [busy, setBusy] = useState(false);
  const [cleared, setCleared] = useState<{ id: string; amount: number } | null>(null);

  const clear = () => {
    if (inProgress.current || pendingCount < 1) return;
    inProgress.current = true;
    setBusy(true);
    try {
      const entryId = actions.clearDue(target);
      const state = useAppStore.getState();
      if (!entryId) {
        if (state.lastError) {
          void confirmAsync({ title: 'Could not clear due', message: state.lastError, confirmLabel: 'OK' });
        }
        return;
      }
      const transaction = state.data.transactions.find((row) =>
        row.source?.kind === (target.kind === 'plan' ? 'holding-entry'
          : target.kind === 'liability' ? 'liability-payment' : 'policy-payment')
        && row.source.parentId === target.id
        && row.source.entryId === entryId);
      setCleared({ id: entryId, amount: transaction?.amount ?? nextAmount });
    } finally {
      inProgress.current = false;
      setBusy(false);
    }
  };

  const undo = () => {
    if (!cleared || inProgress.current) return;
    inProgress.current = true;
    setBusy(true);
    try {
      actions.undoClearDue(target, cleared.id);
      const error = useAppStore.getState().lastError;
      if (error) {
        void confirmAsync({ title: 'Could not undo payment', message: error, confirmLabel: 'OK' });
      } else setCleared(null);
    } finally {
      inProgress.current = false;
      setBusy(false);
    }
  };

  return (
    <View>
      <Button
        label="Clear due"
        icon="check"
        variant="primary"
        disabled={busy || pendingCount < 1}
        onPress={clear}
      />
      {pendingCount >= 2 ? (
        <Button
          label="Clear past dues"
          icon="clock"
          disabled={busy}
          onPress={() => router.push(
            `/clear-dues?kind=${target.kind}&id=${encodeURIComponent(target.id)}` as Href,
          )}
        />
      ) : null}
      {cleared ? (
        <ActionToast
          message={`Marked ${formatINR(cleared.amount)} as paid`}
          actionLabel="Undo"
          onAction={undo}
          onDismiss={() => setCleared(null)}
        />
      ) : null}
    </View>
  );
}
