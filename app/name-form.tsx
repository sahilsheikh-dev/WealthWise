import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormScreen } from '../src/components/form/FormScreen';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button } from '../src/components/ui';
import { useAppActions } from '../src/data/useAppData';
import { useAppStore } from '../src/data/store';
import { useTheme } from '../src/theme/useTheme';
import { typography } from '../src/theme/tokens';

const nameSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(40, 'Keep your name under 40 characters'),
});

type NameFormInput = z.input<typeof nameSchema>;
type NameFormOutput = z.output<typeof nameSchema>;

export default function NameFormScreen() {
  const currentName = useAppStore((state) => state.data.settings.name);
  const actions = useAppActions();
  const { colors } = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, submitCount },
  } = useForm<NameFormInput, undefined, NameFormOutput>({
    resolver: zodResolver(nameSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { name: currentName },
  });

  const close = () => {
    if (!isDirty) {
      router.back();
      return;
    }
    Alert.alert('Discard changes?', 'Your changes have not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const save = (value: NameFormOutput) => {
    actions.updateSettings({ name: value.name });
    const state = useAppStore.getState();
    if (state.lastError) {
      Alert.alert('Could not save your name', state.lastError);
      return;
    }
    router.back();
  };

  const invalidCount = Object.keys(errors).length;
  return (
    <FormScreen
      title="Your name"
      onClose={close}
      footer={
        <View style={styles.footer}>
          {submitCount > 0 && invalidCount > 0 ? (
            <AppText style={[typography.meta, styles.error, { color: colors.err }]}>
              Fix {invalidCount} {invalidCount === 1 ? 'field' : 'fields'}
            </AppText>
          ) : null}
          <Button
            label="Save"
            variant="primary"
            accessibilityLabel="Save name"
            disabled={isSubmitting || (submitCount > 0 && invalidCount > 0)}
            onPress={handleSubmit(save)}
            style={styles.save}
          />
        </View>
      }>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
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
        )}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  footer: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  error: { flex: 1, textAlign: 'center' },
  save: { flex: 1 },
});
