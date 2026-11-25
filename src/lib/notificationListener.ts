import { Linking, NativeEventEmitter, NativeModules, Platform } from 'react-native';

import type { RawDetectedNotification } from '../domain/transactionDetection';

type NativeListenerModule = {
  isPermissionGranted: () => Promise<boolean>;
  openNotificationAccessSettings: () => Promise<void>;
  openAppInfoSettings: () => Promise<void>;
  setDetectionConfig: (enabled: boolean, allowedPackages: string[]) => Promise<void>;
  drainQueuedEvents: () => Promise<RawDetectedNotification[]>;
};

const nativeModule = (NativeModules as Record<string, unknown> | undefined)
  ?.WealthWiseNotificationListener as NativeListenerModule | undefined;

export const notificationListenerAdapter = {
  isSupported(): boolean {
    return Platform.OS === 'android';
  },
  hasNativeModule(): boolean {
    return Platform.OS === 'android' && nativeModule !== undefined;
  },
  async isPermissionGranted(): Promise<boolean> {
    if (Platform.OS !== 'android' || !nativeModule) return false;
    return nativeModule.isPermissionGranted();
  },
  async openNotificationAccessSettings(): Promise<void> {
    if (Platform.OS !== 'android') return;
    if (nativeModule) {
      await nativeModule.openNotificationAccessSettings();
      return;
    }
    await Linking.openSettings();
  },
  async openAppInfoSettings(): Promise<void> {
    if (Platform.OS !== 'android') return;
    if (nativeModule) {
      await nativeModule.openAppInfoSettings();
      return;
    }
    await Linking.openSettings();
  },
  async setDetectionConfig(enabled: boolean, allowedPackages: string[]): Promise<void> {
    if (Platform.OS !== 'android' || !nativeModule) return;
    await nativeModule.setDetectionConfig(enabled, allowedPackages);
  },
  async drainQueuedEvents(): Promise<RawDetectedNotification[]> {
    if (Platform.OS !== 'android' || !nativeModule) return [];
    return nativeModule.drainQueuedEvents();
  },
  subscribeLiveEvents(listener: (event: RawDetectedNotification) => void): () => void {
    if (Platform.OS !== 'android' || !nativeModule) return () => undefined;
    const emitter = new NativeEventEmitter(
      NativeModules.WealthWiseNotificationListener as ConstructorParameters<typeof NativeEventEmitter>[0],
    );
    const sub = emitter.addListener('WealthWiseNotificationDetected', (raw: object) => {
      const event = raw as Partial<RawDetectedNotification>;
      if (
        typeof event.packageName === 'string' &&
        typeof event.title === 'string' &&
        typeof event.text === 'string' &&
        typeof event.postedAtMs === 'number'
      ) {
        listener({
          packageName: event.packageName,
          title: event.title,
          text: event.text,
          postedAtMs: event.postedAtMs,
        });
      }
    });
    return () => sub.remove();
  },
};
