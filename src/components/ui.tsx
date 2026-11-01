import { Feather } from '@expo/vector-icons';
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
  accessibilityLabel,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  onPress?: () => void;
  accessibilityHint?: string;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const spokenLabel = accessibilityLabel ?? `${label}${typeof value === 'string' ? `, ${value}` : ''}`;
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
        accessibilityLabel={spokenLabel}
        accessibilityHint={accessibilityHint ?? `Opens ${label} details`}
        onPress={onPress}
        style={[styles.statPill, styles.statPillPressable, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        {content}
      </Pressable>
    );
  }
  return (
    <View
      accessible
      accessibilityLabel={spokenLabel}
      style={[styles.statPill, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
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
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  amount?: ReactNode;
  amountSub?: ReactNode;
  tone?: Tone;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const readableAmount = typeof amount === 'string' ? amount : '';
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
          {amount ? (
            <AppText
              accessibilityLabel={accessibilityLabel ?? (readableAmount || undefined)}
              weight="bold"
              style={[typography.amount, { color: toneColor(colors, tone) }]}>
              {amount}
            </AppText>
          ) : null}
          {amountSub ? <AppText style={[typography.meta, { color: colors.text3 }, styles.rightText]}>{amountSub}</AppText> : null}
        </View>
      ) : null}
    </>
  );

  if (!onPress) return <View style={[styles.listItem, { borderBottomColor: colors.border }]}>{contents}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${title}${subtitle ? `, ${subtitle}` : ''}${readableAmount ? `, ${readableAmount}` : ''}`}
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
  icon?: keyof typeof Feather.glyphMap;
};

export function ActionRow({
  actions,
  stopParentPress = false,
}: {
  actions: ActionItem[];
  stopParentPress?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
      {actions.map((action) => (
        <Button
          key={action.label}
          label={action.label}
          onPress={(event) => {
            if (stopParentPress) event?.stopPropagation();
            action.onPress?.();
          }}
          variant={action.variant ?? 'soft'}
          disabled={action.disabled}
          icon={action.icon}
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
  onClear,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  onClear?: () => void;
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
      {value.length > 0 && onClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={onClear}
          style={styles.searchClear}>
          <Feather name="x" size={16} color={colors.text3} />
        </Pressable>
      ) : null}
    </View>
  );
}

const bottomTabs = [
  { key: 'index', label: 'Home', accessibleLabel: 'Home', route: '/(tabs)' as const, icon: 'home' as const },
  { key: 'transactions', label: 'Transactions', accessibleLabel: 'Transactions', route: '/(tabs)/transactions' as const, icon: 'repeat' as const },
  { key: 'goals', label: 'Goals', accessibleLabel: 'Goals', route: '/(tabs)/goals' as const, icon: 'target' as const },
  { key: 'budget', label: 'Budget', accessibleLabel: 'Budget', route: '/(tabs)/budget' as const, icon: 'pie-chart' as const },
] as const;

export type BottomTabKey = typeof bottomTabs[number]['key'];

export function BottomTabBar({
  activeTab,
  onSelect,
  placement = 'flow',
}: {
  activeTab: string | null;
  onSelect: (tab: BottomTabKey) => void;
  placement?: 'flow' | 'overlay';
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      testID="bottom-tab-bar"
      style={[
        styles.bottomTabBar,
        placement === 'overlay' ? styles.bottomTabBarOverlay : undefined,
        { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 10) },
      ]}>
      {bottomTabs.map((tab) => {
        const selected = activeTab === tab.key;
        const color = selected ? colors.primary : colors.text3;
        return (
        <Pressable
          key={tab.key}
          testID={`bottom-tab-${tab.key}`}
          accessibilityRole="tab"
          accessibilityLabel={tab.accessibleLabel}
          accessibilityState={{ selected }}
          onPress={() => onSelect(tab.key)}
          style={styles.bottomTab}>
          <Feather name={tab.icon} size={18} color={color} />
          <AppText
            testID={`bottom-tab-label-${tab.key}`}
            allowFontScaling
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            numberOfLines={1}
            style={[typography.navLabel, styles.bottomTabLabel, { color }]}>
            {tab.label}
          </AppText>
        </Pressable>
        );
      })}
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
  warning: { marginHorizontal: 20, marginTop: 12, padding: 12, borderRadius: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  warningText: { flex: 1, lineHeight: 17 },
  empty: { minHeight: 90, marginHorizontal: 20, marginTop: 8, padding: 16, borderRadius: radii.item, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionRow: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionButton: { flexGrow: 1 },
  searchField: { minHeight: 48, marginHorizontal: 20, marginTop: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.button },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 8, fontSize: 12, fontFamily: 'Montserrat_500Medium' },
  searchClear: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  bottomTabBar: { paddingTop: 10, paddingHorizontal: 4, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-around' },
  bottomTabBarOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  bottomTab: { flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 4, alignItems: 'center', justifyContent: 'center', gap: 3 },
  bottomTabLabel: { alignSelf: 'stretch', flexShrink: 1, textAlign: 'center', lineHeight: undefined },
});
