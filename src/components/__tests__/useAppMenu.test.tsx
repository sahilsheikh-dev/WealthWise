import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { emptyAppData } from '../../domain/actions';
import { useAppMenu } from '../useAppMenu';

const mockRouterPush = jest.fn();
const mockPathname: { current: string } = { current: '/' };
const mockState = {
  data: emptyAppData('2026-10-11'),
  devActions: undefined,
};
const mockUnlinked: { current: boolean } = { current: false };

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
  usePathname: () => mockPathname.current,
}));
jest.mock('../../data/store', () => ({
  useAppStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));
jest.mock('../../domain/instruments', () => ({
  findUnlinkedEntries: () => mockUnlinked.current ? [{ id: 'orphan' }] : [],
}));
jest.mock('../../lib/confirm', () => ({ choiceAsync: jest.fn() }));
jest.mock('../../theme/useTheme', () => ({ useTheme: () => ({ themeId: 'system' }) }));

describe('useAppMenu', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    mockPathname.current = '/';
    mockUnlinked.current = false;
  });

  it('exposes the global actions, conditionally links missing transactions, and navigates only off-route', () => {
    const menuRef: { current: ReturnType<typeof useAppMenu> } = { current: [] };
    function CaptureMenu() {
      menuRef.current = useAppMenu();
      return null;
    }
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<CaptureMenu />); });
    if (!renderer) throw new Error('Menu hook did not render.');
    expect(menuRef.current.map(({ label }) => label)).toContain('Backup and restore');
    expect(menuRef.current.map(({ label }) => label)).not.toContain('Link missing transactions');
    act(() => menuRef.current.find(({ label }) => label === 'Backup and restore')?.onPress());
    expect(mockRouterPush).toHaveBeenCalledWith('/backup');
    mockPathname.current = '/backup';
    mockUnlinked.current = true;
    act(() => renderer?.update(<CaptureMenu />));
    expect(menuRef.current.map(({ label }) => label)).toContain('Link missing transactions');
    act(() => menuRef.current.find(({ label }) => label === 'Backup and restore')?.onPress());
    expect(mockRouterPush).toHaveBeenCalledTimes(1);
  });
});
