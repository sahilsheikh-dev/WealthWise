import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { useAppMenu } from '../useAppMenu';
import { useUIStore } from '../../data/uiStore';
import { choiceAsync } from '../../lib/confirm';

const mockRouterPush = jest.fn();
const mockAlert = jest.fn();
const mockConfirmAsync = jest.fn(async (_options: object) => true);
const mockPathname: { current: string } = { current: '/' };
const mockState: {
  devActions?: { loadDemoData: jest.Mock; loadStressData: jest.Mock };
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
    jest.mocked(choiceAsync).mockReset().mockResolvedValue(null);
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
    mockState.devActions = { loadDemoData, loadStressData: jest.fn() };
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
      const loadItem = menuRef.current.find(({ label }) => label === 'Load demo data (6 months)');
      if (!loadItem) throw new Error('Demo data menu action did not render.');
      await act(async () => {
        loadItem.onPress();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockConfirmAsync).toHaveBeenCalledWith({
        title: 'Load demo data?',
        message: 'Replace local app data with six months of sample data?',
        confirmLabel: 'Load demo data',
        destructive: true,
      });
      expect(loadDemoData).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledWith('Demo data loaded', 'Six months of sample data are ready.', [
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

  it('loads a selected stress tier, reports hydration/render timing, and offers Undo', async () => {
    const loadStressData = jest.fn(async () => ({ ok: true as const, loadMs: 125 }));
    mockState.devActions = { loadDemoData: jest.fn(), loadStressData };
    mockState.actions.undoImport = jest.fn(async () => ({ ok: true as const }));
    jest.mocked(choiceAsync).mockResolvedValue('dense');
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = (callback) => {
      callback(0);
      return 0;
    };
    const menuRef: { current: ReturnType<typeof useAppMenu> } = { current: [] };
    function CaptureMenu() {
      menuRef.current = useAppMenu();
      return null;
    }
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<CaptureMenu />); });
    if (!renderer) throw new Error('Menu hook did not render.');
    try {
      const loadItem = menuRef.current.find(({ label }) => label === 'Load stress data (50y/100y/126y/dense)');
      if (!loadItem) throw new Error('Stress-data menu action did not render.');
      await act(async () => {
        loadItem.onPress();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(choiceAsync).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Load stress data?',
        choices: expect.arrayContaining([
          expect.objectContaining({ id: '50' }),
          expect.objectContaining({ id: '100' }),
          expect.objectContaining({ id: '126' }),
          expect.objectContaining({ id: 'dense' }),
        ]),
      }));
      expect(loadStressData).toHaveBeenCalledWith(126, true);
      expect(mockAlert).toHaveBeenCalledWith(
        'Stress data loaded',
        expect.stringMatching(/Build, validate, save and replace: 125 ms\. First render after replace: \d+ ms\./),
        expect.arrayContaining([expect.objectContaining({ text: 'Undo' }), { text: 'OK' }]),
      );
    } finally {
      globalThis.requestAnimationFrame = originalRequestAnimationFrame;
      act(() => renderer?.unmount());
    }
  });
});
