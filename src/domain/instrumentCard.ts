import { valueStaleness } from './holdingActions';
import { holdingCapabilities } from './holdingCapabilities';
import { behindBy, installmentsTracked, loggedTrackedCount, planInvested, planProgressPct, planValue, projection } from './sip';
import { planSchedule } from './schedule';
import { investmentEntryTotals } from './investmentReturns';
import { isCashOrBankHoldingType } from './portfolio';
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
  progressPct?: number;
  progressCaption: string;
  description: InstrumentCardTextSegment[];
  nextLine?: InstrumentCardTextSegment[];
  behindLine?: string;
  helperLine?: string;
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
    const capabilities = holdingCapabilities(holding.type);
    const schedule = planSchedule(holding, ctx.asOf);
    const projectionData = projection(holding);
    const overdue = behindBy(holding, ctx.asOf);
    const tracked = installmentsTracked(holding, ctx.asOf);
    const currentValue = planValue(holding, ctx.asOf);
    const progressPct = planProgressPct(holding);
    const summary = row.returnSummary;
    const returnText = formatReturnText(summary);
    const snapshotDate = holding.actualValueDate;
    const hasBackdatedEntries = snapshotDate !== null
      && holding.logs.some((entry) => entry.date < snapshotDate);
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
        ? 'Current value'
        : holding.actualValueDate
          ? `Actual value as of ${formatDate(holding.actualValueDate)}`
          : 'Actual value',
      progressPct,
      progressCaption: '',
      description: [
        { text: 'Invested ' },
        { amount: planInvested(holding) },
        { text: `, ${returnText}. Plan: ` },
        { amount: projectionData.totalContributions },
        { text: ` in contributions. ${loggedTrackedCount(holding)} logged since tracking began, ${tracked} due.` },
      ],
      ...(hasBackdatedEntries ? {
        helperLine: 'Entries dated before the last valuation are assumed included in it.',
      } : {}),
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
        ...(capabilities.entries ? [{ id: 'deposit' as const, label: 'Log installment' }] : []),
        { id: 'withdraw', label: 'Withdraw', disabled: !canWithdraw, accessibilityHint: canWithdraw ? undefined : 'Nothing to withdraw' },
        ...(capabilities.recurring ? [{ id: 'schedule' as const, label: `Schedule (${holding.logs.length})` }] : []),
      ],
    };
  }

  const capabilities = holdingCapabilities(holding.type);
  const stale = valueStaleness(holding.valueAsOf, ctx.asOf);
  const valueCaption = !holding.valueAsOf
    ? 'Value date unknown'
    : stale.stale
      ? `Value not updated in ${stale.days ?? 0} days`
      : `Updated ${formatDate(holding.valueAsOf)}`;
  const summary = row.returnSummary;
  const returnText = formatReturnText(summary);
  const cashOrBank = isCashOrBankHoldingType(holding.type);
  const entryTotals = investmentEntryTotals(holding.logs);
  const hasBackdatedEntries = Boolean(holding.valueAsOf)
    && holding.logs.some((entry) => entry.date < (holding.valueAsOf ?? ''));
  const helperLines = [
    ...(hasBackdatedEntries ? ['Entries dated before the last valuation are assumed included in it.'] : []),
    ...(!capabilities.entries && holding.logs.length > 0 ? ['Entries from earlier are kept.'] : []),
  ];
  return {
    kind: 'manual',
    name: holding.name,
    subtitle: cashOrBank
      ? [{ text: holding.type }]
      : [{ text: `${holding.type}, invested ` }, { amount: row.invested }],
    value: row.value,
    valueCaption: cashOrBank ? 'Balance' : valueCaption,
    progressPct: cashOrBank ? undefined : sharePct,
    progressCaption: cashOrBank ? '' : `${sharePct.toFixed(1)}% of your assets`,
    description: cashOrBank
      ? [
        { text: 'Deposited ' },
        { amount: entryTotals.deposits },
        { text: '. Withdrawn ' },
        { amount: entryTotals.withdrawals },
      ]
      : [
        { text: `${row.gain >= 0 ? 'Gain' : 'Loss'} ` },
        { amount: Math.abs(row.gain) },
        { text: returnText },
      ],
    ...(helperLines.length > 0 ? { helperLine: helperLines.join(' ') } : {}),
    statuses: stale.stale ? [{ label: 'Stale value', tone: 'neutral' }] : [],
    headerAction: { id: 'edit', label: 'Edit' },
    actions: [
      ...(capabilities.entries ? [{ id: 'deposit' as const, label: 'Deposit' }] : []),
      { id: 'withdraw', label: 'Withdraw', disabled: !canWithdraw, accessibilityHint: canWithdraw ? undefined : 'Nothing to withdraw' },
      ...(capabilities.entries || holding.logs.length > 0 ? [{ id: 'entries' as const, label: `Entries (${holding.logs.length})` }] : []),
      ...(stale.stale ? [{ id: 'confirm' as const, label: 'Confirm' }] : []),
    ],
  };
}

function formatReturnText(summary: PortfolioRow['returnSummary']): string {
  const annualized = summary?.annualizedLabel === 'XIRR'
    ? summary.xirr
    : summary?.cagr;
  if (summary?.annualizedLabel && annualized !== null && annualized !== undefined) {
    return `${summary.annualizedLabel} ${(annualized * 100).toFixed(1)}%`;
  }
  if (summary?.absoluteReturnPct == null) return 'No return yet';
  return `${summary.absoluteReturnPct.toFixed(1)}% absolute`;
}
