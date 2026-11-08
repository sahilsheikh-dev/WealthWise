import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';

import { formatAmount } from '../lib/amountDisplay';
import type { BudgetOverview } from '../domain/budget';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/tokens';
import { AppText } from './ui';

export const paceChartPalettes = {
  light: [
    '#4338CA', '#047857', '#B45309', '#BE123C', '#0369A1', '#7E22CE',
    '#0F766E', '#B91C1C', '#6D28D9', '#9A3412', '#1D4ED8', '#166534',
  ],
  dark: [
    '#A5B4FC', '#4ADE80', '#FBBF24', '#FDA4AF', '#7DD3FC', '#C4B5FD',
    '#5EEAD4', '#F87171', '#D8B4FE', '#FDBA74', '#93C5FD', '#86EFAC',
  ],
} as const;

const markerShapes = [
  'circle', 'square', 'diamond', 'triangle', 'cross', 'ring',
  'plus', 'bar', 'pill', 'double-circle', 'double-square', 'small-circle',
] as const;
type MarkerShape = (typeof markerShapes)[number];

export function PaceLine({
  pace,
  summary,
  shortSummary,
}: {
  pace: NonNullable<BudgetOverview['pace']>;
  summary: string;
  shortSummary: string;
}) {
  const { colors, isDark } = useTheme();
  const [width, setWidth] = useState(0);
  const [hiddenSections, setHiddenSections] = useState<ReadonlySet<string>>(() => new Set());
  const height = 132;
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const allValues = pace.sections.flatMap((section) => [...section.planned, ...section.actual]);
  const maximum = Math.max(...allValues, 0);
  const scale = maximum || 1;
  const palette = isDark ? paceChartPalettes.dark : paceChartPalettes.light;

  const toggleSection = (sectionId: string) => {
    setHiddenSections((previous) => {
      const next = new Set(previous);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  return (
    <View testID="pace-line">
      <View style={styles.plotRow}>
        <View testID="pace-y-axis" style={[styles.yAxis, { height }]}>
          {[maximum, maximum / 2, 0].map((value, index) => (
            <AppText
              key={index}
              testID={`pace-y-axis-${index}`}
              style={[typography.label, { color: colors.text2 }]}
              numberOfLines={1}>
              {formatAmount(value, 'row', 1)}
            </AppText>
          ))}
        </View>
        <View
          testID="pace-line-container"
          onLayout={onLayout}
          style={[styles.pacePlot, { height }]}>
          {[0, 0.5, 1].map((fraction, index) => (
            <View
              key={fraction}
              testID={`pace-gridline-${index}`}
              pointerEvents="none"
              style={[styles.gridline, { top: 4 + (height - 8) * fraction, backgroundColor: colors.border }]}
            />
          ))}
          {pace.sections.map((section, index) => {
            if (hiddenSections.has(section.id)) return null;
            const color = palette[index % palette.length] ?? colors.primary;
            const shape = markerShapes[index % markerShapes.length] ?? 'circle';
            const plannedPoints = section.planned.map((value, day) => ({
              x: pace.days <= 1 ? 0 : day / (pace.days - 1) * width,
              y: height - 4 - value / scale * (height - 8),
            }));
            const actualPoints = section.actual.map((value, day) => ({
              x: pace.days <= 1 ? 0 : day / (pace.days - 1) * width,
              y: height - 4 - value / scale * (height - 8),
            }));
            return (
              <View
                key={section.id}
                testID={`pace-section-series-${section.id}`}
                accessible
                accessibilityRole="image"
                accessibilityLabel={sectionAccessibilityLabel(section)}
                style={StyleSheet.absoluteFill}>
                {width > 0 ? (
                  <>
                    <PaceSegments
                      points={plannedPoints}
                      color={color}
                      shape={shape}
                      dashed
                      dashPattern={index}
                      testID={`pace-series-${section.id}-planned`}
                    />
                    <PaceSegments
                      points={actualPoints}
                      color={color}
                      shape={shape}
                      testID={`pace-series-${section.id}-actual`}
                    />
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
      <View testID="pace-x-axis" style={styles.xAxisRow}>
        <View style={styles.xAxisSpacer} />
        <View style={styles.xAxisLabels}>
          <AppText style={[typography.label, { color: colors.text2 }]} numberOfLines={1}>Day 1</AppText>
          <AppText style={[typography.label, { color: colors.text2 }]} numberOfLines={1}>
            Day {pace.days}
          </AppText>
        </View>
      </View>
      <View testID="pace-series-legend" style={styles.seriesLegend}>
        <View style={styles.seriesLegendItem}>
          <View testID="pace-actual-key" style={[styles.seriesKeyLine, { backgroundColor: colors.text2 }]} />
          <AppText style={[typography.meta, { color: colors.text2 }]}>Actual</AppText>
        </View>
        <View style={styles.seriesLegendItem}>
          <View testID="pace-planned-key" style={styles.dashedKey}>
            {[0, 1, 2].map((dash) => (
              <View key={dash} style={[styles.dashKeyLine, { backgroundColor: colors.text2 }]} />
            ))}
          </View>
          <AppText style={[typography.meta, { color: colors.text2 }]}>Planned</AppText>
        </View>
      </View>
      <View style={styles.legend}>
        {pace.sections.map((section, index) => {
          const color = palette[index % palette.length] ?? colors.primary;
          const shape = markerShapes[index % markerShapes.length] ?? 'circle';
          const visible = !hiddenSections.has(section.id);
          return (
            <Pressable
              key={section.id}
              testID={`pace-section-toggle-${section.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected: visible }}
              accessibilityLabel={`${section.name}, ${visible ? 'shown' : 'hidden'}; actual solid, planned dashed`}
              onPress={() => toggleSection(section.id)}
              style={[
                styles.legendToggle,
                { borderColor: visible ? color : colors.border, backgroundColor: colors.surface },
                !visible && styles.legendToggleHidden,
              ]}>
              <PaceMarker
                shape={shape}
                color={color}
                background={colors.surface}
                hollow={!visible}
                testID={`pace-marker-${section.id}`}
              />
              <AppText style={[typography.meta, { color: colors.text1 }]}>{section.name}</AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText
        testID="pace-short-summary"
        accessibilityLabel={summary}
        numberOfLines={1}
        style={[typography.meta, { color: colors.text2 }]}>
        {shortSummary}
      </AppText>
    </View>
  );
}

function sectionAccessibilityLabel(section: NonNullable<BudgetOverview['pace']>['sections'][number]): string {
  const difference = section.actualToDate - section.plannedToDate;
  const comparison = difference === 0
    ? 'on pace'
    : `${formatAmount(Math.abs(difference), 'exact', 1)} ${difference > 0 ? 'ahead of' : 'behind'} plan`;
  return `${section.name}: ${formatAmount(section.actualToDate, 'exact', 1)} actual vs ${formatAmount(section.plannedToDate, 'exact', 1)} planned to date; ${comparison}.`;
}

function PaceSegments({
  points,
  color,
  shape,
  dashed = false,
  dashPattern = 0,
  testID,
}: {
  points: { x: number; y: number }[];
  color: string;
  shape: MarkerShape;
  dashed?: boolean;
  dashPattern?: number;
  testID: string;
}) {
  const dashLength = 4 + dashPattern % 3;
  const gapLength = 3 + Math.floor(dashPattern / 3) % 3;
  return (
    <View pointerEvents="none" testID={testID} style={StyleSheet.absoluteFill}>
      {points.slice(1).map((point, index) => {
        const start = points[index];
        if (!start) return null;
        const dx = point.x - start.x;
        const dy = point.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        if (!dashed) {
          return (
            <View
              key={`segment-${index}`}
              testID={`${testID}-segment-${index}`}
              style={lineStyle(start, point, length, angle, color)}
            />
          );
        }
        const dashCount = Math.ceil(length / (dashLength + gapLength));
        return Array.from({ length: dashCount }, (_, dashIndex) => {
          const offset = dashIndex * (dashLength + gapLength);
          const visibleLength = Math.min(dashLength, length - offset);
          const unitX = length === 0 ? 0 : dx / length;
          const unitY = length === 0 ? 0 : dy / length;
          const center = {
            x: start.x + unitX * (offset + visibleLength / 2),
            y: start.y + unitY * (offset + visibleLength / 2),
          };
          return (
            <View
              key={`dash-${index}-${dashIndex}`}
              testID={`${testID}-segment-${index}-dash-${dashIndex}`}
              style={lineStyle(
                { x: center.x - visibleLength / 2, y: center.y },
                { x: center.x + visibleLength / 2, y: center.y },
                visibleLength,
                angle,
                color,
              )}
            />
          );
        });
      })}
      {points.map((point, index) => (
        <View
          key={`marker-${index}`}
          testID={`${testID}-point-${index}`}
          style={[styles.markerPosition, { left: point.x - 4, top: point.y - 4 }]}>
          <PaceMarker
            shape={shape}
            color={color}
            background={color}
            hollow={dashed}
            testID={`${testID}-marker-${index}`}
          />
        </View>
      ))}
    </View>
  );
}

function lineStyle(
  start: { x: number; y: number },
  point: { x: number; y: number },
  length: number,
  angle: number,
  color: string,
): ViewStyle {
  return {
    position: 'absolute',
    left: (start.x + point.x - length) / 2,
    top: (start.y + point.y - 2) / 2,
    width: length,
    height: 2,
    backgroundColor: color,
    transform: [{ rotate: `${angle}rad` }],
  };
}

function PaceMarker({
  shape,
  color,
  background,
  hollow,
  testID,
}: {
  shape: MarkerShape;
  color: string;
  background: string;
  hollow: boolean;
  testID: string;
}) {
  if (shape === 'triangle') {
    return (
      <View
        testID={testID}
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 4,
          borderRightWidth: 4,
          borderBottomWidth: 7,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
    );
  }
  if (shape === 'cross' || shape === 'plus' || shape === 'bar') {
    const rotations = shape === 'cross' ? ['45deg', '-45deg'] : ['0deg', '90deg'];
    return (
      <View testID={testID} style={styles.crossMarker}>
        <View style={[styles.markerBar, { width: shape === 'bar' ? 8 : 7, backgroundColor: color }]} />
        {shape !== 'bar' ? (
          <View
            style={[
              styles.markerBar,
              { width: 7, backgroundColor: color, transform: [{ rotate: rotations[1] }] },
            ]}
          />
        ) : null}
        {shape === 'cross' ? (
          <View
            style={[
              styles.markerBar,
              { width: 7, backgroundColor: color, transform: [{ rotate: rotations[0] }] },
            ]}
          />
        ) : null}
      </View>
    );
  }
  if (shape === 'double-circle' || shape === 'double-square') {
    return (
      <View
        testID={testID}
        style={[
          styles.doubleMarker,
          shape === 'double-circle' ? styles.markerCircle : null,
          {
            borderColor: color,
            borderWidth: hollow ? 1 : 0,
            backgroundColor: hollow ? 'transparent' : color,
          },
        ]}>
        <View
          style={[
            styles.doubleMarkerCore,
            shape === 'double-circle' ? styles.markerCircle : null,
            { backgroundColor: hollow ? color : background },
          ]}
        />
      </View>
    );
  }
  return (
    <View
      testID={testID}
      style={[
        styles.marker,
        shape === 'circle' || shape === 'ring' ? styles.markerCircle : null,
        shape === 'diamond' ? styles.markerDiamond : null,
        shape === 'pill' ? styles.markerPill : null,
        shape === 'small-circle' ? styles.markerSmall : null,
        {
          borderColor: color,
          borderWidth: hollow || shape === 'ring' ? 2 : 0,
          backgroundColor: hollow || shape === 'ring' ? 'transparent' : color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  plotRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  yAxis: { width: 54, justifyContent: 'space-between', alignItems: 'flex-end' },
  xAxisRow: { flexDirection: 'row', gap: 8 },
  xAxisSpacer: { width: 54 },
  xAxisLabels: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  pacePlot: { position: 'relative', flex: 1 },
  gridline: { position: 'absolute', left: 0, right: 0, height: 1 },
  seriesLegend: { flexDirection: 'row', gap: 12, marginTop: 6 },
  seriesLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  seriesKeyLine: { width: 18, height: 2 },
  dashedKey: { width: 18, flexDirection: 'row', justifyContent: 'space-between' },
  dashKeyLine: { width: 4, height: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  legendToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  legendToggleHidden: { opacity: 0.55 },
  markerPosition: { position: 'absolute', width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  marker: { width: 7, height: 7 },
  markerCircle: { borderRadius: 4 },
  markerDiamond: { width: 6, height: 6, transform: [{ rotate: '45deg' }] },
  markerPill: { width: 9, height: 5, borderRadius: 3 },
  markerSmall: { width: 4, height: 4, borderRadius: 2 },
  doubleMarker: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  doubleMarkerCore: { width: 3, height: 3 },
  crossMarker: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  markerBar: { position: 'absolute', height: 2 },
});
