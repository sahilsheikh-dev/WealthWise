import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '../ui';
import { useTheme } from '../../theme/useTheme';

export function SwitchRow({ label, value, onValueChange, disabled = false }: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <AppText style={styles.label}>{label}</AppText>
      <Switch
        accessibilityRole="switch"
        accessibilityLabel={label}
        disabled={disabled}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surface3, true: colors.primaryDim }}
        thumbColor={value ? colors.primary : colors.text3}
      />
    </View>
  );
}

const styles = StyleSheet.create({ row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, label: { flex: 1 } });
