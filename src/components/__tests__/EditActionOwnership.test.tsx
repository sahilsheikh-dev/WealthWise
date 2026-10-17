import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { CardHeaderRow } from '../CardHeaderRow';
import { IconButton } from '../IconButton';
import { ListRow } from '../ListRow';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: jest.requireActual('../../theme/themes').themes.light.colors }),
}));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(path);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

describe('shared edit action ownership', () => {
  it('keeps the edit pencil implementation exclusively in shared row components', () => {
    const root = process.cwd();
    const owners = new Set([
      join(root, 'src/components/CardHeaderRow.tsx'),
      join(root, 'src/components/ListRow.tsx'),
    ]);
    const budgetHeader = join(root, 'app/(tabs)/budget.tsx');
    const violations = ['app', 'src/components']
      .flatMap((directory) => sourceFiles(join(root, directory)))
      .filter((path) => path !== budgetHeader
        && !owners.has(path)
        && readFileSync(path, 'utf8').includes('edit-2'));

    expect(violations).toEqual([]);
    expect(readFileSync(budgetHeader, 'utf8')).toContain("icon: 'edit-2', label: 'Edit budget'");
  });

  it('renders edit actions as the final, accessible action in both shared row types', () => {
    const onEdit = jest.fn();
    let header: TestRenderer.ReactTestRenderer | undefined;
    let row: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      header = TestRenderer.create(
        <CardHeaderRow title="Asset" value="$10" editLabel="Edit asset" onEdit={onEdit} />,
      );
      row = TestRenderer.create(
        <ListRow editLabel="Edit entry" onEdit={onEdit}><>{'Entry'}</></ListRow>,
      );
    });
    if (!header || !row) throw new Error('Shared edit rows did not render.');

    const headerButton = header.root.findAllByType(IconButton)[0];
    const listButton = row.root.findAllByType(IconButton)[0];
    expect(headerButton?.props.label).toBe('Edit asset');
    expect(listButton?.props.label).toBe('Edit entry');
    act(() => headerButton?.props.onPress());
    act(() => listButton?.props.onPress());
    expect(onEdit).toHaveBeenCalledTimes(2);
  });
});
