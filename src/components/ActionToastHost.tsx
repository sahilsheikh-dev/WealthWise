import { StyleSheet, View } from 'react-native';

import { useUIStore } from '../data/uiStore';
import { ActionToast } from './ActionToast';

export function ActionToastHost() {
  const toast = useUIStore((state) => state.actionToast);
  const setToast = useUIStore((state) => state.setActionToast);
  if (!toast) return null;
  return (
    <View pointerEvents="box-none" style={styles.host}>
      <ActionToast
        message={toast.message}
        actionLabel={toast.actionLabel}
        onAction={toast.onAction ? () => {
          toast.onAction?.();
          setToast(null);
        } : undefined}
        onDismiss={() => setToast(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, bottom: 76 },
});
