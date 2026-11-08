import { create } from 'zustand';

import { monthKey } from '../domain/dates';
import { todayISO } from '../lib/clock';

type UIStore = {
  txMonth: string;
  setTxMonth: (month: string) => void;
  lastCreatedInstrumentId: string | null;
  setLastCreatedInstrumentId: (id: string | null) => void;
  persistedBytes: number | null;
  setPersistedBytes: (bytes: number) => void;
  actionToast: { message: string; actionLabel?: string; onAction?: () => void } | null;
  setActionToast: (toast: UIStore['actionToast']) => void;
};

export const useUIStore = create<UIStore>((set) => ({
  txMonth: monthKey(todayISO()),
  setTxMonth: (txMonth) => set({ txMonth }),
  lastCreatedInstrumentId: null,
  setLastCreatedInstrumentId: (lastCreatedInstrumentId) => set({ lastCreatedInstrumentId }),
  persistedBytes: null,
  setPersistedBytes: (persistedBytes) => set({ persistedBytes }),
  actionToast: null,
  setActionToast: (actionToast) => set({ actionToast }),
}));
