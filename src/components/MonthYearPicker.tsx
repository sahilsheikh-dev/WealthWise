import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { formatMonth } from '../lib/format';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { AppText, Chip } from './ui';

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as const;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function parseMonthParts(monthKey: string): { year: number; month: string } {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthKey);
  if (!match) return { year: new Date().getFullYear(), month: '01' };
  return { year: Number(match[1]), month: match[2] ?? '01' };
}

export function isMonthWithinBounds(candidate: string, minMonth?: string, maxMonth?: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(candidate)) return false;
  if (minMonth && candidate < minMonth) return false;
  if (maxMonth && candidate > maxMonth) return false;
  return true;
}

export function MonthYearPicker({
  visible,
  month,
  minMonth,
  maxMonth,
  onSelect,
  onClose,
}: {
  visible: boolean;
  month: string;
  minMonth?: string;
  maxMonth?: string;
  onSelect: (monthKey: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const parsed = useMemo(() => parseMonthParts(month), [month]);
  const [yearOverride, setYearOverride] = useState<number | null>(null);
  const selectedYear = yearOverride ?? parsed.year;

  const minYear = minMonth ? parseMonthParts(minMonth).year : undefined;
  const maxYear = maxMonth ? parseMonthParts(maxMonth).year : undefined;
  const canDecrementYear = minYear === undefined || selectedYear - 1 >= minYear;
  const canIncrementYear = maxYear === undefined || selectedYear + 1 <= maxYear;

  const quickYears = useMemo(() => {
    const candidates = [selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2];
    return candidates.filter((y) => (minYear === undefined || y >= minYear) && (maxYear === undefined || y <= maxYear));
  }, [maxYear, minYear, selectedYear]);

  if (!visible) return null;

  const handleClose = () => {
    setYearOverride(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close month and year selector"
        onPress={handleClose}
        style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
        <View
          onStartShouldSetResponder={() => true}
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <AppText weight="bold" style={typography.name}>Jump to month &amp; year</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={handleClose}
              style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.text2} />
            </Pressable>
          </View>

          <View style={styles.yearRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous year"
              accessibilityState={{ disabled: !canDecrementYear }}
              disabled={!canDecrementYear}
              onPress={() => {
                if (canDecrementYear) setYearOverride(selectedYear - 1);
              }}
              style={[styles.yearStepBtn, { borderColor: colors.border }, !canDecrementYear && styles.disabled]}>
              <Feather name="chevron-left" size={18} color={colors.text2} />
            </Pressable>
            <AppText testID="month-year-selected-year" weight="bold" style={typography.h1}>
              {selectedYear}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next year"
              accessibilityState={{ disabled: !canIncrementYear }}
              disabled={!canIncrementYear}
              onPress={() => {
                if (canIncrementYear) setYearOverride(selectedYear + 1);
              }}
              style={[styles.yearStepBtn, { borderColor: colors.border }, !canIncrementYear && styles.disabled]}>
              <Feather name="chevron-right" size={18} color={colors.text2} />
            </Pressable>
          </View>

          <View style={styles.quickYears}>
            {quickYears.map((year) => (
              <Chip
                key={year}
                label={String(year)}
                selected={year === selectedYear}
                onPress={() => setYearOverride(year)}
              />
            ))}
          </View>

          <View style={styles.monthGrid}>
            {MONTHS.map((mm, index) => {
              const candidate = `${selectedYear}-${mm}`;
              const allowed = isMonthWithinBounds(candidate, minMonth, maxMonth);
              const isSelected = candidate === month;
              return (
                <Pressable
                  key={mm}
                  testID={`month-option-${candidate}`}
                  accessibilityRole="button"
                  accessibilityLabel={formatMonth(candidate)}
                  accessibilityState={{ selected: isSelected, disabled: !allowed }}
                  disabled={!allowed}
                  onPress={() => {
                    if (!allowed) return;
                    setYearOverride(null);
                    onSelect(candidate);
                    onClose();
                  }}
                  style={[
                    styles.monthCell,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.surface : colors.surface2,
                    },
                    !allowed && styles.disabled,
                  ]}>
                  <AppText
                    weight={isSelected ? 'bold' : 'semibold'}
                    style={{ color: isSelected ? colors.primary : colors.text1 }}>
                    {SHORT_MONTHS[index]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 20 },
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 18, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  yearStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickYears: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthCell: {
    width: '31%',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
});
