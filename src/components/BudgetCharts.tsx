import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AmountText } from './AmountText';
import { AppText } from './ui';
import type { BudgetOverview } from '../domain/budget';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/tokens';

type BudgetStack = BudgetOverview['stacked'];

function stackSegments(
  period: 'planned' | 'actual',
  values: BudgetStack,
): { id: string; value: number; color: 'primary' | 'ok' | 'err' | 'purple' }[] {
  const segments = [
    { id: 'spend', value: values.spend[period] },
    { id: 'invest', value: values.invest[period] },
    {
      id: values.left[period] < 0 ? 'over' : 'left',
      value: Math.abs(values.left[period]),
    },
  ].filter((segment) => segment.value > 0);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const denominator = Math.max(values.income[period], total);
  return segments.map((segment) => ({
    ...segment,
    value: denominator === 0 ? 0 : segment.value / denominator * 100,
    color: segment.id === 'spend'
      ? 'primary'
      : segment.id === 'invest' ? 'purple' : segment.id === 'over' ? 'err' : 'ok',
  }));
}

export function StackedBar({
  values,
  summary,
}: {
  values: BudgetStack;
  summary: string;
}) {
  const { colors } = useTheme();
  const colorByToken = {
    primary: colors.primary,
    ok: colors.ok,
    err: colors.err,
    purple: colors.purple,
  };
  return (
    <View testID="stacked-bar" accessibilityRole="image" accessibilityLabel={summary}>
      {(['planned', 'actual'] as const).map((period) => (
        <View key={period} style={styles.chartRow}>
          <AppText style={styles.periodLabel}>{period === 'planned' ? 'Planned' : 'Actual'}</AppText>
          <View style={[styles.stackedTrack, { backgroundColor: colors.surface2 }]}>
            {stackSegments(period, values).map((segment) => (
              <View
                key={segment.id}
                testID={`stacked-segment-${period}-${segment.id}`}
                accessibilityLabel={`${period} ${segment.id}`}
                style={{
                  width: `${segment.value}%`,
                  backgroundColor: colorByToken[segment.color],
                }}
              />
            ))}
          </View>
        </View>
      ))}
      <View style={styles.legend}>
        <LegendItem label="Spending" color={colors.primary} />
        <LegendItem label="Investing" color={colors.purple} />
        <LegendItem label="Left" color={colors.ok} />
        <LegendItem label="Over" color={colors.err} />
      </View>
      <AppText numberOfLines={1} style={[typography.meta, { color: colors.text2 }]}>{summary}</AppText>
    </View>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText style={typography.meta}>{label}</AppText>
    </View>
  );
}

export function SectionBars({
  sections,
  summary,
}: {
  sections: BudgetOverview['sections'];
  summary: string;
}) {
  const { colors } = useTheme();
  return (
    <View testID="section-bars" accessibilityRole="image" accessibilityLabel={summary} style={styles.sectionBars}>
      {sections.map((section) => {
        const over = section.actual > section.planned;
        const ratio = section.planned > 0
          ? Math.min(1, section.actual / section.planned)
          : section.actual > 0 ? 1 : 0;
        return (
          <View key={section.id} testID={`section-bar-${section.id}`} style={styles.sectionBar}>
            <View style={styles.sectionHeading}>
              <AppText style={styles.sectionName}>{section.name}</AppText>
              <AppText
                style={typography.meta}
                accessibilityLabel={`${section.name}: actual ${section.actual}; planned ${section.planned}`}>
                <AmountText value={section.actual} tier="row" /> / <AmountText value={section.planned} tier="row" />
              </AppText>
            </View>
            <View style={[styles.sectionTrack, { backgroundColor: colors.surface2 }]}>
              {ratio > 0 ? (
                <View
                  testID={`section-bar-overlay-${section.id}`}
                  style={{
                    width: `${ratio * 100}%`,
                    backgroundColor: over ? colors.err : colors.primary,
                  }}
                />
              ) : null}
            </View>
          </View>
        );
      })}
      <AppText numberOfLines={1} style={[typography.meta, { color: colors.text2 }]}>{summary}</AppText>
    </View>
  );
}

export function PaceLine({
  pace,
  summary,
}: {
  pace: NonNullable<BudgetOverview['pace']>;
  summary: string;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const height = 92;
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const allValues = [...pace.planned, ...pace.actual];
  const maximum = Math.max(...allValues, 1);
  const plannedPoints = pace.planned.map((value, index) => ({
    x: pace.days <= 1 ? 0 : index / (pace.days - 1) * width,
    y: height - value / maximum * (height - 10),
  }));
  const actualPoints = pace.actual.map((value, index) => ({
    x: pace.days <= 1 ? 0 : index / (pace.days - 1) * width,
    y: height - value / maximum * (height - 10),
  }));
  return (
    <View testID="pace-line">
      <View
        testID="pace-line-container"
        accessible
        accessibilityRole="image"
        accessibilityLabel={summary}
        onLayout={onLayout}
        style={[styles.pacePlot, { height }]}>
        {width > 0 ? (
          <>
            <PaceSegments points={plannedPoints} color={colors.primary} testID="pace-planned" />
            <PaceSegments points={actualPoints} color={colors.ok} testID="pace-actual" />
          </>
        ) : null}
      </View>
      <View style={styles.legend}>
        <LegendItem label="Planned pace" color={colors.primary} />
        <LegendItem label="Actual" color={colors.ok} />
      </View>
      <AppText numberOfLines={1} style={[typography.meta, { color: colors.text2 }]}>{summary}</AppText>
    </View>
  );
}

function PaceSegments({
  points,
  color,
  testID,
}: {
  points: { x: number; y: number }[];
  color: string;
  testID: string;
}) {
  return (
    <View pointerEvents="none" testID={`${testID}-series`} style={StyleSheet.absoluteFill}>
      {points.slice(1).map((point, index) => {
        const start = points[index];
        if (!start) return null;
        const dx = point.x - start.x;
        const dy = point.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        return (
          <View
            key={`segment-${index}`}
            testID={`${testID}-segment-${index}`}
            style={{
              position: 'absolute',
              left: (start.x + point.x - length) / 2,
              top: (start.y + point.y - 2) / 2,
              width: length,
              height: 2,
              backgroundColor: color,
              transform: [{ rotate: `${angle}rad` }],
            }}
          />
        );
      })}
      {points.map((point, index) => (
        <View
          key={`dot-${index}`}
          testID={`${testID}-dot-${index}`}
          style={{
            position: 'absolute',
            left: point.x - 3,
            top: point.y - 3,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  periodLabel: { width: 48, ...typography.meta },
  stackedTrack: { height: 16, flex: 1, flexDirection: 'row', overflow: 'hidden', borderRadius: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  sectionBars: { gap: 10 },
  sectionBar: { gap: 5 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionName: { flex: 1, minWidth: 0, ...typography.meta },
  sectionTrack: { height: 6, overflow: 'hidden', borderRadius: 3 },
  pacePlot: { position: 'relative', width: '100%' },
});
