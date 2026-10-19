import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { makeBudgetSectionFormSchema } from '../domain/schemas';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/tokens';
import { AppText, Button } from './ui';
import { SegmentedControl } from './form/SegmentedControl';
import { TextField } from './form/TextField';

const sectionSchema = makeBudgetSectionFormSchema();
type SectionFormInput = z.input<typeof sectionSchema>;
type SectionFormOutput = z.output<typeof sectionSchema>;

export function BudgetSectionAddSheet({
  visible,
  laterCustomMonths,
  onClose,
  onSave,
}: {
  visible: boolean;
  laterCustomMonths: number;
  onClose: () => void;
  onSave: (values: SectionFormOutput) => boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<
    SectionFormInput,
    undefined,
    SectionFormOutput
  >({
    resolver: zodResolver(sectionSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { name: '', type: 'spend', scope: 'following' },
  });
  const scope = useWatch({ control, name: 'scope' }) ?? 'following';

  const save = handleSubmit((values) => {
    if (onSave(values)) onClose();
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="budget-section-add-modal">
      <View style={styles.overlay} testID="budget-section-add-overlay">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close category editor"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="budget-section-add-backdrop" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}>
          <View
            testID="budget-section-add-sheet"
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) },
            ]}>
            <View style={styles.header}>
              <AppText weight="bold" style={[typography.name, styles.heading]}>Add category</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close category editor"
                onPress={onClose}
                style={styles.closeButton}>
                <Feather name="x" size={20} color={colors.text2} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.fields}>
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
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <SegmentedControl
                    label="Category type"
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
              {visible && scope === 'following' && laterCustomMonths > 0 ? (
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  {laterCustomMonths === 1
                    ? '1 later month has its own values and is kept.'
                    : `${laterCustomMonths} later months have their own values and are kept.`}
                </AppText>
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
  saveButton: { alignSelf: 'stretch', justifyContent: 'center' },
});
