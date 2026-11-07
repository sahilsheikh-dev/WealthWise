import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppActions } from '../data/useAppData';
import { useAppStore } from '../data/store';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { AppText } from './ui';

export function StorageErrorBanner() {
  const message = useAppStore((state) => state.storageError);
  const { dismissStorageError } = useAppActions();
  const { colors } = useTheme();
  if (!message) return null;

  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: colors.errDim }]}>
      <Feather name="alert-circle" size={16} color={colors.err} />
      <AppText style={[typography.meta, styles.message, { color: colors.err }]}>
        Your last change could not be saved. Free up storage and try again.
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss storage error"
        onPress={dismissStorageError}
        style={styles.dismiss}>
        <Feather name="x" size={16} color={colors.err} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 9 },
  message: { flex: 1 },
  dismiss: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
