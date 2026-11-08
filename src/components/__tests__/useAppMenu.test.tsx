import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { useAppMenu } from '../useAppMenu';
import { useUIStore } from '../../data/uiStore';

const mockRouterPush = jest.fn();
const mockAlert = jest.fn();
const mockConfirmAsync = jest.fn(async (_options: object) => true);
const mockPathname: { current: string } = { current: '/' };
const mockState: {
  devActions?: { loadDemoData: jest.Mock };
  actions: { undoImport: jest.Mock };
} = {
  devActions: undefined,
  actions: { undoImport: jest.fn(async () => ({ ok: true as const })) },
};

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
  usePathname: () => mockPathname.current,
}));
jest.mock('react-native', () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));
jest.mock('../../data/store', () => ({
  useAppStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));
jest.mock('../../lib/confirm', () => ({
  choiceAsync: jest.fn(),
  confirmAsync: (...args: Parameters<typeof mockConfirmAsync>) => mockConfirmAsync(...args),
}));
jest.mock('../../theme/useTheme', () => ({ useTheme: () => ({ themeId: 'system' }) }));

describe('useAppMenu', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    mockAlert.mockClear();
    mockConfirmAsync.mockReset().mockResolvedValue(true);
    mockState.devActions = undefined;
    mockState.actions.undoImport = jest.fn(async () => ({ ok: true as const }));
    useUIStore.getState().setActionToast(null);
    mockPathname.current = '/';
  });

  it('exposes global actions without link-missing transactions and navigates only off-route', () => {
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
    expect(menuRef.current.map(({ label }) => label)).not.toContain('Budget history');
    expect(menuRef.current.map(({ label }) => label).filter((label) => label.startsWith('Review '))).toEqual([]);
    act(() => menuRef.current.find(({ label }) => label === 'Backup and restore')?.onPress());
    expect(mockRouterPush).toHaveBeenCalledWith('/backup');
    mockPathname.current = '/backup';
    act(() => renderer?.update(<CaptureMenu />));
    expect(menuRef.current.map(({ label }) => label)).not.toContain('Link missing transactions');
    act(() => menuRef.current.find(({ label }) => label === 'Backup and restore')?.onPress());
    expect(mockRouterPush).toHaveBeenCalledTimes(1);
  });

  it('shows the demo-loaded Undo / OK popup without navigating, then restores data and shows a toast', async () => {
    const loadDemoData = jest.fn(async () => ({ ok: true as const }));
    const undoImport = jest.fn(async () => ({ ok: true as const }));
    mockState.devActions = { loadDemoData };
    mockState.actions.undoImport = undoImport;
    const menuRef: { current: ReturnType<typeof useAppMenu> } = { current: [] };
    function CaptureMenu() {
      menuRef.current = useAppMenu();
      return null;
    }
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<CaptureMenu />); });
    if (!renderer) throw new Error('Menu hook did not render.');
    try {
      const loadItem = menuRef.current.find(({ label }) => label === 'Load demo data (4 months)');
      if (!loadItem) throw new Error('Demo data menu action did not render.');
      await act(async () => {
        loadItem.onPress();
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(mockConfirmAsync).toHaveBeenCalledWith({
        title: 'Load demo data?',
        message: 'Replace local app data with four months of sample data?',
        confirmLabel: 'Load demo data',
        destructive: true,
      });
      expect(loadDemoData).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledWith('Demo data loaded', 'Four months of sample data are ready.', [
        expect.objectContaining({ text: 'Undo', style: 'cancel', onPress: expect.any(Function) }),
        { text: 'OK' },
      ]);
      expect(mockRouterPush).not.toHaveBeenCalled();

      const alertButtons = mockAlert.mock.calls[0]?.[2] as { text: string; onPress?: () => void }[] | undefined;
      const undoButton = alertButtons?.find(({ text }) => text === 'Undo');
      if (!undoButton?.onPress) throw new Error('Demo data Undo button did not render.');
      await act(async () => {
        undoButton.onPress?.();
        await Promise.resolve();
      });
      expect(undoImport).toHaveBeenCalledTimes(1);
      expect(useUIStore.getState().actionToast).toEqual({ message: 'Demo data removed' });
      expect(mockRouterPush).not.toHaveBeenCalled();
    } finally {
      act(() => renderer?.unmount());
      useUIStore.getState().setActionToast(null);
    }
  });
});
