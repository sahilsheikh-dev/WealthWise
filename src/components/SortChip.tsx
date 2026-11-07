import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import type { SortOption, SortSpec } from '../lib/sorting';
import { AppText, Chip } from './ui';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/tokens';

export function SortChip({
  options,
  spec,
  onChange,
}: {
  options: readonly SortOption[];
  spec: SortSpec;
  onChange: (spec: SortSpec) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const activeOption = options.find((option) => option.key === spec.key);
  if (!activeOption) throw new Error(`Sort option "${spec.key}" is not available.`);

  return (
    <>
      <Chip
        label={`Sort: ${activeOption.label} ${spec.dir === 'asc' ? '↑' : '↓'}`}
        selected={false}
        onPress={() => setOpen(true)}
      />
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close sort options"
            style={styles.backdrop}
            onPress={() => setOpen(false)}
          />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText weight="semibold" style={typography.h1}>Sort by</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sort direction ${spec.dir === 'asc' ? 'ascending' : 'descending'}`}
              onPress={() => onChange({ ...spec, dir: spec.dir === 'asc' ? 'desc' : 'asc' })}
              style={[styles.direction, { backgroundColor: colors.surface2 }]}>
              <AppText weight="medium">
                {spec.dir === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
              </AppText>
              <AppText style={[typography.meta, { color: colors.text3 }]}>Tap to reverse</AppText>
            </Pressable>
            {options.map((option) => {
              const selected = option.key === spec.key;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onChange({ key: option.key, dir: spec.dir });
                    setOpen(false);
                  }}
                  style={[styles.option, { borderBottomColor: colors.border }]}>
                  <AppText weight={selected ? 'semibold' : 'regular'}>{option.label}</AppText>
                  {selected ? <AppText weight="bold" style={{ color: colors.primary }}>✓</AppText> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0008' },
  sheet: { maxHeight: '75%', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  direction: { minHeight: 52, marginVertical: 8, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  option: { minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
