import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import { AppText, Button, Card, Screen, SectionTitle } from '../src/components/ui';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { createMetaStore, type BackupMeta } from '../src/data/metaStore';
import { useAppStore } from '../src/data/store';
import { BackupExportError, backupFileName, createBackup, encryptedBackupFileName, parseBackup, type ParseBackupResult } from '../src/domain/backup';
import {
  DEFAULT_SCRYPT_PARAMS,
  InvalidEnvelope,
  KdfParametersOutOfRange,
  PassphraseTooShort,
  UnsupportedEnvelopeVersion,
  WrongPassphraseOrTampered,
  decryptBackup,
  encryptBackup,
  isEncryptedBackup,
} from '../src/domain/backupCrypto';
import { confirmAsync } from '../src/lib/confirm';
import { todayISO } from '../src/lib/clock';
import { formatDate } from '../src/lib/format';
import { storageSummary, utf8ByteLength } from '../src/lib/storageGuard';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

const metaStore = createMetaStore(AsyncStorage);
const digest = (text: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);

type BackupPassphraseFields = {
  exportPassphrase: string;
  confirmPassphrase: string;
  importPassphrase: string;
};

export default function BackupScreen() {
  const { colors } = useTheme();
  const data = useAppStore((state) => state.data);
  const replaceAllData = useAppStore((state) => state.actions.replaceAllData);
  const undoImport = useAppStore((state) => state.actions.undoImport);
  const undoSnapshot = useAppStore((state) => state.undoImport);
  const [meta, setMeta] = useState<BackupMeta>({});
  const [preview, setPreview] = useState<Extract<ParseBackupResult, { ok: true }> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState('Working…');
  const [encryptExport, setEncryptExport] = useState(true);
  const [showPassphrases, setShowPassphrases] = useState(false);
  const [encryptedImportText, setEncryptedImportText] = useState<string | null>(null);
  const { control, setValue } = useForm<BackupPassphraseFields>({
    defaultValues: { exportPassphrase: '', confirmPassphrase: '', importPassphrase: '' },
  });
  const exportPassphrase = useWatch({ control, name: 'exportPassphrase' }) ?? '';
  const confirmPassphrase = useWatch({ control, name: 'confirmPassphrase' }) ?? '';
  const importPassphrase = useWatch({ control, name: 'importPassphrase' }) ?? '';
  const busyRef = useRef(false);

  useEffect(() => {
    void metaStore.getMeta().then(setMeta);
  }, []);

  const begin = (message: string) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setBusyMessage(message);
    setMessage(null);
    setIssues([]);
    return true;
  };
  const finish = () => {
    busyRef.current = false;
    setBusy(false);
  };

  const exportBackup = async () => {
    if (!begin(encryptExport ? 'Encrypting backup…' : 'Preparing plain backup…')) return;
    let file: File | null = null;
    try {
      const confirmed = await confirmAsync({
        title: encryptExport ? 'Export encrypted backup?' : 'Export plain backup?',
        message: encryptExport
          ? 'The passphrase cannot be recovered. If you lose it, you lose access to this backup. Continue?'
          : 'This backup will not be encrypted. Anyone who gets the file can read your data. Continue?',
        confirmLabel: encryptExport ? 'Export encrypted backup' : 'Export plain backup',
      });
      if (!confirmed) return;
      if (!(await Sharing.isAvailableAsync())) {
        setMessage('Sharing is not available on this device.');
        return;
      }
      const exportedAt = new Date().toISOString();
      const plainText = await createBackup(data, { exportedAt, digest });
      const text = encryptExport
        ? await encryptBackup(plainText, exportPassphrase, {
          salt: await Crypto.getRandomBytesAsync(16),
          nonce: await Crypto.getRandomBytesAsync(12),
          kdf: { name: 'scrypt', params: DEFAULT_SCRYPT_PARAMS },
        })
        : plainText;
      file = new File(Paths.cache, encryptExport
        ? encryptedBackupFileName(exportedAt)
        : backupFileName(exportedAt));
      file.create({ overwrite: true });
      file.write(text);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Wealth Wise backup' });
      const nextMeta = await metaStore.updateMeta({ lastExportAt: exportedAt });
      setMeta(nextMeta);
    } catch (error) {
      setMessage(error instanceof BackupExportError
        ? error.message
        : backupCryptoErrorMessage(error) ?? 'The backup could not be exported. Please try again.');
    } finally {
      try {
        if (file?.exists) file.delete();
      } catch {
        setMessage('The temporary backup file could not be removed from this device.');
      }
      setValue('exportPassphrase', '');
      setValue('confirmPassphrase', '');
      finish();
    }
  };

  const importFromFile = async () => {
    if (!begin('Reading backup…')) return;
    setPreview(null);
    setEncryptedImportText(null);
    setValue('importPassphrase', '');
    let picked: File | null = null;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: ['application/json', '*/*'],
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) {
        setMessage('No file was selected.');
        return;
      }
      picked = new File(asset.uri);
      const text = await picked.text();
      try {
        picked.delete();
        picked = null;
      } catch {
        setMessage('The selected temporary file could not be removed.');
        return;
      }
      if (isEncryptedBackup(text)) {
        setEncryptedImportText(text);
        setMessage('This backup is encrypted. Enter its passphrase to continue.');
        return;
      }
      const parsed = await parseBackup(text, { digest, today: todayISO(), newId: () => Crypto.randomUUID() });
      if (!parsed.ok) {
        setMessage(parsed.message);
        setIssues(parsed.issues ?? []);
        return;
      }
      setPreview(parsed);
    } catch {
      setMessage('The selected file could not be read.');
    } finally {
      try {
        if (picked?.exists) picked.delete();
      } catch {
        setMessage('The selected temporary file could not be removed.');
      }
      finish();
    }
  };

  const unlockEncryptedBackup = async () => {
    if (!encryptedImportText || !begin('Unlocking encrypted backup…')) return;
    try {
      const plainText = await decryptBackup(encryptedImportText, importPassphrase);
      setValue('importPassphrase', '');
      const parsed = await parseBackup(plainText, { digest, today: todayISO(), newId: () => Crypto.randomUUID() });
      if (!parsed.ok) {
        setMessage(parsed.message);
        setIssues(parsed.issues ?? []);
        return;
      }
      setPreview(parsed);
      setEncryptedImportText(null);
      setValue('importPassphrase', '');
    } catch (error) {
      setMessage(backupCryptoErrorMessage(error) ?? 'The encrypted backup could not be opened.');
      setValue('importPassphrase', '');
    } finally {
      finish();
    }
  };

  const replaceImport = async () => {
    if (!preview || !begin('Importing backup…')) return;
    try {
      const confirmed = await confirmAsync({
        title: 'Replace all data?',
        message: 'This will replace ALL data currently on this phone.',
        confirmLabel: 'Replace my data',
        destructive: true,
      });
      if (!confirmed) return;
      const result = await replaceAllData(preview.data);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMessage('Your data was imported. You can undo this import below.');
      setPreview(null);
    } catch {
      setMessage('The data could not be imported. Nothing was replaced.');
    } finally {
      finish();
    }
  };

  const undo = async () => {
    if (!begin('Restoring previous data…')) return;
    try {
      const result = await undoImport();
      setMessage(result.ok ? 'The previous data has been restored.' : result.message);
    } finally {
      finish();
    }
  };

  const handleExportPress = async () => {
    if (encryptExport
      && exportPassphrase.normalize('NFKC') !== confirmPassphrase.normalize('NFKC')) {
      setMessage('The passphrases do not match.');
      return;
    }
    await exportBackup();
  };

  return (
    <Screen>
      <AppHeader title="Backup and restore" showBack />
      <SectionTitle>Export</SectionTitle>
      <Card>
        <AppText style={[typography.meta, { color: colors.text2, lineHeight: 19 }]}>
          Encrypted backups protect the exported file only. Data stored on this phone remains unencrypted;
          the app lock is not encryption.
          {'\n'}If you lose the passphrase, you cannot restore the backup.
        </AppText>
        <SwitchRow
          label="Encrypt exported backup"
          value={encryptExport}
          disabled={busy}
          onValueChange={(enabled) => {
            setEncryptExport(enabled);
            if (!enabled) {
              setValue('exportPassphrase', '');
              setValue('confirmPassphrase', '');
              setShowPassphrases(false);
            }
          }}
        />
        {encryptExport ? (
          <View style={styles.passphraseFields}>
            <PassphraseField
              control={control}
              label="Passphrase"
              name="exportPassphrase"
              accessibilityHint="Use at least 10 characters. Unicode is normalized; no other character rules apply."
              visible={showPassphrases}
              onToggleVisible={() => setShowPassphrases((visible) => !visible)}
            />
            <PassphraseField
              control={control}
              label="Confirm passphrase"
              name="confirmPassphrase"
              accessibilityHint="Re-enter the same passphrase to confirm it."
              visible={showPassphrases}
              onToggleVisible={() => setShowPassphrases((visible) => !visible)}
            />
            <AppText style={[typography.meta, { color: colors.text3 }]}>
              At least 10 characters after Unicode normalization. No other character rules.
            </AppText>
          </View>
        ) : (
          <AppText style={[typography.meta, { color: colors.err, lineHeight: 19 }]}>
            This file will be unencrypted. Anyone who gets it can read your financial data.
            {'\n'}A temporary cache copy is used for sharing and removed afterward.
          </AppText>
        )}
        <AppText style={[typography.meta, { color: colors.text3, marginTop: 10 }]}>
          Last export: {meta.lastExportAt ? formatDate(meta.lastExportAt.slice(0, 10)) : 'never'}
        </AppText>
        <AppText style={[typography.meta, { color: colors.text3 }]}>
          Approximate data size: {storageSummary(utf8ByteLength(JSON.stringify(data)))}
        </AppText>
        {busy ? (
          <View accessibilityLiveRegion="polite" style={styles.busy}>
            <ActivityIndicator color={colors.primary} />
            <AppText style={[typography.meta, { color: colors.text2 }]}>{busyMessage}</AppText>
          </View>
        ) : null}
        <Button
          label={encryptExport ? 'Export encrypted backup' : 'Export plain backup'}
          icon="download"
          variant="primary"
          disabled={busy}
          onPress={handleExportPress}
        />
      </Card>

      <SectionTitle>Import</SectionTitle>
      <Card>
        <AppText style={[typography.meta, { color: colors.text3, lineHeight: 19 }]}>
          Picked files use a temporary cache copy for reading, then it is removed. Encrypted backups are decrypted only in memory.
        </AppText>
        <Button label="Import from file" icon="upload" disabled={busy} onPress={importFromFile} />
        {encryptedImportText ? (
          <View style={styles.passphraseFields}>
            <AppText style={[typography.meta, { color: colors.text2, lineHeight: 19 }]}>
              Enter the passphrase used when this backup was exported. A lost passphrase cannot be recovered.
            </AppText>
            <PassphraseField
              control={control}
              label="Backup passphrase"
              name="importPassphrase"
              accessibilityHint="If authentication fails, the passphrase may be wrong or the file may be damaged."
              visible={showPassphrases}
              onToggleVisible={() => setShowPassphrases((visible) => !visible)}
            />
            <Button
              label="Unlock backup"
              icon="unlock"
              disabled={busy}
              onPress={unlockEncryptedBackup}
            />
          </View>
        ) : null}
        {preview ? <ImportPreview preview={preview} colors={colors} onReplace={() => void replaceImport()} busy={busy} /> : null}
        {undoSnapshot ? (
          <View style={styles.undo}>
            <AppText style={[typography.meta, { color: colors.text2 }]}>
              Previous data saved on {formatDate(undoSnapshot.savedAt)}
            </AppText>
            <Button label="Undo import" icon="corner-up-left" disabled={busy} onPress={() => void undo()} />
          </View>
        ) : null}
      </Card>
      {message ? <AppText accessibilityRole="alert" style={[typography.meta, styles.message, { color: colors.err }]}>{message}</AppText> : null}
      {issues.length > 0 ? (
        <Card>
          {issues.map((issue) => <AppText key={issue} style={[typography.meta, { color: colors.text2 }]}>{issue}</AppText>)}
        </Card>
      ) : null}
    </Screen>
  );
}

function PassphraseField({
  control,
  label,
  name,
  accessibilityHint,
  visible,
  onToggleVisible,
}: {
  control: Control<BackupPassphraseFields>;
  label: string;
  name: keyof BackupPassphraseFields;
  accessibilityHint: string;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.passphraseField}>
      <AppText style={typography.meta}>{label}</AppText>
      <View style={[styles.passphraseRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <TextInput
              accessibilityLabel={label}
              accessibilityHint={accessibilityHint}
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              secureTextEntry={!visible}
              style={[styles.passphraseInput, { color: colors.text1 }]}
              value={field.value}
            />
          )}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide passphrase' : 'Show passphrase'}
          onPress={onToggleVisible}
          style={styles.visibilityButton}>
          <AppText weight="semibold" style={{ color: colors.primary }}>
            {visible ? 'Hide' : 'Show'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ImportPreview({
  preview,
  colors,
  onReplace,
  busy,
}: {
  preview: Extract<ParseBackupResult, { ok: true }>;
  colors: ReturnType<typeof useTheme>['colors'];
  onReplace: () => void;
  busy: boolean;
}) {
  const { summary } = preview;
  const counts = [
    `${summary.transactions} transactions`, `${summary.goals} goals`,
    `${summary.holdings} holdings`, `${summary.plans} plans`,
    `${summary.liabilities} liabilities`,
  ].join(' · ');
  const range = summary.firstDate && summary.lastDate
    ? `${formatDate(summary.firstDate)} – ${formatDate(summary.lastDate)}`
    : 'No transaction dates';
  return (
    <View style={[styles.preview, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <AppText weight="semibold">Backup from {formatDate(preview.exportedAt.slice(0, 10))}</AppText>
      <AppText style={[typography.meta, { color: colors.text2 }]}>{counts}</AppText>
      <AppText style={[typography.meta, { color: colors.text2 }]}>Transaction dates: {range}</AppText>
      <AppText weight="semibold" style={{ color: colors.err, marginTop: 8 }}>
        This will replace ALL data currently on this phone
      </AppText>
      <Button label="Replace my data" icon="upload" variant="danger-text" disabled={busy} onPress={onReplace} />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 12, gap: 8, marginTop: 12 },
  passphraseFields: { gap: 10 },
  passphraseField: { gap: 6 },
  passphraseRow: { minHeight: 50, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  passphraseInput: { flex: 1, minHeight: 48, paddingHorizontal: 14, fontFamily: 'Montserrat_500Medium', fontSize: 16 },
  visibilityButton: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  busy: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 },
  undo: { gap: 6, marginTop: 12 },
  message: { marginHorizontal: 20, marginVertical: 10 },
});

function backupCryptoErrorMessage(error: unknown): string | null {
  if (error instanceof InvalidEnvelope
    || error instanceof KdfParametersOutOfRange
    || error instanceof PassphraseTooShort
    || error instanceof UnsupportedEnvelopeVersion
    || error instanceof WrongPassphraseOrTampered) {
    return error.message;
  }
  return null;
}
