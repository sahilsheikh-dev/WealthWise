import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './ui';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export function QuickActionButton({
  label,
  icon,
  onPress,
  wrapped = false,
  showIndicator = false,
  testID,
  accessibilityLabel,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  wrapped?: boolean;
  showIndicator?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={[
        styles.button,
        wrapped ? styles.wrappedButton : undefined,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}>
      <Feather name={icon} size={14} color={colors.text2} />
      <AppText
        weight="semibold"
        style={[typography.chip, styles.label, { color: colors.text2 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}>
        {label}
      </AppText>
      <View style={styles.indicatorSlot}>
        {showIndicator ? (
          <View testID="budget-month-review-dot" style={[styles.dot, { backgroundColor: colors.primary }]} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 0,
    minHeight: 44,
    flex: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  wrappedButton: { flex: 0, width: '47%' },
  label: { flexShrink: 1, textAlign: 'center', fontSize: 13 },
  indicatorSlot: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
