import { Tabs } from 'expo-router';

import { BottomTabBar } from '../../src/components/ui';

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarShowLabel: false }}
      tabBar={({ state, navigation }) => (
        <BottomTabBar
          activeTab={state.routes[state.index]?.name ?? null}
          onSelect={(tab) => navigation.navigate(tab)}
        />
      )}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
    </Tabs>
  );
}
