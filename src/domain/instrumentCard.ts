import { valueStaleness } from './holdingActions';
import { behindBy, installmentsTracked, loggedTrackedCount, planInvested, planProgressPct, planValue, projection } from './sip';
import { planSchedule } from './schedule';
import type { ISODate } from './types';
import type { PortfolioRow } from './portfolio';
import { formatDate } from '../lib/format';

export type InstrumentCardTextSegment = { text: string } | { amount: number };

export type InstrumentCardAction = {
  id: 'deposit' | 'withdraw' | 'schedule' | 'entries' | 'edit' | 'confirm';
  label: string;
  disabled?: boolean;
  accessibilityHint?: string;
};

export type InstrumentCardStatus = {
  label: string;
  tone: 'ok' | 'primary' | 'err' | 'neutral';
};

export type InstrumentCardModel = {
  kind: PortfolioRow['kind'];
  name: string;
  subtitle: InstrumentCardTextSegment[];
  value: number;
  valueCaption: string;
  progressPct: number;
  progressCaption: string;
  description: InstrumentCardTextSegment[];
  nextLine?: InstrumentCardTextSegment[];
  behindLine?: string;
  statuses: InstrumentCardStatus[];
  pendingDueCount?: number;
  pendingDueAmount?: number;
  headerAction: InstrumentCardAction;
  actions: InstrumentCardAction[];
};

export type InstrumentCardContext = {
  asOf: ISODate;
  totalAssets: number;
};

export function buildInstrumentCardModel(row: PortfolioRow, ctx: InstrumentCardContext): InstrumentCardModel {
  const canWithdraw = row.value >= 1;
  const sharePct = ctx.totalAssets > 0 ? Math.min(100, Math.max(0, row.value / ctx.totalAssets * 100)) : 0;
  const holding = row.holding;
  if (!holding) {
    throw new Error(`Portfolio row "${row.id}" is missing its holding.`);
  }

  if (holding.kind === 'plan') {
    const schedule = planSchedule(holding, ctx.asOf);
    const projectionData = projection(holding);
    const overdue = behindBy(holding, ctx.asOf);
    const tracked = installmentsTracked(holding, ctx.asOf);
    const currentValue = planValue(holding, ctx.asOf);
    const progressPct = planProgressPct(holding);
    const statuses: InstrumentCardStatus[] = [];
    if (overdue > 0 && schedule.summary.nextDue) {
      statuses.push({ label: `${schedule.summary.overdue} overdue`, tone: 'err' });
    }
    if (!schedule.summary.nextDue) statuses.push({ label: 'Completed', tone: 'ok' });
    return {
      kind: 'plan',
      name: holding.name,
      subtitle: [
        { text: `${holding.type}, Monthly ` },
        { amount: holding.amount },
        { text: `, ${holding.stepUpPct}% step-up, ${holding.tenureYears} yrs, ${holding.ratePct}% p.a.` },
      ],
      value: currentValue,
      valueCaption: holding.actualValue === null
        ? 'Estimated value'
        : holding.actualValueDate
          ? `Actual value as of ${formatDate(holding.actualValueDate)}`
          : 'Actual value',
      progressPct,
      progressCaption: '',
      description: [
        { text: 'Invested ' },
        { amount: planInvested(holding) },
        { text: '. Plan: ' },
        { amount: projectionData.totalContributions },
        { text: ` in contributions. ${loggedTrackedCount(holding)} logged since tracking began, ${tracked} due.` },
      ],
      ...(schedule.summary.nextDue ? {
        nextLine: [
          { text: `Next: ${formatDate(schedule.summary.nextDue.dueDate)}, ` },
          { amount: schedule.summary.nextDue.amount },
        ],
      } : {}),
      ...(overdue > 0 && schedule.summary.nextDue ? { behindLine: `${overdue} behind` } : {}),
      statuses,
      pendingDueCount: schedule.summary.overdue + schedule.summary.ongoing,
      pendingDueAmount: schedule.rows.find((row) => row.status === 'overdue' || row.status === 'ongoing')?.amount ?? 0,
      headerAction: { id: 'edit', label: 'Edit' },
      actions: [
        { id: 'deposit', label: 'Log installment' },
        { id: 'withdraw', label: 'Withdraw', disabled: !canWithdraw, accessibilityHint: canWithdraw ? undefined : 'Nothing to withdraw' },
        { id: 'schedule', label: `Schedule (${holding.logs.length})` },
      ],
    };
  }

  const stale = valueStaleness(holding.valueAsOf, ctx.asOf);
  const valueCaption = !holding.valueAsOf
    ? 'Value date unknown'
    : stale.stale
      ? `Value not updated in ${stale.days ?? 0} days`
      : `Updated ${formatDate(holding.valueAsOf)}`;
  return {
    kind: 'manual',
    name: holding.name,
    subtitle: [
      { text: `${holding.type}, invested ` },
      { amount: row.invested },
    ],
    value: row.value,
    valueCaption,
    progressPct: sharePct,
    progressCaption: `${sharePct.toFixed(1)}% of your assets`,
    description: [
      { text: `${row.gain >= 0 ? 'Gain' : 'Loss'} ` },
      { amount: Math.abs(row.gain) },
      { text: row.gainPct === null ? '' : ` (${row.gainPct.toFixed(1)}%)` },
    ],
    statuses: stale.stale ? [{ label: 'Stale value', tone: 'neutral' }] : [],
    headerAction: { id: 'edit', label: 'Edit' },
    actions: [
      { id: 'deposit', label: 'Deposit' },
      { id: 'withdraw', label: 'Withdraw', disabled: !canWithdraw, accessibilityHint: canWithdraw ? undefined : 'Nothing to withdraw' },
      { id: 'entries', label: `Entries (${holding.logs.length})` },
      ...(stale.stale ? [{ id: 'confirm' as const, label: 'Confirm' }] : []),
    ],
  };
}
