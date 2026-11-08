import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import {
  addTransaction, completeOnboarding, deleteTransaction, emptyAppData, updateSettings, updateTransaction,
} from '../domain/actions';
import {
  addPlan, deletePlan, updatePlan,
  type AddPlanInput, type PlanPatch,
} from '../domain/planActions';
import {
  addInvestmentEntry, deleteInvestmentEntry, updateInvestmentEntry,
  type InvestmentEntryInput, type InvestmentEntryPatch,
} from '../domain/investmentActions';
import {
  addLiability, addLiabilityPayment, deleteLiability, deleteLiabilityPayment, updateLiability, updateLiabilityPayment,
  type AddLiabilityInput, type LiabilityPatch, type LiabilityPaymentPatch,
} from '../domain/liabilityActions';
import { addGoal, deleteGoal, updateGoal, type AddGoalInput, type GoalPatch } from '../domain/goalActions';
import {
  addPolicy as addPolicyData,
  deletePolicy as deletePolicyData,
  setPolicyStatus as setPolicyStatusData,
  updatePolicy,
  type PolicyPatch,
} from '../domain/policyActions';
import { setCoverGoalTarget as setCoverGoalTargetData } from '../domain/coverGoals';
import { setGoalLinks } from '../domain/goalLinks';
import {
  allocateSurplus,
  fundShortfall,
  recordMoneyMovement,
  type MoneyMovement,
  type ShortfallAllocation,
  type SurplusAllocation,
} from '../domain/cashFlow';
import { addHolding, confirmHoldingValue, deleteHolding, updateHolding, type HoldingPatch } from '../domain/holdingActions';
import {
  addInstrumentTransaction,
  createMissingTransactions,
  deleteLinkedTransaction,
  linkExistingTransaction,
  updateLinkedTransaction,
  type InstrumentTransactionInput,
  type LinkedTransactionPatch,
} from '../domain/instruments';
import { validateIntegrity } from '../domain/links';
import { monthlyBaseline } from '../domain/ef';
import { ensureEfGoal } from '../domain/goals';
import {
  saveEfPlan,
  setEfAllocation,
  setEfBucketLinks,
  type EfPlanDraft,
} from '../domain/efAllocationActions';
import {
  applyBudgetPlanToMonth,
  clearMonthBudget,
  customizeMonthBudget,
  addSection as addBudgetSectionData,
  addIncomeItem as addBudgetIncomeData,
  renameSection as renameBudgetSectionData,
  changeSectionType as changeBudgetSectionTypeData,
  deleteSection as deleteBudgetSectionData,
  addItem as addBudgetItemData,
  editItem as editBudgetItemStructureData,
  deleteItem as deleteBudgetItemData,
  editBudgetItem as editBudgetItemData,
  editBudgetIncome as editBudgetIncomeData,
  ensureCurrentMonthBudget,
  removeBudgetItem as removeBudgetItemData,
  restoreMonthBudget,
  restoreBudgetPlanAndMonth,
  saveAndApplyBudgetPlan,
  setBudgetPlan,
  setBudgetRepeat,
} from '../domain/budget';
import { resolveEfAllocation, type EfAllocation } from '../domain/efAllocation';
import {
  addLiabilityWithHistory,
  addPlanWithHistory,
  addPolicyWithHistory,
  addPolicyPayment as addPolicyPaymentData,
  clearDue,
  clearDuesThrough,
  clearPastDues,
  undoClearDue,
  undoClearDuesThrough,
  type AddPolicyInput,
  type DueTarget,
  type PastDuesMode,
} from '../domain/dues';
import { SCHEMA_VERSION } from '../domain/schemas';
import { buildDemoData } from '../mock/demoData';
import { createStressTransactions } from '../domain/stressData';
import type {
  AppData, BudgetIncomeItem, BudgetItem, BudgetPlan, BudgetSection, CoverGoalTargetMode, CoverPolicyType, GoalLink, Holding, ISODate, LiabilityPayment, MonthBudget, PolicyPayment, PolicyStatus, Settings, Transaction,
} from '../domain/types';
import type {
  BudgetIncomeInput,
  BudgetIncomeUpdateInput,
  BudgetItemPatch,
  BudgetItemScope,
  BudgetItemSource,
  BudgetItemValues,
} from '../domain/budget';
import { migratePersisted } from './migrate';
import { createSafeStorage } from './safeStorage';
import { useUIStore } from './uiStore';
import { validateImportData } from '../domain/backup';

const PERSIST_NAME = 'wealthwise.app.v1';
const PREIMPORT_KEY = `${PERSIST_NAME}.preimport`;
const META_KEY = 'wealthwise.meta.v1';

export type AppActions = {
  addTransaction: (input: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  addInstrumentTransaction: (input: InstrumentTransactionInput) => void;
  updateLinkedTransaction: (id: string, patch: LinkedTransactionPatch) => void;
  deleteLinkedTransaction: (id: string) => void;
  linkExistingTransaction: (transactionId: string, instrumentId: string, note?: string) => void;
  createMissingTransactions: () => void;
  addPlan: (input: AddPlanInput) => void;
  updatePlan: (id: string, patch: PlanPatch) => void;
  deletePlan: (id: string, options: { linkedTransactions: 'delete' | 'keep' }) => void;
  addInvestmentEntry: (holdingId: string, input: InvestmentEntryInput) => void;
  updateInvestmentEntry: (holdingId: string, entryId: string, patch: InvestmentEntryPatch) => void;
  deleteInvestmentEntry: (holdingId: string, entryId: string) => void;
  clearDue: (target: DueTarget, rowId?: string) => string | undefined;
  clearDuesThrough: (target: DueTarget, dueDate: ISODate) => string[] | undefined;
  clearPastDues: (target: DueTarget, options: {
    mode: 'settle' | 'record';
    balance?: number;
    addSkippedToOpening?: boolean;
  }) => { count: number; amount: number; months: { month: string; amount: number }[] } | undefined;
  undoClearDue: (target: DueTarget, entryId: string) => void;
  undoClearDuesThrough: (target: DueTarget, entryIds: string[]) => void;
  addPlanWithHistory: (input: AddPlanInput, mode: PastDuesMode, addSkippedToOpening?: boolean) => void;
  addLiabilityWithHistory: (input: AddLiabilityInput, mode: PastDuesMode, balance?: number) => void;
  addPolicyWithHistory: (input: AddPolicyInput, mode: PastDuesMode) => void;
  addPolicyPayment: (policyId: string, payment: Omit<PolicyPayment, 'id'>) => void;
  updatePolicy: (id: string, patch: PolicyPatch) => void;
  addPolicy: (input: AddPolicyInput) => void;
  setPolicyStatus: (id: string, status: PolicyStatus) => void;
  deletePolicy: (id: string) => void;
  setCoverGoalTarget: (input: { type: CoverPolicyType; targetMode: CoverGoalTargetMode; targetValue?: number }) => void;
  addLiability: (input: AddLiabilityInput) => void;
  updateLiability: (id: string, patch: LiabilityPatch) => void;
  deleteLiability: (id: string, options: { linkedTransactions: 'delete' | 'keep' }) => void;
  addLiabilityPayment: (liabilityId: string, input: Pick<LiabilityPayment, 'date' | 'amount' | 'kind' | 'note'>) => void;
  updateLiabilityPayment: (liabilityId: string, paymentId: string, patch: LiabilityPaymentPatch) => void;
  deleteLiabilityPayment: (liabilityId: string, paymentId: string) => void;
  addGoal: (input: AddGoalInput) => void;
  updateGoal: (id: string, patch: GoalPatch) => void;
  setGoalLinks: (goalId: string, links: GoalLink[]) => void;
  fundShortfall: (month: string, allocations: ShortfallAllocation[]) => void;
  allocateSurplus: (date: ISODate, allocations: SurplusAllocation[]) => void;
  recordMoneyMovement: (movement: MoneyMovement) => void;
  saveBudgetPlan: (plan: BudgetPlan | null) => void;
  saveAndApplyBudgetPlan: (plan: BudgetPlan, month: string) => void;
  applyBudgetPlan: (month: string) => void;
  setBudgetRepeat: (repeatMonthly: boolean, repeatFrom: string | null) => void;
  customizeMonthBudget: (month: string, input: { incomes: BudgetIncomeItem[]; lines?: { category: string; planned: number; dueDay?: number }[] }, today: ISODate) => void;
  restoreMonthBudget: (month: string, budget: MonthBudget | null) => void;
  restoreBudgetPlanAndMonth: (plan: BudgetPlan | null, month: string, budget: MonthBudget | null) => void;
  editBudgetItem: (
    month: string, source: BudgetItemSource, values: BudgetItemValues, scope: BudgetItemScope, today: ISODate,
  ) => void;
  removeBudgetItem: (month: string, source: BudgetItemSource, scope: BudgetItemScope, today: ISODate) => void;
  addSection: (month: string, input: Pick<BudgetSection, 'name' | 'type'>, scope: BudgetItemScope, today: ISODate) => void;
  renameSection: (month: string, sectionId: string, name: string, scope: BudgetItemScope, today: ISODate) => void;
  changeSectionType: (month: string, sectionId: string, type: BudgetSection['type'], scope: BudgetItemScope, today: ISODate) => void;
  deleteSection: (month: string, sectionId: string, scope: BudgetItemScope, today: ISODate) => void;
  addBudgetItem: (month: string, input: Omit<BudgetItem, 'id'>, scope: BudgetItemScope, today: ISODate) => void;
  addBudgetIncome: (month: string, input: Omit<BudgetIncomeInput, 'id'>, scope: BudgetItemScope, today: ISODate) => void;
  editBudgetIncome: (month: string, incomeId: string, values: BudgetIncomeUpdateInput, scope: BudgetItemScope, today: ISODate) => void;
  editBudgetStructureItem: (month: string, itemId: string, patch: BudgetItemPatch, scope: BudgetItemScope, today: ISODate) => void;
  deleteBudgetStructureItem: (month: string, itemId: string, scope: BudgetItemScope, today: ISODate) => void;
  clearMonthBudget: (month: string) => void;
  ensureCurrentMonthBudget: (today: ISODate) => void;
  deleteGoal: (id: string) => void;
  addHolding: (input: Omit<Extract<Holding, { kind: 'manual' }>, 'id' | 'kind' | 'valueAsOf' | 'logs'>) => void;
  updateHolding: (id: string, patch: HoldingPatch) => void;
  deleteHolding: (id: string, options?: { linkedTransactions: 'delete' | 'keep' }) => void;
  confirmHoldingValue: (id: string) => void;
  setEfAllocation: (allocation: EfAllocation) => void;
  setEfBucketLinks: (bucketId: string, holdingIds: string[]) => void;
  saveEfPlan: (plan: EfPlanDraft) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  completeOnboarding: (profile: { name: string; monthlySalary: number | null }) => void;
  dismissStorageError: () => void;
  resolveRecovery: (action: 'start-fresh') => void;
  retryHydration: () => void;
  getCorruptBackup: () => Promise<string | null>;
  replaceAllData: (data: AppData) => Promise<{ ok: true } | { ok: false; message: string }>;
  undoImport: () => Promise<{ ok: true } | { ok: false; message: string }>;
  eraseAllData: () => Promise<{ ok: true } | { ok: false; message: string }>;
};

export type DevActions = {
  loadDemoData: () => Promise<{ ok: true } | { ok: false; message: string }>;
  loadStressData: () => void;
  simulateCorruption: () => Promise<void>;
};

export type AppStoreState = {
  data: AppData;
  hydrated: boolean;
  status: 'loading' | 'ready' | 'recovery';
  recoveryReason: 'corrupt' | 'newer-version' | 'read-error' | null;
  storageError: string | null;
  lastError: string | null;
  undoImport: { savedAt: ISODate } | null;
  actions: AppActions;
  devActions?: DevActions;
};

export type StoreDependencies = {
  newId: () => string;
  today: () => ISODate;
  reload?: () => void;
  isDev?: boolean;
  removeLockSettings?: () => Promise<void>;
  clearUiMeta?: () => Promise<void>;
  cancelReminders?: () => Promise<void>;
};

export function createAppStore(
  storage: StateStorage,
  deps: StoreDependencies,
): UseBoundStore<StoreApi<AppStoreState>> {
  let useStore: UseBoundStore<StoreApi<AppStoreState>> | undefined;
  let corruptionReason: 'corrupt' | 'newer-version' | 'read-error' | null = null;
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
    {
      blockWrites: () => suppressNextWrite || useStore?.getState().status === 'recovery',
      trackedKey: PERSIST_NAME,
      onReadSuccess: useUIStore.getState().setPersistedBytes,
      onWriteSuccess: useUIStore.getState().setPersistedBytes,
    },
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
        addInstrumentTransaction(input) {
          applyDataAction((data) => addInstrumentTransaction(data, input, deps.newId, deps.today()));
        },
        updateLinkedTransaction(id, patch) {
          applyDataAction((data) => updateLinkedTransaction(data, id, patch, {
            newId: deps.newId,
            today: deps.today(),
          }));
        },
        deleteLinkedTransaction(id) {
          applyDataAction((data) => deleteLinkedTransaction(data, id));
        },
        linkExistingTransaction(transactionId, instrumentId, note) {
          applyDataAction((data) => linkExistingTransaction(data, transactionId, instrumentId, deps.newId, deps.today(), note));
        },
        createMissingTransactions() {
          applyDataAction((data) => createMissingTransactions(data, deps.newId));
        },
        updateSettings(patch) {
          applyDataAction((data) => updateSettings(data, patch));
        },
        completeOnboarding(profile) {
          applyDataAction((data) => completeOnboarding(data, profile));
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
        addInvestmentEntry(holdingId, input) {
          applyDataAction((data) => addInvestmentEntry(data, holdingId, input, deps.newId, deps.today()));
        },
        updateInvestmentEntry(holdingId, entryId, patch) {
          applyDataAction((data) => updateInvestmentEntry(data, holdingId, entryId, patch, deps.today()));
        },
        deleteInvestmentEntry(holdingId, entryId) {
          applyDataAction((data) => deleteInvestmentEntry(data, holdingId, entryId));
        },
        clearDue(target, rowId) {
          let entryId: string | undefined;
          applyDataAction((data) => {
            const result = clearDue(data, target, {
              date: deps.today(),
              newId: deps.newId,
              ...(rowId ? { rowId } : {}),
            });
            entryId = result.entryId;
            return result.data;
          });
          return entryId;
        },
        clearDuesThrough(target, dueDate) {
          let entryIds: string[] | undefined;
          applyDataAction((data) => {
            const result = clearDuesThrough(data, target, dueDate, {
              date: deps.today(),
              newId: deps.newId,
            });
            entryIds = result.entryIds;
            return result.data;
          });
          return entryIds;
        },
        clearPastDues(target, options) {
          let summary: { count: number; amount: number; months: { month: string; amount: number }[] } | undefined;
          applyDataAction((data) => {
            const result = clearPastDues(data, target, options, { asOf: deps.today(), newId: deps.newId });
            summary = result.summary;
            return result.data;
          });
          return summary;
        },
        undoClearDue(target, entryId) {
          applyDataAction((data) => undoClearDue(data, target, entryId));
        },
        undoClearDuesThrough(target, entryIds) {
          applyDataAction((data) => undoClearDuesThrough(data, target, entryIds));
        },
        addPlanWithHistory(input, mode, addSkippedToOpening = true) {
          applyDataAction((data) => addPlanWithHistory(data, input, {
            mode,
            addSkippedToOpening,
            asOf: deps.today(),
            newId: deps.newId,
          }).data);
        },
        addLiabilityWithHistory(input, mode, balance) {
          applyDataAction((data) => addLiabilityWithHistory(data, input, {
            mode,
            balance,
            asOf: deps.today(),
            newId: deps.newId,
          }).data);
        },
        addPolicyWithHistory(input, mode) {
          applyDataAction((data) => addPolicyWithHistory(data, input, {
            mode,
            asOf: deps.today(),
            newId: deps.newId,
          }).data);
        },
        addPolicyPayment(policyId, payment) {
          applyDataAction((data) => addPolicyPaymentData(data, { policyId, payment }, deps.newId).data);
        },
        updatePolicy(id, patch) {
          const previous = get().data;
          applyDataAction((data) => updatePolicy(data, { id, patch }));
          const previousPolicy = previous.policies.find((policy) => policy.id === id);
          if (get().lastError === null && get().data !== previous
            && previousPolicy && patch.status !== undefined && patch.status !== previousPolicy.status) {
            useUIStore.getState().setActionToast({
              message: 'Policy status updated.',
              actionLabel: 'Undo',
              onAction: () => set({ data: previous, lastError: null }),
            });
          }
        },
        addPolicy(input) {
          applyDataAction((data) => addPolicyData(data, {
            ...input,
            id: deps.newId(),
            payments: [],
          }));
        },
        setPolicyStatus(id, status) {
          const previous = get().data;
          applyDataAction((data) => setPolicyStatusData(data, { id, status }));
          if (get().lastError === null && get().data !== previous) {
            useUIStore.getState().setActionToast({
              message: 'Policy status updated.',
              actionLabel: 'Undo',
              onAction: () => set({ data: previous, lastError: null }),
            });
          }
        },
        deletePolicy(id) {
          const previous = get().data;
          applyDataAction((data) => deletePolicyData(data, { id }));
          if (get().lastError === null && get().data !== previous) {
            useUIStore.getState().setActionToast({
              message: 'Policy deleted.',
              actionLabel: 'Undo',
              onAction: () => set({ data: previous, lastError: null }),
            });
          }
        },
        setCoverGoalTarget(input) {
          const previous = get().data;
          applyDataAction((data) => setCoverGoalTargetData(data, input));
          if (get().lastError === null && get().data !== previous) {
            useUIStore.getState().setActionToast({
              message: 'Cover goal updated.',
              actionLabel: 'Undo',
              onAction: () => set({ data: previous, lastError: null }),
            });
          }
        },
        addLiability(input) {
          applyDataAction((data) => addLiability(data, input, deps.newId));
        },
        updateLiability(id, patch) {
          applyDataAction((data) => updateLiability(data, id, patch));
        },
        deleteLiability(id, options) {
          applyDataAction((data) => deleteLiability(data, id, options));
        },
        addLiabilityPayment(liabilityId, input) {
          applyDataAction((data) => addLiabilityPayment(data, liabilityId, input, { newId: deps.newId }));
        },
        updateLiabilityPayment(liabilityId, paymentId, patch) {
          applyDataAction((data) => updateLiabilityPayment(data, liabilityId, paymentId, patch));
        },
        deleteLiabilityPayment(liabilityId, paymentId) {
          applyDataAction((data) => deleteLiabilityPayment(data, liabilityId, paymentId));
        },
        addGoal(input) {
          applyDataAction((data) => addGoal(data, input, deps.newId));
        },
        updateGoal(id, patch) {
          applyDataAction((data) => updateGoal(data, id, patch, {
            expenseBaseline: monthlyBaseline(data.transactions, 'expense', deps.today()),
          }));
        },
        setGoalLinks(goalId, links) {
          applyDataAction((data) => setGoalLinks(data, goalId, links));
        },
        fundShortfall(month, allocations) {
          applyDataAction((data) => fundShortfall(data, { month, allocations }, deps.newId));
        },
        allocateSurplus(date, allocations) {
          applyDataAction((data) => allocateSurplus(data, { date, allocations }, deps.newId, deps.today()));
        },
        recordMoneyMovement(movement) {
          applyDataAction((data) => recordMoneyMovement(data, movement, deps.newId, deps.today()));
        },
        saveBudgetPlan(plan) {
          applyDataAction((data) => setBudgetPlan(data, plan));
        },
        saveAndApplyBudgetPlan(plan, month) {
          applyDataAction((data) => saveAndApplyBudgetPlan(data, plan, month, {
            newId: deps.newId,
            today: deps.today(),
          }));
        },
        applyBudgetPlan(month) {
          applyDataAction((data) => applyBudgetPlanToMonth(data, month, {
            newId: deps.newId,
            today: deps.today(),
          }));
        },
        setBudgetRepeat(repeatMonthly, repeatFrom) {
          applyDataAction((data) => setBudgetRepeat(data, repeatMonthly, repeatFrom));
        },
        customizeMonthBudget(month, input, today) {
          applyDataAction((data) => customizeMonthBudget(data, month, input, today));
        },
        restoreMonthBudget(month, budget) {
          applyDataAction((data) => restoreMonthBudget(data, month, budget));
        },
        restoreBudgetPlanAndMonth(plan, month, budget) {
          applyDataAction((data) => restoreBudgetPlanAndMonth(data, plan, month, budget));
        },
        editBudgetItem(month, source, values, scope, today) {
          applyDataAction((data) => editBudgetItemData(data, month, source, values, scope, today));
        },
        removeBudgetItem(month, source, scope, today) {
          applyDataAction((data) => removeBudgetItemData(data, month, source, scope, today));
        },
        addSection(month, input, scope, today) {
          applyDataAction((data) => addBudgetSectionData(data, month, { ...input, id: deps.newId() }, scope, today));
        },
        renameSection(month, sectionId, name, scope, today) {
          applyDataAction((data) => renameBudgetSectionData(data, month, { sectionId, name }, scope, today));
        },
        changeSectionType(month, sectionId, type, scope, today) {
          applyDataAction((data) => changeBudgetSectionTypeData(data, month, { sectionId, type }, scope, today));
        },
        deleteSection(month, sectionId, scope, today) {
          applyDataAction((data) => deleteBudgetSectionData(data, month, { sectionId }, scope, today));
        },
        addBudgetItem(month, input, scope, today) {
          applyDataAction((data) => addBudgetItemData(data, month, { ...input, id: deps.newId() }, scope, today));
        },
        addBudgetIncome(month, input, scope, today) {
          applyDataAction((data) => addBudgetIncomeData(data, month, { ...input, id: deps.newId() }, scope, today));
        },
        editBudgetIncome(month, incomeId, values, scope, today) {
          applyDataAction((data) => editBudgetIncomeData(data, month, { incomeId, values }, scope, today));
        },
        editBudgetStructureItem(month, itemId, patch, scope, today) {
          applyDataAction((data) => editBudgetItemStructureData(data, month, { itemId, patch }, scope, today));
        },
        deleteBudgetStructureItem(month, itemId, scope, today) {
          applyDataAction((data) => deleteBudgetItemData(data, month, { itemId }, scope, today));
        },
        clearMonthBudget(month) {
          applyDataAction((data) => clearMonthBudget(data, month));
        },
        ensureCurrentMonthBudget(today) {
          applyDataAction((data) => ensureCurrentMonthBudget(data, today, deps.newId));
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
        deleteHolding(id, options) {
          applyDataAction((data) => deleteHolding(data, id, options));
        },
        confirmHoldingValue(id) {
          applyDataAction((data) => confirmHoldingValue(data, id, deps.today()));
        },
        setEfAllocation(allocation) {
          applyDataAction((data) => setEfAllocation(data, allocation));
        },
        setEfBucketLinks(bucketId, holdingIds) {
          applyDataAction((data) => setEfBucketLinks(data, bucketId, holdingIds));
        },
        saveEfPlan(plan) {
          applyDataAction((data) => saveEfPlan(data, plan, deps.newId));
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
          const reason = get().recoveryReason;
          if (reason === 'newer-version' || reason === 'read-error') {
            suppressNextWrite = true;
            try {
              set({
                storageError: reason === 'newer-version'
                  ? 'This data was saved by a newer version of the app. Update the app to open it.'
                  : "Your saved data couldn't be read right now. It has not been changed.",
              });
            } finally {
              suppressNextWrite = false;
            }
            return;
          }
          if (reason !== 'corrupt') return;
          corruptionReason = null;
          set({
            data: emptyAppData(deps.today()),
            status: 'ready',
            recoveryReason: null,
            storageError: null,
            lastError: null,
          });
        },
        retryHydration() {
          corruptionReason = null;
          suppressNextWrite = true;
          try {
            set({ status: 'loading', recoveryReason: null, storageError: null });
          } finally {
            suppressNextWrite = false;
          }
          void store.persist.rehydrate();
        },
        async getCorruptBackup() {
          return await storage.getItem(`${PERSIST_NAME}.corrupt.latest`);
        },
        async replaceAllData(importedData) {
          if (get().status !== 'ready') {
            return { ok: false, message: 'Data can only be replaced after the app has loaded.' };
          }
          const validated = validateImportData(importedData);
          if (!validated.ok) {
            return { ok: false, message: 'This data cannot be imported safely.' };
          }
          const today = deps.today();
          try {
            await storage.setItem(PREIMPORT_KEY, JSON.stringify({ savedAt: today, data: get().data }));
          } catch {
            return { ok: false, message: 'Your current data could not be saved for undo. Nothing was replaced.' };
          }
          const expenseBaseline = monthlyBaseline(validated.data.transactions, 'expense', today);
          const data = validated.data.goals.some((goal) => goal.auto === 'ef')
            ? validated.data
            : {
              ...validated.data,
              goals: ensureEfGoal(validated.data.goals, { expenseBaseline, asOf: today }),
            };
          set({ data, undoImport: { savedAt: today }, lastError: null });
          return { ok: true };
        },
        async undoImport() {
          let raw: string | null;
          try {
            raw = await storage.getItem(PREIMPORT_KEY);
          } catch {
            return { ok: false, message: 'The saved undo copy could not be read.' };
          }
          if (raw === null) return { ok: false, message: 'There is no saved import to undo.' };
          let snapshot: unknown;
          try {
            snapshot = JSON.parse(raw);
          } catch {
            return { ok: false, message: 'The saved undo copy is unreadable.' };
          }
          if (typeof snapshot !== 'object' || snapshot === null || !('data' in snapshot)) {
            return { ok: false, message: 'The saved undo copy is invalid.' };
          }
          const validated = validateImportData(snapshot.data);
          if (!validated.ok) return { ok: false, message: 'The saved undo copy is invalid and cannot be restored.' };
          set({ data: validated.data, undoImport: null, lastError: null });
          try {
            await storage.removeItem(PREIMPORT_KEY);
          } catch {
            return { ok: false, message: 'The previous data was restored, but the undo copy could not be removed.' };
          }
          return { ok: true };
        },
        async eraseAllData() {
          try {
            await deps.cancelReminders?.();
            await storage.removeItem(PERSIST_NAME);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v1`);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v2`);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v3`);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v4`);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v5`);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v6`);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v7`);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v8`);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v9`);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v10`);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v11`);
            await storage.removeItem(`${PERSIST_NAME}.premigration.v12`);
            await storage.removeItem(`${PERSIST_NAME}.prerepair-efallocation`);
            await storage.removeItem(PREIMPORT_KEY);
            await storage.removeItem(`${PERSIST_NAME}.corrupt.latest`);
            await storage.removeItem(`${PERSIST_NAME}.corrupt.previous`);
            if (deps.clearUiMeta) await deps.clearUiMeta();
            else await storage.removeItem(META_KEY);
            await deps.removeLockSettings?.();
          } catch {
            return { ok: false, message: 'Some saved data could not be erased. Please try again.' };
          }
          set({
            data: emptyAppData(deps.today()),
            status: 'ready',
            recoveryReason: null,
            storageError: null,
            lastError: null,
            undoImport: null,
          });
          return { ok: true };
        },
      };
      const state: AppStoreState = {
        data: emptyAppData(deps.today()),
        hydrated: false,
        status: 'loading',
        recoveryReason: null,
        storageError: null,
        lastError: null,
        undoImport: null,
        actions,
        ...(deps.isDev ?? (typeof __DEV__ !== 'undefined' && __DEV__) ? {
          devActions: {
            loadDemoData() {
              return actions.replaceAllData(buildDemoData(deps.today()));
            },
            loadStressData() {
              const transactions = createStressTransactions(deps.today(), deps.newId);
              set({ data: { ...get().data, transactions } });
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
      name: PERSIST_NAME,
      version: SCHEMA_VERSION,
      storage: jsonStorage!,
      partialize: (state) => ({ data: state.data }),
      migrate: (persisted, version) => migratePersisted(persisted, version, {
        today: deps.today(),
        newId: deps.newId,
      }),
      onRehydrateStorage: () => async (state, error) => {
        const storeApi = useStore!;
        if (error) {
          corruptionReason = 'read-error';
          storeApi.setState({
            status: 'recovery',
            recoveryReason: 'read-error',
            storageError: "Your saved data couldn't be read right now. It has not been changed.",
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
        const allocationResolution = resolveEfAllocation(data);
        const allocationNeedsRepair = allocationResolution.repaired;
        if (allocationNeedsRepair) {
          data = { ...data, efAllocation: allocationResolution.allocation };
        }
        const today = deps.today();
        const beforeEnsure = data;
        data = ensureCurrentMonthBudget(data, today, deps.newId);
        const budgetWasEnsured = data !== beforeEnsure;
        let undoImport: { savedAt: ISODate } | null = null;
        try {
          const rawSnapshot = await storage.getItem(PREIMPORT_KEY);
          if (rawSnapshot !== null) {
            const snapshot: unknown = JSON.parse(rawSnapshot);
            if (
              typeof snapshot === 'object' && snapshot !== null && 'savedAt' in snapshot &&
              typeof snapshot.savedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(snapshot.savedAt)
            ) {
              undoImport = { savedAt: snapshot.savedAt };
            }
          }
        } catch {
          undoImport = null;
        }
        suppressNextWrite = true;
        try {
          storeApi.setState({ data, undoImport, hydrated: true, status: 'ready' });
        } finally {
          suppressNextWrite = false;
        }
        if (budgetWasEnsured || allocationNeedsRepair) storeApi.setState({ data });
      },
    },
  ));
  useStore = store;
  return store;
}
