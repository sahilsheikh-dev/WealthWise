import { useWindowDimensions, View, StyleSheet } from 'react-native';

import type { GoalProjection } from '../domain/goalLinks';
import { useTheme } from '../theme/useTheme';
import { AppText, ProgressBar } from './ui';

function projectionStatus(projection: GoalProjection): string {
  if (projection.projectedDate === 'Already reached') return 'Already reached';
  if (projection.status === 'ahead') return 'Ahead';
  if (projection.status === 'on-track') return 'On track';
  if (projection.status === 'behind') return 'Behind';
  return 'Not reachable with current contributions';
}

export function GoalProgressRow({
  percent,
  projection,
}: {
  percent: number;
  projection: GoalProjection;
}) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale >= 1.3;
  return (
    <View testID="goal-progress-row" style={[styles.row, stacked && styles.stacked]}>
      <View testID="goal-progress-bar" style={styles.bar}>
        <ProgressBar percent={percent} />
      </View>
      <AppText
        testID="goal-progress-status"
        style={[
          styles.status,
          { color: projection.status === 'behind' ? colors.err : colors.primary },
          stacked && styles.stackedStatus,
        ]}>
        {projectionStatus(projection)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  bar: { flex: 1, minWidth: 0 },
  status: { flexShrink: 0 },
  stackedStatus: { alignSelf: 'flex-end', textAlign: 'right' },
});
