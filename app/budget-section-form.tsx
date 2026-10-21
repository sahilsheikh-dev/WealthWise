import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions } from '../src/data/useAppData';
import { todayISO } from '../src/lib/clock';

const budgetSectionFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a section name.').max(30, 'Keep the name under 30 characters.'),
  type: z.enum(['spend', 'invest']),
  scope: z.enum(['month', 'following']),
});

type BudgetSectionFormInput = z.input<typeof budgetSectionFormSchema>;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function isMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function BudgetSectionFormScreen() {
  const params = useLocalSearchParams<{
    month?: string;
    sectionId?: string;
    name?: string;
    type?: string;
    scope?: string;
  }>();
  const monthParam = firstParam(params.month);
  const month = isMonthKey(monthParam) ? monthParam : todayISO().slice(0, 7);
  const sectionId = firstParam(params.sectionId);
  const editing = sectionId !== '';
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const setActionToast = useUIStore((state) => state.setActionToast);
  const section = editing
    ? data.monthBudgets?.find((budget) => budget.month === month)?.sections.find((item) => item.id === sectionId)
      ?? data.budgetPlan?.sections.find((item) => item.id === sectionId)
    : undefined;
  const requestedType = firstParam(params.type);
  const requestedScope = firstParam(params.scope);
  const defaultScope = requestedScope === 'month' ? 'month' : 'following';
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, submitCount },
  } = useForm<BudgetSectionFormInput>({
    resolver: zodResolver(budgetSectionFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: section?.name ?? firstParam(params.name),
      type: section?.type ?? (requestedType === 'invest' ? 'invest' : 'spend'),
      scope: defaultScope,
    },
  });
  const today = todayISO();

  if (editing && !section) {
    return (
      <FormScreen title="Budget category" onClose={() => router.back()} isDirty={false} footer={null}>
        <EmptyState title="Budget category not found" />
      </FormScreen>
    );
  }

  const save = handleSubmit((values) => {
    const previousPlan = data.budgetPlan;
    const previousMonth = data.monthBudgets?.find((budget) => budget.month === month) ?? null;
    if (section) {
      actions.renameSection(month, section.id, values.name, values.scope, today);
    } else {
      actions.addSection(month, { name: values.name, type: values.type }, values.scope, today);
    }
    if (useAppStore.getState().lastError) return;
    setActionToast({
      message: section ? `${values.name} updated` : `${values.name} added`,
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previousMonth),
    });
    router.back();
  });
  const errorCount = Object.keys(errors).length;

  return (
    <FormScreen
      title={section ? 'Rename category' : 'Add category'}
      onClose={() => router.back()}
      isDirty={isDirty}
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
            accessibilityLabel="Budget category name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={30}
            error={errors.name?.message}
          />
        )}
      />
      {!section ? (
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <SegmentedControl
              value={field.value}
              options={[
                { label: 'Spend', value: 'spend' },
                { label: 'Invest', value: 'invest' },
              ]}
              onChange={field.onChange}
              error={errors.type?.message}
            />
          )}
        />
      ) : null}
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
    </FormScreen>
  );
}
