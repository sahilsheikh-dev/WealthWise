import { useAppStore } from './store';

export function useAppData() {
  return useAppStore((state) => state.data);
}

export function useAppActions() {
  return useAppStore((state) => state.actions);
}
