import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TopAnchoredSheet } from './TopAnchoredSheet';
import { IconButton } from './IconButton';
import { AppText } from './ui';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const styles = StyleSheet.create({
  card: { width: '88%', maxWidth: 420 },
  scroll: { flexShrink: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, minWidth: 0 },
  option: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  optionText: { flex: 1, flexShrink: 1, textAlign: 'center' },
});

export function ApplyScopeDialog({
  visible,
  onClose,
  onApply,
  description,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (scope: 'month' | 'following') => void;
  description?: string;
}) {
  const { colors } = useTheme();
  const applied = useRef(false);
  useEffect(() => {
    if (!visible) applied.current = false;
  }, [visible]);

  const apply = (scope: 'month' | 'following') => {
    if (applied.current) return;
    applied.current = true;
    onApply(scope);
  };

  return (
    <TopAnchoredSheet visible={visible} onClose={onClose} sheetTestID="apply-scope-dialog" centered contentStyle={styles.card}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <AppText weight="bold" style={[typography.h1, styles.title]}>Choose months</AppText>
            <IconButton icon="x" label="Close" onPress={onClose} />
          </View>
          {description ? <AppText>{description}</AppText> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="This month only"
            onPress={() => apply('month')}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: colors.surface2, borderColor: colors.border },
              pressed && { opacity: 0.76 },
            ]}>
            <AppText style={[typography.chip, styles.optionText, { color: colors.text2 }]}>
              This month only
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="This and following months"
            onPress={() => apply('following')}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: colors.surface2, borderColor: colors.border },
              pressed && { opacity: 0.76 },
            ]}>
            <AppText style={[typography.chip, styles.optionText, { color: colors.text2 }]}>
              This and following months
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </TopAnchoredSheet>
  );
}
