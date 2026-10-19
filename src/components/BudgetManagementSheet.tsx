import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { EARNED_INCOME_CATEGORIES, type BudgetSection, type EarnedIncomeCategory } from '../domain/types';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { ChoiceField } from './form/ChoiceField';
import { Dropdown } from './Dropdown';
import { FormShell, type FormShellAction } from './FormShell';
import { IntegerField } from './form/IntegerField';
import { MoneyField } from './form/MoneyField';
import { SegmentedControl } from './form/SegmentedControl';
import { TextField } from './form/TextField';
import { TopAnchoredSheet } from './TopAnchoredSheet';
import { AppText, Button } from './ui';

export type BudgetManagementMode =
  | { kind: 'add-section' }
  | { kind: 'rename-section'; sectionId: string; name: string }
  | { kind: 'add-item'; sectionId: string; category?: string }
  | { kind: 'edit-item'; sectionId: string; itemId: string; name: string; mode: 'amount' | 'percent'; value: number; day?: number }
  | { kind: 'add-income'; name?: string; category?: EarnedIncomeCategory; amount?: number }
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
  itemCategory: z.string(),
  sectionType: z.enum(['spend', 'invest']),
  category: z.enum(EARNED_INCOME_CATEGORIES),
  itemMode: z.enum(['amount', 'percent']),
  value: z.string(),
  amount: z.string(),
  day: z.string(),
  scope: z.enum(['month', 'following']),
});

const CUSTOM_ITEM_CATEGORY = '__custom_item_category__';

function makeFormSchema(mode: BudgetManagementMode) {
  return formSchema.superRefine((value, context) => {
    const isIncome = mode.kind === 'add-income' || mode.kind === 'edit-income';
    const isBudgetItem = mode.kind === 'add-item' || mode.kind === 'edit-item';
    const maxNameLength = isIncome ? 40 : 30;
    const name = value.name.trim();
    if (isBudgetItem && !value.itemCategory) {
      context.addIssue({ code: 'custom', path: ['itemCategory'], message: 'Choose a category' });
    } else if (isBudgetItem && value.itemCategory === CUSTOM_ITEM_CATEGORY && !name) {
      context.addIssue({ code: 'custom', path: ['name'], message: 'Enter a name' });
    } else if (!isBudgetItem && mode.kind !== 'edit-income' && !name) {
      context.addIssue({ code: 'custom', path: ['name'], message: 'Enter a name' });
    } else if (isBudgetItem && value.itemCategory === CUSTOM_ITEM_CATEGORY && name.length > maxNameLength) {
      context.addIssue({ code: 'custom', path: ['name'], message: `Keep the name under ${maxNameLength} characters` });
    } else if (!isBudgetItem && name.length > maxNameLength) {
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
  itemCategoryOptions,
  onClose,
  onSave,
  onRemove,
}: {
  visible: boolean;
  mode: BudgetManagementMode;
  fontScale: number;
  defaultScope: 'month' | 'following';
  laterCustomMonths: number;
  itemCategoryOptions: readonly string[];
  onClose: () => void;
  onSave: (values: BudgetManagementValues) => boolean;
  onRemove?: () => void;
}) {
  const { colors } = useTheme();
  const schema = makeFormSchema(mode);
  const suggestedItemCategory = mode.kind === 'edit-item' ? mode.name
    : mode.kind === 'add-item' ? mode.category
      : undefined;
  const initialItemCategory = suggestedItemCategory
    ? itemCategoryOptions.includes(suggestedItemCategory)
      ? suggestedItemCategory
      : CUSTOM_ITEM_CATEGORY
    : '';
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
        : mode.kind === 'add-item' && mode.category && !itemCategoryOptions.includes(mode.category)
          ? mode.category
          : mode.kind === 'add-income' ? mode.name ?? '' : '',
      itemCategory: initialItemCategory,
      sectionType: 'spend',
      category: mode.kind === 'edit-income' || mode.kind === 'add-income'
        ? mode.category ?? 'Salary'
        : 'Salary',
      itemMode: mode.kind === 'edit-item' ? mode.mode : 'amount',
      value: mode.kind === 'edit-item' ? String(mode.value) : '',
      amount: mode.kind === 'edit-income'
        ? String(mode.amount)
        : mode.kind === 'add-income' && mode.amount !== undefined
          ? String(mode.amount)
          : '',
      day: mode.kind === 'edit-item' || mode.kind === 'edit-income'
        ? mode.day === undefined ? '' : String(mode.day)
        : '',
      scope: defaultScope,
    },
  });
  const scope = useWatch({ control, name: 'scope' }) ?? defaultScope;
  const itemMode = useWatch({ control, name: 'itemMode' }) ?? 'amount';
  const itemCategory = useWatch({ control, name: 'itemCategory' }) ?? '';
  const isItem = mode.kind === 'add-item' || mode.kind === 'edit-item';
  const isIncome = mode.kind === 'add-income' || mode.kind === 'edit-income';
  const canRemove = (mode.kind === 'edit-item' || mode.kind === 'edit-income') && onRemove !== undefined;
  const rightActions: FormShellAction[] = [
    ...(canRemove && onRemove ? [{
      icon: 'trash-2' as const,
      label: 'Delete item',
      hint: 'Delete this item from the selected month range',
      onPress: onRemove,
      destructive: true,
    }] : []),
    { icon: 'x', label: 'Close', hint: 'Close this form', onPress: onClose },
  ];

  const save = handleSubmit((values) => {
    const parsedDay = values.day === '' ? undefined : Number(values.day);
    const parsedValue = Number(values.value);
    const parsedAmount = Number(values.amount);
    if (onSave({
      name: isItem && values.itemCategory !== CUSTOM_ITEM_CATEGORY
        ? values.itemCategory
        : values.name.trim(),
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
    <TopAnchoredSheet
      visible={visible}
      onClose={onClose}
      sheetTestID="budget-management-sheet"
      contentStyle={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <FormShell
        title={titleFor(mode)}
        headerTestID="budget-management-header"
        rightActions={rightActions}
        footer={(
          <Button
            label={isSubmitting ? 'Saving' : 'Save'}
            variant="primary"
            disabled={isSubmitting}
            onPress={save}
            style={styles.saveButton}
          />
        )}
        bodyTestID="budget-management-fields">
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
                    name="itemCategory"
                    render={({ field }) => (
                      <Dropdown
                        label="Category"
                        accessibilityLabel="Item category"
                        value={field.value}
                        options={[
                          ...itemCategoryOptions.map((category) => ({ value: category, title: category })),
                          { value: CUSTOM_ITEM_CATEGORY, title: 'Custom' },
                        ]}
                        onChange={field.onChange}
                        placeholder="Select category"
                        error={errors.itemCategory?.message}
                      />
                    )}
                  />
                  {itemCategory === CUSTOM_ITEM_CATEGORY ? (
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
                  ) : null}
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
                      <AppText
                        testID="due-day-helper"
                        style={[typography.meta, { color: colors.text3 }]}>
                        Day of the month it is due, 1 to 31. Leave empty if there is no fixed day.
                      </AppText>
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
      </FormShell>
    </TopAnchoredSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    alignSelf: 'stretch',
  },
  itemFields: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemFieldsStacked: { flexDirection: 'column' },
  itemValue: { flex: 2, minWidth: 0 },
  dueDay: { flex: 1, minWidth: 0, gap: 6 },
  dayLabel: { minHeight: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  readOnly: { gap: 4 },
  saveButton: { alignSelf: 'stretch', justifyContent: 'center' },
});
