import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { useSecuritySettings } from '../src/components/SecurityProvider';
import { AppText, Button, Card, Screen, ScreenHeader, SectionTitle } from '../src/components/ui';
import { TextField } from '../src/components/form/TextField';
import { useAppStore } from '../src/data/store';
import { createAuthenticator } from '../src/lib/authenticate';
import { confirmAsync } from '../src/lib/confirm';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

const authenticator = createAuthenticator({
  hasHardwareAsync: LocalAuthentication.hasHardwareAsync,
  isEnrolledAsync: LocalAuthentication.isEnrolledAsync,
  authenticateAsync: async (options) => LocalAuthentication.authenticateAsync(options),
});

export default function EraseDataScreen() {
  const { colors } = useTheme();
  const { settings, resetAfterErase } = useSecuritySettings();
  const eraseAllData = useAppStore((state) => state.actions.eraseAllData);
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const erase = async () => {
    if (confirmation !== 'ERASE' || busy || !settings) return;
    setBusy(true);
    setMessage(null);
    try {
      if (settings.enabled) {
        const result = await authenticator.authenticate('Unlock Wealth Wise');
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
      }
      const confirmed = await confirmAsync({
        title: 'Erase all data?',
        message: 'This permanently deletes the data saved on this phone.',
        confirmLabel: 'Erase all data',
        destructive: true,
      });
      if (!confirmed) return;
      const result = await eraseAllData();
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      resetAfterErase();
      router.replace('/(tabs)');
    } catch {
      setMessage('Your data could not be erased. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Erase all data" right={<Button label="Back" onPress={() => router.back()} />} />
      <SectionTitle>What will be deleted</SectionTitle>
      <Card>
        <AppText style={[typography.meta, { color: colors.text2, lineHeight: 20 }]}>
          All transactions, goals, holdings, loans, emergency-fund entries, app preferences, undo data, damaged-data recovery copies, export reminders, and app-lock settings stored on this phone.
        </AppText>
        <Button label="Export a backup first" onPress={() => router.push('/backup')} />
      </Card>
      <Card>
        <TextField
          label="Type ERASE to continue"
          accessibilityLabel="Type ERASE to confirm deleting all data"
          autoCapitalize="characters"
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder="ERASE"
        />
        <Button
          label="Erase all data"
          variant="danger-text"
          disabled={confirmation !== 'ERASE' || busy}
          onPress={() => void erase()}
        />
      </Card>
      {message ? <AppText accessibilityRole="alert" style={[typography.meta, styles.message, { color: colors.err }]}>{message}</AppText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ message: { marginHorizontal: 20, marginVertical: 10 } });
