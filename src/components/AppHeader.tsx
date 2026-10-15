import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';

import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { routeKindForPath } from '../lib/routeKinds';
import { HeaderMenu, type HeaderMenuItem } from './HeaderMenu';
import { AppText } from './ui';
import { useAppMenu } from './useAppMenu';

export type AppHeaderAction = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  showIndicator?: boolean;
};

export type AppHeaderMenuItem = Omit<HeaderMenuItem, 'onPress'> & { onPress: () => void };

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  backLabel = 'Go back',
  fallbackHref = '/',
  rightActions = [],
  menu,
  showDefaultMenu,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
  fallbackHref?: '/' | '/(tabs)' | '/assets' | '/liabilities' | '/emergency-fund';
  rightActions?: AppHeaderAction[];
  menu?: AppHeaderMenuItem[];
  showDefaultMenu?: boolean;
}) {
  const { colors } = useTheme();
  const pathname = usePathname();
  const routeKind = routeKindForPath(pathname);
  const globalMenu = useAppMenu();
  const [menuVisible, setMenuVisible] = useState(false);
  const showBackControl = showBack || routeKind === 'stack';
  const showCloseControl = routeKind === 'form';
  const constrainTitle = rightActions.length > 2;
  const hasExplicitRightContent = rightActions.length > 0 || menu !== undefined;
  const defaultMenu = !hasExplicitRightContent && showDefaultMenu !== false ? globalMenu : undefined;
  const visibleMenu = menu ?? defaultMenu;
  const menuItems = visibleMenu?.map((item) => ({
    ...item,
    onPress: item.onPress,
  }));

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(fallbackHref);
  }

  useEffect(() => {
    if (!showBackControl && !showCloseControl) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) router.back();
      else router.replace(fallbackHref);
      return true;
    });
    return () => subscription.remove();
  }, [fallbackHref, showBackControl, showCloseControl]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {showBackControl || showCloseControl ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showCloseControl ? 'Close' : backLabel}
            onPress={goBack}
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name={showCloseControl ? 'x' : 'chevron-left'} size={showCloseControl ? 20 : 24} color={colors.text1} />
          </Pressable>
        ) : null}
        <View style={styles.titleBlock}>
          <AppText
            weight="bold"
            style={typography.h1}
            numberOfLines={constrainTitle ? 1 : 2}
            ellipsizeMode={constrainTitle ? 'tail' : undefined}>
            {title}
          </AppText>
          {subtitle ? <AppText style={[typography.meta, { color: colors.text3 }]}>{subtitle}</AppText> : null}
        </View>
        <View style={styles.actions}>
          {rightActions.slice(0, 3).map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityState={{ disabled: action.disabled }}
              disabled={action.disabled}
              onPress={action.onPress}
              style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }, action.disabled && styles.disabled]}>
              <Feather name={action.icon} size={20} color={action.destructive ? colors.err : colors.primary} />
              {action.showIndicator ? <View testID="header-action-indicator" style={[styles.actionIndicator, { backgroundColor: colors.primary }]} /> : null}
            </Pressable>
          ))}
          {visibleMenu ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More options"
              onPress={() => setMenuVisible(true)}
              style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <AppText weight="bold" style={styles.ellipsis}>⋯</AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
      {menuItems ? <HeaderMenu visible={menuVisible} items={menuItems} onClose={() => setMenuVisible(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleBlock: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  ellipsis: { fontSize: 25, lineHeight: 30, marginTop: 7 },
  actionIndicator: { position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: 3 },
  disabled: { opacity: 0.45 },
});
