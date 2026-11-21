import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import type { z } from 'zod';

import { FormScreen } from '../src/components/form/FormScreen';
import { FieldTitle } from '../src/components/form/FieldTitle';
import { MoneyField } from '../src/components/form/MoneyField';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { makeProfileFormSchema } from '../src/domain/schemas';
import { confirmAsync } from '../src/lib/confirm';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

const schema = makeProfileFormSchema();
type ProfileInput = z.input<typeof schema>;
type ProfileOutput = z.output<typeof schema>;

export default function ProfileFormScreen() {
  const settings = useAppStore((state) => state.data.settings);
  const actions = useAppActions();
  const { colors } = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, submitCount },
  } = useForm<ProfileInput, undefined, ProfileOutput>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: settings.name,
      monthlySalary: settings.monthlySalary === null ? '' : String(settings.monthlySalary),
    },
  });
  const save = (value: ProfileOutput) => {
    actions.updateSettings({ name: value.name, monthlySalary: value.monthlySalary });
    const error = useAppStore.getState().lastError;
    if (error) {
      void confirmAsync({ title: 'Could not save your profile', message: error, confirmLabel: 'OK' });
      return;
    }
    router.back();
  };

  return (
    <FormScreen
      title="Profile"
      onClose={() => router.back()}
      isDirty={isDirty}
      footer={
        <View style={styles.footer}>
          {submitCount > 0 && Object.keys(errors).length > 0 ? (
            <AppText style={[typography.meta, { color: colors.err }]}>
              Fix {Object.keys(errors).length} {Object.keys(errors).length === 1 ? 'field' : 'fields'}
            </AppText>
          ) : null}
          <Button
            label="Save"
            icon="save"
            variant="primary"
            accessibilityLabel="Save profile"
            disabled={isSubmitting}
            onPress={handleSubmit(save)}
            style={styles.save}
          />
        </View>
      }>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <FieldTitle title="Name">
            <TextField
              label="Name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="What should we call you?"
              accessibilityLabel="Your name"
              maxLength={41}
              autoCapitalize="words"
              error={errors.name?.message}
            />
          </FieldTitle>
        )}
      />
      <Controller
        control={control}
        name="monthlySalary"
        render={({ field }) => (
          <View style={styles.salary}>
            <FieldTitle title="Monthly take-home income">
              <MoneyField
                label="Monthly take-home income (₹)"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                accessibilityLabel="Monthly take-home income"
                error={errors.monthlySalary?.message}
              />
            </FieldTitle>
            <AppText style={[typography.meta, { color: colors.text3 }]}>
              Used to estimate how much of your income goes to EMIs
            </AppText>
          </View>
        )}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  footer: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  save: { flex: 1 },
  salary: { gap: 7 },
});
