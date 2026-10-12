import { StyleSheet, View } from 'react-native';

import type { InstrumentCardAction, InstrumentCardModel } from '../domain/instrumentCard';
import { formatINR } from '../lib/format';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import type { DueTarget } from '../domain/dues';
import { CardHeaderRow } from './CardHeaderRow';
import { DueActions } from './DueActions';
import { AppText, Button, Card, ProgressBar, StatusBadge } from './ui';

export function InstrumentCard({
  model,
  onAction,
  dueTarget,
}: {
  model: InstrumentCardModel;
  onAction: (action: InstrumentCardAction['id']) => void;
  dueTarget?: DueTarget;
}) {
  const { colors } = useTheme();
  const actionIcons: Record<Exclude<InstrumentCardAction['id'], 'edit'>, 'plus' | 'arrow-down-left' | 'calendar' | 'list' | 'check-circle'> = {
    deposit: 'plus',
    withdraw: 'arrow-down-left',
    schedule: 'calendar',
    entries: 'list',
    confirm: 'check-circle',
  };
  return (
    <Card style={styles.card}>
      <CardHeaderRow
        title={<AppText weight="semibold" style={typography.name}>{model.name}</AppText>}
        subtitle={<AppText style={[typography.meta, { color: colors.text3 }]}>{model.subtitle}</AppText>}
        value={<AppText weight="bold" style={typography.amount}>{formatINR(model.value)}</AppText>}
        valueCaption={<AppText style={[typography.meta, { color: colors.text3 }]}>{model.valueCaption}</AppText>}
        editLabel={`Edit ${model.name}`}
        onEdit={() => onAction(model.headerAction.id)}
      />
      <ProgressBar percent={model.progressPct} tone={model.statuses.some((status) => status.tone === 'err') ? 'err' : 'primary'} />
      {model.progressCaption ? (
        <AppText style={[typography.meta, styles.progressCaption, { color: colors.text3 }]}>{model.progressCaption}</AppText>
      ) : null}
      {model.nextLine ? <AppText style={[typography.meta, styles.nextLine, { color: colors.text2 }]}>{model.nextLine}</AppText> : null}
      {model.behindLine ? <AppText style={[typography.meta, styles.nextLine, { color: colors.err }]}>{model.behindLine}</AppText> : null}
      {dueTarget && model.pendingDueCount !== undefined && model.pendingDueCount > 0 ? (
        <DueActions
          target={dueTarget}
          pendingCount={model.pendingDueCount}
          nextAmount={model.pendingDueAmount ?? 0}
        />
      ) : null}
      <AppText style={[typography.meta, styles.description, { color: colors.text2 }]}>{model.description}</AppText>
      {model.statuses.length ? (
        <View style={styles.statuses}>
          {model.statuses.map((status) => <StatusBadge key={status.label} label={status.label} tone={status.tone} />)}
        </View>
      ) : null}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        {model.actions.map((action) => {
          if (action.id === 'edit') return null;
          return (
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
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 0, marginTop: 0, marginBottom: 10 },
  progressCaption: { marginTop: 5 },
  nextLine: { marginTop: 5 },
  description: { marginTop: 7, lineHeight: 18 },
  statuses: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  actions: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  action: { flexGrow: 1 },
});
