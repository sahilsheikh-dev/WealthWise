import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { useSecuritySettings } from './SecurityProvider';
import { AppText, Button, Card, Screen } from './ui';
import { createAuthenticator } from '../lib/authenticate';
import { lockReducer, type LockState } from '../lib/lockPolicy';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const authenticator = createAuthenticator({
  hasHardwareAsync: LocalAuthentication.hasHardwareAsync,
  isEnrolledAsync: LocalAuthentication.isEnrolledAsync,
  authenticateAsync: async (options) => LocalAuthentication.authenticateAsync(options),
});

export function LockGate({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const { settings, update } = useSecuritySettings();
  const [lock, setLock] = useState<LockState>({ locked: false, authInFlight: false, backgroundedAt: null });
  const [capability, setCapability] = useState<'ready' | 'no-hardware' | 'not-enrolled' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const autoAttempted = useRef(false);
  const initialized = useRef(false);
  const lastState = useRef(AppState.currentState);

  useEffect(() => {
    if (!settings) return;
    setLock((current) => {
      const next = initialized.current
        ? lockReducer(current, { type: 'settings-changed', enabled: settings.enabled })
        : lockReducer(current, { type: 'cold-start', enabled: settings.enabled });
      initialized.current = true;
      return next;
    });
    if (!settings.enabled) setCapability('ready');
  }, [settings]);

  const unlock = useCallback(async () => {
    if (!settings?.enabled) return;
    setMessage(null);
    setLock((current) => lockReducer(current, { type: 'auth-start' }));
    try {
      const nextCapability = await authenticator.getCapability();
      setCapability(nextCapability);
      if (nextCapability !== 'ready') {
        setMessage("Device security isn't set up on this phone.");
        return;
      }
      const result = await authenticator.authenticate('Unlock Wealth Wise');
      if (result.ok) {
        setLock((current) => lockReducer(current, { type: 'auth-success' }));
      } else {
        setMessage(result.message);
      }
    } catch {
      setMessage('Device authentication is unavailable right now.');
    } finally {
      setLock((current) => lockReducer(current, { type: 'auth-finished' }));
    }
  }, [settings, setLock]);

  useEffect(() => {
    if (!settings?.enabled || !lock.locked) {
      autoAttempted.current = false;
      return;
    }
    if (autoAttempted.current) return;
    autoAttempted.current = true;
    void unlock();
  }, [lock.locked, settings?.enabled, unlock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
      const previous = lastState.current;
      if (nextState !== 'active' && previous === 'active') {
        setLock((current) => lockReducer(current, { type: 'background', now: Date.now() }));
      } else if (nextState === 'active' && previous !== 'active' && settings) {
        setLock((current) => lockReducer(current, {
          type: 'foreground', enabled: settings.enabled, now: Date.now(), graceMs: settings.graceMs,
        }));
      }
      lastState.current = nextState;
    });
    return () => subscription.remove();
  }, [settings]);

  useEffect(() => {
    if (!settings?.hidePreviews) {
      void ScreenCapture.allowScreenCaptureAsync().catch(() => setMessage('Screenshot protection could not be turned off.'));
      return;
    }
    void ScreenCapture.preventScreenCaptureAsync().catch(() => setMessage('Screenshot protection could not be enabled.'));
    return () => {
      void ScreenCapture.allowScreenCaptureAsync().catch(() => setMessage('Screenshot protection could not be released.'));
    };
  }, [settings?.hidePreviews]);

  if (!settings) return <LockScreen message="Loading device security…" />;
  if (settings.enabled && lock.locked) {
    const setupRequired = capability === 'no-hardware' || capability === 'not-enrolled';
    return (
      <LockScreen
        message={setupRequired ? "Device security isn't set up on this phone." : message ?? undefined}
        setupRequired={setupRequired}
        onUnlock={() => void unlock()}
        onDisable={() => {
          void update({ ...settings, enabled: false }).then(() => {
            setLock((current) => lockReducer(current, { type: 'settings-changed', enabled: false }));
            setMessage(null);
          }).catch(() => setMessage('App lock could not be turned off. Try again.'));
        }}
      />
    );
  }
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {children}
      {settings.hidePreviews && appState !== 'active' ? (
        <View accessibilityLabel="Privacy cover" style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />
      ) : null}
    </View>
  );
}

function LockScreen({
  message,
  setupRequired = false,
  onUnlock,
  onDisable,
}: {
  message?: string;
  setupRequired?: boolean;
  onUnlock?: () => void;
  onDisable?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Screen>
      <View style={styles.lockContent}>
        <Card>
          <AppText weight="bold" style={typography.h1}>Wealth Wise is locked</AppText>
          {message ? <AppText style={[typography.meta, { color: colors.text2, marginVertical: 12 }]}>{message}</AppText> : null}
          {setupRequired ? (
            <Button label="Turn off app lock" variant="danger-text" onPress={onDisable} />
          ) : onUnlock ? (
            <Button label="Unlock" variant="primary" onPress={onUnlock} />
          ) : null}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  lockContent: { flex: 1, justifyContent: 'center' },
});
