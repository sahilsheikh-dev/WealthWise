import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { IconButton } from '../src/components/IconButton';
import { IntegerField } from '../src/components/form/IntegerField';
import { MoneyField } from '../src/components/form/MoneyField';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { efBalance, monthlyBaseline } from '../src/domain/ef';
import { emergencyMinimumTarget, effectiveEmergencyTarget } from '../src/domain/goals';
import { linkableInstruments } from '../src/domain/goalLinks';
import { makeGoalFormSchema, type GoalFormInput, type GoalFormOutput } from '../src/domain/schemas';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';
import { formatAmount } from '../src/lib/amountDisplay';
import { useTheme } from '../src/theme/useTheme';
import { typography } from '../src/theme/tokens';

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
  const [pickerVisible, setPickerVisible] = useState(false);
  const { control, handleSubmit, setValue, formState: { errors, isDirty, isSubmitting, submitCount } } =
    useForm<GoalFormInput, undefined, GoalFormOutput>({
      resolver: zodResolver(schema),
      mode: 'onTouched',
      reValidateMode: 'onChange',
      defaultValues: goal
        ? {
          name: goal.name,
          target: String(effectiveTarget ?? goal.target),
          saved: String(goal.saved),
          year: String(goal.year),
          links: goal.links.map((link) => ({ instrumentId: link.instrumentId, share: String(link.share) })),
        }
        : { name: '', target: '', saved: '0', year: String(Number(today.slice(0, 4)) + 1), links: [] },
    });
  const links = useWatch({ control, name: 'links' }) ?? [];
  const instruments = useMemo(() => linkableInstruments(data, today), [data, today]);

  const save = (values: GoalFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (goal) {
        actions.updateGoal(goal.id, locked
          ? { target: values.target, year: values.year }
          : { name: values.name, target: values.target, saved: values.saved, year: values.year, links: values.links });
      } else {
        actions.addGoal({
          name: values.name,
          target: values.target,
          saved: values.saved,
          year: values.year,
          links: values.links,
        });
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
    <FormScreen title="Goal" onClose={() => router.back()} isDirty={false} footer={<Button label="Back" onPress={() => router.back()} />}>
      <EmptyState title="Goal not found" />
    </FormScreen>
  );
  const errorsVisible = submitCount > 0 && Object.keys(errors).length > 0;
  return (
    <FormScreen title="Goal" onClose={() => router.back()} isDirty={isDirty}
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
          <ReadOnlyRow label="Emergency fund" value={`Current balance ${formatAmount(efBalance(data.efEntries), 'exact', 1)}`} />
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
                ? `Minimum: ${formatAmount(minimumTarget, 'exact', 1)} (3 months of your average expenses)`
                : 'Add expenses to calculate your 3-month minimum'}
            </AppText>
          ) : null}
        </View>
      )} />
      {!locked && links.length > 0 ? (
        <View style={styles.linkSection}>
          <AppText weight="semibold">Linked assets</AppText>
          <AppText style={{ color: colors.text3 }}>Saved amount follows the linked assets</AppText>
          <AppText style={{ color: colors.text3 }}>Manual holdings are assumed flat in projections.</AppText>
          {links.map((link, index) => {
            const instrument = instruments.find((item) => item.id === link.instrumentId);
            return (
              <View key={link.instrumentId} style={styles.linkRow}>
                <View style={styles.linkName}>
                  <AppText weight="medium">{instrument?.name ?? 'Unavailable asset'}</AppText>
                  <AppText style={{ color: colors.text3 }}>
                    Current value {formatAmount(instrument?.value ?? 0, 'exact', 1)}
                  </AppText>
                </View>
                <Controller control={control} name={`links.${index}.share`} render={({ field }) => (
                  <TextField
                    label="Share %"
                    accessibilityLabel={`Share of ${instrument?.name ?? 'asset'} for this goal`}
                    value={field.value ?? ''}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.links?.[index]?.share?.message}
                  />
                )} />
                <IconButton
                  icon="x"
                  label={`Remove ${instrument?.name ?? 'asset'} from goal`}
                  onPress={() => {
                    const next = links.filter((_, currentIndex) => currentIndex !== index);
                    setValue('links', next, { shouldDirty: true, shouldValidate: true });
                  }}
                />
              </View>
            );
          })}
          <Button label="Link an asset" icon="plus" onPress={() => setPickerVisible(true)} />
        </View>
      ) : null}
      {!locked && links.length === 0 ? (
        <>
          <Controller control={control} name="saved" render={({ field }) => (
            <MoneyField label="Saved amount" accessibilityLabel="Goal saved amount" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.saved?.message} />
          )} />
          <Button label="Link an asset" icon="plus" onPress={() => setPickerVisible(true)} />
        </>
      ) : null}
      <Controller control={control} name="year" render={({ field }) => (
        <IntegerField label="Target year" accessibilityLabel="Goal target year" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.year?.message} />
      )} />
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.picker, { backgroundColor: colors.surface }]}>
            <AppText weight="bold" style={typography.h1}>Link an asset</AppText>
            <ScrollView>
              {instruments.filter((instrument) => !links.some((link) => link.instrumentId === instrument.id))
                .map((instrument) => {
                  const selectedShare = goal?.links.find((link) => link.instrumentId === instrument.id)?.share ?? 0;
                  const freeShare = Math.min(100, instrument.freeShare + selectedShare);
                  return (
                    <Pressable
                      key={instrument.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Link ${instrument.name}, current value ${formatAmount(instrument.value, 'exact', 1)}, ${freeShare}% available`}
                      onPress={() => {
                        if (freeShare < 0.1) return;
                        setValue('links', [...links, {
                          instrumentId: instrument.id,
                          share: String(freeShare),
                        }], { shouldDirty: true, shouldValidate: true });
                        setPickerVisible(false);
                      }}
                      style={[styles.pickerRow, { borderBottomColor: colors.border }]}
                    >
                      <View style={{ flex: 1 }}>
                        <AppText weight="semibold">{instrument.name}</AppText>
                        <AppText style={{ color: colors.text3 }}>
                          {formatAmount(instrument.value, 'exact', 1)} · {freeShare}% free
                        </AppText>
                      </View>
                    </Pressable>
                  );
                })}
            </ScrollView>
            <Button label="Done" onPress={() => setPickerVisible(false)} />
          </View>
        </View>
      </Modal>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  linkSection: { gap: 8 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkName: { flex: 1, gap: 2 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
  picker: { maxHeight: '80%', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 },
  pickerRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
});
