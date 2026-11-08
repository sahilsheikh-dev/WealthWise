import { monthsCovered } from './ef';
import { valueStaleness } from './holdingActions';
import { behindBy, installmentsTracked, loggedTrackedCount, planInvested, planProgressPct, planValue, projection } from './sip';
import { planSchedule } from './schedule';
import type { ISODate } from './types';
import type { PortfolioRow } from './portfolio';
import { formatDate, formatINR, formatINRShort } from '../lib/format';

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
  subtitle: string;
  value: number;
  valueCaption: string;
  progressPct: number;
  progressCaption: string;
  description: string;
  nextLine?: string;
  behindLine?: string;
  statuses: InstrumentCardStatus[];
  actions: InstrumentCardAction[];
};

export type InstrumentCardContext = {
  asOf: ISODate;
  totalAssets: number;
  monthlyExpenseBaseline: number;
  emergencyEntryCount: number;
};

export function buildInstrumentCardModel(row: PortfolioRow, ctx: InstrumentCardContext): InstrumentCardModel {
  const canWithdraw = row.value >= 1;
  const sharePct = ctx.totalAssets > 0 ? Math.min(100, Math.max(0, row.value / ctx.totalAssets * 100)) : 0;

  if (row.kind === 'auto-ef') {
    const covered = monthsCovered(row.value, ctx.monthlyExpenseBaseline);
    return {
      kind: 'auto-ef',
      name: row.name,
      subtitle: 'Emergency fund, auto-synced',
      value: row.value,
      valueCaption: 'Current value',
      progressPct: sharePct,
      progressCaption: `${sharePct.toFixed(1)}% of your assets`,
      description: ctx.monthlyExpenseBaseline > 0 && covered !== null
        ? `${covered.toFixed(1)} months of expenses covered`
        : 'Log expenses to see months covered',
      statuses: [],
      actions: [
        { id: 'deposit', label: 'Deposit' },
        { id: 'withdraw', label: 'Withdraw', disabled: !canWithdraw, accessibilityHint: canWithdraw ? undefined : 'Nothing to withdraw' },
        { id: 'entries', label: `Entries (${ctx.emergencyEntryCount})` },
        { id: 'edit', label: 'Edit' },
      ],
    };
  }

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
      subtitle: `${holding.type}, Monthly ${formatINR(holding.amount)}, ${holding.stepUpPct}% step-up, ${holding.tenureYears} yrs, ${holding.ratePct}% p.a.`,
      value: currentValue,
      valueCaption: holding.actualValue === null
        ? 'Estimated value'
        : holding.actualValueDate
          ? `Actual value as of ${formatDate(holding.actualValueDate)}`
          : 'Actual value',
      progressPct,
      progressCaption: '',
      description: `Invested ${formatINR(planInvested(holding))}. Plan: ${formatINRShort(projectionData.totalContributions)} in contributions. ${loggedTrackedCount(holding)} logged since tracking began, ${tracked} due.`,
      ...(schedule.summary.nextDue ? {
        nextLine: `Next: ${formatDate(schedule.summary.nextDue.dueDate)}, ${formatINR(schedule.summary.nextDue.amount)}`,
      } : {}),
      ...(overdue > 0 && schedule.summary.nextDue ? { behindLine: `${overdue} behind` } : {}),
      statuses,
      actions: [
        { id: 'deposit', label: 'Log installment' },
        { id: 'withdraw', label: 'Withdraw', disabled: !canWithdraw, accessibilityHint: canWithdraw ? undefined : 'Nothing to withdraw' },
        { id: 'schedule', label: `Schedule (${holding.logs.length})` },
        { id: 'edit', label: 'Edit' },
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
    subtitle: `${holding.type}, invested ${formatINR(row.invested)}`,
    value: row.value,
    valueCaption,
    progressPct: sharePct,
    progressCaption: `${sharePct.toFixed(1)}% of your assets`,
    description: `${row.gain >= 0 ? 'Gain' : 'Loss'} ${formatINR(Math.abs(row.gain))}${row.gainPct === null ? '' : ` (${row.gainPct.toFixed(1)}%)`}`,
    statuses: stale.stale ? [{ label: 'Stale value', tone: 'neutral' }] : [],
    actions: [
      { id: 'deposit', label: 'Deposit' },
      { id: 'withdraw', label: 'Withdraw', disabled: !canWithdraw, accessibilityHint: canWithdraw ? undefined : 'Nothing to withdraw' },
      { id: 'entries', label: `Entries (${holding.logs.length})` },
      ...(stale.stale ? [{ id: 'confirm' as const, label: 'Confirm' }] : []),
      { id: 'edit', label: 'Edit' },
    ],
  };
}
