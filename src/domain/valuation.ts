import type { Compounding, Holding, HoldingType, ISODate, ValuationMethod } from './types';

const periodsPerYear: Record<Exclude<Compounding, 'simple'>, number> = {
  monthly: 12,
  quarterly: 4,
  halfYearly: 2,
  yearly: 1,
};

export function suggestedValuationMethod(
  type: HoldingType,
  hasPricedEntry: boolean,
  ratePct?: number,
): ValuationMethod {
  switch (type) {
    case 'Cash':
      return 'balance';
    case 'Savings account':
      return 'balanceInterest';
    case 'Fixed deposit':
    case 'Recurring deposit':
    case 'EPFO / PF':
      return ratePct === undefined ? 'manual' : 'accrual';
    case 'Mutual fund / SIP':
    case 'Stocks / ETF':
    case 'Gold':
    case 'Silver':
      return hasPricedEntry ? 'unitsPrice' : 'manual';
    case 'Other':
      return 'manual';
  }
}

function compound(amount: number, from: ISODate, to: ISODate, ratePct: number, method: Compounding): number {
  const days = Math.max(0, (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
  const years = days / 365;
  const rate = ratePct / 100;
  if (method === 'simple') return amount * (1 + rate * years);
  const periods = periodsPerYear[method];
  return amount * (1 + rate / periods) ** (periods * years);
}

function accrualValue(holding: Holding, asOf: ISODate, legacyValue: number): number {
  const ratePct = holding.ratePct;
  if (ratePct === undefined) return legacyValue;
  const endDate = holding.maturityDate && holding.maturityDate < asOf ? holding.maturityDate : asOf;
  const snapshotDate = holding.kind === 'manual' ? holding.valueAsOf : holding.actualValueDate;
  const snapshotValue = holding.kind === 'manual'
    ? holding.valueAsOf ? holding.value : null
    : holding.actualValue;
  if (snapshotDate && snapshotDate > asOf) return legacyValue;
  const events: { date: ISODate; amount: number }[] = [];

  if (snapshotValue !== null && snapshotDate !== null && snapshotDate !== undefined) {
    events.push({ date: snapshotDate, amount: snapshotValue });
  } else {
    events.push({
      date: holding.kind === 'plan' ? holding.startDate : asOf,
      amount: holding.kind === 'plan' ? holding.opening : holding.invested,
    });
  }

  for (const entry of holding.logs) {
    if (entry.date > asOf || (snapshotDate && entry.date <= snapshotDate)) continue;
    events.push({ date: entry.date, amount: entry.kind === 'Deposit' ? entry.amount : -entry.amount });
  }
  const compounding = holding.compounding ?? 'yearly';
  return Math.max(0, events.reduce((total, event) => {
    if (event.date > asOf) return total;
    return total + (event.date <= endDate
      ? compound(event.amount, event.date, endDate, ratePct, compounding)
      : event.amount);
  }, 0));
}

function unitsValue(holding: Holding, asOf: ISODate, legacyValue: number): number {
  const latestPrice = holding.latestPrice;
  if (latestPrice === undefined || !holding.priceAsOf || holding.priceAsOf > asOf) return legacyValue;
  const openingAmount = holding.kind === 'plan' ? holding.opening : holding.invested;
  const units = openingAmount / latestPrice + holding.logs
    .filter((entry) => entry.date <= asOf)
    .reduce((total, entry) => {
      const transactionPrice = entry.price ?? latestPrice;
      const unitsAtEntry = entry.amount / transactionPrice;
      return total + (entry.kind === 'Deposit' ? unitsAtEntry : -unitsAtEntry);
    }, 0);
  return Math.max(0, units * latestPrice);
}

export function configuredHoldingValue(
  holding: Holding,
  asOf: ISODate,
  legacyValue: number,
): number {
  switch (holding.valuationMethod) {
    case 'accrual':
      return accrualValue(holding, asOf, legacyValue);
    case 'unitsPrice':
      return unitsValue(holding, asOf, legacyValue);
    case 'balance':
    case 'balanceInterest':
    case 'manual':
    case undefined:
      return legacyValue;
  }
}
