import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import { AppText, Card, Screen } from '../src/components/ui';
import { THEME_IDS, type ThemeId } from '../src/domain/types';
import { themes } from '../src/theme/themes';
import { useTheme } from '../src/theme/useTheme';
import { radii, typography } from '../src/theme/tokens';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

const options: { id: ThemeId; label: string; description: string }[] = [
  { id: 'system', label: 'System', description: 'Follows your phone appearance' },
  ...THEME_IDS.filter((id): id is Exclude<ThemeId, 'system'> => id !== 'system')
    .map((id) => ({ id, label: themes[id].label, description: themes[id].description })),
];

export default function ThemeScreen() {
  const { colors, themeId, resolvedId, setTheme } = useTheme();
  return (
    <Screen>
      <AppHeader title="Theme" subtitle="Choose how Wealth Wise looks" showBack />
      {options.map((option) => {
        const palette = option.id === 'system' ? themes[resolvedId] : themes[option.id];
        const selected = themeId === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label} theme${selected ? ', selected' : ''}`}
            onPress={() => setTheme(option.id)}
          >
            <Card style={[styles.card, selected && { borderColor: colors.primary }]}>
              <View style={[styles.preview, { backgroundColor: palette.colors.bg, borderColor: palette.colors.border }]}>
                <View style={[styles.previewCard, { backgroundColor: palette.colors.surface }]}>
                  <View style={[styles.swatch, { backgroundColor: palette.colors.primary }]} />
                  <View style={[styles.line, { backgroundColor: palette.colors.text1 }]} />
                  <View style={[styles.line, styles.shortLine, { backgroundColor: palette.colors.text2 }]} />
                </View>
              </View>
              <View style={styles.description}>
                <AppText weight="semibold">{option.label}</AppText>
                <AppText style={[typography.meta, { color: colors.text2 }]}>{option.description}</AppText>
              </View>
              {selected ? <Feather name="check-circle" size={20} color={colors.primary} /> : null}
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  preview: {
    width: 82, height: 56, padding: 6, borderRadius: radii.item, borderWidth: StyleSheet.hairlineWidth,
  },
  previewCard: { flex: 1, borderRadius: 7, justifyContent: 'center', paddingHorizontal: 8, gap: 4 },
  swatch: { width: 16, height: 8, borderRadius: 4, marginBottom: 1 },
  line: { width: 44, height: 3, borderRadius: 2 },
  shortLine: { width: 30 },
  description: { flex: 1, gap: 3 },
});
