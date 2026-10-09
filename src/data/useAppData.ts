import { mockAppData } from '../mock/data';
import type { AppData } from '../domain/types';

export function useAppData(): AppData {
  return mockAppData;
}
