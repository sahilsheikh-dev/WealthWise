import { StyleSheet, View } from 'react-native';

import type { InstrumentCardAction, InstrumentCardModel, InstrumentCardTextSegment } from '../domain/instrumentCard';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import type { DueTarget } from '../domain/dues';
import { formatAmount } from '../lib/amountDisplay';
import { CardHeaderRow } from './CardHeaderRow';
import { AmountText } from './AmountText';
import { DueActions } from './DueActions';
import { AppText, Button, Card, ProgressBar, StatusBadge } from './ui';

export function InstrumentCard({
  model,
  onAction,
  dueTarget,
  goalCount,
}: {
  model: InstrumentCardModel;
  onAction: (action: InstrumentCardAction['id']) => void;
  dueTarget?: DueTarget;
  goalCount?: number;
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
        subtitle={(
          <AppText
            accessibilityLabel={describeAmountSegments(model.subtitle)}
            style={[typography.meta, { color: colors.text3 }]}>
            {renderAmountSegments(model.subtitle)}
          </AppText>
        )}
        value={<AmountText value={model.value} tier="tile" weight="bold" style={typography.amount} />}
        valueCaption={<AppText style={[typography.meta, { color: colors.text3 }]}>{model.valueCaption}</AppText>}
        editLabel={`Edit ${model.name}`}
        onEdit={() => onAction(model.headerAction.id)}
      />
      {goalCount ? (
        <AppText style={[typography.meta, { color: colors.primary }]}>
          Goals: {goalCount}
        </AppText>
      ) : null}
      <ProgressBar percent={model.progressPct} tone={model.statuses.some((status) => status.tone === 'err') ? 'err' : 'primary'} />
      {model.progressCaption ? (
        <AppText style={[typography.meta, styles.progressCaption, { color: colors.text3 }]}>{model.progressCaption}</AppText>
      ) : null}
      {model.nextLine ? (
        <AppText
          accessibilityLabel={describeAmountSegments(model.nextLine)}
          style={[typography.meta, styles.nextLine, { color: colors.text2 }]}>
          {renderAmountSegments(model.nextLine)}
        </AppText>
      ) : null}
      {model.behindLine ? <AppText style={[typography.meta, styles.nextLine, { color: colors.err }]}>{model.behindLine}</AppText> : null}
      {dueTarget && model.pendingDueCount !== undefined && model.pendingDueCount > 0 ? (
        <DueActions
          target={dueTarget}
          pendingCount={model.pendingDueCount}
          nextAmount={model.pendingDueAmount ?? 0}
        />
      ) : null}
      <AppText
        accessibilityLabel={describeAmountSegments(model.description)}
        style={[typography.meta, styles.description, { color: colors.text2 }]}>
        {renderAmountSegments(model.description)}
      </AppText>
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

function describeAmountSegments(segments: InstrumentCardTextSegment[]): string {
  return segments.map((segment) =>
    'text' in segment ? segment.text : formatAmount(segment.amount, 'exact', 1),
  ).join('');
}

function renderAmountSegments(segments: InstrumentCardTextSegment[]) {
  return segments.map((segment, index) =>
    'text' in segment
      ? segment.text
      : <AmountText key={index} value={segment.amount} tier="row" />,
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
