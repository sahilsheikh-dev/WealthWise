import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { AppHeader } from '../src/components/AppHeader';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, Card, EmptyState, Screen, SearchField, SectionTitle, WarningBanner } from '../src/components/ui';
import { DEFAULT_TRANSACTION_DETECTION, type PersistedTransactionDetection } from '../src/data/metaStore';
import { metaStore } from '../src/data/store';
import {
  buildSourceAppPickerItems,
  DEFAULT_DETECTION_SOURCE_APPS,
  type PendingTransactionDraft,
} from '../src/domain/transactionDetection';
import { confirmAsync } from '../src/lib/confirm';
import { formatDate } from '../src/lib/format';
import { notificationListenerAdapter, type EligibleSourceAppsResult } from '../src/lib/notificationListener';
import { singleParam } from '../src/lib/routeParams';
import { removeTransactionDraft } from '../src/lib/transactionDetectionDrafts';
import { buildDraftFormRoute, syncNativeDetectionConfig } from '../src/lib/transactionDetectionRuntime';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function TransactionDetectionScreen() {
  const params = useLocalSearchParams<{ draftId?: string }>();
  const highlightedDraftId = singleParam(params.draftId);
  const { colors } = useTheme();
  const isAndroid = Platform.OS === 'android';

  const [detection, setDetection] = useState<PersistedTransactionDetection>(DEFAULT_TRANSACTION_DETECTION);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [customPackage, setCustomPackage] = useState('');
  const [appQuery, setAppQuery] = useState('');
  const [eligibleApps, setEligibleApps] = useState<EligibleSourceAppsResult>({
    installedTrusted: [],
    observedApps: [],
  });
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const sync = () => {
      void Promise.all([
        metaStore.getMeta(),
        notificationListenerAdapter.isPermissionGranted(),
        notificationListenerAdapter.getEligibleSourceApps(),
      ]).then(([meta, granted, eligible]) => {
        if (!active) return;
        setDetection(meta.transactionDetection ?? DEFAULT_TRANSACTION_DETECTION);
        setPermissionGranted(granted);
        setEligibleApps(eligible);
      });
    };
    sync();
    const unsubMeta = metaStore.subscribe((next) => {
      if (active) setDetection(next.transactionDetection ?? DEFAULT_TRANSACTION_DETECTION);
    });
    const subApp = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => {
      active = false;
      unsubMeta();
      subApp.remove();
    };
  }, []);

  const saveDetection = async (next: PersistedTransactionDetection) => {
    setStatusError(null);
    try {
      await metaStore.updateMeta({ transactionDetection: next });
      await syncNativeDetectionConfig();
    } catch {
      setStatusError('Could not save transaction detection settings.');
    }
  };

  const handleToggleEnabled = (value: boolean) => {
    if (!isAndroid) return;
    if (value && !detection.disclosureAcceptedAt) {
      setDisclosureOpen(true);
      return;
    }
    void saveDetection({ ...detection, enabled: value });
  };

  const handleAcceptDisclosure = async () => {
    setDisclosureOpen(false);
    const next: PersistedTransactionDetection = {
      ...detection,
      enabled: true,
      disclosureAcceptedAt: new Date().toISOString(),
      allowedPackages: detection.allowedPackages.length > 0
        ? detection.allowedPackages
        : DEFAULT_DETECTION_SOURCE_APPS.map((item) => item.packageName),
    };
    await saveDetection(next);
    if (!permissionGranted) {
      await notificationListenerAdapter.openNotificationAccessSettings();
    }
  };

  const toggleSourceApp = (packageName: string, checked: boolean) => {
    const current = new Set(detection.allowedPackages);
    if (checked) current.add(packageName);
    else current.delete(packageName);
    void saveDetection({ ...detection, allowedPackages: [...current] });
  };

  const addCustomPackage = () => {
    const trimmed = customPackage.trim();
    if (!trimmed || !/^[a-zA-Z0-9._-]+$/.test(trimmed)) return;
    const current = new Set(detection.allowedPackages);
    current.add(trimmed);
    setCustomPackage('');
    void saveDetection({ ...detection, allowedPackages: [...current] });
  };

  const openDraftReview = (draft: PendingTransactionDraft) => {
    router.push(buildDraftFormRoute(draft));
  };

  const discardDraft = (draftId: string) => {
    void confirmAsync({
      title: 'Discard detected draft?',
      message: 'Remove this draft without creating a transaction?',
      confirmLabel: 'Discard',
      destructive: true,
    }).then((confirmed) => {
      if (confirmed) void removeTransactionDraft(draftId);
    });
  };

  const pickerItems = useMemo(
    () =>
      buildSourceAppPickerItems({
        installedPackages: eligibleApps.installedTrusted,
        observedApps: eligibleApps.observedApps,
        allowedPackages: detection.allowedPackages,
        query: appQuery,
      }),
    [appQuery, detection.allowedPackages, eligibleApps.installedTrusted, eligibleApps.observedApps],
  );

  const statusLabel = !isAndroid
    ? 'Android only (not supported on iOS)'
    : !detection.enabled
      ? 'Disabled'
      : permissionGranted
        ? 'Enabled (Notification access granted)'
        : 'Enabled in app — Notification access required';

  return (
    <Screen>
      <AppHeader title="Transaction detection" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {statusError ? <WarningBanner><AppText>{statusError}</AppText></WarningBanner> : null}

        {!isAndroid ? (
          <Card>
            <AppText style={[typography.name, { color: colors.text1, marginBottom: 6 }]}>
              Android only
            </AppText>
            <AppText style={[typography.meta, { color: colors.text2 }]}>
              Automatic notification-based transaction detection is only available on Android. iOS does not allow third-party apps to read SMS or other apps’ notifications. You can continue adding transactions manually anytime.
            </AppText>
            <View style={styles.actionRow}>
              <Button
                label="Add transaction manually"
                variant="primary"
                onPress={() => router.push('/transaction-form')}
              />
            </View>
          </Card>
        ) : (
          <>
            <SectionTitle>Status & opt-in</SectionTitle>
            <Card>
              <AppText style={[typography.meta, { color: colors.text3, marginBottom: 4 }]}>
                Status: {statusLabel}
              </AppText>
              <SwitchRow
                label="Detect payment notifications"
                value={detection.enabled}
                onValueChange={handleToggleEnabled}
              />
              <AppText style={[typography.meta, { color: colors.text3, marginTop: 4 }]}>
                Parses payment alerts locally on-device into reviewable drafts. Never reads SMS history, never sends data over the network, and never creates transactions automatically. If a transaction is missed, check that the bank/UPI or SMS app posts notifications with visible text (not muted or hidden on lock screen) and is selected below.
              </AppText>
              {detection.enabled && !permissionGranted ? (
                <View style={styles.settingsActions}>
                  <Button
                    label="Open Notification Access"
                    variant="primary"
                    onPress={() => void notificationListenerAdapter.openNotificationAccessSettings()}
                  />
                  <Button
                    label="Open App Info (Android 13+ Restricted Settings)"
                    variant="soft"
                    onPress={() => void notificationListenerAdapter.openAppInfoSettings()}
                  />
                </View>
              ) : null}
              {detection.enabled && permissionGranted ? (
                <View style={styles.settingsActions}>
                  <Button
                    label="Review Android Notification Access"
                    variant="soft"
                    onPress={() => void notificationListenerAdapter.openNotificationAccessSettings()}
                  />
                </View>
              ) : null}
            </Card>
          </>
        )}

        {isAndroid ? (
          <>
            <SectionTitle>Pending review drafts ({detection.pendingDrafts.length})</SectionTitle>
        {detection.pendingDrafts.length === 0 ? (
          <Card>
            <EmptyState
              title="No pending drafts"
              subtitle="Detected transactions will appear here for your review and confirmation before any financial record is created."
            />
          </Card>
        ) : (
          detection.pendingDrafts.map((draft) => {
            const highlighted = highlightedDraftId === draft.id;
            return (
              <Card
                key={draft.id}
                style={highlighted ? { borderColor: colors.primary, borderWidth: 1.5 } : undefined}
              >
                <View style={styles.draftHeader}>
                  <View style={styles.draftInfo}>
                    <AppText style={[typography.name, { color: colors.text1 }]}>
                      {draft.suggestedNote}
                    </AppText>
                    <AppText style={[typography.meta, { color: colors.text3 }]}>
                      {draft.type === 'income' ? 'Credit' : 'Debit'} · {formatDate(draft.date)} · {draft.sourcePackage}
                    </AppText>
                  </View>
                  <AmountText
                    value={draft.amount}
                    tier="exact"
                    tone={draft.type === 'income' ? 'ok' : 'err'}
                    style={typography.amount}
                  />
                </View>
                <View style={styles.draftActions}>
                  <Button
                    label="Review & add"
                    variant="primary"
                    onPress={() => openDraftReview(draft)}
                  />
                  <Button
                    label="Discard"
                    variant="soft"
                    onPress={() => discardDraft(draft.id)}
                  />
                </View>
              </Card>
            );
          })
        )}
          </>
        ) : null}

        {isAndroid ? (
          <>
            <SectionTitle>Eligible source apps</SectionTitle>
            <Card>
              <AppText style={[typography.meta, { color: colors.text3, marginBottom: 8 }]}>
                Only notifications from selected apps are inspected. Android restricts broad installed-app visibility without QUERY_ALL_PACKAGES, so WealthWise shows installed apps from the verified payment catalogue plus apps observed by the notification listener.
              </AppText>
              <SearchField
                value={appQuery}
                onChangeText={setAppQuery}
                placeholder="Search source apps"
                accessibilityLabel="Search source apps"
              />
              <View style={styles.pickerList}>
                {pickerItems.map((app) => (
                  <View key={app.packageName} style={styles.pickerRow}>
                    <SwitchRow
                      label={`${app.label} · ${app.trusted ? 'Trusted' : 'Unverified'}`}
                      value={app.selected}
                      onValueChange={(checked) => toggleSourceApp(app.packageName, checked)}
                    />
                    <AppText style={[typography.meta, { color: colors.text3 }]}>
                      {app.packageName}
                      {app.installed ? ' · Installed' : ''}
                      {app.observed ? ' · Observed' : ''}
                    </AppText>
                  </View>
                ))}
                {pickerItems.length === 0 ? (
                  <AppText style={[typography.meta, { color: colors.text3 }]}>
                    No matching source apps. You can add a package ID below.
                  </AppText>
                ) : null}
              </View>
              <View style={styles.customPackageRow}>
                <TextField
                  label="Add custom package name"
                  accessibilityLabel="Add custom package name"
                  value={customPackage}
                  onChangeText={setCustomPackage}
                  placeholder="com.example.bankapp"
                  autoCapitalize="none"
                />
                <Button label="Add app" variant="soft" onPress={addCustomPackage} />
              </View>
            </Card>
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={disclosureOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDisclosureOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText style={[typography.name, { color: colors.text1, marginBottom: 8 }]}>
              Prominent disclosure: Notification access
            </AppText>
            <AppText style={[typography.meta, { color: colors.text2, marginBottom: 12 }]}>
              Enabling transaction detection allows WealthWise to read incoming notifications from your selected payment and banking apps on this device. Android notification access can expose notification content.
            </AppText>
            <AppText style={[typography.meta, { color: colors.text3, marginBottom: 16 }]}>
              • Processing happens 100% locally in memory on your device.{'\n'}
              • Raw notification text is never saved or sent over the network.{'\n'}
              • WealthWise never reads SMS history and never creates transactions without your confirmation.{'\n'}
              • You can disable access anytime in this screen or Android Settings.
            </AppText>
            <View style={styles.modalButtons}>
              <Button label="I understand & continue" variant="primary" onPress={() => void handleAcceptDisclosure()} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Not now"
                onPress={() => setDisclosureOpen(false)}
                style={styles.cancelButton}
              >
                <AppText style={[typography.chip, { color: colors.text2 }]}>Not now</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
    gap: 12,
  },
  actionRow: {
    marginTop: 12,
  },
  settingsActions: {
    marginTop: 12,
    gap: 8,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  draftInfo: {
    flex: 1,
    gap: 2,
  },
  draftActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pickerList: {
    marginTop: 10,
    gap: 8,
  },
  pickerRow: {
    gap: 2,
  },
  customPackageRow: {
    marginTop: 12,
    gap: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalButtons: {
    gap: 10,
  },
  cancelButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
