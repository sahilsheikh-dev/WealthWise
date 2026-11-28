import Constants from 'expo-constants';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import { AppText, Card, Screen, SectionTitle } from '../src/components/ui';
import { SCHEMA_VERSION } from '../src/domain/schemas';
import { confirmAsync } from '../src/lib/confirm';
import { typography } from '../src/theme/tokens';

const repositoryUrl = 'https://github.com/sahilsheikh-dev/WealthWise';
const releasesUrl = `${repositoryUrl}/releases`;
const links = [
  { label: 'Repository', url: repositoryUrl },
  { label: 'Releases', url: releasesUrl },
  { label: 'Issues', url: `${repositoryUrl}/issues` },
  { label: 'CHANGELOG', url: `${repositoryUrl}/blob/main/CHANGELOG.md` },
] as const;

function showOpenError(error: unknown) {
  Alert.alert(
    'Could not open link',
    error instanceof Error ? error.message : 'An unexpected error occurred.',
  );
}

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function AboutScreen() {
  const appName = Constants.expoConfig?.name ?? 'WealthWise';
  const appVersion = Constants.expoConfig?.version;

  const openLink = (url: string) => {
    void Linking.openURL(url).catch(showOpenError);
  };

  const checkForUpdates = async () => {
    try {
      const confirmed = await confirmAsync({
        title: 'Check for updates?',
        message: 'Your browser will open the GitHub latest-release page. The app will not check for updates itself.',
        confirmLabel: 'Open browser',
      });
      if (!confirmed) return;
      await Linking.openURL(`${releasesUrl}/latest`);
    } catch (error: unknown) {
      showOpenError(error);
    }
  };

  return (
    <Screen>
      <AppHeader title="About" showBack />
      <SectionTitle>App information</SectionTitle>
      <Card style={styles.card}>
        <AppText weight="bold" style={typography.h1}>{appName}</AppText>
        <AppText>Version {appVersion ?? 'Unavailable'}</AppText>
        <AppText>Data schema version {SCHEMA_VERSION}</AppText>
        <AppText>License: MIT</AppText>
      </Card>
      <SectionTitle>Project</SectionTitle>
      <Card style={styles.card}>
        {links.map(({ label, url }) => (
          <Pressable
            key={label}
            accessibilityRole="link"
            accessibilityLabel={label}
            accessibilityHint="Opens this page in your browser."
            onPress={() => openLink(url)}
            style={styles.link}>
            <AppText style={typography.name}>{label}</AppText>
          </Pressable>
        ))}
      </Card>
      <SectionTitle>Privacy</SectionTitle>
      <Card style={styles.card}>
        <AppText>Data stays on this device; the app makes no network requests.</AppText>
      </Card>
      <View style={styles.updateAction}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Check for updates"
          accessibilityHint="Opens the latest release in your browser after confirmation."
          onPress={() => void checkForUpdates()}
          style={styles.link}>
          <AppText weight="semibold" style={typography.name}>Check for updates</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, marginBottom: 8 },
  link: { minHeight: 44, justifyContent: 'center' },
  updateAction: { paddingHorizontal: 20, paddingTop: 4 },
});
