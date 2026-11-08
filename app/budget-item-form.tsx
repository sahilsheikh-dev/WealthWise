import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { IntegerField } from '../src/components/form/IntegerField';
import { MoneyField } from '../src/components/form/MoneyField';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { Dropdown } from '../src/components/Dropdown';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions } from '../src/data/useAppData';
import { effectiveMonthBudget } from '../src/domain/budget';
import { shiftMonth } from '../src/domain/dates';
import { formatMonth } from '../src/lib/format';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';
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
  if (values.frequency !== 'monthly' && !/^\d{4}-(0[1-9]|1[0-2])$/.test(values.firstDueMonth)) {
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
    },
  });
  const mode = useWatch({ control, name: 'mode' }) ?? 'amount';
  const frequency = useWatch({ control, name: 'frequency' }) ?? 'monthly';
  const scope = useWatch({ control, name: 'scope' }) ?? (requestedScope === 'month' ? 'month' : 'following');
  const firstDueMonths = Array.from({ length: 12 }, (_, index) => shiftMonth(month, index));
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
    const confirmed = await confirmAsync({
      title: 'Delete item?',
      message: `Delete ${item.name} from the selected month range? Transactions will remain unchanged.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    const previousPlan = data.budgetPlan;
    const previousMonth = data.monthBudgets?.find((row) => row.month === month) ?? null;
    actions.deleteBudgetStructureItem(month, item.id, scope, today);
    if (useAppStore.getState().lastError) return;
    setActionToast({
      message: `${item.name} deleted`,
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previousMonth),
    });
    router.back();
  };

  const save = handleSubmit((values) => {
    const previousPlan = data.budgetPlan;
    const previousMonth = data.monthBudgets?.find((row) => row.month === month) ?? null;
    const scope = values.scope;
    if (item) {
      actions.editBudgetStructureItem(month, item.id, {
        name: values.name,
        mode: values.mode,
        value: Number(values.value),
        dueDay: values.day === '' ? null : Number(values.day),
        frequency: values.frequency,
        firstDueMonth: values.frequency === 'monthly' ? null : values.firstDueMonth,
      }, scope, today);
    } else {
      actions.addBudgetItem(month, {
        sectionId,
        name: values.name,
        mode: values.mode,
        value: Number(values.value),
        frequency: values.frequency,
        ...(values.frequency === 'monthly' ? {} : { firstDueMonth: values.firstDueMonth }),
        ...(values.day === '' ? {} : { dueDay: Number(values.day) }),
      }, scope, today);
    }
    if (useAppStore.getState().lastError) return;
    setActionToast({
      message: item ? `${values.name} updated` : `${values.name} added`,
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previousMonth),
    });
    router.back();
  });
  const errorCount = Object.keys(errors).length;

  return (
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
          <TextField
            label="Name"
            accessibilityLabel="Budget item name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={30}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="mode"
        render={({ field }) => (
          <SegmentedControl
            label="Value type"
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
          <MoneyField
            label="Planned amount"
            accessibilityLabel="Planned amount"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.value?.message}
          />
        ) : (
          <TextField
            label="Planned percent"
            accessibilityLabel="Planned percent"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.value?.message}
          />
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
      {frequency === 'monthly' ? null : (
        <>
          <Controller
            control={control}
            name="firstDueMonth"
            render={({ field }) => (
              <Dropdown
                label="First due month"
                accessibilityLabel="Budget item first due month"
                value={field.value}
                options={firstDueMonths.map((value) => ({ value, title: formatMonth(value) }))}
                onChange={field.onChange}
                error={errors.firstDueMonth?.message}
              />
            )}
          />
          <AppText style={[typography.meta, { color: colors.text3 }]}>
            Percent items are only available monthly.
          </AppText>
        </>
      )}
      <Controller
        control={control}
        name="day"
        render={({ field }) => (
          <IntegerField
            label="Due day"
            accessibilityLabel="Due day"
            icon="calendar-outline"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.day?.message}
          />
        )}
      />
      <AppText testID="budget-item-due-day-helper" style={[typography.meta, { color: colors.text3 }]}>
        Day of the month it is due, 1 to 31. Leave empty if there is no fixed day.
      </AppText>
      <Controller
        control={control}
        name="scope"
        render={({ field }) => (
          <SegmentedControl
            label="Apply changes to"
            value={field.value}
            options={[
              { label: 'This month only', value: 'month' },
              { label: 'This and following months', value: 'following' },
            ]}
            onChange={field.onChange}
            error={errors.scope?.message}
          />
        )}
      />
      {submitCount > 0 && errorCount > 0 ? (
        <AppText style={[typography.meta, { color: colors.err }]}>
          Fix {errorCount} {errorCount === 1 ? 'field' : 'fields'}
        </AppText>
      ) : null}
    </FormScreen>
  );
}
