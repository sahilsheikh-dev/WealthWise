import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FieldTitle } from '../src/components/form/FieldTitle';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { emergencyFundBaseline } from '../src/domain/ef';
import { emergencyMinimumTarget, effectiveEmergencyTarget } from '../src/domain/goals';
import { makeEmergencyFundTargetFormSchema } from '../src/domain/schemas';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

type TargetFormInput = { target: string };
type TargetFormOutput = { target: number };

export default function EmergencyFundTargetFormScreen() {
  const { colors } = useTheme();
  const state = useAppStore((current) => current);
  const { data, lastError } = state;
  const today = useMemo(() => todayISO(), []);
  const baseline = emergencyFundBaseline(data.transactions, data.settings.monthlySalary, today).amount;
  const minimumTarget = emergencyMinimumTarget(baseline);
  const goal = data.goals.find((item) => item.auto === 'ef');
  const schema = useMemo(() => makeEmergencyFundTargetFormSchema(minimumTarget), [minimumTarget]);
  const { control, handleSubmit, formState: { errors, isDirty, isSubmitting, submitCount } } =
    useForm<TargetFormInput, undefined, TargetFormOutput>({
      resolver: zodResolver(schema),
      mode: 'onTouched',
      reValidateMode: 'onChange',
      defaultValues: {
        target: goal
          ? String(effectiveEmergencyTarget(goal, baseline).target)
          : String(Math.max(0.01, minimumTarget)),
      },
    });
  const targetValue = useWatch({ control, name: 'target' });
  const numericTarget = Number(targetValue);
  const targetIsValid = Number.isFinite(numericTarget)
    && numericTarget >= Math.max(0.01, minimumTarget)
    && numericTarget <= 10_000_000_000
    && Math.abs(numericTarget * 100 - Math.round(numericTarget * 100)) < 0.00001;
  const errorsVisible = submitCount > 0 && Object.keys(errors).length > 0;

  const save = handleSubmit(({ target }) => {
    state.actions.setEmergencyFundTarget(target);
    if (!useAppStore.getState().lastError) router.back();
  });

  if (!goal) {
    return (
      <FormScreen title="Emergency fund target" onClose={() => router.back()} isDirty={false} footer={null}>
        <EmptyState title="Emergency fund not found" />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Emergency fund target"
      onClose={() => router.back()}
      isDirty={isDirty}
      footer={(
        <View style={styles.footer}>
          <Button
            label="Save"
            icon="save"
            variant="primary"
            style={styles.saveButton}
            disabled={isSubmitting || errorsVisible || !targetIsValid}
            onPress={() => { void save(); }}
          />
        </View>
      )}
    >
      <FormErrorBanner message={lastError} />
      <Controller control={control} name="target" render={({ field }) => (
        <FieldTitle title="Target amount">
          <MoneyField
            label="Target amount"
            accessibilityLabel="Emergency fund target"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.target?.message}
          />
        </FieldTitle>
      )} />
      {minimumTarget > 0 ? (
        <AppText style={[typography.meta, { color: colors.text3 }]}>
          Minimum: {formatAmount(minimumTarget, 'exact', 1)} (3 months of cover)
        </AppText>
      ) : (
        <AppText style={[typography.meta, { color: colors.text3 }]}>
          Add monthly expenses or income to calculate your three-month minimum.
        </AppText>
      )}
      <View style={styles.preview}>
        <AppText style={[typography.meta, { color: colors.text3 }]}>Effective target</AppText>
        <AmountText value={Math.max(numericTarget || 0, minimumTarget)} tier="row" weight="semibold" />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  saveButton: { flex: 1 },
  preview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
});
