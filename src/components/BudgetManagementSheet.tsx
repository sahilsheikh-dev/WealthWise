import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { EARNED_INCOME_CATEGORIES, type BudgetSection, type EarnedIncomeCategory } from '../domain/types';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { ChoiceField } from './form/ChoiceField';
import { IntegerField } from './form/IntegerField';
import { MoneyField } from './form/MoneyField';
import { SegmentedControl } from './form/SegmentedControl';
import { TextField } from './form/TextField';
import { AppText, Button } from './ui';

export type BudgetManagementMode =
  | { kind: 'add-section' }
  | { kind: 'rename-section'; sectionId: string; name: string }
  | { kind: 'add-item'; sectionId: string }
  | { kind: 'edit-item'; sectionId: string; itemId: string; name: string; mode: 'amount' | 'percent'; value: number; day?: number }
  | { kind: 'add-income' }
  | { kind: 'edit-income'; itemId: string; name: string; category: EarnedIncomeCategory; amount: number; day?: number };

export type BudgetManagementValues = {
  name: string;
  sectionType: BudgetSection['type'];
  category: EarnedIncomeCategory;
  itemMode: 'amount' | 'percent';
  value: number;
  amount: number;
  day?: number;
  scope: 'month' | 'following';
};

const formSchema = z.object({
  name: z.string(),
  sectionType: z.enum(['spend', 'invest']),
  category: z.enum(EARNED_INCOME_CATEGORIES),
  itemMode: z.enum(['amount', 'percent']),
  value: z.string(),
  amount: z.string(),
  day: z.string(),
  scope: z.enum(['month', 'following']),
});

function makeFormSchema(mode: BudgetManagementMode) {
  return formSchema.superRefine((value, context) => {
    const isIncome = mode.kind === 'add-income' || mode.kind === 'edit-income';
    const maxNameLength = isIncome ? 40 : 30;
    const name = value.name.trim();
    if (mode.kind !== 'edit-income' && !name) {
      context.addIssue({ code: 'custom', path: ['name'], message: 'Enter a name' });
    } else if (name.length > maxNameLength) {
      context.addIssue({ code: 'custom', path: ['name'], message: `Keep the name under ${maxNameLength} characters` });
    }

    if (mode.kind === 'add-item' || mode.kind === 'edit-item') {
      const amount = Number(value.value);
      const maximum = value.itemMode === 'percent' ? 100 : 1_000_000_000;
      if (!value.value.trim() || !Number.isFinite(amount) || amount < 0 || amount > maximum) {
        context.addIssue({
          code: 'custom',
          path: ['value'],
          message: value.itemMode === 'percent' ? 'Enter a percent from 0 to 100' : 'Enter an amount from 0 to 1,000,000,000',
        });
      }
    }

    if (mode.kind === 'add-income') {
      const amount = Number(value.amount);
      if (!value.amount.trim() || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
        context.addIssue({ code: 'custom', path: ['amount'], message: 'Enter an income amount greater than 0' });
      }
    }
    if (value.day !== '' && (!/^\d+$/.test(value.day) || Number(value.day) < 1 || Number(value.day) > 31)) {
      context.addIssue({ code: 'custom', path: ['day'], message: 'Enter a day from 1 to 31' });
    }
  });
}

function titleFor(mode: BudgetManagementMode): string {
  switch (mode.kind) {
    case 'add-section': return 'Add category';
    case 'rename-section': return 'Rename category';
    case 'add-item': return 'Add item';
    case 'edit-item': return 'Edit item';
    case 'add-income': return 'Add income';
    case 'edit-income': return 'Edit income';
  }
}

export function BudgetManagementSheet({
  visible,
  mode,
  fontScale,
  defaultScope,
  laterCustomMonths,
  onClose,
  onSave,
  onRemove,
}: {
  visible: boolean;
  mode: BudgetManagementMode;
  fontScale: number;
  defaultScope: 'month' | 'following';
  laterCustomMonths: number;
  onClose: () => void;
  onSave: (values: BudgetManagementValues) => boolean;
  onRemove?: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const schema = makeFormSchema(mode);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<
    z.input<typeof formSchema>,
    undefined,
    z.output<typeof formSchema>
  >({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: mode.kind === 'rename-section' || mode.kind === 'edit-item' || mode.kind === 'edit-income'
        ? mode.name
        : '',
      sectionType: 'spend',
      category: mode.kind === 'edit-income' ? mode.category : 'Salary',
      itemMode: mode.kind === 'edit-item' ? mode.mode : 'amount',
      value: mode.kind === 'edit-item' ? String(mode.value) : '',
      amount: mode.kind === 'edit-income' ? String(mode.amount) : '',
      day: mode.kind === 'edit-item' || mode.kind === 'edit-income'
        ? mode.day === undefined ? '' : String(mode.day)
        : '',
      scope: defaultScope,
    },
  });
  const scope = useWatch({ control, name: 'scope' }) ?? defaultScope;
  const itemMode = useWatch({ control, name: 'itemMode' }) ?? 'amount';
  const isItem = mode.kind === 'add-item' || mode.kind === 'edit-item';
  const isIncome = mode.kind === 'add-income' || mode.kind === 'edit-income';
  const canRemove = (mode.kind === 'edit-item' || mode.kind === 'edit-income') && onRemove !== undefined;

  const save = handleSubmit((values) => {
    const parsedDay = values.day === '' ? undefined : Number(values.day);
    const parsedValue = Number(values.value);
    const parsedAmount = Number(values.amount);
    if (onSave({
      name: values.name.trim(),
      sectionType: values.sectionType,
      category: values.category,
      itemMode: values.itemMode,
      value: parsedValue,
      amount: parsedAmount,
      ...(parsedDay === undefined ? {} : { day: parsedDay }),
      scope: values.scope,
    })) onClose();
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="budget-management-modal">
      <View style={styles.overlay} testID="budget-management-overlay">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close budget editor"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="budget-management-backdrop" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}>
          <View
            testID="budget-management-sheet"
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) },
            ]}>
            <View style={styles.header}>
              <AppText weight="bold" style={[typography.name, styles.heading]}>{titleFor(mode)}</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close budget editor"
                onPress={onClose}
                style={styles.closeButton}>
                <Feather name="x" size={20} color={colors.text2} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.fields}>
              {mode.kind === 'add-section' || mode.kind === 'rename-section' ? (
                <>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <TextField
                        label="Category name"
                        accessibilityLabel="Category name"
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        maxLength={30}
                        error={errors.name?.message}
                      />
                    )}
                  />
                  {mode.kind === 'add-section' ? (
                    <Controller
                      control={control}
                      name="sectionType"
                      render={({ field }) => (
                        <SegmentedControl
                          label="Category type"
                          value={field.value}
                          options={[
                            { label: 'Spend', value: 'spend' },
                            { label: 'Invest', value: 'invest' },
                          ]}
                          onChange={field.onChange}
                          error={errors.sectionType?.message}
                        />
                      )}
                    />
                  ) : null}
                </>
              ) : null}

              {isItem ? (
                <>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <TextField
                        label="Name"
                        accessibilityLabel="Item name"
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
                    name="itemMode"
                    render={({ field }) => (
                      <SegmentedControl
                        value={field.value}
                        options={[
                          { label: '₹', value: 'amount' },
                          { label: '%', value: 'percent' },
                        ]}
                        onChange={field.onChange}
                        error={errors.itemMode?.message}
                      />
                    )}
                  />
                  <View style={[styles.itemFields, fontScale >= 1.3 && styles.itemFieldsStacked]} testID="budget-item-inline-fields">
                    <View style={styles.itemValue}>
                      <Controller
                        control={control}
                        name="value"
                        render={({ field }) => itemMode === 'amount' ? (
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
                    </View>
                    <View style={styles.dueDay}>
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
                    </View>
                  </View>
                </>
              ) : null}

              {isIncome ? (
                <>
                  {mode.kind === 'add-income' ? (
                    <>
                      <Controller
                        control={control}
                        name="name"
                        render={({ field }) => (
                          <TextField
                            label="Income name"
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
                        name="category"
                        render={({ field }) => (
                          <ChoiceField
                            label="Income category"
                            value={field.value}
                            choices={EARNED_INCOME_CATEGORIES}
                            onChange={field.onChange}
                            error={errors.category?.message}
                          />
                        )}
                      />
                    </>
                  ) : (
                    <View style={styles.readOnly}>
                      <AppText weight="semibold">{mode.name}</AppText>
                      <AppText style={[typography.meta, { color: colors.text3 }]}>{mode.category}</AppText>
                    </View>
                  )}
                  <View style={[styles.itemFields, fontScale >= 1.3 && styles.itemFieldsStacked]}>
                    <View style={styles.itemValue}>
                      <Controller
                        control={control}
                        name="amount"
                        render={({ field }) => (
                          <MoneyField
                            label="Planned amount"
                            accessibilityLabel="Planned income amount"
                            value={field.value}
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            error={errors.amount?.message}
                          />
                        )}
                      />
                    </View>
                    <View style={styles.dueDay}>
                      <Controller
                        control={control}
                        name="day"
                        render={({ field }) => (
                          <IntegerField
                            label="Optional"
                            accessibilityLabel="Due day"
                            icon="calendar-outline"
                            value={field.value}
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            error={errors.day?.message}
                          />
                        )}
                      />
                    </View>
                  </View>
                </>
              ) : null}

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
              {visible && scope === 'following' && laterCustomMonths > 0 ? (
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  {laterCustomMonths === 1
                    ? '1 later month has its own values and is kept.'
                    : `${laterCustomMonths} later months have their own values and are kept.`}
                </AppText>
              ) : null}
              {canRemove ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove item"
                  onPress={onRemove}
                  style={styles.removeButton}>
                  <AppText weight="semibold" style={{ color: colors.err }}>Remove item</AppText>
                </Pressable>
              ) : null}
              <Button
                label={isSubmitting ? 'Saving' : 'Save'}
                variant="primary"
                disabled={isSubmitting}
                onPress={save}
                style={styles.saveButton}
              />
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
  itemFields: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemFieldsStacked: { flexDirection: 'column' },
  itemValue: { flex: 2, minWidth: 0 },
  dueDay: { flex: 1, minWidth: 0, gap: 6 },
  dayLabel: { minHeight: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  readOnly: { gap: 4 },
  removeButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  saveButton: { alignSelf: 'stretch', justifyContent: 'center' },
});
