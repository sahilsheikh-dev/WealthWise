import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { BackHandler, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './ui';
import type { AppMenuItem } from '../lib/appMenu';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { TopAnchoredSheet } from './TopAnchoredSheet';

export type HeaderMenuSelection = {
  title: string;
  message: string;
  choices: readonly { id: string; label: string; destructive?: boolean }[];
  onSelect: (id: string) => void;
};

export type HeaderMenuItem = AppMenuItem & {
  onPress: () => void;
  selection?: HeaderMenuSelection;
};

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
  const { fontScale } = useWindowDimensions();
  const [selection, setSelection] = useState<HeaderMenuSelection | null>(null);

  useEffect(() => {
    if (!visible) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose, visible]);

  return (
    <>
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
                if (item.selection) setSelection(item.selection);
                else item.onPress();
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
    <TopAnchoredSheet
      visible={selection !== null}
      onClose={() => setSelection(null)}
      sheetTestID="header-menu-selection"
      centered
      contentStyle={styles.selectionCard}>
      {selection ? (
        <View style={styles.selectionContent}>
          <AppText weight="bold" style={typography.h1}>{selection.title}</AppText>
          <AppText>{selection.message}</AppText>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
            {selection.choices.map((choice) => (
              <Pressable
                key={choice.id}
                accessibilityRole="button"
                accessibilityLabel={choice.label}
                onPress={() => {
                  setSelection(null);
                  selection.onSelect(choice.id);
                }}
                style={({ pressed }) => [
                  styles.selectionOption,
                  { minHeight: Math.max(52, 48 * fontScale), backgroundColor: colors.surface2, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}>
                <AppText style={[
                  typography.chip,
                  styles.selectionLabel,
                  choice.destructive && { color: colors.err },
                ]}>
                  {choice.label}
                </AppText>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={() => setSelection(null)}
              style={({ pressed }) => [
                styles.selectionOption,
                { minHeight: Math.max(52, 48 * fontScale), backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.pressed,
              ]}>
              <AppText style={[typography.chip, styles.selectionLabel]}>Cancel</AppText>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}
    </TopAnchoredSheet>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'flex-end', paddingRight: 16, backgroundColor: 'rgba(0,0,0,0.28)' },
  menu: { width: 270, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, overflow: 'hidden' },
  row: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { flex: 1 },
  disabled: { opacity: 0.5 },
  selectionCard: { width: '88%', maxWidth: 420 },
  selectionContent: { paddingHorizontal: 16, paddingBottom: 12, gap: 10, flexShrink: 1 },
  selectionOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  selectionLabel: { flex: 1, flexShrink: 1, textAlign: 'center' },
  pressed: { opacity: 0.76 },
});
