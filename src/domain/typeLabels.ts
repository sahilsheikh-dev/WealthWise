import type { HoldingType, LiabilityType } from './types';

export function financialTypeLabel(
  type: HoldingType | LiabilityType,
  customTypeName?: string,
): string {
  return type === 'Custom' && customTypeName ? customTypeName : type;
}
