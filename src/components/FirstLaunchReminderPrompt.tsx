import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DEFAULT_REMINDER_PREFERENCES, type BackupMeta } from '../data/metaStore';
import { metaStore, useAppStore } from '../data/store';
import { reminderNotificationAdapter } from '../lib/reminderNotifications';
import { enableReminderPreferences } from '../lib/reminderPreferences';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { IconButton } from './IconButton';
import { TopAnchoredSheet } from './TopAnchoredSheet';
import { AppText, Button } from './ui';

const styles = StyleSheet.create({
  card: { width: '88%', maxWidth: 420 },
  scroll: { flexShrink: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, minWidth: 0 },
  body: { lineHeight: 22 },
  button: { width: '100%', minHeight: 48 },
});

export function FirstLaunchReminderPrompt() {
  const pathname = usePathname();
  const routeRef = useRef(pathname);
  const status = useAppStore((state) => state.status);
  const onboarded = useAppStore((state) => state.data.settings.onboarded);
  const { colors } = useTheme();
  const [meta, setMeta] = useState<BackupMeta | null>(null);
  const [visible, setVisible] = useState(false);
  const showAttempted = useRef(false);
  const actionInFlight = useRef(false);

  useEffect(() => {
    let active = true;
    let receivedUpdate = false;
    const unsubscribe = metaStore.subscribe((next) => {
      receivedUpdate = true;
      if (active) setMeta(next);
    });
    void metaStore.getMeta().then((next) => {
      if (active && !receivedUpdate) setMeta(next);
    }).catch((error: unknown) => {
      if (active) reportPromptError(error);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!meta || status !== 'ready' || !onboarded || pathname !== '/'
      || meta.remindersPromptHandled || showAttempted.current) return undefined;
    const timer = setTimeout(() => {
      showAttempted.current = true;
      void (async () => {
        const latestMeta = await metaStore.getMeta();
        if (latestMeta.remindersPromptHandled || routeRef.current !== '/') {
          setMeta(latestMeta);
          return;
        }
        const permission = await reminderNotificationAdapter.getPermissionState();
        const preferences = latestMeta.reminders ?? DEFAULT_REMINDER_PREFERENCES;
        if (permission === 'granted' && preferences.enabled) return;
        if (routeRef.current !== '/') return;
        const updatedMeta = await metaStore.updateMeta({ remindersPromptHandled: true });
        setMeta(updatedMeta);
        setVisible(true);
      })().catch(reportPromptError);
    }, 400);
    return () => clearTimeout(timer);
  }, [meta, onboarded, pathname, status]);

  useEffect(() => {
    routeRef.current = pathname;
    if (pathname === '/') return undefined;
    const timer = setTimeout(() => setVisible(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const turnOnReminders = async () => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setVisible(false);
    try {
      const result = await enableReminderPreferences(DEFAULT_REMINDER_PREFERENCES, {
        getPermissionState: reminderNotificationAdapter.getPermissionState,
        requestPermission: reminderNotificationAdapter.requestPermission,
        save: async (preferences) => {
          const updatedMeta = await metaStore.updateMeta({ reminders: preferences });
          setMeta(updatedMeta);
          return updatedMeta.reminders ?? DEFAULT_REMINDER_PREFERENCES;
        },
      });
      router.push({
        pathname: '/reminders',
        params: result.permission === 'granted' ? {} : { setup: result.permission },
      });
    } catch (error) {
      reportPromptError(error);
      router.push('/reminders');
    } finally {
      actionInFlight.current = false;
    }
  };

  return (
    <TopAnchoredSheet
      visible={visible && pathname === '/'}
      onClose={() => setVisible(false)}
      sheetTestID="first-launch-reminders-prompt"
      centered
      contentStyle={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <AppText weight="bold" style={[typography.h1, styles.title]}>Payment reminders</AppText>
            <IconButton icon="x" label="Close" onPress={() => setVisible(false)} />
          </View>
          <AppText style={[styles.body, { color: colors.text2 }]}>
            Get a reminder the day before and on the day a payment is due. Reminders stay on this phone.
          </AppText>
          <Button
            label="Turn on reminders"
            variant="primary"
            style={styles.button}
            onPress={() => void turnOnReminders()}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Not now"
            onPress={() => setVisible(false)}
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.76 }]}>
            <AppText style={{ color: colors.text2, textAlign: 'center' }}>Not now</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </TopAnchoredSheet>
  );
}

function reportPromptError(error: unknown): void {
  Alert.alert(
    'Payment reminders',
    error instanceof Error ? error.message : 'Reminder settings could not be updated.',
  );
}
