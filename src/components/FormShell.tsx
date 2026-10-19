import { Feather } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { AppText } from './ui';

export type FormShellAction = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  hint: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  filled?: boolean;
  variant?: 'default' | 'primary' | 'destructive';
};

export function FormShell({
  title,
  children,
  leftAction,
  rightActions = [],
  footer,
  titleAlignment = 'left',
  bodyTestID,
  headerTestID,
  stickyHeader,
  screenMode = false,
  footerBottomPadding = 12,
  footerBackground,
  bodyContentStyle,
}: PropsWithChildren<{
  title: string;
  leftAction?: FormShellAction;
  rightActions?: readonly FormShellAction[];
  footer: ReactNode;
  titleAlignment?: 'center' | 'left';
  bodyTestID?: string;
  headerTestID?: string;
  stickyHeader?: ReactNode;
  screenMode?: boolean;
  footerBottomPadding?: number;
  footerBackground?: string;
  bodyContentStyle?: StyleProp<ViewStyle>;
}>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.shell, screenMode ? styles.screenShell : null]} testID="form-shell">
      <View
        testID={headerTestID}
        style={[
          styles.header,
          screenMode ? styles.screenHeader : null,
          { borderBottomColor: colors.border },
        ]}>
        {leftAction ? <ActionButton action={leftAction} /> : screenMode ? <View style={styles.actionPlaceholder} /> : null}
        <AppText
          weight="bold"
          style={[typography.h1, styles.title, titleAlignment === 'center' && styles.centerTitle]}>
          {title}
        </AppText>
        <View style={[styles.actions, screenMode ? styles.screenActions : null]}>
          {rightActions.map((action) => <ActionButton key={action.label} action={action} />)}
          {screenMode && rightActions.length === 0 ? <View style={styles.actionPlaceholder} /> : null}
        </View>
      </View>
      <ScrollView
        testID={bodyTestID ?? 'form-shell-body'}
        style={[styles.body, screenMode ? styles.screenBody : null]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={stickyHeader ? [0] : undefined}
        contentContainerStyle={[
          styles.content,
          screenMode ? styles.screenContent : null,
          bodyContentStyle,
        ]}>
        {stickyHeader ? (
          <View style={[styles.stickyHeader, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
            {stickyHeader}
          </View>
        ) : null}
        {children}
      </ScrollView>
      <View
        testID="form-shell-footer"
        style={[
          styles.footer,
          screenMode ? styles.screenFooter : null,
          {
            backgroundColor: footerBackground ?? colors.surface,
            borderTopColor: colors.border,
            paddingBottom: footerBottomPadding,
          },
        ]}>
        {footer}
      </View>
    </View>
  );
}

function ActionButton({ action }: { action: FormShellAction }) {
  const { colors } = useTheme();
  const variant = action.destructive ? 'destructive' : action.variant ?? 'default';
  const backgroundColor = action.filled
    ? variant === 'destructive' ? colors.errDim
      : variant === 'primary' ? colors.primary
        : colors.surface2
    : 'transparent';
  const color = variant === 'destructive' ? colors.err
    : variant === 'primary' ? colors.surface
      : colors.text2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityHint={action.hint}
      accessibilityState={{ disabled: action.disabled ?? false }}
      disabled={action.disabled}
      onPress={action.onPress}
      style={[styles.action, { backgroundColor }, action.disabled ? styles.disabled : null]}>
      <Feather name={action.icon} size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { flexShrink: 1, alignSelf: 'stretch' },
  screenShell: { flex: 1 },
  header: { minHeight: 58, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  screenHeader: { paddingHorizontal: 20 },
  title: { flex: 1, minWidth: 0 },
  centerTitle: { textAlign: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  screenActions: { minWidth: 44 },
  actionPlaceholder: { width: 44, height: 44 },
  action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  disabled: { opacity: 0.45 },
  body: { flexShrink: 1 },
  screenBody: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 20 },
  screenContent: { gap: 18, paddingBottom: 28 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth },
  screenFooter: { paddingHorizontal: 20, paddingTop: 12 },
  stickyHeader: { zIndex: 1, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
});
