import { Feather } from '@expo/vector-icons';
import { router, useIsFocused, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { AppText, Button, Card, Screen, SectionTitle } from '../src/components/ui';
import { useAppMenu } from '../src/components/useAppMenu';
import { DEFAULT_TRANSACTION_DETECTION, type BackupMeta } from '../src/data/metaStore';
import { metaStore } from '../src/data/store';
import { notificationListenerAdapter } from '../src/lib/notificationListener';
import {
  loadTransactionDetectionStatus,
  type TransactionDetectionStatusInfo,
} from '../src/lib/transactionDetectionStatus';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const menuItems = useAppMenu();
  const [detectionStatus, setDetectionStatus] = useState<TransactionDetectionStatusInfo | null>(null);
  const [detectionEnabled, setDetectionEnabled] = useState(false);

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
        <>
          <SectionTitle>Data &amp; developer actions</SectionTitle>
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
        </>
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
