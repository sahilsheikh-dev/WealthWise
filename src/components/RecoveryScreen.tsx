import { StyleSheet, View } from 'react-native';

import { useAppActions } from '../data/useAppData';
import { AppText, Button, Card, Screen } from './ui';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { confirmAsync } from '../lib/confirm';

export function RecoveryScreen({ newerVersion = false }: { newerVersion?: boolean }) {
  const { resolveRecovery } = useAppActions();
  const { colors } = useTheme();
  const startFresh = () => {
    void confirmAsync({
      title: 'Start fresh?',
      message: 'This will replace the unreadable saved data with a new empty account. A backup copy will remain on this device.',
      confirmLabel: 'Start fresh',
      destructive: true,
    }).then((confirmed) => { if (confirmed) resolveRecovery('start-fresh'); });
  };

  return (
    <Screen>
      <View style={styles.content}>
        <Card>
          <AppText weight="bold" style={typography.h1}>
            {newerVersion ? 'Update Wealth Wise' : 'Saved data could not be read'}
          </AppText>
          <AppText style={[styles.body, { color: colors.text2 }]}>
            {newerVersion
              ? 'This data was saved by a newer version of the app. Update Wealth Wise to open it safely.'
              : 'We could not read your saved data. A copy has been kept on this device. You can start fresh without deleting that backup.'}
          </AppText>
          {!newerVersion ? <Button label="Start fresh" variant="primary" onPress={startFresh} /> : null}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center' },
  body: { ...typography.meta, lineHeight: 20, marginVertical: 16 },
});
