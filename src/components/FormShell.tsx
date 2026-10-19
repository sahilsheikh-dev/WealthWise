import { Feather } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { AppText } from './ui';

export type FormShellAction = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  hint: string;
  onPress: () => void;
  destructive?: boolean;
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
}: PropsWithChildren<{
  title: string;
  leftAction?: FormShellAction;
  rightActions?: readonly FormShellAction[];
  footer: ReactNode;
  titleAlignment?: 'center' | 'left';
  bodyTestID?: string;
  headerTestID?: string;
}>) {
  const { colors } = useTheme();
  return (
    <View style={styles.shell} testID="form-shell">
      <View testID={headerTestID} style={[styles.header, { borderBottomColor: colors.border }]}>
        {leftAction ? <ActionButton action={leftAction} /> : null}
        <AppText
          weight="bold"
          numberOfLines={1}
          style={[typography.h1, styles.title, titleAlignment === 'center' && styles.centerTitle]}>
          {title}
        </AppText>
        <View style={styles.actions}>
          {rightActions.map((action) => <ActionButton key={action.label} action={action} />)}
        </View>
      </View>
      <ScrollView
        testID={bodyTestID ?? 'form-shell-body'}
        style={styles.body}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
      <View testID="form-shell-footer" style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {footer}
      </View>
    </View>
  );
}

function ActionButton({ action }: { action: FormShellAction }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityHint={action.hint}
      onPress={action.onPress}
      style={styles.action}>
      <Feather name={action.icon} size={20} color={action.destructive ? colors.err : colors.text2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { flexShrink: 1, alignSelf: 'stretch' },
  header: { minHeight: 58, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { flex: 1, minWidth: 0 },
  centerTitle: { textAlign: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { flexShrink: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
