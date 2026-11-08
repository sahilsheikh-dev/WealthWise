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
import { SecurityProvider } from '../src/components/SecurityProvider';
import { StorageErrorBanner } from '../src/components/StorageErrorBanner';
import { useAppStore } from '../src/data/store';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { useTheme } from '../src/theme/useTheme';

void SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { colors, isDark } = useTheme();
  const status = useAppStore((state) => state.status);
  const recoveryReason = useAppStore((state) => state.recoveryReason);
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {status === 'ready' ? <StorageErrorBanner /> : null}
      {status === 'recovery' ? (
        <RecoveryScreen reason={recoveryReason ?? 'corrupt'} />
      ) : status === 'loading' ? null : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="loans" />
          <Stack.Screen name="emergency-fund" />
          <Stack.Screen name="transaction-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="name-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="plan-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="plan-log-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="loan-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="loan-payment-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="goal-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="holding-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="ef-entry-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="plan-logs" />
          <Stack.Screen name="loan-payments" />
          <Stack.Screen name="backup" />
          <Stack.Screen name="security" />
          <Stack.Screen name="erase-data" />
        </Stack>
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
          <LockGate>
            <AppContent />
          </LockGate>
        </SecurityProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
