import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TopAnchoredSheet } from './TopAnchoredSheet';
import { AppText, Button, Chip } from './ui';
import { typography } from '../theme/tokens';

const styles = StyleSheet.create({
  card: { width: '88%', maxWidth: 420 },
  content: { paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  actions: { flexDirection: 'row', gap: 8 },
});

export function ApplyScopeDialog({
  visible,
  onCancel,
  onApply,
  title = 'Apply to',
}: {
  visible: boolean;
  onCancel: () => void;
  onApply: (scope: 'month' | 'following') => void;
  title?: string;
}) {
  const [scope, setScope] = useState<'month' | 'following' | null>(null);
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setScope(null), 0);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <TopAnchoredSheet visible={visible} onClose={onCancel} sheetTestID="apply-scope-dialog" centered contentStyle={styles.card}>
      <View style={styles.content}>
        <AppText weight="bold" style={typography.h1}>{title}</AppText>
        <Chip label="This month only" selected={scope === 'month'} onPress={() => setScope('month')} />
        <Chip label="This and following months" selected={scope === 'following'} onPress={() => setScope('following')} />
        <View style={styles.actions}>
          <Button label="Cancel" variant="soft" onPress={onCancel} />
          <Button label="Apply" onPress={() => { if (scope) onApply(scope); }} />
        </View>
      </View>
    </TopAnchoredSheet>
  );
}
