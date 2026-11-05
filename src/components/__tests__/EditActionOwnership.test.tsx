import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { CardHeaderRow } from '../CardHeaderRow';
import { IconButton } from '../IconButton';
import { ListRow } from '../ListRow';
import { ActionRow, Button } from '../ui';
import { ActionToast } from '../ActionToast';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: jest.requireActual('../../theme/themes').themes.light.colors }),
}));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(path);
    return path.endsWith('.ts') || path.endsWith('.tsx') ? [path] : [];
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
      [join(root, 'app/(tabs)/budget.tsx'), ["icon: 'plus'", "label: 'Add category'"]],
      [join(root, 'app/emergency-fund.tsx'), ["icon: 'edit-2'", "label: 'Edit allocation'"]],
    ]);
    const approvedIcons = new Map([
      [join(root, 'app/ef-allocation-form.tsx'), ['icon="edit-2"']],
      [join(root, 'app/investment-entries.tsx'), ["icon: 'edit-2'"]],
      [join(root, 'app/liability-payments.tsx'), ["icon: 'edit-2'"]],
      [join(root, 'app/liabilities.tsx'), ['icon="edit-2"']],
    ]);
    const violations = ['app', 'src/components']
      .flatMap((directory) => sourceFiles(join(root, directory)))
      .filter((path) => !approvedHeaders.has(path)
        && !approvedIcons.has(path)
        && !owners.has(path)
        && readFileSync(path, 'utf8').includes('edit-2'));

    expect(violations).toEqual([]);
    for (const [path, expected] of [...approvedHeaders, ...approvedIcons]) {
      const source = readFileSync(path, 'utf8');
      for (const action of expected) expect(source).toContain(action);
    }
  });

  it('uses Feather edit-2 and contains no legacy edit icon names', () => {
    const root = process.cwd();
    const iconFiles = ['app', 'src']
      .flatMap((directory) => sourceFiles(join(root, directory)))
      .map((path) => ({ path, source: readFileSync(path, 'utf8') }));
    const legacyIcon = /\bicon\s*[:=]\s*['"](?:edit|edit-3|pencil)['"]|\bname\s*=\s*['"](?:edit|edit-3|pencil)['"]/;

    expect(iconFiles.filter(({ source }) => legacyIcon.test(source)).map(({ path }) => path)).toEqual([]);
    expect(iconFiles.some(({ source }) => /icon\s*[:=]\s*['"]edit-2['"]/.test(source))).toBe(true);
  });

  it('does not give asset or liability cards a separate edit action', () => {
    const root = process.cwd();
    const assetCard = readFileSync(join(root, 'src/components/InstrumentCard.tsx'), 'utf8');
    const liabilities = readFileSync(join(root, 'app/liabilities.tsx'), 'utf8');

    expect(assetCard).not.toContain('editLabel=');
    expect(liabilities).not.toContain('editLabel=');
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

  it('stops liability action presses from bubbling to the card edit target', () => {
    const action = jest.fn();
    const event = { stopPropagation: jest.fn() };
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <ActionRow
          stopParentPress
          actions={[{ label: 'Payments', onPress: action }]}
        />,
      );
    });
    if (!renderer) throw new Error('Action row did not render.');

    const button = renderer.root.findByType(Button);
    act(() => button.props.onPress(event));
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(1);
    act(() => renderer?.unmount());
  });

  it('stops the due Undo toast action from bubbling to the card edit target', () => {
    const action = jest.fn();
    const event = { stopPropagation: jest.fn() };
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <ActionToast
          message="Marked as paid"
          actionLabel="Undo"
          onAction={action}
          onDismiss={jest.fn()}
          stopParentPress
        />,
      );
    });
    if (!renderer) throw new Error('Due Undo toast did not render.');

    const undo = renderer.root.findByProps({ accessibilityLabel: 'Undo' });
    act(() => undo.props.onPress(event));
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(1);
    act(() => renderer?.unmount());
  });
});
