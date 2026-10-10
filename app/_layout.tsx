import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RecoveryScreen } from '../src/components/RecoveryScreen';
import { LockGate } from '../src/components/LockGate';
import OnboardingScreen from './onboarding';
import { SecurityProvider } from '../src/components/SecurityProvider';
import { StorageErrorBanner } from '../src/components/StorageErrorBanner';
import { useAppStore } from '../src/data/store';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

void SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { colors, statusBar } = useTheme();
  const status = useAppStore((state) => state.status);
  const recoveryReason = useAppStore((state) => state.recoveryReason);
  const onboarded = useAppStore((state) => state.data.settings.onboarded);
  if (status === 'loading') return null;
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={statusBar} />
      {status === 'recovery' ? (
        <RecoveryScreen reason={recoveryReason ?? 'corrupt'} />
      ) : (
        <>
          <StorageErrorBanner />
          <LockGate>
            {onboarded ? (
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg },
                }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="assets" />
                <Stack.Screen name="liabilities" />
                <Stack.Screen name="emergency-fund" />
                <Stack.Screen name="transaction-form" options={{ presentation: 'modal' }} />
                <Stack.Screen name="link-missing" />
                <Stack.Screen name="profile-form" options={{ presentation: 'modal' }} />
                <Stack.Screen name="theme" />
                <Stack.Screen name="investment-form" options={{ presentation: 'modal' }} />
                <Stack.Screen name="investment-entry-form" options={{ presentation: 'modal' }} />
                <Stack.Screen name="liability-form" options={{ presentation: 'modal' }} />
                <Stack.Screen name="liability-payment-form" options={{ presentation: 'modal' }} />
                <Stack.Screen name="goal-form" options={{ presentation: 'modal' }} />
                <Stack.Screen name="ef-entry-form" options={{ presentation: 'modal' }} />
                <Stack.Screen name="investment-entries" />
                <Stack.Screen name="liability-payments" />
                <Stack.Screen name="backup" />
                <Stack.Screen name="security" />
                <Stack.Screen name="erase-data" />
              </Stack>
            ) : <OnboardingScreen />}
          </LockGate>
        </>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const hydrated = useAppStore((state) => state.hydrated);

  useEffect(() => {
    if ((loaded || error) && hydrated) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error, hydrated]);

  if (error) throw error;
  if (!loaded || !hydrated) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SecurityProvider>
          <AppContent />
        </SecurityProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
