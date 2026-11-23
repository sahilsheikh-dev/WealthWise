import { useCallback, useEffect, useState } from 'react';

import { friendlyError } from '../lib/friendlyError';
import {
  DEFAULT_SORTS as DEFAULTS,
  SORT_OPTIONS as OPTIONS,
  resolveSortSpec,
  sortIfSelected,
  type SortList,
  type SortOption,
  type SortSpec,
} from '../lib/sorting';
import { metaStore } from './store';
import { useUIStore } from './uiStore';

export function useSort(list: SortList, defaultSpec: SortSpec = resolveDefault(list)) {
  const options = OPTIONS[list];
  const [stored, setStored] = useState<SortSpec | null>(() => {
    const cached = metaStore?.getCachedMeta?.();
    return resolveSortSpec(cached?.sortSpecs?.[list], options, defaultSpec);
  });

  useEffect(() => {
    let active = true;
    if (metaStore?.getMeta) {
      void metaStore.getMeta().then((meta) => {
        if (!active) return;
        const resolved = resolveSortSpec(meta?.sortSpecs?.[list], options, defaultSpec);
        if (resolved) {
          setStored((prev) => {
            if (prev && prev.key === resolved.key && prev.dir === resolved.dir) {
              return prev;
            }
            return resolved;
          });
        }
      });
    }
    const unsubscribe = metaStore?.subscribe?.((meta) => {
      if (!active) return;
      const resolved = resolveSortSpec(meta?.sortSpecs?.[list], options, defaultSpec);
      setStored((prev) => {
        if (!prev && !resolved) return prev;
        if (prev && resolved && prev.key === resolved.key && prev.dir === resolved.dir) {
          return prev;
        }
        return resolved;
      });
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [defaultSpec, list, options]);

  const setSpec = useCallback((spec: SortSpec) => {
    if (!options.some((option) => option.key === spec.key) ||
      (spec.dir !== 'asc' && spec.dir !== 'desc')) {
      throw new Error('Sort preference is invalid.');
    }
    const previous = stored;
    setStored(spec);
    if (metaStore?.updateSortSpec) {
      void metaStore.updateSortSpec(list, spec, options).catch((error: unknown) => {
        setStored(previous);
        useUIStore.getState().setActionToast({ message: friendlyError(error) });
      });
    }
  }, [list, options, stored]);

  const sort = useCallback(<T extends object>(items: readonly T[]) =>
    sortIfSelected(items, list, stored), [list, stored]);

  return { spec: stored ?? defaultSpec, selected: stored !== null, setSpec, sort };
}

function resolveDefault(list: SortList): SortSpec {
  return DEFAULTS[list];
}

export type { SortOption };
