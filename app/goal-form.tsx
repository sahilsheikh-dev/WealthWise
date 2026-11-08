import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { IntegerField } from '../src/components/form/IntegerField';
import { MoneyField } from '../src/components/form/MoneyField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { efBalance, monthlyBaseline } from '../src/domain/ef';
import { emergencyMinimumTarget, effectiveEmergencyTarget } from '../src/domain/goals';
import { makeGoalFormSchema, type GoalFormInput, type GoalFormOutput } from '../src/domain/schemas';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';
import { formatINR } from '../src/lib/format';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function GoalFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const goalId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const { colors } = useTheme();
  const goal = goalId ? data.goals.find((item) => item.id === goalId) : undefined;
  const expenseBaseline = monthlyBaseline(data.transactions, 'expense', today);
  const minimumTarget = emergencyMinimumTarget(expenseBaseline);
  const effectiveTarget = goal?.auto === 'ef'
    ? effectiveEmergencyTarget(goal, expenseBaseline).target
    : goal?.target;
  const locked = goal?.auto === 'ef';
  const schema = useMemo(() => makeGoalFormSchema(today, {
    otherNames: data.goals.filter((item) => item.id !== goalId).map((item) => item.name),
    locked: Boolean(locked),
    existingYear: goal?.year,
    minTarget: minimumTarget,
  }), [data.goals, goalId, goal?.year, locked, minimumTarget, today]);
  const submitting = useRef(false);
  const { control, handleSubmit, formState: { errors, isDirty, isSubmitting, submitCount } } =
    useForm<GoalFormInput, undefined, GoalFormOutput>({
      resolver: zodResolver(schema),
      mode: 'onTouched',
      reValidateMode: 'onChange',
      defaultValues: goal
        ? { name: goal.name, target: String(effectiveTarget ?? goal.target), saved: String(goal.saved), year: String(goal.year) }
        : { name: '', target: '', saved: '0', year: String(Number(today.slice(0, 4)) + 1) },
    });

  const close = () => {
    if (!isDirty) return router.back();
    void confirmAsync({
      title: 'Discard changes?', message: 'Your changes have not been saved.',
      confirmLabel: 'Discard', cancelLabel: 'Keep editing', destructive: true,
    }).then((discard) => { if (discard) router.back(); });
  };
  const save = (values: GoalFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (goal) {
        actions.updateGoal(goal.id, locked
          ? { target: values.target, year: values.year }
          : { name: values.name, target: values.target, saved: values.saved, year: values.year });
      } else {
        actions.addGoal({ name: values.name, target: values.target, saved: values.saved, year: values.year });
      }
      if (!useAppStore.getState().lastError) router.back();
    } finally {
      submitting.current = false;
    }
  };
  const remove = () => {
    if (!goal || locked) return;
    void confirmAsync({
      title: 'Delete goal?', message: `Delete ${goal.name}? This cannot be undone.`,
      confirmLabel: 'Delete', destructive: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      actions.deleteGoal(goal.id);
      if (!useAppStore.getState().lastError) router.back();
    });
  };

  if (goalId && !goal) return (
    <FormScreen title="Goal" onClose={() => router.back()} footer={<Button label="Back" onPress={() => router.back()} />}>
      <EmptyState title="Goal not found" />
    </FormScreen>
  );
  const errorsVisible = submitCount > 0 && Object.keys(errors).length > 0;
  return (
    <FormScreen title="Goal" onClose={close}
      headerAction={goal && !locked ? { label: 'Delete goal', onPress: remove } : undefined}
      footer={(
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button label="Save" icon="save" variant="primary" style={{flex: 1}} disabled={isSubmitting || errorsVisible} onPress={() => {
          if (!submitting.current) void handleSubmit(save)();
        }} />
      </View>
    )}>
      <FormErrorBanner message={lastError} />
      {locked ? (
        <>
          <ReadOnlyRow label="Emergency fund" value={`Current balance ${efBalance(data.efEntries).toLocaleString('en-IN')}`} />
          <ReadOnlyRow label="Saved amount" value="Saved amount follows your Emergency fund balance" />
        </>
      ) : (
        <Controller control={control} name="name" render={({ field }) => (
          <TextField label="Name" accessibilityLabel="Goal name" maxLength={40} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.name?.message} />
        )} />
      )}
      <Controller control={control} name="target" render={({ field }) => (
        <View style={{ gap: 6 }}>
          <MoneyField label="Target amount" accessibilityLabel="Goal target" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.target?.message} />
          {locked ? (
            <AppText style={{ color: colors.text3 }}>
              {minimumTarget > 0
                ? `Minimum: ${formatINR(minimumTarget)} (3 months of your average expenses)`
                : 'Add expenses to calculate your 3-month minimum'}
            </AppText>
          ) : null}
        </View>
      )} />
      {!locked ? (
        <Controller control={control} name="saved" render={({ field }) => (
          <MoneyField label="Saved amount" accessibilityLabel="Goal saved amount" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.saved?.message} />
        )} />
      ) : null}
      <Controller control={control} name="year" render={({ field }) => (
        <IntegerField label="Target year" accessibilityLabel="Goal target year" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.year?.message} />
      )} />
    </FormScreen>
  );
}
