import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';

import { Dropdown } from '../src/components/Dropdown';
import { ApplyScopeDialog } from '../src/components/ApplyScopeDialog';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FieldTitle } from '../src/components/form/FieldTitle';
import { FormScreen } from '../src/components/form/FormScreen';
import { IntegerField } from '../src/components/form/IntegerField';
import { MoneyField } from '../src/components/form/MoneyField';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions } from '../src/data/useAppData';
import { effectiveMonthBudget } from '../src/domain/budget';
import { shiftMonth } from '../src/domain/dates';
import { holdingCapabilities } from '../src/domain/holdingCapabilities';
import { todayISO } from '../src/lib/clock';
import { formatAmount } from '../src/lib/amountDisplay';
import { formatMonth } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const budgetItemFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter an item name.').max(30, 'Keep the name under 30 characters.'),
  mode: z.enum(['amount', 'percent']),
  value: z.string().trim(),
  frequency: z.enum(['monthly', 'quarterly', 'half-yearly', 'yearly']),
  firstDueMonth: z.string(),
  day: z.string(),
  scope: z.enum(['month', 'following']),
  holdingId: z.string(),
}).superRefine((values, context) => {
  const amount = Number(values.value);
  const maximum = values.mode === 'percent' ? 100 : 1_000_000_000;
  if (!values.value || !Number.isFinite(amount) || amount < 0 || amount > maximum) {
    context.addIssue({
      code: 'custom',
      path: ['value'],
      message: values.mode === 'percent'
        ? 'Enter a percent from 0 to 100.'
        : 'Enter an amount from 0 to 1,000,000,000.',
    });
  }
  if (values.day !== '' && (!/^\d+$/.test(values.day) || Number(values.day) < 1 || Number(values.day) > 31)) {
    context.addIssue({ code: 'custom', path: ['day'], message: 'Enter a day from 1 to 31.' });
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(values.firstDueMonth)) {
    context.addIssue({ code: 'custom', path: ['firstDueMonth'], message: 'Choose the first due month.' });
  }
  if (values.mode === 'percent' && values.frequency !== 'monthly') {
    context.addIssue({ code: 'custom', path: ['frequency'], message: 'Percent items can only be monthly.' });
  }
});

type BudgetItemFormInput = z.input<typeof budgetItemFormSchema>;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function isMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function BudgetItemFormScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    month?: string;
    sectionId?: string;
    itemId?: string;
    name?: string;
    scope?: string;
  }>();
  const monthParam = firstParam(params.month);
  const month = isMonthKey(monthParam) ? monthParam : todayISO().slice(0, 7);
  const sectionId = firstParam(params.sectionId);
  const itemId = firstParam(params.itemId);
  const editing = itemId !== '';
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const setActionToast = useUIStore((state) => state.setActionToast);
  const today = todayISO();
  const budget = effectiveMonthBudget(data, month, today).budget;
  const section = budget?.sections.find((item) => item.id === sectionId);
  const item = editing ? budget?.items.find((candidate) => candidate.id === itemId) : undefined;
  const requestedScope = firstParam(params.scope);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting, submitCount },
  } = useForm<BudgetItemFormInput>({
    resolver: zodResolver(budgetItemFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: item?.name ?? firstParam(params.name),
      mode: item?.mode ?? 'amount',
      value: item ? String(item.value) : '',
      frequency: item?.frequency ?? 'monthly',
      firstDueMonth: item?.firstDueMonth ?? month,
      day: item?.dueDay === undefined ? '' : String(item.dueDay),
      scope: requestedScope === 'month' ? 'month' : 'following',
      holdingId: item?.holdingId ?? '',
    },
  });
  const mode = useWatch({ control, name: 'mode' }) ?? 'amount';
  const frequency = useWatch({ control, name: 'frequency' }) ?? 'monthly';
  const holdingId = useWatch({ control, name: 'holdingId' }) ?? '';
  const linkedHolding = data.holdings.find((holding) => holding.id === holdingId);
  const firstDueMonths = Array.from({ length: 25 }, (_, index) => shiftMonth(month, index));
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [deleteScopeDialogOpen, setDeleteScopeDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<z.output<typeof budgetItemFormSchema> | null>(null);
  if (!firstDueMonths.includes(item?.firstDueMonth ?? '')) {
    if (item?.firstDueMonth) firstDueMonths.unshift(item.firstDueMonth);
  }

  if (!section || (editing && !item)) {
    return (
      <FormScreen title={editing ? 'Edit item' : 'Add item'} onClose={() => router.back()} isDirty={false} footer={null}>
        <EmptyState title={section ? 'Budget item not found' : 'Budget section not found'} />
      </FormScreen>
    );
  }

  const remove = async () => {
    if (!item) return;
    setDeleteScopeDialogOpen(true);
  };

  const applyDelete = (selectedScope: 'month' | 'following') => {
    if (!item) return;
    setDeleteScopeDialogOpen(false);
    const previousPlan = data.budgetPlan;
    const previousMonth = data.monthBudgets?.find((row) => row.month === month) ?? null;
    actions.deleteBudgetStructureItem(month, item.id, selectedScope, today);
    if (useAppStore.getState().lastError) return;
    setActionToast({
      message: `${item.name} deleted`,
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previousMonth),
    });
    router.back();
  };

  const save = handleSubmit((values) => {
    setPendingValues(values);
    setScopeDialogOpen(true);
  });

  const applySave = (selectedScope: 'month' | 'following') => {
    setScopeDialogOpen(false);
    const values = pendingValues;
    if (!values) return;
    if (selectedScope === 'month' && values.firstDueMonth > month) {
      setError('firstDueMonth', { type: 'manual', message: 'This month only conflicts with a start month later than the viewed month.' });
      return;
    }
    const previousPlan = data.budgetPlan;
    const previousMonth = data.monthBudgets?.find((row) => row.month === month) ?? null;
    const resolvedLinkedHolding = data.holdings.find((holding) => holding.id === values.holdingId);
    const linkedPlan = resolvedLinkedHolding?.kind === 'plan' ? resolvedLinkedHolding : undefined;
    const resolvedName = values.name;
    const resolvedMode = linkedPlan ? 'amount' : values.mode;
    const resolvedValue = linkedPlan ? linkedPlan.amount : Number(values.value);
    const resolvedFrequency = linkedPlan ? 'monthly' : values.frequency;
    const resolvedFirstDueMonth = linkedPlan ? linkedPlan.trackFrom.slice(0, 7) : values.firstDueMonth;
    const resolvedDueDay = linkedPlan
      ? Number(linkedPlan.trackFrom.slice(8, 10))
      : values.day === '' ? null : Number(values.day);
    if (item) {
      actions.editBudgetStructureItem(month, item.id, {
        name: resolvedName,
        mode: resolvedMode,
        value: resolvedValue,
        dueDay: resolvedDueDay,
        frequency: resolvedFrequency,
        firstDueMonth: resolvedFirstDueMonth,
        holdingId: values.holdingId || null,
      }, selectedScope, today);
    } else {
      actions.addBudgetItem(month, {
        sectionId,
        name: resolvedName,
        mode: resolvedMode,
        value: resolvedValue,
        frequency: resolvedFrequency,
        firstDueMonth: resolvedFirstDueMonth,
        ...(values.holdingId ? { holdingId: values.holdingId } : {}),
        ...(resolvedDueDay === null ? {} : { dueDay: resolvedDueDay }),
      }, selectedScope, today);
    }
    if (useAppStore.getState().lastError) return;
    setActionToast({
      message: item ? `${values.name} updated` : `${values.name} added`,
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previousMonth),
    });
    router.back();
  };
  const errorCount = Object.keys(errors).length;

  return (
    <>
      <FormScreen
      title={item ? 'Edit item' : 'Add item'}
      onClose={() => router.back()}
      isDirty={isDirty}
      headerAction={item ? { label: 'Delete item', onPress: () => { void remove(); } } : undefined}
      footer={
        <Button
          label="Save"
          icon="save"
          variant="primary"
          disabled={isSubmitting || (submitCount > 0 && errorCount > 0)}
          onPress={() => { void save(); }}
        />
      }>
      <FormErrorBanner message={lastError} />
      <AppText style={[typography.meta, { color: colors.text2 }]}>Section · {section.name}</AppText>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <FieldTitle title="Name">
            <TextField
              label="Name"
              accessibilityLabel="Budget item name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              maxLength={30}
              error={errors.name?.message}
            />
          </FieldTitle>
        )}
      />
      {section.type === 'invest' && !section.system ? (
        <Controller
          control={control}
          name="holdingId"
          render={({ field }) => {
            const otherLink = data.budgetPlan?.items.find((candidate) =>
              candidate.id !== itemId && candidate.holdingId === field.value);
            const options = [
              { value: '', title: 'None' },
              ...data.holdings
                .filter((holding) => holdingCapabilities(holding.type).recurring || holding.id === item?.holdingId)
                .map((holding) => ({ value: holding.id, title: holding.name })),
            ];
            return (
              <Dropdown
                label="Linked asset"
                accessibilityLabel="Linked asset"
                value={field.value}
                options={options}
                onChange={field.onChange}
                error={otherLink ? 'This holding is already linked to another budget item.' : errors.holdingId?.message}
              />
            );
          }}
        />
      ) : null}
      {linkedHolding && !holdingCapabilities(linkedHolding.type).recurring ? (
        <AppText style={[typography.meta, { color: colors.text3 }]}>
          Fixed deposits cannot be newly linked to recurring Budget schedules. Clear this existing link to remove it.
        </AppText>
      ) : null}
      {linkedHolding?.kind === 'plan' ? (
        <>
          <AppText style={[typography.meta, { color: colors.text3 }]}>
            The plan schedule is the source. Amount, frequency, due day and start month are read-only.
          </AppText>
          <AppText weight="semibold" style={typography.name}>
            Amount {formatAmount(linkedHolding.amount, 'exact', 1)} · {linkedHolding.frequency} · Starts {formatMonth(linkedHolding.trackFrom.slice(0, 7))}
          </AppText>
        </>
      ) : null}
      {linkedHolding?.kind !== 'plan' ? (
        <>
      <Controller
        control={control}
        name="mode"
        render={({ field }) => (
          <SegmentedControl
          value={field.value}
            options={frequency === 'monthly' ? [
              { label: 'Amount', value: 'amount' },
              { label: 'Percent', value: 'percent' },
            ] : [{ label: 'Amount', value: 'amount' }]}
            onChange={field.onChange}
            error={errors.mode?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="value"
        render={({ field }) => mode === 'amount' ? (
          <FieldTitle title="Planned amount">
            <MoneyField
              label="Planned amount"
              accessibilityLabel="Planned amount"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.value?.message}
            />
          </FieldTitle>
        ) : (
          <FieldTitle title="Planned percent">
            <TextField
              label="Planned percent"
              accessibilityLabel="Planned percent"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.value?.message}
            />
          </FieldTitle>
        )}
      />
      <Controller
        control={control}
        name="frequency"
        render={({ field }) => (
          <Dropdown
            label="Frequency"
            accessibilityLabel="Budget item frequency"
            value={field.value}
            options={[
              { value: 'monthly', title: 'Monthly' },
              ...(mode === 'percent' ? [] : [
                { value: 'quarterly', title: 'Quarterly' },
                { value: 'half-yearly', title: 'Half-yearly' },
                { value: 'yearly', title: 'Yearly' },
              ]),
            ]}
            onChange={field.onChange}
            error={errors.frequency?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="firstDueMonth"
        render={({ field }) => (
          <Dropdown
            label="Start month"
            accessibilityLabel="Budget item start month"
            value={field.value}
            options={firstDueMonths.map((value) => ({ value, title: formatMonth(value) }))}
            onChange={field.onChange}
            error={errors.firstDueMonth?.message}
          />
        )}
      />
      <AppText style={[typography.meta, { color: colors.text3 }]}>
        Earlier months are not offered because past months are frozen.
      </AppText>
        </>
      ) : null}
      <Controller
        control={control}
        name="day"
        render={({ field }) => (
          <FieldTitle title="Due day">
            <IntegerField
              label="Due day"
              accessibilityLabel="Due day"
              icon="calendar-outline"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.day?.message}
            />
          </FieldTitle>
        )}
      />
      <AppText testID="budget-item-due-day-helper" style={[typography.meta, { color: colors.text3 }]}>
        Day of the month it is due, 1 to 31. Leave empty if there is no fixed day.
      </AppText>
      {submitCount > 0 && errorCount > 0 ? (
        <AppText style={[typography.meta, { color: colors.err }]}>
          Fix {errorCount} {errorCount === 1 ? 'field' : 'fields'}
        </AppText>
      ) : null}
      </FormScreen>
      <ApplyScopeDialog visible={scopeDialogOpen} onClose={() => setScopeDialogOpen(false)} onApply={applySave} />
      <ApplyScopeDialog visible={deleteScopeDialogOpen} onClose={() => setDeleteScopeDialogOpen(false)} onApply={applyDelete} />
    </>
  );
}
