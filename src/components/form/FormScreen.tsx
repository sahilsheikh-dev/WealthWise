import { Feather } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../ui';
import { IconButton } from '../IconButton';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export function FormScreen({
  title,
  onClose,
  children,
  footer,
  headerAction,
}: PropsWithChildren<{
  title: string;
  onClose: () => void;
  footer: ReactNode;
  headerAction?: { label: string; onPress: () => void; disabled?: boolean };
}>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close form"
            onPress={onClose}
            style={styles.close}>
            <Feather name="x" size={22} color={colors.text2} />
          </Pressable>
          <AppText weight="bold" style={[typography.h1, styles.title]} numberOfLines={1}>{title}</AppText>
          {headerAction ? (
            <IconButton
              icon="trash-2"
              label={headerAction.label}
              onPress={headerAction.onPress}
              variant="destructive"
              disabled={headerAction.disabled}
            />
          ) : <View style={styles.closePlaceholder} />}
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        <View style={[
          styles.footer,
          { backgroundColor: colors.bg, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
          {footer}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: { minHeight: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  close: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  closePlaceholder: { width: 44, height: 44 },
  title: { flex: 1, textAlign: 'center' },
  content: { padding: 20, gap: 18, paddingBottom: 28 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
