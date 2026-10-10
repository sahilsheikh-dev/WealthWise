import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { BackHandler, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './ui';
import type { HomeMenuItem } from '../lib/homeMenu';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export type HeaderMenuItem = HomeMenuItem & { onPress: () => void };

export function HeaderMenu({
  visible,
  items,
  onClose,
}: {
  visible: boolean;
  items: HeaderMenuItem[];
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose, visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 54 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close menu" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {items.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="menuitem"
              accessibilityLabel={item.label}
              accessibilityState={{ disabled: item.disabled }}
              disabled={item.disabled}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={[styles.row, { borderBottomColor: colors.border }, item.disabled && styles.disabled]}>
              <Feather name={item.icon} size={18} color={item.destructive ? colors.err : colors.text2} />
              <AppText weight="medium" style={[typography.name, styles.label, item.destructive && { color: colors.err }]}>
                {item.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'flex-end', paddingRight: 16, backgroundColor: 'rgba(0,0,0,0.28)' },
  menu: { width: 270, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, overflow: 'hidden' },
  row: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { flex: 1 },
  disabled: { opacity: 0.5 },
});
