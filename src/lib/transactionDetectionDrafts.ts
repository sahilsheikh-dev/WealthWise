import { DEFAULT_TRANSACTION_DETECTION } from '../data/metaStore';
import { metaStore } from '../data/store';

export async function removeTransactionDraft(draftId: string): Promise<void> {
  const meta = await metaStore.getMeta();
  const current = meta.transactionDetection ?? DEFAULT_TRANSACTION_DETECTION;
  const nextDrafts = current.pendingDrafts.filter((draft) => draft.id !== draftId);
  if (nextDrafts.length === current.pendingDrafts.length) return;
  await metaStore.updateMeta({
    transactionDetection: {
      ...current,
      pendingDrafts: nextDrafts,
    },
  });
}
