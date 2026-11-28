import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import BackupScreen from '../../../app/backup';
import { emptyAppData } from '../../domain/actions';

const mockReplaceAllData = jest.fn(async () => ({ ok: true as const }));
const mockUndoImport = jest.fn(async () => ({ ok: true as const }));
const mockConfirmAsync = jest.fn(async (_opts: unknown) => false);
const mockDeleteFile = jest.fn();
let mockPickedText = '{}';
let mockEncrypted = false;
let mockParsedOk = true;

const mockData = {
  ...emptyAppData('2026-10-10'),
  settings: { ...emptyAppData('2026-10-10').settings, name: 'Current Owner' },
};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  usePathname: () => '/backup',
}));
jest.mock('react-native-safe-area-context', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      ReactModule.createElement('SafeAreaView', props, children),
  };
});
jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: {} }));
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn(async () => 'sha256-digest'),
  getRandomBytesAsync: jest.fn(async (n: number) => new Uint8Array(n)),
  randomUUID: jest.fn(() => '00000000-0000-4000-8000-000000000001'),
}));
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///tmp/picked-backup.json' }],
  })),
}));
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({
    exists: true,
    text: jest.fn(async () => mockPickedText),
    delete: mockDeleteFile,
    create: jest.fn(),
    write: jest.fn(),
  })),
  Paths: { cache: 'file:///tmp' },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));
jest.mock('../../data/metaStore', () => ({
  createMetaStore: () => ({ getMeta: async () => ({}), updateMeta: async () => ({}) }),
}));
jest.mock('../../data/store', () => ({
  useAppStore: Object.assign(
    (selector: (state: unknown) => unknown) =>
      selector({
        data: mockData,
        undoImport: null,
        actions: {
          replaceAllData: mockReplaceAllData,
          undoImport: mockUndoImport,
        },
      }),
    { getState: () => ({ lastError: null }) },
  ),
}));
jest.mock('../../domain/backup', () => {
  const actual = jest.requireActual('../../domain/backup');
  return {
    ...actual,
    parseBackup: jest.fn(async () =>
      mockParsedOk
        ? {
            ok: true,
            exportedAt: '2026-11-28T00:00:00.000Z',
            data: { ...mockData, settings: { ...mockData.settings, name: 'Imported Owner' } },
            summary: { transactions: 1, goals: 0, holdings: 0, plans: 0, liabilities: 0 },
          }
        : { ok: false, message: 'Invalid backup file.', issues: ['Bad schema'] },
    ),
  };
});
jest.mock('../../domain/backupCrypto', () => {
  const actual = jest.requireActual('../../domain/backupCrypto');
  return {
    ...actual,
    isEncryptedBackup: jest.fn(() => mockEncrypted),
    decryptBackup: jest.fn(async () => '{"plain":true}'),
  };
});
jest.mock('../../lib/confirm', () => ({
  confirmAsync: (opts: unknown) => mockConfirmAsync(opts),
}));
jest.mock('../../lib/clock', () => ({ todayISO: () => '2026-11-28' }));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => {
    const { themes } = jest.requireActual('../../theme/themes');
    return {
      colors: themes.light.colors,
      isDark: themes.light.isDark,
      themeId: 'light',
      setThemeId: jest.fn(),
    };
  },
}));

describe('Backup import confirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPickedText = '{"plain":true}';
    mockEncrypted = false;
    mockParsedOk = true;
  });

  it('prompts Import backup / Cancel after plain backup selection and preserves data + deletes temp file on Cancel', async () => {
    mockConfirmAsync.mockResolvedValueOnce(false);
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<BackupScreen />);
    });

    const importBtn = tree.root.findByProps({ accessibilityLabel: 'Import from file' });
    await act(async () => {
      await importBtn.props.onPress();
    });

    expect(mockDeleteFile).toHaveBeenCalledTimes(1);
    expect(mockConfirmAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import backup?',
        confirmLabel: 'Import backup',
        destructive: true,
        message: expect.stringContaining('replace ALL data'),
      }),
    );
    expect(mockReplaceAllData).not.toHaveBeenCalled();

    // Preview button uses "Import backup" wording instead of "Replace my data"
    expect(tree.root.findAllByProps({ accessibilityLabel: 'Replace my data' })).toHaveLength(0);
    const previewImportBtn = tree.root.findByProps({ accessibilityLabel: 'Import backup' });
    mockConfirmAsync.mockResolvedValueOnce(true);
    await act(async () => {
      await previewImportBtn.props.onPress();
    });
    expect(mockReplaceAllData).toHaveBeenCalledTimes(1);
  });

  it('prompts Import backup / Cancel after encrypted backup decryption and imports on confirm', async () => {
    mockEncrypted = true;
    mockConfirmAsync.mockResolvedValueOnce(true);
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<BackupScreen />);
    });

    const importBtn = tree.root.findByProps({ accessibilityLabel: 'Import from file' });
    await act(async () => {
      await importBtn.props.onPress();
    });
    expect(mockReplaceAllData).not.toHaveBeenCalled();

    const unlockBtn = tree.root.findByProps({ accessibilityLabel: 'Unlock backup' });
    await act(async () => {
      await unlockBtn.props.onPress();
    });

    expect(mockConfirmAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import backup?',
        confirmLabel: 'Import backup',
      }),
    );
    expect(mockReplaceAllData).toHaveBeenCalledTimes(1);
  });
});
