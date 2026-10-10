import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../src/components/ui';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const tabIcons = {
  index: 'home',
  transactions: 'repeat',
  goals: 'target',
} as const;

const tabLabels = {
  index: 'Home',
  transactions: 'Txns',
  goals: 'Goals',
} as const;

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text3,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(7, insets.bottom),
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarIcon: ({ color, size }) => {
          const name = tabIcons[route.name as keyof typeof tabIcons] ?? 'circle';
          const label = tabLabels[route.name as keyof typeof tabLabels];
          return (
            <View style={styles.tabContent}>
              <Feather name={name} size={size} color={color} />
              <AppText style={[typography.navLabel, { color }]}>{label}</AppText>
            </View>
          );
        },
      })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Txns' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContent: { alignItems: 'center', justifyContent: 'center', gap: 2, width: 60, marginTop: 10 },
});
