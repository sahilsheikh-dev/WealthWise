import { router, usePathname, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';

import { useSecuritySettings } from './SecurityProvider';
import { metaStore, useAppStore } from '../data/store';
import {
  DEFAULT_REMINDER_PREFERENCES,
  type BackupMeta,
} from '../data/metaStore';
import { planReminders } from '../domain/reminders';
import { isValidISO } from '../domain/dates';
import {
  reminderNotificationAdapter,
  type NotificationResponseEnvelope,
} from '../lib/reminderNotifications';
import { notificationListenerAdapter } from '../lib/notificationListener';
import {
  ensureTransactionDraftNotificationCategory,
  ingestDetectedNotifications,
  postGenericDraftReviewNotification,
  syncNativeDetectionConfig,
} from '../lib/transactionDetectionRuntime';
import { reminderScheduler } from '../lib/reminderRuntime';
import { MAX_SCHEDULED_REMINDERS } from '../lib/reminderScheduler';
import { useUIStore } from '../data/uiStore';

export function ReminderRuntime() {
  const data = useAppStore((state) => state.data);
  const status = useAppStore((state) => state.status);
  const { settings: securitySettings } = useSecuritySettings();
  const [meta, setMeta] = useState<BackupMeta | null>(null);
  const [foregroundRevision, setForegroundRevision] = useState(0);

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
      if (active) reportReminderError(error);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setForegroundRevision((revision) => revision + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !meta || !securitySettings) return undefined;
    const timer = setTimeout(() => {
      void (async () => {
        const permission = await reminderNotificationAdapter.getPermissionState();
        const preferences = meta.reminders ?? DEFAULT_REMINDER_PREFERENCES;
        if (!preferences.enabled || permission !== 'granted') {
          await reminderScheduler.cancel();
          return;
        }
        const reminders = planReminders(
          data,
          { ...preferences, hidePreviews: securitySettings.hidePreviews },
          new Date(),
          MAX_SCHEDULED_REMINDERS,
        );
        await reminderScheduler.refresh(reminders);
      })().catch(reportReminderError);
    }, 250);
    return () => clearTimeout(timer);
  }, [data, foregroundRevision, meta, securitySettings, status]);

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function reminderTarget(data: unknown): { dueItemId: string; dueDate: string } | null {
  if (!isRecord(data) || data.type !== 'wealthwise-reminder' || !isRecord(data.target)) return null;
  const { dueItemId, dueDate } = data.target;
  if (typeof dueItemId !== 'string' || dueItemId.length === 0
    || typeof dueDate !== 'string' || !isValidISO(dueDate)) return null;
  return { dueItemId, dueDate };
}

export function NotificationResponseHandler() {
  const pathname = usePathname();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (pathname !== '/payment-confirm') handledResponseId.current = null;
  }, [pathname]);

  const handleResponse = useCallback((response: NotificationResponseEnvelope) => {
    if (handledResponseId.current === response.identifier) return;
    handledResponseId.current = response.identifier;
    if (isRecord(response.data) && response.data.type === 'wealthwise-transaction-draft') {
      const draftId = typeof response.data.draftId === 'string' ? response.data.draftId : undefined;
      router.push(
        (draftId
          ? { pathname: '/transaction-detection', params: { draftId } }
          : '/transaction-detection') as Href,
      );
    } else {
      const target = reminderTarget(response.data);
      if (target) {
        if (target.dueItemId === 'update-values') router.push('/assets');
        else {
          router.push({
            pathname: '/payment-confirm',
            params: { dueItemId: target.dueItemId, dueDate: target.dueDate },
          });
        }
      }
    }
    void reminderNotificationAdapter.clearLastResponse().catch((error: unknown) => {
      Alert.alert(
        'Could not clear notification response',
        error instanceof Error ? error.message : 'Try opening the reminder again.',
      );
    });
  }, []);

  useEffect(() => {
    const removeListener = reminderNotificationAdapter.addResponseListener(handleResponse);
    void reminderNotificationAdapter.getLastResponse().then((response) => {
      if (response) handleResponse(response);
    }).catch((error: unknown) => {
      Alert.alert(
        'Could not read notification',
        error instanceof Error ? error.message : 'The reminder could not be opened.',
      );
    });
    return removeListener;
  }, [handleResponse]);

  return null;
}

export function TransactionDetectionRuntime() {
  const status = useAppStore((state) => state.status);

  useEffect(() => {
    if (status !== 'ready') return undefined;
    void ensureTransactionDraftNotificationCategory();
    void syncNativeDetectionConfig();

    const drain = async () => {
      const events = await notificationListenerAdapter.drainQueuedEvents();
      if (events.length === 0) return;
      await ingestDetectedNotifications(events);
    };
    void drain();

    const unsubApp = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void drain();
      }
    });

    const unsubEvents = notificationListenerAdapter.subscribeLiveEvents((event) => {
      void ingestDetectedNotifications([event]).then(async ({ addedDrafts }) => {
        const firstDraft = addedDrafts[0];
        if (!firstDraft) return;
        if (AppState.currentState === 'active') {
          router.push(`/transaction-detection?draftId=${encodeURIComponent(firstDraft.id)}` as Href);
        } else {
          await postGenericDraftReviewNotification(firstDraft.id);
        }
      });
    });

    return () => {
      unsubApp.remove();
      unsubEvents();
    };
  }, [status]);

  return null;
}

function reportReminderError(error: unknown): void {
  const detail = error instanceof Error ? error.message : 'An unexpected error occurred.';
  useUIStore.getState().setActionToast({ message: `Reminders could not be updated. ${detail}` });
}
