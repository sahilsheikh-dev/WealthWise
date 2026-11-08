import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppActions } from '../data/useAppData';
import { todayISO } from '../lib/clock';
import { AppText, Button, Card, Screen } from './ui';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { confirmAsync } from '../lib/confirm';

type RecoveryReason = 'corrupt' | 'newer-version' | 'read-error';

export function RecoveryScreen({ reason }: { reason: RecoveryReason }) {
  const { resolveRecovery, retryHydration, getCorruptBackup } = useAppActions();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const startFresh = () => {
    void confirmAsync({
      title: 'Start fresh?',
      message: 'This will replace the unreadable saved data with a new empty account. A backup copy will remain on this device.',
      confirmLabel: 'Start fresh',
      destructive: true,
    }).then((confirmed) => { if (confirmed) resolveRecovery('start-fresh'); });
  };
  const shareDamagedData = async () => {
    setBusy(true);
    setMessage(null);
    let file: File | null = null;
    try {
      const raw = await getCorruptBackup();
      if (raw === null) {
        setMessage('The damaged data file is not available to share.');
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
        setMessage('Sharing is not available on this device.');
        return;
      }
      file = new File(Paths.cache, `wealthwise-damaged-${todayISO().replaceAll('-', '')}.txt`);
      file.create({ overwrite: true });
      file.write(raw);
      await Sharing.shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: 'Share damaged data file' });
    } catch {
      setMessage('The damaged data file could not be shared.');
    } finally {
      try {
        if (file?.exists) file.delete();
      } catch {
        setMessage('The temporary damaged-data file could not be removed from this device.');
      }
      setBusy(false);
    }
  };
  const newerVersion = reason === 'newer-version';
  const readError = reason === 'read-error';

  return (
    <Screen>
      <View style={styles.content}>
        <Card>
          <AppText weight="bold" style={typography.h1}>
            {newerVersion ? 'Update Wealth Wise' : readError ? 'Saved data is temporarily unavailable' : 'Saved data could not be read'}
          </AppText>
          <AppText style={[styles.body, { color: colors.text2 }]}>
            {newerVersion
              ? 'This data was saved by a newer version of the app. Update Wealth Wise to open it safely.'
              : readError
                ? "Your saved data couldn't be read right now. It has not been changed."
                : 'Your saved data could not be read. A copy of the damaged data is kept on this device.'}
          </AppText>
          {readError ? <Button label="Try again" icon="refresh-cw" variant="primary" disabled={busy} onPress={retryHydration} /> : null}
          {reason === 'corrupt' ? (
            <>
              <Button label="Share damaged data file" icon="share" disabled={busy} onPress={() => void shareDamagedData()} />
              <Button label="Start fresh" icon="refresh-cw" variant="danger-text" disabled={busy} onPress={startFresh} />
            </>
          ) : null}
          {message ? <AppText accessibilityRole="alert" style={[typography.meta, { color: colors.err }]}>{message}</AppText> : null}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center' },
  body: { ...typography.meta, lineHeight: 20, marginVertical: 16 },
});
