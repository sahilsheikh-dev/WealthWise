import type { HoldingType } from './types';

export type HoldingCapabilities = {
  entries: boolean;
  recurring: boolean;
  returns: boolean;
};

const capabilities: Record<HoldingType, HoldingCapabilities> = {
  'Mutual fund / SIP': { entries: true, recurring: true, returns: true },
  'Stocks / ETF': { entries: true, recurring: true, returns: true },
  'Fixed deposit': { entries: false, recurring: false, returns: true },
  'Recurring deposit': { entries: true, recurring: true, returns: true },
  'EPFO / PF': { entries: true, recurring: true, returns: true },
  'Savings account': { entries: true, recurring: true, returns: false },
  Cash: { entries: true, recurring: true, returns: false },
  Gold: { entries: true, recurring: true, returns: true },
  Silver: { entries: true, recurring: true, returns: true },
  Other: { entries: true, recurring: true, returns: true },
};

export function holdingCapabilities(type: HoldingType): HoldingCapabilities {
  return capabilities[type];
}
