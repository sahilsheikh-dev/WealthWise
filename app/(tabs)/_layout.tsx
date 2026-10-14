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
  budget: 'pie-chart',
} as const;

const tabLabels = {
  index: 'Home',
  transactions: 'Transactions',
  goals: 'Goals',
  budget: 'Budget',
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
          height: 76 + insets.bottom,
          paddingTop: Math.min(20, insets.bottom),
          paddingBottom: Math.max(10, insets.bottom),
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
              <AppText numberOfLines={1} style={[typography.navLabel, styles.tabLabel, { color }]}>{label}</AppText>
            </View>
          );
        },
      })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContent: { alignItems: 'center', justifyContent: 'center', gap: 2, width: 100, minHeight: 44 },
  tabLabel: { flexShrink: 1, textAlign: 'center' },
});
