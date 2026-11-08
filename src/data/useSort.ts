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
  const [stored, setStored] = useState<SortSpec | null>(null);

  useEffect(() => {
    let active = true;
    void metaStore.getMeta().then((meta) => {
      if (!active) return;
      const resolved = resolveSortSpec(meta.sortSpecs?.[list], options, defaultSpec);
      if (resolved) setStored(resolved);
    });
    return () => {
      active = false;
    };
  }, [defaultSpec, list, options]);

  const setSpec = useCallback((spec: SortSpec) => {
    if (!options.some((option) => option.key === spec.key) ||
      (spec.dir !== 'asc' && spec.dir !== 'desc')) {
      throw new Error('Sort preference is invalid.');
    }
    const previous = stored;
    setStored(spec);
    void metaStore.updateSortSpec(list, spec, options).catch((error: unknown) => {
      setStored(previous);
      useUIStore.getState().setActionToast({ message: friendlyError(error) });
    });
  }, [list, options, stored]);

  const sort = useCallback(<T extends object>(items: readonly T[]) =>
    sortIfSelected(items, list, stored), [list, stored]);

  return { spec: stored ?? defaultSpec, selected: stored !== null, setSpec, sort };
}

function resolveDefault(list: SortList): SortSpec {
  return DEFAULTS[list];
}

export type { SortOption };
