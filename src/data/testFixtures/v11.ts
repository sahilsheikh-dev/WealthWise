import type { AppData } from '../../domain/types';
import { mockAppData } from '../../mock/data';

export function makeV11Fixture(data: AppData = mockAppData): Omit<AppData, 'coverGoals'> {
  const { coverGoals: _coverGoals, ...legacy } = data;
  return legacy;
}
