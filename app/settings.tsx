import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useIsFocused, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, AppState, Pressable, StyleSheet, View } from 'react-native';
import type { z } from 'zod';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { FieldTitle } from '../src/components/form/FieldTitle';
import { MoneyField } from '../src/components/form/MoneyField';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { TextField } from '../src/components/form/TextField';
import { IconButton } from '../src/components/IconButton';
import { AppText, Button, Card, Screen, SectionTitle } from '../src/components/ui';
import { useAppMenu } from '../src/components/useAppMenu';
import { DEFAULT_TRANSACTION_DETECTION, type BackupMeta } from '../src/data/metaStore';
import { metaStore, useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { makeProfileFormSchema } from '../src/domain/schemas';
import { confirmAsync } from '../src/lib/confirm';
import { notificationListenerAdapter } from '../src/lib/notificationListener';
import {
  loadTransactionDetectionStatus,
  type TransactionDetectionStatusInfo,
} from '../src/lib/transactionDetectionStatus';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

const profileSchema = makeProfileFormSchema();
type ProfileInput = z.input<typeof profileSchema>;
type ProfileOutput = z.output<typeof profileSchema>;

export default function SettingsScreen() {
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const menuItems = useAppMenu();
  const profileSettings = useAppStore((state) => state.data.settings);
  const actions = useAppActions();
  const [editingProfile, setEditingProfile] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<TransactionDetectionStatusInfo | null>(null);
  const [detectionEnabled, setDetectionEnabled] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput, undefined, ProfileOutput>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: profileSettings.name,
      monthlySalary: profileSettings.monthlySalary === null ? '' : String(profileSettings.monthlySalary),
    },
  });

  const startProfileEdit = () => {
    reset({
      name: profileSettings.name,
      monthlySalary: profileSettings.monthlySalary === null ? '' : String(profileSettings.monthlySalary),
    });
    setEditingProfile(true);
  };

  const saveProfile = (value: ProfileOutput) => {
    actions.updateSettings({ name: value.name, monthlySalary: value.monthlySalary });
    const error = useAppStore.getState().lastError;
    if (error) {
      void confirmAsync({ title: 'Could not save your profile', message: error, confirmLabel: 'OK' });
      return;
    }
    setEditingProfile(false);
  };

  const refreshDetection = useCallback(() => {
    void Promise.all([
      loadTransactionDetectionStatus(metaStore),
      typeof metaStore?.getMeta === 'function' ? metaStore.getMeta() : Promise.resolve<BackupMeta>({}),
    ]).then(([status, meta]) => {
      setDetectionStatus(status);
      setDetectionEnabled((meta.transactionDetection ?? DEFAULT_TRANSACTION_DETECTION).enabled);
    });
  }, []);

  useEffect(() => {
    refreshDetection();
    const unsub = typeof metaStore?.subscribe === 'function' ? metaStore.subscribe(refreshDetection) : () => undefined;
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshDetection();
    });
    return () => {
      unsub();
      appStateSub.remove();
    };
  }, [isFocused, refreshDetection]);

  const toggleDetection = (nextEnabled: boolean) => {
    if (!notificationListenerAdapter.isSupported()) {
      router.push('/transaction-detection' as Href);
      return;
    }
    if (nextEnabled) {
      router.push('/transaction-detection' as Href);
      return;
    }
    void (async () => {
      try {
        const current = (await metaStore.getMeta()).transactionDetection ?? DEFAULT_TRANSACTION_DETECTION;
        await metaStore.updateMeta({
          transactionDetection: {
            ...current,
            enabled: false,
          },
        });
        await notificationListenerAdapter.setDetectionConfig(false, []);
        refreshDetection();
      } catch (error) {
        Alert.alert(
          'Could not update setting',
          error instanceof Error ? error.message : 'Transaction detection could not be disabled.',
        );
      }
    })();
  };

  const generalItems = menuItems.filter((item) => !item.destructive);
  const dangerItems = menuItems.filter((item) => item.destructive);

  const showTransactionDetection = detectionStatus !== null && detectionStatus.status !== 'unavailable';

  return (
    <Screen>
      <AppHeader title="Settings" showBack />

      <SectionTitle>Profile</SectionTitle>
      <View testID="settings-profile-card">
      <Card style={styles.sectionCard}>
        {editingProfile ? (
          <View style={styles.profileForm}>
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
                <FieldTitle title="Monthly take-home income">
                  <MoneyField
                    label="Monthly take-home income"
                    value={field.value ?? ''}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    accessibilityLabel="Monthly take-home income"
                    error={errors.monthlySalary?.message}
                  />
                </FieldTitle>
              )}
            />
            <View style={styles.profileActions}>
              <Button
                label="Cancel"
                variant="soft"
                accessibilityLabel="Cancel profile edit"
                onPress={() => setEditingProfile(false)}
              />
              <Button
                label="Save"
                icon="save"
                variant="primary"
                accessibilityLabel="Save profile"
                disabled={isSubmitting}
                onPress={() => void handleSubmit(saveProfile)()}
              />
            </View>
          </View>
        ) : (
          <View style={styles.profileSummary}>
            <View style={styles.profileFields}>
              <View style={styles.profileField}>
                <AppText style={[typography.meta, { color: colors.text3 }]}>Name</AppText>
                <AppText testID="settings-profile-name" weight="semibold" style={{ color: colors.text1 }}>
                  {profileSettings.name.trim() || 'Not set'}
                </AppText>
              </View>
              <View style={styles.profileField}>
                <AppText style={[typography.meta, { color: colors.text3 }]}>Monthly income</AppText>
                {profileSettings.monthlySalary !== null ? (
                  <View testID="settings-profile-income">
                    <AmountText
                      value={profileSettings.monthlySalary}
                      tier="tile"
                      weight="semibold"
                    />
                  </View>
                ) : (
                  <AppText testID="settings-profile-income" weight="semibold" style={{ color: colors.text2 }}>
                    Not set
                  </AppText>
                )}
              </View>
            </View>
            <IconButton
              icon="edit-2"
              label="Edit profile"
              onPress={startProfileEdit}
            />
          </View>
        )}
      </Card>
      </View>

      {showTransactionDetection ? (
        <>
          <SectionTitle>Transaction detection</SectionTitle>
          <Card style={styles.sectionCard}>
            <SwitchRow
              label="Automatically detect transactions"
              value={detectionEnabled}
              onValueChange={toggleDetection}
            />
            <View style={styles.detectionDetails}>
              <AppText testID="settings-detection-status" weight="semibold" style={{ color: colors.primary }}>
                Status: {detectionStatus.label}
              </AppText>
              <AppText style={[typography.meta, { color: colors.text2 }]}>
                {detectionStatus.description}
              </AppText>
              {detectionStatus.status === 'access_needed' ? (
                <Button
                  label="Grant Android Notification Access"
                  variant="primary"
                  onPress={() => router.push('/transaction-detection' as Href)}
                />
              ) : detectionStatus.status === 'notifications_needed' ? (
                <Button
                  label="Allow notification permission"
                  variant="primary"
                  onPress={() => router.push('/transaction-detection' as Href)}
                />
              ) : (
                <Button
                  label="Manage transaction detection"
                  variant="soft"
                  onPress={() => router.push('/transaction-detection' as Href)}
                />
              )}
            </View>
          </Card>
        </>
      ) : null}

      <SectionTitle>Preferences &amp; tools</SectionTitle>
      <Card style={styles.menuCard}>
        {generalItems.map((item, index) => (
          <SettingsRow
            key={item.label}
            label={item.label}
            description={item.description}
            icon={item.icon}
            destructive={false}
            divider={index < generalItems.length - 1}
            onPress={item.onPress}
          />
        ))}
      </Card>

      {dangerItems.length > 0 ? (
        <Card style={styles.menuCard}>
          {dangerItems.map((item, index) => (
            <SettingsRow
              key={item.label}
              label={item.label}
              description={item.description}
              icon={item.icon}
              destructive
              divider={index < dangerItems.length - 1}
              onPress={item.onPress}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

function SettingsRow({
  label,
  description,
  icon,
  destructive,
  divider,
  onPress,
}: {
  label: string;
  description?: string;
  icon: keyof typeof Feather.glyphMap;
  destructive: boolean;
  divider: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const tint = destructive ? colors.err : colors.text1;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={description ? `${label}, ${description}` : label}
      onPress={onPress}
      style={[
        styles.row,
        divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}>
      <Feather name={icon} size={18} color={tint} />
      <View style={styles.rowText}>
        <AppText weight="semibold" style={{ color: tint }}>{label}</AppText>
        {description ? (
          <AppText style={[typography.meta, { color: colors.text3 }]}>{description}</AppText>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={colors.text3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionCard: { gap: 10 },
  profileSummary: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  profileFields: { flex: 1, minWidth: 0, gap: 8 },
  profileField: { gap: 2 },
  profileForm: { gap: 10 },
  profileActions: { flexDirection: 'row', gap: 8 },
  detectionDetails: { gap: 8 },
  menuCard: { paddingVertical: 4 },
  row: {
    minHeight: 50,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
});
