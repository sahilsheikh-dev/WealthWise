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

describe('edit action ownership', () => {
  it('keeps screen-header edit actions on the explicitly approved screens', () => {
    const root = process.cwd();
    const owners = new Set([
      join(root, 'src/components/CardHeaderRow.tsx'),
      join(root, 'src/components/ListRow.tsx'),
    ]);
    const approvedHeaders = new Map([
      [join(root, 'app/(tabs)/budget.tsx'), ["icon: 'edit-2'", "label: 'Edit budget'"]],
      [join(root, 'app/emergency-fund.tsx'), ["icon: 'edit-2'", "label: 'Edit allocation'"]],
    ]);
    const violations = ['app', 'src/components']
      .flatMap((directory) => sourceFiles(join(root, directory)))
      .filter((path) => !approvedHeaders.has(path)
        && !owners.has(path)
        && readFileSync(path, 'utf8').includes('edit-2'));

    expect(violations).toEqual([]);
    for (const [path, expected] of approvedHeaders) {
      const source = readFileSync(path, 'utf8');
      for (const action of expected) expect(source).toContain(action);
    }
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
