import { View, StyleSheet } from 'react-native';

import { ProgressBar } from './ui';

export function GoalProgressRow({ percent }: { percent: number }) {
  return (
    <View testID="goal-progress-row" style={styles.row}>
      <View testID="goal-progress-bar" style={styles.bar}>
        <ProgressBar percent={percent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  bar: { width: '100%' },
});
