import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppActions } from '../data/useAppData';
import { useAppStore } from '../data/store';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { AppText } from './ui';

export function StorageErrorBanner() {
  const storageError = useAppStore((state) => state.storageError);
  const storageWarning = useAppStore((state) => state.storageWarning);
  const { dismissStorageError, dismissStorageWarning } = useAppActions();
  const { colors } = useTheme();
  if (!storageError && !storageWarning) return null;

  const isError = Boolean(storageError);
  const backgroundColor = isError ? colors.errDim : colors.infoDim;
  const iconColor = isError ? colors.err : colors.info;
  const textColor = isError ? colors.err : colors.text1;
  const iconName = isError ? 'alert-circle' : 'alert-triangle';
  const bannerText = isError
    ? 'Your last change could not be saved. Free up storage and try again.'
    : storageWarning;
  const dismissLabel = isError ? 'Dismiss storage error' : 'Dismiss storage warning';
  const onDismiss = isError ? dismissStorageError : dismissStorageWarning;

  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor }]}>
      <Feather name={iconName} size={16} color={iconColor} />
      <AppText style={[typography.meta, styles.message, { color: textColor }]}>
        {bannerText}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dismissLabel}
        onPress={onDismiss}
        style={styles.dismiss}>
        <Feather name="x" size={16} color={iconColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 9 },
  message: { flex: 1 },
  dismiss: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
