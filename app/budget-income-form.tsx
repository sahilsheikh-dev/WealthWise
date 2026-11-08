import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Dropdown, type DropdownOption } from '../src/components/Dropdown';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
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
import { EARNED_INCOME_CATEGORIES } from '../src/domain/types';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const budgetIncomeFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter an income name.').max(40, 'Keep the name under 40 characters.'),
  amount: z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, 'Enter a valid income amount.')
    .transform(Number).pipe(z.number().positive().max(1_000_000_000)),
  day: z.string(),
  category: z.enum(EARNED_INCOME_CATEGORIES),
  scope: z.enum(['month', 'following']),
}).superRefine((values, context) => {
  if (values.day !== '' && (!/^\d+$/.test(values.day) || Number(values.day) < 1 || Number(values.day) > 31)) {
    context.addIssue({ code: 'custom', path: ['day'], message: 'Enter a day from 1 to 31.' });
  }
});

type BudgetIncomeFormInput = z.input<typeof budgetIncomeFormSchema>;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function isMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

const incomeCategoryOptions: readonly DropdownOption[] = EARNED_INCOME_CATEGORIES.map((category) => ({
  value: category,
  title: category,
}));

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function BudgetIncomeFormScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    month?: string;
    incomeId?: string;
    name?: string;
    category?: string;
    amount?: string;
    day?: string;
    scope?: string;
  }>();
  const monthParam = firstParam(params.month);
  const month = isMonthKey(monthParam) ? monthParam : todayISO().slice(0, 7);
  const incomeId = firstParam(params.incomeId);
  const editing = incomeId !== '';
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const setActionToast = useUIStore((state) => state.setActionToast);
  const today = todayISO();
  const income = editing
    ? effectiveMonthBudget(data, month, today).budget?.incomes.find((item) => item.id === incomeId)
    : undefined;
  const requestedCategory = firstParam(params.category);
  const initialCategory = EARNED_INCOME_CATEGORIES.find((category) => category === requestedCategory);
  const requestedScope = firstParam(params.scope);
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, submitCount },
  } = useForm<BudgetIncomeFormInput, undefined, z.output<typeof budgetIncomeFormSchema>>({
    resolver: zodResolver(budgetIncomeFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: income?.name ?? firstParam(params.name),
      amount: income ? String(income.amount) : firstParam(params.amount),
      day: income?.day !== undefined
        ? String(income.day)
        : firstParam(params.day),
      category: income?.category ?? initialCategory ?? 'Salary',
      scope: requestedScope === 'month' ? 'month' : 'following',
    },
  });
  const scope = useWatch({ control, name: 'scope' }) ?? (requestedScope === 'month' ? 'month' : 'following');

  if (editing && !income) {
    return (
      <FormScreen title="Edit income" onClose={() => router.back()} isDirty={false} footer={null}>
        <EmptyState title="Budget income not found" />
      </FormScreen>
    );
  }

  const remove = async () => {
    if (!income) return;
    const confirmed = await confirmAsync({
      title: 'Delete income?',
      message: `Delete ${income.name} from the selected month range? Transactions will remain unchanged.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    const previousPlan = data.budgetPlan;
    const previousMonth = data.monthBudgets?.find((row) => row.month === month) ?? null;
    actions.removeBudgetItem(month, {
      kind: 'income',
      incomeId: income.id,
      category: income.category,
    }, scope, today);
    if (useAppStore.getState().lastError) return;
    setActionToast({
      message: `${income.name} deleted`,
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previousMonth),
    });
    router.back();
  };

  const save = handleSubmit((values) => {
    const previousPlan = data.budgetPlan;
    const previousMonth = data.monthBudgets?.find((row) => row.month === month) ?? null;
    const updatedValues = {
      name: values.name,
      amount: values.amount,
      category: values.category,
      ...(values.day === '' ? {} : { day: Number(values.day) }),
    };
    if (income) {
      actions.editBudgetIncome(month, income.id, updatedValues, values.scope, today);
    } else {
      actions.addBudgetIncome(month, updatedValues, values.scope, today);
    }
    if (useAppStore.getState().lastError) return;
    setActionToast({
      message: income ? `${values.name} updated` : `${values.name} added`,
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previousMonth),
    });
    router.back();
  });
  const errorCount = Object.keys(errors).length;

  return (
    <FormScreen
      title={income ? 'Edit income' : 'Add income'}
      onClose={() => router.back()}
      isDirty={isDirty}
      headerAction={income ? { label: 'Delete income', onPress: () => { void remove(); } } : undefined}
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
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            label="Name"
            accessibilityLabel="Income name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={40}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <MoneyField
            label="Amount"
            accessibilityLabel="Income amount"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.amount?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="day"
        render={({ field }) => (
          <IntegerField
            label="Day"
            accessibilityLabel="Income day"
            icon="calendar-outline"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.day?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <Dropdown
            label="Category"
            accessibilityLabel="Income category"
            value={field.value}
            options={incomeCategoryOptions}
            onChange={field.onChange}
            error={errors.category?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="scope"
        render={({ field }) => (
          <SegmentedControl
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
