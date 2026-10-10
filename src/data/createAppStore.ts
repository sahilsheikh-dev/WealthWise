import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { addTransaction, deleteTransaction, emptyAppData, updateSettings, updateTransaction } from '../domain/actions';
import { monthlyBaseline } from '../domain/ef';
import { ensureEfGoal } from '../domain/goals';
import { SCHEMA_VERSION } from '../domain/schemas';
import { mockAppData } from '../mock/data';
import type { AppData, ISODate, Settings, Transaction } from '../domain/types';
import { migratePersisted } from './migrate';
import { createSafeStorage } from './safeStorage';

export type AppActions = {
  addTransaction: (input: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  dismissStorageError: () => void;
  resolveRecovery: (action: 'start-fresh') => void;
};

export type DevActions = {
  loadDemoData: () => void;
  eraseAll: () => void;
  simulateCorruption: () => Promise<void>;
};

export type AppStoreState = {
  data: AppData;
  hydrated: boolean;
  status: 'loading' | 'ready' | 'recovery';
  recoveryReason: 'corrupt' | 'newer-version' | null;
  storageError: string | null;
  lastError: string | null;
  actions: AppActions;
  devActions?: DevActions;
};

export type StoreDependencies = {
  newId: () => string;
  today: () => ISODate;
  reload?: () => void;
  isDev?: boolean;
};

export function createAppStore(
  storage: StateStorage,
  deps: StoreDependencies,
): UseBoundStore<StoreApi<AppStoreState>> {
  let useStore: UseBoundStore<StoreApi<AppStoreState>> | undefined;
  let corruptionReason: 'corrupt' | 'newer-version' | null = null;
  let suppressNextWrite = false;
  const safeStorage = createSafeStorage(
    storage,
    {
      onWriteError: (message) => useStore?.setState({ storageError: message }),
      onCorrupt: ({ reason }) => {
        corruptionReason = reason === 'newer-version' ? 'newer-version' : 'corrupt';
        useStore?.setState({ status: 'recovery', recoveryReason: corruptionReason });
      },
    },
    { blockWrites: () => suppressNextWrite || useStore?.getState().status === 'recovery' },
  );
  const jsonStorage = createJSONStorage(() => safeStorage);

  const store = create<AppStoreState>()(persist(
    (set, get) => {
      const setError = (error: unknown) => {
        set({ lastError: error instanceof Error ? error.message : 'The requested change could not be completed.' });
      };
      const clearActionError = () => set({ lastError: null });
      const actions: AppActions = {
        addTransaction(input) {
          try {
            set({ data: addTransaction(get().data, input, deps.newId) });
            clearActionError();
          } catch (error) {
            setError(error);
          }
        },
        updateTransaction(id, patch) {
          try {
            set({ data: updateTransaction(get().data, id, patch) });
            clearActionError();
          } catch (error) {
            setError(error);
          }
        },
        deleteTransaction(id) {
          try {
            set({ data: deleteTransaction(get().data, id) });
            clearActionError();
          } catch (error) {
            setError(error);
          }
        },
        updateSettings(patch) {
          try {
            set({ data: updateSettings(get().data, patch) });
            clearActionError();
          } catch (error) {
            setError(error);
          }
        },
        dismissStorageError() {
          suppressNextWrite = true;
          try {
            set({ storageError: null });
          } finally {
            suppressNextWrite = false;
          }
        },
        resolveRecovery(action) {
          if (action !== 'start-fresh') return;
          corruptionReason = null;
          set({
            data: emptyAppData(deps.today()),
            status: 'ready',
            recoveryReason: null,
            storageError: null,
            lastError: null,
          });
        },
      };
      const state: AppStoreState = {
        data: emptyAppData(deps.today()),
        hydrated: false,
        status: 'loading',
        recoveryReason: null,
        storageError: null,
        lastError: null,
        actions,
        ...(deps.isDev ?? (typeof __DEV__ !== 'undefined' && __DEV__) ? {
          devActions: {
            loadDemoData() {
              const expenseBaseline = monthlyBaseline(mockAppData.transactions, 'expense', deps.today());
              set({
                data: {
                  ...mockAppData,
                  goals: ensureEfGoal(mockAppData.goals, { expenseBaseline, asOf: deps.today() }),
                },
              });
            },
            eraseAll() {
              set({
                data: emptyAppData(deps.today()),
                status: 'ready',
                recoveryReason: null,
                storageError: null,
              });
            },
            async simulateCorruption() {
              await storage.setItem('wealthwise.app.v1', '{not json');
              if (!deps.reload) throw new Error('App reload is unavailable in this environment.');
              deps.reload();
            },
          },
        } : {}),
      };
      return state;
    },
    {
      name: 'wealthwise.app.v1',
      version: SCHEMA_VERSION,
      storage: jsonStorage!,
      partialize: (state) => ({ data: state.data }),
      migrate: migratePersisted,
      onRehydrateStorage: () => (state, error) => {
        const storeApi = useStore!;
        if (error) {
          corruptionReason ??= 'corrupt';
          storeApi.setState({
            status: 'recovery',
            recoveryReason: corruptionReason,
            storageError: 'Saved data could not be read. A backup has been kept on this device.',
            hydrated: true,
          });
          return;
        }
        const current = state ?? storeApi.getState();
        if (corruptionReason !== null) {
          storeApi.setState({
            hydrated: true,
            status: 'recovery',
            recoveryReason: corruptionReason,
          });
          return;
        }
        let data = current.data;
        if (!data.goals.some((goal) => goal.auto === 'ef')) {
          const expenseBaseline = monthlyBaseline(data.transactions, 'expense', deps.today());
          data = {
            ...data,
            goals: ensureEfGoal(data.goals, { expenseBaseline, asOf: deps.today() }),
          };
        }
        storeApi.setState({ data, hydrated: true, status: 'ready' });
      },
    },
  ));
  useStore = store;
  return store;
}
