import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { useSecuritySettings } from '../src/components/SecurityProvider';
import { AppHeader } from '../src/components/AppHeader';
import { Dropdown } from '../src/components/Dropdown';
import { AppText, Card, Screen, SectionTitle } from '../src/components/ui';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { createAuthenticator } from '../src/lib/authenticate';
import { GRACE_OPTIONS } from '../src/lib/lockPolicy';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const authenticator = createAuthenticator({
  hasHardwareAsync: LocalAuthentication.hasHardwareAsync,
  isEnrolledAsync: LocalAuthentication.isEnrolledAsync,
  authenticateAsync: async (options) => LocalAuthentication.authenticateAsync(options),
});
const graceChoices = ['Immediately', '30 seconds', '5 minutes'] as const;
const graceMsFor = (label: (typeof graceChoices)[number]) => ({
  Immediately: GRACE_OPTIONS.immediate,
  '30 seconds': GRACE_OPTIONS['30 seconds'],
  '5 minutes': GRACE_OPTIONS['5 minutes'],
}[label]);
const graceLabelFor = (graceMs: number) =>
  graceChoices.find((label) => graceMsFor(label) === graceMs) ?? '30 seconds';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function SecurityScreen() {
  const { colors } = useTheme();
  const { settings, update } = useSecuritySettings();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!settings) return <Screen><AppText>Loading device security…</AppText></Screen>;
  const changeLock = async (enabled: boolean) => {
    setBusy(true);
    setMessage(null);
    try {
      if (enabled) {
        const capability = await authenticator.getCapability();
        if (capability !== 'ready') {
          setMessage(capability === 'no-hardware'
            ? 'This phone does not have biometric or device authentication hardware.'
            : 'Set up biometrics or a device passcode before turning on app lock.');
          return;
        }
      }
      const result = await authenticator.authenticate('Unlock Wealth Wise');
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      await update({
        ...settings,
        enabled,
        hidePreviews: enabled && !settings.enabled ? true : settings.hidePreviews,
      });
    } catch {
      setMessage('Security settings could not be saved. Try again.');
    } finally {
      setBusy(false);
    }
  };
  const changeGrace = (choice: string) => {
    const selected = graceChoices.find((item) => item === choice);
    if (!selected) return;
    void update({ ...settings, graceMs: graceMsFor(selected) })
      .catch(() => setMessage('The lock delay could not be saved.'));
  };
  const changePrivacy = (hidePreviews: boolean) => {
    void update({ ...settings, hidePreviews })
      .catch(() => setMessage('The privacy setting could not be saved.'));
  };

  return (
    <Screen>
      <AppHeader title="Security" showBack />
      <SectionTitle>App lock</SectionTitle>
      <Card>
        <SwitchRow label="App lock" value={settings.enabled} disabled={busy} onValueChange={(value) => void changeLock(value)} />
        <AppText style={[typography.meta, { color: colors.text3, marginBottom: 10 }]}>
          Require device authentication to open Wealth Wise.
        </AppText>
        <Dropdown
          label="Lock again after"
          accessibilityLabel="Lock again after"
          options={graceChoices.map((choice) => ({ value: choice, title: choice }))}
          value={graceLabelFor(settings.graceMs)}
          onChange={changeGrace}
        />
        <SwitchRow
          label="Hide app preview and block screenshots"
          value={settings.hidePreviews}
          disabled={busy}
          onValueChange={changePrivacy}
        />
      </Card>
      {message ? <AppText accessibilityRole="alert" style={[typography.meta, styles.message, { color: colors.err }]}>{message}</AppText> : null}
      <Card>
        <AppText style={[typography.meta, { color: colors.text2, lineHeight: 19 }]}>
          App lock stops someone from using your unlocked phone. It does not encrypt the data stored on this device.
        </AppText>
      </Card>
      {busy ? <AppText style={[typography.meta, { color: colors.text3, marginHorizontal: 20 }]}>Checking device security…</AppText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: { marginHorizontal: 20, marginVertical: 10 },
});
