import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Screen, ScreenHeader } from '../../src/components/ui';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

type MenuRowProps = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  detail?: string;
  disabled?: boolean;
  onPress?: () => void;
};

export default function MoreScreen() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <Screen>
      <ScreenHeader title="More" />
      <View style={styles.list}>
        <MenuRow label="Emergency fund" icon="shield" onPress={() => router.push('/emergency-fund')} />
        <MenuRow label="Loans" icon="credit-card" onPress={() => router.push('/loans')} />
        <MenuRow label="Export" icon="download" detail="Coming soon" disabled />
        <MenuRow
          label="Switch theme"
          icon={isDark ? 'sun' : 'moon'}
          detail={isDark ? 'Dark' : 'Light'}
          onPress={toggleTheme}
        />
      </View>
    </Screen>
  );
}

function MenuRow({ label, icon, detail, disabled = false, onPress }: MenuRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}${detail ? `, ${detail}` : ''}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surface2 }]}>
        <Feather name={icon} size={17} color={disabled ? colors.text3 : colors.primary} />
      </View>
      <AppText weight="semibold" style={[styles.label, disabled && { color: colors.text3 }]}>{label}</AppText>
      {detail ? <AppText style={[typography.meta, { color: colors.text3 }]}>{detail}</AppText> : null}
      <Feather name="chevron-right" size={16} color={colors.text3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { marginHorizontal: 20, marginTop: 12 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  iconWrap: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  label: { flex: 1, fontSize: 13 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
});
