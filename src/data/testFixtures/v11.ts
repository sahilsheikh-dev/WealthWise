import type { AppData } from '../../domain/types';
import { mockAppData } from '../../mock/data';

export function makeV11Fixture(data: AppData = mockAppData): AppData {
  return data;
}
