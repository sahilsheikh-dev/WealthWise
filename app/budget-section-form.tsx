import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';

import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { TextField } from '../src/components/form/TextField';
import { ApplyScopeDialog } from '../src/components/ApplyScopeDialog';
import { Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useUIStore } from '../src/data/uiStore';
import { useAppActions } from '../src/data/useAppData';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';

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
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [deleteScopeDialogOpen, setDeleteScopeDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<z.output<typeof budgetSectionFormSchema> | null>(null);

  if (editing && !section) {
    return (
      <FormScreen title="Budget category" onClose={() => router.back()} isDirty={false} footer={null}>
        <EmptyState title="Budget category not found" />
      </FormScreen>
    );
  }

  const remove = async () => {
    if (!section) return;
    const count = data.budgetPlan?.items.filter((item) => item.sectionId === section.id).length ?? 0;
    const confirmed = await confirmAsync({
      title: 'Delete category?',
      message: `This category contains ${count} budget item${count === 1 ? '' : 's'}.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (confirmed) setDeleteScopeDialogOpen(true);
  };

  const applyDelete = (selectedScope: 'month' | 'following') => {
    if (!section) return;
    setDeleteScopeDialogOpen(false);
    const previousPlan = data.budgetPlan;
    const previousMonth = data.monthBudgets?.find((budget) => budget.month === month) ?? null;
    actions.deleteSection(month, section.id, selectedScope, today);
    if (useAppStore.getState().lastError) return;
    setActionToast({
      message: `${section.name} deleted`,
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
    const previousPlan = data.budgetPlan;
    const previousMonth = data.monthBudgets?.find((budget) => budget.month === month) ?? null;
    if (section) {
      actions.renameSection(month, section.id, values.name, selectedScope, today);
    } else {
      actions.addSection(month, { name: values.name, type: values.type }, selectedScope, today);
    }
    if (useAppStore.getState().lastError) return;
    setActionToast({
      message: section ? `${values.name} updated` : `${values.name} added`,
      actionLabel: 'Undo',
      onAction: () => actions.restoreBudgetPlanAndMonth(previousPlan, month, previousMonth),
    });
    router.back();
  };
  const errorCount = Object.keys(errors).length;

  return (
    <>
    <FormScreen
      title={section ? 'Rename category' : 'Add category'}
      onClose={() => router.back()}
      isDirty={isDirty}
      headerAction={section ? { label: 'Delete category', onPress: () => { void remove(); } } : undefined}
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
    </FormScreen>
    <ApplyScopeDialog visible={scopeDialogOpen} onCancel={() => setScopeDialogOpen(false)} onApply={applySave} />
    <ApplyScopeDialog visible={deleteScopeDialogOpen} title="Apply to" onCancel={() => setDeleteScopeDialogOpen(false)} onApply={applyDelete} />
    </>
  );
}
