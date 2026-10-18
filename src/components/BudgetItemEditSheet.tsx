import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { makeBudgetItemEditSchema } from '../domain/schemas';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/tokens';
import { AppText, Button } from './ui';
import { IntegerField } from './form/IntegerField';
import { MoneyField } from './form/MoneyField';
import { SegmentedControl } from './form/SegmentedControl';

const editSchema = makeBudgetItemEditSchema();
type EditFormInput = z.input<typeof editSchema>;
type EditFormOutput = z.output<typeof editSchema>;

export function BudgetItemEditSheet({
  visible,
  title,
  incomeDetails,
  amount,
  day,
  laterCustomMonths,
  onClose,
  onSave,
  onRemove,
}: {
  visible: boolean;
  title: string;
  incomeDetails?: { name: string; category: string };
  amount: number;
  day?: number;
  laterCustomMonths: number;
  onClose: () => void;
  onSave: (values: EditFormOutput) => boolean;
  onRemove: (scope: EditFormOutput['scope']) => boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<
    EditFormInput,
    undefined,
    EditFormOutput
  >({
    resolver: zodResolver(editSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { amount: String(amount), day: day === undefined ? '' : String(day), scope: 'month' },
  });
  const scope = useWatch({ control, name: 'scope' }) ?? 'month';

  const save = handleSubmit((values) => {
    if (onSave(values)) onClose();
  });

  const remove = () => {
    if (onRemove(scope)) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="budget-item-edit-modal">
      <View style={styles.overlay} testID="budget-item-edit-overlay">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close budget item editor"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="budget-item-edit-backdrop" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}>
          <View
            testID="budget-item-edit-sheet"
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) },
            ]}>
            <View style={styles.header}>
              <AppText weight="bold" style={[typography.name, styles.heading]}>{title}</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close budget item editor"
                onPress={onClose}
                style={styles.closeButton}>
                <Feather name="x" size={20} color={colors.text2} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.fields}>
              {incomeDetails ? (
                <View style={styles.readOnlyDetails}>
                  <View>
                    <AppText style={[typography.meta, { color: colors.text3 }]}>Name</AppText>
                    <AppText>{incomeDetails.name}</AppText>
                  </View>
                  <View>
                    <AppText style={[typography.meta, { color: colors.text3 }]}>Category</AppText>
                    <AppText>{incomeDetails.category}</AppText>
                  </View>
                </View>
              ) : null}
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyField
                    label="Planned amount"
                    accessibilityLabel="Planned amount"
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
                    label="Due day (optional)"
                    accessibilityLabel="Due day (optional)"
                    value={field.value ?? ''}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.day?.message}
                  />
                )}
              />
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
              {scope === 'following' ? (
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  {laterCustomMonths === 1
                    ? '1 later month has its own values and is kept.'
                    : `${laterCustomMonths} later months have their own values and are kept.`}
                </AppText>
              ) : null}
              <View style={styles.actions}>
                <Button
                  label={isSubmitting ? 'Saving' : 'Save'}
                  variant="primary"
                  disabled={isSubmitting}
                  onPress={save}
                  style={styles.saveButton}
                />
                <Button label="Remove item" variant="danger-text" onPress={remove} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  keyboardAvoiding: { justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '60%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  header: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heading: { flex: 1 },
  closeButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  fields: { gap: 14, paddingBottom: 8 },
  readOnlyDetails: { gap: 8 },
  actions: { gap: 8, paddingTop: 4 },
  saveButton: { alignSelf: 'stretch', justifyContent: 'center' },
});
