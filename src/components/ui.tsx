import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, typography, type ThemeColors, type Tone } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const toneColor = (colors: ThemeColors, tone: Tone) => {
  const tones: Record<Tone, string> = {
    primary: colors.primary,
    ok: colors.ok,
    err: colors.err,
    info: colors.info,
    purple: colors.purple,
    neutral: colors.text2,
  };
  return tones[tone];
};

const toneBackground = (colors: ThemeColors, tone: Tone) => {
  const tones: Record<Tone, string> = {
    primary: colors.primaryDim,
    ok: colors.okDim,
    err: colors.errDim,
    info: colors.infoDim,
    purple: colors.purpleDim,
    neutral: colors.surface2,
  };
  return tones[tone];
};

export function AppText({
  children,
  style,
  weight = 'regular',
  ...props
}: PropsWithChildren<{
  style?: StyleProp<TextStyle>;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}> & ComponentProps<typeof Text>) {
  const { colors } = useTheme();
  const fontFamily = {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium',
    semibold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_700Bold',
  }[weight];
  return (
    <Text {...props} style={[{ color: colors.text1, fontFamily }, style]}>
      {children}
    </Text>
  );
}

export function Screen({
  children,
  scroll = true,
  bottomPadding = 26,
}: PropsWithChildren<{ scroll?: boolean; bottomPadding?: number }>) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function StatPill({
  label,
  value,
  tone = 'primary',
  onPress,
  accessibilityHint,
}: {
  label: string;
  value: string;
  tone?: Tone;
  onPress?: () => void;
  accessibilityHint?: string;
}) {
  const { colors } = useTheme();
  const content = (
    <>
      <View style={styles.statPillText}>
        <AppText style={[typography.label, styles.statLabel, { color: colors.text3 }]}>{label}</AppText>
        <AppText style={[styles.statValue, { color: toneColor(colors, tone) }]} numberOfLines={2}>
          {value}
        </AppText>
      </View>
      {onPress ? <Feather name="chevron-right" size={16} color={colors.text3} /> : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value}`}
        accessibilityHint={accessibilityHint ?? `Opens ${label} details`}
        onPress={onPress}
        style={[styles.statPill, styles.statPillPressable, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        {content}
      </Pressable>
    );
  }
  return (
    <View style={[styles.statPill, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      {content}
    </View>
  );
}

export function StatPillRow({ children }: PropsWithChildren) {
  return <View style={styles.statRow}>{children}</View>;
}

export function ProgressBar({ percent, tone = 'primary' }: { percent: number; tone?: Tone }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.max(0, Math.min(100, percent)) }}
      style={[styles.track, { backgroundColor: colors.surface3 }]}>
      <View
        style={[
          styles.fill,
          { width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: toneColor(colors, tone) },
        ]}
      />
    </View>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primaryDim : colors.surface2,
          borderColor: selected ? colors.primaryDim : colors.border,
        },
      ]}>
      <AppText style={[typography.chip, { color: selected ? colors.primary : colors.text3 }]}>{label}</AppText>
    </Pressable>
  );
}

export function ChipRow({ children }: PropsWithChildren) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}>
      {children}
    </ScrollView>
  );
}

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statusBadge, { backgroundColor: toneBackground(colors, tone) }]}>
      <AppText weight="semibold" style={[typography.label, { color: toneColor(colors, tone) }]}>{label}</AppText>
    </View>
  );
}

export function ListItem({
  title,
  subtitle,
  amount,
  amountSub,
  tone = 'neutral',
  icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  amount?: string;
  amountSub?: string;
  tone?: Tone;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const contents = (
    <>
      {icon ? (
        <View style={[styles.listIcon, { backgroundColor: toneBackground(colors, tone) }]}>
          <Feather name={icon} size={16} color={toneColor(colors, tone)} />
        </View>
      ) : null}
      <View style={styles.flexText}>
        <AppText weight="semibold" style={typography.name}>{title}</AppText>
        {subtitle ? <AppText style={[typography.meta, { color: colors.text3 }]}>{subtitle}</AppText> : null}
      </View>
      {amount || amountSub ? (
        <View style={styles.amountColumn}>
          {amount ? <AppText weight="bold" style={[typography.amount, { color: toneColor(colors, tone) }]}>{amount}</AppText> : null}
          {amountSub ? <AppText style={[typography.meta, { color: colors.text3 }, styles.rightText]}>{amountSub}</AppText> : null}
        </View>
      ) : null}
    </>
  );

  if (!onPress) return <View style={[styles.listItem, { borderBottomColor: colors.border }]}>{contents}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}${amount ? `, ${amount}` : ''}`}
      onPress={onPress}
      style={[styles.listItem, { borderBottomColor: colors.border }]}>
      {contents}
    </Pressable>
  );
}

export function SectionTitle({ children, right }: PropsWithChildren<{ right?: ReactNode }>) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <AppText weight="bold" style={[styles.sectionText, { color: colors.text3 }]}>{children}</AppText>
      {right}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'soft',
  disabled = false,
  icon,
  style,
  ...props
}: {
  label: string;
  onPress?: PressableProps['onPress'];
  variant?: 'primary' | 'soft' | 'danger-text';
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  style?: StyleProp<ViewStyle>;
} & Pick<PressableProps, 'accessibilityHint' | 'accessibilityLabel'>) {
  const { colors } = useTheme();
  const backgroundColor = variant === 'primary' ? colors.primaryDim : colors.surface2;
  const foregroundColor = variant === 'primary' ? colors.primary : variant === 'danger-text' ? colors.err : colors.text2;
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: variant === 'danger-text' ? 'transparent' : backgroundColor, borderColor: colors.border },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {icon ? <Feather name={icon} size={14} color={foregroundColor} /> : null}
      <AppText weight="semibold" style={[typography.chip, { color: foregroundColor }]}>{label}</AppText>
    </Pressable>
  );
}

export function Fab({ label, onPress }: { label: string; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.fab, { backgroundColor: colors.primary }]}>
      <Feather name="plus" size={22} color={colors.surface} />
    </Pressable>
  );
}

export function WarningBanner({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <View style={[styles.warning, { backgroundColor: colors.errDim }]}>
      <Feather name="alert-circle" size={16} color={colors.err} />
      <AppText weight="semibold" style={[typography.meta, styles.warningText, { color: colors.err }]}>{children}</AppText>
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.empty, { borderColor: colors.border }]}>
      <AppText weight="semibold">{title}</AppText>
      {subtitle ? <AppText style={[typography.meta, { color: colors.text3, textAlign: 'center' }]}>{subtitle}</AppText> : null}
    </View>
  );
}

export type ActionItem = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'soft' | 'danger-text';
  disabled?: boolean;
};

export function ActionRow({ actions }: { actions: ActionItem[] }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
      {actions.map((action) => (
        <Button
          key={action.label}
          label={action.label}
          onPress={action.onPress}
          variant={action.variant ?? 'soft'}
          disabled={action.disabled}
          style={styles.actionButton}
        />
      ))}
    </View>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.searchField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Feather name="search" size={16} color={colors.text3} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        value={value}
        onChangeText={onChangeText}
        style={[styles.searchInput, { color: colors.text1 }]}
        returnKeyType="search"
      />
    </View>
  );
}

export function DetailTabBar({ active = 'Home' }: { active?: 'Home' | 'none' }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabs = [
    { label: 'Home', route: '/(tabs)', icon: 'home' as const, active: active === 'Home' },
    { label: 'Txns', route: '/(tabs)/transactions' as const, icon: 'repeat' as const, active: false },
    { label: 'Goals', route: '/(tabs)/goals' as const, icon: 'target' as const, active: false },
  ] as const;
  return (
    <View style={[styles.detailTabBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.label}
          accessibilityRole="button"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: tab.active }}
          onPress={() => router.replace(tab.route)}
          style={styles.detailTab}>
          <Feather name={tab.icon} size={18} color={tab.active ? colors.primary : colors.text3} />
          <AppText style={[typography.navLabel, { color: tab.active ? colors.primary : colors.text3 }]}>{tab.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingBottom: 26 },
  card: { marginHorizontal: 20, marginTop: 14, padding: 18, borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.card },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  statPill: { flex: 1, minWidth: 0, paddingVertical: 9, paddingHorizontal: 9, borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.pill },
  statPillPressable: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statPillText: { flex: 1, minWidth: 0 },
  statLabel: { marginBottom: 4 },
  statValue: { fontFamily: 'Montserrat_700Bold', fontSize: 13, lineHeight: 18 },
  track: { height: 5, marginTop: 11, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, minWidth: 2 },
  chip: { minHeight: 44, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 22 },
  chipRow: { alignItems: 'center', gap: 6, paddingHorizontal: 20, marginTop: 10 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  listItem: { minHeight: 60, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  listIcon: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  flexText: { flex: 1, minWidth: 0, gap: 3 },
  amountColumn: { maxWidth: '43%', alignItems: 'flex-end', gap: 3 },
  rightText: { textAlign: 'right' },
  sectionTitle: { marginHorizontal: 20, marginTop: 20, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionText: { fontSize: 12 },
  button: { minHeight: 44, paddingHorizontal: 11, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.76 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  warning: { marginHorizontal: 20, marginTop: 12, padding: 12, borderRadius: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  warningText: { flex: 1, lineHeight: 17 },
  empty: { minHeight: 90, marginHorizontal: 20, marginTop: 8, padding: 16, borderRadius: radii.item, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionRow: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionButton: { flexGrow: 1 },
  searchField: { minHeight: 48, marginHorizontal: 20, marginTop: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.button },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 8, fontSize: 12, fontFamily: 'Montserrat_500Medium' },
  detailTabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 8, paddingHorizontal: 4, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-around' },
  detailTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 3 },
});
