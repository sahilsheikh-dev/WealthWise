import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import type { z } from 'zod';

import { BrandMark } from '../src/components/BrandMark';
import { MoneyField } from '../src/components/form/MoneyField';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, Screen } from '../src/components/ui';
import { useAppActions } from '../src/data/useAppData';
import { makeOnboardingFormSchema } from '../src/domain/schemas';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

const schema = makeOnboardingFormSchema();
type OnboardingInput = z.input<typeof schema>;
type OnboardingOutput = z.output<typeof schema>;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const actions = useAppActions();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<OnboardingInput, undefined, OnboardingOutput>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', monthlySalary: '' },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const finish = (profile: OnboardingOutput) => actions.completeOnboarding(profile);
  return (
    <Screen>
      <View style={styles.content}>
        <BrandMark />
        <AppText weight="bold" style={[typography.h1, styles.title]}>Welcome to Wealth Wise</AppText>
        <AppText style={[typography.meta, { color: colors.text2 }]}>Everything stays on this phone</AppText>
        <View style={styles.form}>
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
          <Controller
            control={control}
            name="monthlySalary"
            render={({ field }) => (
              <View style={styles.salary}>
                <MoneyField
                  label="Monthly take-home income (₹)"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  accessibilityLabel="Monthly take-home income"
                  error={errors.monthlySalary?.message}
                />
                <AppText style={[typography.meta, { color: colors.text3 }]}>
                  Used to estimate how much of your income goes to EMIs
                </AppText>
              </View>
            )}
          />
        </View>
        {submitCount > 0 && Object.keys(errors).length > 0 ? (
          <AppText accessibilityRole="alert" style={{ color: colors.err }}>Please check the highlighted fields.</AppText>
        ) : null}
        <Button label="Continue" icon="arrow-right" variant="primary" disabled={isSubmitting} onPress={handleSubmit(finish)} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
          onPress={() => actions.completeOnboarding({ name: '', monthlySalary: null })}
          style={styles.skip}
        >
          <View style={styles.skipContent}>
            <Feather name="skip-forward" size={14} color={colors.primary} />
            <AppText style={[typography.meta, { color: colors.primary }]}>Skip for now</AppText>
          </View>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', gap: 16, paddingVertical: 30, margin: 20 },
  title: { marginTop: 8 },
  form: { gap: 18, marginVertical: 10 },
  salary: { gap: 7 },
  skip: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  skipContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
