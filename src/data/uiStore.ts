import { create } from 'zustand';

import { monthKey } from '../domain/dates';
import { todayISO } from '../lib/clock';

type UIStore = {
  txMonth: string;
  setTxMonth: (month: string) => void;
};

export const useUIStore = create<UIStore>((set) => ({
  txMonth: monthKey(todayISO()),
  setTxMonth: (txMonth) => set({ txMonth }),
}));
