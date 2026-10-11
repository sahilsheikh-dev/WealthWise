import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText, Button, Card, Screen } from './ui';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export type ScreenErrorBoundaryProps = {
  error: Error;
  retry: () => void;
};

export function ScreenErrorBoundary({ error, retry }: ScreenErrorBoundaryProps) {
  const { colors } = useTheme();
  return (
    <Screen>
      <Card style={styles.card}>
        <AppText weight="bold" style={typography.h1}>Something went wrong on this screen</AppText>
        {__DEV__ ? (
          <AppText selectable style={[typography.meta, { color: colors.text3 }]}>{error.message}</AppText>
        ) : null}
        <Button label="Try again" icon="refresh-cw" variant="primary" onPress={retry} />
        <Button label="Go to Home" icon="home" onPress={() => router.replace('/(tabs)')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ card: { gap: 10 } });
