import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Screen, ScreenHeader } from '../../src/components/ui';
import { useAppStore } from '../../src/data/store';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { choiceAsync } from '../../src/lib/confirm';

type MenuRowProps = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  detail?: string;
  disabled?: boolean;
  danger?: boolean;
  onPress?: () => void;
};

export default function MoreScreen() {
  const { themePreference, toggleTheme } = useTheme();
  const name = useAppStore((state) => state.data.settings.name);
  const devActions = useAppStore((state) => state.devActions);
  return (
    <Screen>
      <ScreenHeader title="More" />
      <View style={styles.list}>
        <MenuRow label="Your name" icon="user" detail={name || 'Not set'} onPress={() => router.push('/name-form')} />
        <MenuRow label="Theme" icon="sliders" detail={themePreferenceLabel(themePreference)} onPress={toggleTheme} />
        <MenuRow label="Loans" icon="credit-card" onPress={() => router.push('/loans')} />
        <MenuRow label="Emergency fund" icon="shield" onPress={() => router.push('/emergency-fund')} />
        <MenuRow label="Backup and restore" icon="download" onPress={() => router.push('/backup')} />
        <MenuRow label="Security" icon="lock" onPress={() => router.push('/security')} />
        <MenuRow label="Erase all data" icon="trash-2" danger onPress={() => router.push('/erase-data')} />
      </View>
      {__DEV__ && devActions ? (
        <View style={styles.devList}>
          <AppText style={[typography.label, styles.devHeading]}>DEVELOPER TOOLS</AppText>
          <MenuRow
            label="Load demo data"
            icon="database"
            onPress={() => {
              void choiceAsync({
                title: 'Load demo data?',
                message: 'Replace local app data with the bundled sample data?',
                choices: [{ id: 'load', label: 'Load demo data' }],
              }).then((choice) => { if (choice === 'load') devActions.loadDemoData(); });
            }}
          />
          <MenuRow
            label="Simulate corrupt storage"
            icon="alert-triangle"
            onPress={() => {
              void choiceAsync({
                title: 'Simulate corrupt storage?',
                message: 'The app will restart and show its recovery screen.',
                choices: [{ id: 'continue', label: 'Continue', destructive: true }],
              }).then((choice) => { if (choice === 'continue') void devActions.simulateCorruption(); });
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function themePreferenceLabel(preference: 'system' | 'dark' | 'light'): string {
  return preference[0]!.toUpperCase() + preference.slice(1);
}

function MenuRow({ label, icon, detail, disabled = false, danger = false, onPress }: MenuRowProps) {
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
        <Feather name={icon} size={17} color={disabled ? colors.text3 : danger ? colors.err : colors.primary} />
      </View>
      <AppText weight="semibold" style={[styles.label, danger && { color: colors.err }, disabled && { color: colors.text3 }]}>{label}</AppText>
      {detail ? <AppText style={[typography.meta, { color: colors.text3 }]}>{detail}</AppText> : null}
      <Feather name="chevron-right" size={16} color={colors.text3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { marginHorizontal: 20, marginTop: 12 },
  devList: { marginHorizontal: 20, marginTop: 24 },
  devHeading: { marginBottom: 4 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  iconWrap: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  label: { flex: 1, fontSize: 13 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
});
