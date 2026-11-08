import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { addTransaction, deleteTransaction, emptyAppData, updateSettings, updateTransaction } from '../domain/actions';
import {
  addPlan, addPlanLog, deletePlan, deletePlanLog, updatePlan, updatePlanLog,
  type AddPlanInput, type PlanLogPatch, type PlanPatch,
} from '../domain/planActions';
import {
  addLoan, addLoanPayment, deleteLoan, deleteLoanPayment, updateLoan, updateLoanPayment,
  type AddLoanInput, type LoanPatch, type LoanPaymentPatch,
} from '../domain/loanActions';
import { addGoal, deleteGoal, updateGoal, type AddGoalInput, type GoalPatch } from '../domain/goalActions';
import { addHolding, deleteHolding, updateHolding, type HoldingPatch } from '../domain/holdingActions';
import { addEfEntry, deleteEfEntry, updateEfEntry, type EfEntryPatch } from '../domain/efActions';
import { validateIntegrity } from '../domain/links';
import { monthlyBaseline } from '../domain/ef';
import { ensureEfGoal } from '../domain/goals';
import { SCHEMA_VERSION } from '../domain/schemas';
import { mockAppData } from '../mock/data';
import type { AppData, EfEntry, Holding, ISODate, LogEntry, Settings, Transaction } from '../domain/types';
import { migratePersisted } from './migrate';
import { createSafeStorage } from './safeStorage';

export type AppActions = {
  addTransaction: (input: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  addPlan: (input: AddPlanInput) => void;
  updatePlan: (id: string, patch: PlanPatch) => void;
  deletePlan: (id: string, options: { linkedTransactions: 'delete' | 'keep' }) => void;
  addPlanLog: (planId: string, input: Pick<LogEntry, 'date' | 'amount' | 'note'>, options: { recordTransaction: boolean }) => void;
  updatePlanLog: (planId: string, logId: string, patch: PlanLogPatch) => void;
  deletePlanLog: (planId: string, logId: string) => void;
  addLoan: (input: AddLoanInput) => void;
  updateLoan: (id: string, patch: LoanPatch) => void;
  deleteLoan: (id: string, options: { linkedTransactions: 'delete' | 'keep' }) => void;
  addLoanPayment: (loanId: string, input: Pick<LogEntry, 'date' | 'amount' | 'kind' | 'note'>, options: { recordTransaction: boolean }) => void;
  updateLoanPayment: (loanId: string, paymentId: string, patch: LoanPaymentPatch) => void;
  deleteLoanPayment: (loanId: string, paymentId: string) => void;
  addGoal: (input: AddGoalInput) => void;
  updateGoal: (id: string, patch: GoalPatch) => void;
  deleteGoal: (id: string) => void;
  addHolding: (input: Omit<Extract<Holding, { kind: 'manual' }>, 'id' | 'kind' | 'valueAsOf'>) => void;
  updateHolding: (id: string, patch: HoldingPatch) => void;
  deleteHolding: (id: string) => void;
  addEfEntry: (input: Omit<EfEntry, 'id'>, options: { recordTransaction: boolean }) => void;
  updateEfEntry: (id: string, patch: EfEntryPatch) => void;
  deleteEfEntry: (id: string) => void;
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
      onWriteError: (message) => {
        suppressNextWrite = true;
        try {
          useStore?.setState({ storageError: message });
        } finally {
          suppressNextWrite = false;
        }
      },
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
        suppressNextWrite = true;
        try {
          set({ lastError: error instanceof Error ? error.message : 'The requested change could not be completed.' });
        } finally {
          suppressNextWrite = false;
        }
      };
      const applyDataAction = (action: (data: AppData) => AppData) => {
        try {
          const data = action(get().data);
          if (deps.isDev ?? (typeof __DEV__ !== 'undefined' && __DEV__)) {
            const issues = validateIntegrity(data);
            if (issues.length > 0) console.warn('AppData integrity issues', issues);
          }
          set({ data, lastError: null });
        } catch (error) {
          setError(error);
        }
      };
      const actions: AppActions = {
        addTransaction(input) {
          applyDataAction((data) => addTransaction(data, input, deps.newId));
        },
        updateTransaction(id, patch) {
          applyDataAction((data) => updateTransaction(data, id, patch));
        },
        deleteTransaction(id) {
          applyDataAction((data) => deleteTransaction(data, id));
        },
        updateSettings(patch) {
          applyDataAction((data) => updateSettings(data, patch));
        },
        addPlan(input) {
          applyDataAction((data) => addPlan(data, input, deps.newId));
        },
        updatePlan(id, patch) {
          applyDataAction((data) => updatePlan(data, id, patch));
        },
        deletePlan(id, options) {
          applyDataAction((data) => deletePlan(data, id, options));
        },
        addPlanLog(planId, input, options) {
          applyDataAction((data) => addPlanLog(data, planId, input, { ...options, newId: deps.newId }));
        },
        updatePlanLog(planId, logId, patch) {
          applyDataAction((data) => updatePlanLog(data, planId, logId, patch));
        },
        deletePlanLog(planId, logId) {
          applyDataAction((data) => deletePlanLog(data, planId, logId));
        },
        addLoan(input) {
          applyDataAction((data) => addLoan(data, input, deps.newId));
        },
        updateLoan(id, patch) {
          applyDataAction((data) => updateLoan(data, id, patch));
        },
        deleteLoan(id, options) {
          applyDataAction((data) => deleteLoan(data, id, options));
        },
        addLoanPayment(loanId, input, options) {
          applyDataAction((data) => addLoanPayment(data, loanId, input, { ...options, newId: deps.newId }));
        },
        updateLoanPayment(loanId, paymentId, patch) {
          applyDataAction((data) => updateLoanPayment(data, loanId, paymentId, patch));
        },
        deleteLoanPayment(loanId, paymentId) {
          applyDataAction((data) => deleteLoanPayment(data, loanId, paymentId));
        },
        addGoal(input) {
          applyDataAction((data) => addGoal(data, input, deps.newId));
        },
        updateGoal(id, patch) {
          applyDataAction((data) => updateGoal(data, id, patch));
        },
        deleteGoal(id) {
          applyDataAction((data) => deleteGoal(data, id));
        },
        addHolding(input) {
          applyDataAction((data) => addHolding(data, { ...input, valueAsOf: deps.today() }, deps.newId));
        },
        updateHolding(id, patch) {
          applyDataAction((data) => {
            const current = data.holdings.find((holding) => holding.id === id);
            const valueAsOf = current?.kind === 'manual' && patch.value !== undefined && patch.value !== current.value
              ? deps.today()
              : current?.kind === 'manual' ? current.valueAsOf : undefined;
            return updateHolding(data, id, { ...patch, valueAsOf });
          });
        },
        deleteHolding(id) {
          applyDataAction((data) => deleteHolding(data, id));
        },
        addEfEntry(input, options) {
          applyDataAction((data) => addEfEntry(data, input, { ...options, newId: deps.newId }));
        },
        updateEfEntry(id, patch) {
          applyDataAction((data) => updateEfEntry(data, id, patch));
        },
        deleteEfEntry(id) {
          applyDataAction((data) => deleteEfEntry(data, id));
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
          if (get().recoveryReason === 'newer-version') {
            suppressNextWrite = true;
            try {
              set({ storageError: 'This data was saved by a newer version of the app. Update the app to open it.' });
            } finally {
              suppressNextWrite = false;
            }
            return;
          }
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
