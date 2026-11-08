import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from './ui';
import type { BudgetOverview } from '../domain/budget';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/tokens';

export function PaceLine({
  pace,
  spendingSectionIds,
  summary,
  shortSummary,
}: {
  pace: NonNullable<BudgetOverview['pace']>;
  spendingSectionIds: readonly string[];
  summary: string;
  shortSummary: string;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const height = 92;
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const spendingSections = pace.sections.filter((section) => spendingSectionIds.includes(section.id));
  const planned = Array.from({ length: pace.days }, (_, day) =>
    spendingSections.reduce((total, section) => total + (section.planned[day] ?? 0), 0),
  );
  const actual = Array.from({ length: pace.elapsedDays }, (_, day) =>
    spendingSections.reduce((total, section) => total + (section.actual[day] ?? 0), 0),
  );
  const maximum = Math.max(...planned, ...actual, 1);
  const plannedPoints = planned.map((value, index) => ({
    x: pace.days <= 1 ? 0 : index / (pace.days - 1) * width,
    y: height - value / maximum * (height - 10),
  }));
  const actualPoints = actual.map((value, index) => ({
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
        <LegendItem label="Actual" color={colors.ok} />
        <LegendItem label="Planned pace" color={colors.primary} />
      </View>
      <AppText numberOfLines={1} style={[typography.meta, { color: colors.text2 }]}>
        {shortSummary}
      </AppText>
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
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  pacePlot: { position: 'relative', width: '100%' },
});
