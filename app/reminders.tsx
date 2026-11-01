import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import { Dropdown, type DropdownOption } from '../src/components/Dropdown';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { AppText, Button, Card, Screen, SectionTitle } from '../src/components/ui';
import { useSecuritySettings } from '../src/components/SecurityProvider';
import { metaStore, useAppStore } from '../src/data/store';
import {
  DEFAULT_REMINDER_PREFERENCES,
  type PersistedReminderPreferences,
} from '../src/data/metaStore';
import { planReminders } from '../src/domain/reminders';
import { formatDate } from '../src/lib/format';
import { reminderNotificationAdapter } from '../src/lib/reminderNotifications';
import type { ReminderPermissionState } from '../src/lib/reminderPermissions';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

const timeOptions: readonly DropdownOption[] = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? '00' : '30';
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 || 12;
  const value = `${String(hour).padStart(2, '0')}:${minute}`;
  return { value, title: `${displayHour}:${minute} ${period}` };
});

function permissionLabel(permission: ReminderPermissionState | null): string {
  if (permission === 'granted') return 'Notifications are allowed on this device.';
  if (permission === 'blocked') return 'Notifications are blocked in system settings.';
  if (permission === 'denied') return 'Notifications are not allowed yet.';
  return 'Checking notification permission…';
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'The reminder setting could not be saved.';
}

export default function RemindersScreen() {
  const { colors } = useTheme();
  const { settings: securitySettings } = useSecuritySettings();
  const data = useAppStore((state) => state.data);
  const [preferences, setPreferences] = useState<PersistedReminderPreferences | null>(null);
  const [permission, setPermission] = useState<ReminderPermissionState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    setNow(new Date());
    void metaStore.getMeta().then((meta) => {
      if (active) setPreferences(meta.reminders ?? DEFAULT_REMINDER_PREFERENCES);
    }).catch((error: unknown) => {
      if (active) setMessage(errorText(error));
    });
    void reminderNotificationAdapter.getPermissionState().then((next) => {
      if (active) setPermission(next);
    }).catch((error: unknown) => {
      if (active) setMessage(errorText(error));
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setNow(new Date());
      void reminderNotificationAdapter.getPermissionState().then(setPermission).catch((error: unknown) => {
        setMessage(errorText(error));
      });
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const save = async (next: PersistedReminderPreferences) => {
    setBusy(true);
    setMessage(null);
    try {
      const meta = await metaStore.updateMeta({ reminders: next });
      setPreferences(meta.reminders ?? DEFAULT_REMINDER_PREFERENCES);
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async (enabled: boolean) => {
    if (!preferences) return;
    if (!enabled) {
      await save({ ...preferences, enabled: false });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const current = await reminderNotificationAdapter.getPermissionState();
      const next = current === 'granted'
        ? current
        : current === 'blocked'
          ? current
          : await reminderNotificationAdapter.requestPermission();
      setPermission(next);
      if (next !== 'granted') {
        setMessage(next === 'blocked'
          ? 'Allow notifications in system settings to turn reminders on.'
          : 'Notification permission was not granted. Reminders remain off.');
        return;
      }
      const meta = await metaStore.updateMeta({ reminders: { ...preferences, enabled: true } });
      setPreferences(meta.reminders ?? DEFAULT_REMINDER_PREFERENCES);
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const openSettings = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await reminderNotificationAdapter.openSettings();
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await reminderNotificationAdapter.scheduleTest();
      setMessage('A test notification is scheduled for about 10 seconds from now.');
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const preview = useMemo(() => {
    if (!preferences || !now) return [];
    return planReminders(
      data,
      {
        ...preferences,
        enabled: true,
        hidePreviews: securitySettings?.hidePreviews ?? false,
      },
      now,
      5,
    );
  }, [data, now, preferences, securitySettings?.hidePreviews]);

  return (
    <Screen>
      <AppHeader title="Reminders" showBack />
      <SectionTitle>Local payment reminders</SectionTitle>
      <Card>
        <AppText style={[typography.meta, { color: colors.text2, lineHeight: 20 }]}>
          Reminders stay on this device. Up to 60 upcoming reminders are scheduled;
          open the app to refresh them after a long gap.
        </AppText>
      </Card>
      {!preferences ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <AppText style={[typography.meta, { color: colors.text3 }]}>Loading reminder settings…</AppText>
        </View>
      ) : (
        <>
          <SectionTitle>Permission</SectionTitle>
          <Card>
            <AppText style={[typography.meta, { color: colors.text2 }]}>{permissionLabel(permission)}</AppText>
            {permission === 'blocked' ? (
              <Button
                label="Open system settings"
                icon="settings"
                disabled={busy}
                onPress={() => void openSettings()}
                style={styles.button}
              />
            ) : null}
          </Card>

          <SectionTitle>Schedule</SectionTitle>
          <Card>
            <SwitchRow
              label="Enable reminders"
              value={preferences.enabled}
              disabled={busy}
              onValueChange={(value) => void toggleEnabled(value)}
            />
            <AppText style={[typography.meta, { color: colors.text3, marginBottom: 10 }]}>
              Permission is requested only when you turn reminders on.
            </AppText>
            <Dropdown
              label="Reminder time"
              value={preferences.localTime}
              options={timeOptions}
              onChange={(localTime) => void save({ ...preferences, localTime })}
              accessibilityLabel="Choose reminder time"
            />
            <SwitchRow
              label="Day before"
              value={preferences.dayBefore}
              disabled={busy}
              onValueChange={(value) => void save({ ...preferences, dayBefore: value })}
            />
            <SwitchRow
              label="On the due date"
              value={preferences.sameDay}
              disabled={busy}
              onValueChange={(value) => void save({ ...preferences, sameDay: value })}
            />
            <SwitchRow
              label="Show amounts"
              value={preferences.showAmounts}
              disabled={busy}
              onValueChange={(value) => void save({ ...preferences, showAmounts: value })}
            />
            <AppText style={[typography.meta, { color: colors.text3, lineHeight: 19 }]}>
              Hide app previews overrides this setting and keeps notification text generic.
            </AppText>
          </Card>

          <SectionTitle>Next reminders</SectionTitle>
          <Card>
            {preview.length === 0 ? (
              <AppText style={[typography.meta, { color: colors.text3 }]}>No upcoming dated dues to preview.</AppText>
            ) : preview.map((item) => (
              <View key={item.id} style={[styles.preview, { borderBottomColor: colors.border }]}>
                <View style={styles.previewText}>
                  <AppText weight="semibold">{item.title}</AppText>
                  <AppText style={[typography.meta, { color: colors.text3 }]}>
                    {formatDate(item.target.dueDate)} at {item.fireAt.slice(11)}
                  </AppText>
                  <AppText style={[typography.meta, { color: colors.text2 }]}>{item.body}</AppText>
                </View>
                <AppText style={[typography.meta, { color: colors.text3 }]}>{item.kind === 'day-before' ? 'Day before' : 'Due day'}</AppText>
              </View>
            ))}
          </Card>
          <Card>
            <Button
              label="Send a test notification in 10 seconds"
              icon="bell"
              disabled={busy || permission !== 'granted'}
              onPress={() => void sendTest()}
              style={styles.button}
            />
          </Card>
        </>
      )}
      {busy ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <AppText style={[typography.meta, { color: colors.text3 }]}>Updating reminder settings…</AppText>
        </View>
      ) : null}
      {message ? (
        <AppText accessibilityRole="alert" style={[typography.meta, styles.message, { color: colors.err }]}>
          {message}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: 12, alignSelf: 'stretch' },
  loading: { marginHorizontal: 20, marginVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  preview: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  previewText: { flex: 1, gap: 3 },
  message: { marginHorizontal: 20, marginVertical: 10 },
});
