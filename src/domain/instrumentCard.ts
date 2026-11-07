import { valueStaleness } from './holdingActions';
import { holdingCapabilities } from './holdingCapabilities';
import { behindBy, installmentsTracked, loggedTrackedCount, planProgressPct, projection } from './sip';
import { planSchedule } from './schedule';
import { isCashOrBankHoldingType } from './portfolio';
import { suggestedValuationMethod } from './valuation';
import type { ISODate } from './types';
import type { PortfolioRow } from './portfolio';
import { formatDate } from '../lib/format';

export type InstrumentCardTextSegment = { text: string } | { amount: number };

export type InstrumentCardAction = {
  id: 'deposit' | 'withdraw' | 'entries' | 'edit' | 'update' | 'stop';
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
    const method = holding.valuationMethod ?? suggestedValuationMethod(
      holding.type,
      holding.logs.some((entry) => entry.price !== undefined),
      holding.ratePct,
    );
    const schedule = planSchedule(holding, ctx.asOf);
    const projectionData = projection(holding);
    const overdue = behindBy(holding, ctx.asOf);
    const tracked = installmentsTracked(holding, ctx.asOf);
    const progressPct = planProgressPct(holding);
    const summary = row.returnSummary;
    const returnText = formatReturnText(summary);
    const valueDate = method === 'unitsPrice'
      ? holding.priceAsOf
      : holding.actualValueDate;
    const stale = valueStaleness(valueDate ?? undefined, ctx.asOf);
    const hasBackdatedEntries = Boolean(holding.actualValueDate)
      && holding.logs.some((entry) => entry.date < (holding.actualValueDate ?? ''));
    const statuses: InstrumentCardStatus[] = [];
    if (overdue > 0 && schedule.summary.nextDue) {
      statuses.push({ label: `${schedule.summary.overdue} overdue`, tone: 'err' });
    }
    if ((method === 'manual' || method === 'unitsPrice') && stale.stale) {
      statuses.push({ label: 'Stale value', tone: 'neutral' });
    }
    if (!schedule.summary.nextDue) statuses.push({ label: 'Completed', tone: 'ok' });
    const helperLines = [
      ...(row.costRecovered ? ['Cost recovered'] : []),
      ...(hasBackdatedEntries ? ['Entries dated before the last valuation are assumed included in it.'] : []),
    ];
    return {
      kind: 'plan',
      name: holding.name,
      subtitle: [
        { text: `${holding.type}, Monthly ` },
        { amount: holding.amount },
        { text: `, ${holding.stepUpPct}% step-up, ${holding.tenureYears} yrs, ${holding.ratePct}% p.a.` },
      ],
      value: row.value,
      valueCaption: holding.valuationMethod === 'accrual'
        ? `Estimated${holding.maturityDate ? ` to ${formatDate(holding.maturityDate)}` : ''}`
        : valueDate
          ? `Updated ${stale.days ?? 0} days ago`
          : 'Value not updated',
      progressPct,
      progressCaption: '',
      description: [
        { text: 'Invested ' },
        { amount: row.invested },
        { text: `, ${returnText}. Plan: ` },
        { amount: projectionData.totalContributions },
        { text: ` in contributions. ${loggedTrackedCount(holding)} logged since tracking began, ${tracked} due.` },
      ],
      ...(helperLines.length > 0 ? { helperLine: helperLines.join(' ') } : {}),
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
        ...(capabilities.entries ? [{ id: 'deposit' as const, label: 'Deposit' }] : []),
        { id: 'withdraw', label: 'Withdraw', disabled: !canWithdraw, accessibilityHint: canWithdraw ? undefined : 'Nothing to withdraw' },
        { id: 'entries', label: 'Entries' },
        {
          id: 'stop' as const,
          label: holding.stopDate ? 'Resume recurring' : 'Stop investment',
          accessibilityHint: holding.stopDate ? 'Resume this recurring plan' : 'Stop future recurring dues',
        },
        { id: 'update', label: method === 'unitsPrice' ? 'Update price' : 'Update value' },
      ],
    };
  }

  const capabilities = holdingCapabilities(holding.type);
  const method = holding.valuationMethod ?? suggestedValuationMethod(
    holding.type,
    holding.logs.some((entry) => entry.price !== undefined),
    holding.ratePct,
  );
  const date = method === 'unitsPrice' ? holding.priceAsOf : holding.valueAsOf;
  const updateAge = valueStaleness(date, ctx.asOf);
  const valueCaption = holding.valuationMethod === 'accrual'
    ? 'Estimated'
    : !date
    ? 'Value date unknown'
    : `Updated ${updateAge.days ?? 0} days ago`;
  const summary = row.returnSummary;
  const returnText = formatReturnText(summary);
  const cashOrBank = isCashOrBankHoldingType(holding.type);
  const hasBackdatedEntries = Boolean(holding.valueAsOf)
    && holding.logs.some((entry) => entry.date < (holding.valueAsOf ?? ''));
  const helperLines = [
    ...(row.costRecovered ? ['Cost recovered'] : []),
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
        { text: 'Invested ' },
        { amount: row.invested },
      ]
      : [
        { text: `${row.gain >= 0 ? 'Gain' : 'Loss'} ` },
        { amount: Math.abs(row.gain) },
        { text: returnText },
      ],
    ...(helperLines.length > 0 ? { helperLine: helperLines.join(' ') } : {}),
    statuses: (method === 'manual' || method === 'unitsPrice') && updateAge.stale
      ? [{ label: 'Stale value', tone: 'neutral' }]
      : [],
    headerAction: { id: 'edit', label: 'Edit' },
    actions: [
      ...(capabilities.entries ? [{ id: 'deposit' as const, label: 'Deposit' }] : []),
      { id: 'withdraw', label: 'Withdraw', disabled: !canWithdraw, accessibilityHint: canWithdraw ? undefined : 'Nothing to withdraw' },
      { id: 'entries', label: 'Entries' },
      { id: 'update', label: method === 'unitsPrice' ? 'Update price' : 'Update value' },
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
