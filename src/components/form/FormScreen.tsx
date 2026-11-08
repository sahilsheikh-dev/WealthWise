import type { PropsWithChildren, ReactNode } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useCallback, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormShell, type FormShellAction } from '../FormShell';
import { confirmAsync } from '../../lib/confirm';
import { useTheme } from '../../theme/useTheme';

export function FormScreen({
  title,
  onClose,
  children,
  stickyHeader,
  footer,
  headerAction,
  isDirty = false,
  leftAction,
  rightActions: additionalRightActions = [],
  onHardwareBack,
  bodyContentStyle,
}: PropsWithChildren<{
  title: string;
  onClose: () => void;
  stickyHeader?: ReactNode;
  footer: ReactNode;
  headerAction?: {
    label: string;
    onPress: () => void;
    icon?: FormShellAction['icon'];
    variant?: FormShellAction['variant'];
    disabled?: boolean;
    hint?: string;
  };
  isDirty?: boolean;
  leftAction?: FormShellAction | null;
  rightActions?: readonly FormShellAction[];
  onHardwareBack?: () => boolean;
  bodyContentStyle?: StyleProp<ViewStyle>;
}>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const close = useCallback(async () => {
    if (isDirty) {
      const discard = await confirmAsync({
        title: 'Discard changes?',
        message: 'Your unsaved changes will be lost.',
        confirmLabel: 'Discard',
      });
      if (!discard) return;
    }
    onClose();
  }, [isDirty, onClose]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onHardwareBack) return onHardwareBack();
      void close();
      return true;
    });
    return () => subscription.remove();
  }, [close, onHardwareBack]);

  const resolvedLeftAction = leftAction === undefined
    ? {
      icon: 'arrow-left' as const,
      label: 'Back',
      hint: 'Return to the previous screen',
      onPress: () => { void close(); },
      filled: true,
    }
    : leftAction ?? undefined;
  const rightActions: FormShellAction[] = [
    ...(headerAction ? [{
      icon: headerAction.icon ?? 'trash-2',
      label: headerAction.label,
      hint: headerAction.hint ?? headerAction.label,
      onPress: headerAction.onPress,
      variant: headerAction.variant ?? 'destructive',
      disabled: headerAction.disabled,
      filled: true,
    }] : []),
    ...additionalRightActions,
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FormShell
          title={title}
          titleAlignment="center"
          leftAction={resolvedLeftAction}
          rightActions={rightActions}
          stickyHeader={stickyHeader}
          footer={footer}
          footerBottomPadding={Math.max(insets.bottom, 12)}
          footerBackground={colors.bg}
          bodyContentStyle={bodyContentStyle}
          screenMode
        >
          {children}
        </FormShell>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
});
