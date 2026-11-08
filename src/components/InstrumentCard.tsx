import { StyleSheet, View } from 'react-native';

import type { InstrumentCardAction, InstrumentCardModel } from '../domain/instrumentCard';
import { formatINR } from '../lib/format';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { IconButton } from './IconButton';
import { AppText, Button, Card, ProgressBar, StatusBadge } from './ui';

export function InstrumentCard({
  model,
  onAction,
}: {
  model: InstrumentCardModel;
  onAction: (action: InstrumentCardAction['id']) => void;
}) {
  const { colors } = useTheme();
  const actionIcons: Record<InstrumentCardAction['id'], 'plus' | 'arrow-down-left' | 'calendar' | 'list' | 'check-circle' | 'edit-2'> = {
    deposit: 'plus',
    withdraw: 'arrow-down-left',
    schedule: 'calendar',
    entries: 'list',
    edit: 'edit-2',
    confirm: 'check-circle',
  };
  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.nameBlock}>
          <AppText weight="semibold" style={typography.name}>{model.name}</AppText>
          <AppText style={[typography.meta, { color: colors.text3 }]}>{model.subtitle}</AppText>
        </View>
        <View style={styles.valueBlock}>
          <AppText weight="bold" style={typography.amount}>{formatINR(model.value)}</AppText>
          <AppText style={[typography.meta, { color: colors.text3 }]}>{model.valueCaption}</AppText>
        </View>
        <IconButton
          icon="edit-2"
          label={`Edit ${model.name}`}
          onPress={() => onAction(model.headerAction.id)}
          hint="Edit this asset"
        />
      </View>
      <ProgressBar percent={model.progressPct} tone={model.statuses.some((status) => status.tone === 'err') ? 'err' : 'primary'} />
      {model.progressCaption ? (
        <AppText style={[typography.meta, styles.progressCaption, { color: colors.text3 }]}>{model.progressCaption}</AppText>
      ) : null}
      {model.nextLine ? <AppText style={[typography.meta, styles.nextLine, { color: colors.text2 }]}>{model.nextLine}</AppText> : null}
      {model.behindLine ? <AppText style={[typography.meta, styles.nextLine, { color: colors.err }]}>{model.behindLine}</AppText> : null}
      <AppText style={[typography.meta, styles.description, { color: colors.text2 }]}>{model.description}</AppText>
      {model.statuses.length ? (
        <View style={styles.statuses}>
          {model.statuses.map((status) => <StatusBadge key={status.label} label={status.label} tone={status.tone} />)}
        </View>
      ) : null}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        {model.actions.map((action) => (
          <Button
            key={action.id}
            label={action.label}
            onPress={() => onAction(action.id)}
            disabled={action.disabled}
            accessibilityHint={action.accessibilityHint}
            icon={actionIcons[action.id]}
            variant={action.id === 'deposit' ? 'primary' : 'soft'}
            style={styles.action}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 0, marginTop: 0, marginBottom: 10 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nameBlock: { flex: 1, minWidth: 0, gap: 3 },
  valueBlock: { maxWidth: '42%', alignItems: 'flex-end', gap: 3 },
  progressCaption: { marginTop: 5 },
  nextLine: { marginTop: 5 },
  description: { marginTop: 7, lineHeight: 18 },
  statuses: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  actions: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  action: { flexGrow: 1 },
});
