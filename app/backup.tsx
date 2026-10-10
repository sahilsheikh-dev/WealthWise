import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import { AppText, Button, Card, Screen, SectionTitle } from '../src/components/ui';
import { createMetaStore, type BackupMeta } from '../src/data/metaStore';
import { useAppStore } from '../src/data/store';
import { backupFileName, createBackup, parseBackup, type ParseBackupResult } from '../src/domain/backup';
import { confirmAsync } from '../src/lib/confirm';
import { formatDate } from '../src/lib/format';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

const metaStore = createMetaStore(AsyncStorage);
const digest = (text: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);

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
  const busyRef = useRef(false);

  useEffect(() => {
    void metaStore.getMeta().then(setMeta);
  }, []);

  const begin = () => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setMessage(null);
    setIssues([]);
    return true;
  };
  const finish = () => {
    busyRef.current = false;
    setBusy(false);
  };

  const exportBackup = async () => {
    if (!begin()) return;
    let file: File | null = null;
    try {
      const confirmed = await confirmAsync({
        title: 'Export backup?',
        message: 'Anyone who gets this file can read your data. Continue?',
        confirmLabel: 'Export backup',
      });
      if (!confirmed) return;
      if (!(await Sharing.isAvailableAsync())) {
        setMessage('Sharing is not available on this device.');
        return;
      }
      const exportedAt = new Date().toISOString();
      const text = await createBackup(data, { exportedAt, digest });
      file = new File(Paths.cache, backupFileName(exportedAt));
      file.create({ overwrite: true });
      file.write(text);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Wealth Wise backup' });
      const nextMeta = await metaStore.updateMeta({ lastExportAt: exportedAt });
      setMeta(nextMeta);
    } catch {
      setMessage('The backup could not be exported. Please try again.');
    } finally {
      try {
        if (file?.exists) file.delete();
      } catch {
        setMessage('The temporary backup file could not be removed from this device.');
      }
      finish();
    }
  };

  const importFromFile = async () => {
    if (!begin()) return;
    setPreview(null);
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
      const parsed = await parseBackup(text, { digest });
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

  const replaceImport = async () => {
    if (!preview || !begin()) return;
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
    if (!begin()) return;
    try {
      const result = await undoImport();
      setMessage(result.ok ? 'The previous data has been restored.' : result.message);
    } finally {
      finish();
    }
  };

  return (
    <Screen>
      <AppHeader title="Backup and restore" showBack />
      <SectionTitle>Export</SectionTitle>
      <Card>
        <AppText style={[typography.meta, { color: colors.text2, lineHeight: 19 }]}>
          The file contains all your financial data in plain text.
          {'\n'}Anywhere you save or send it can read it.
        </AppText>
        <AppText style={[typography.meta, { color: colors.text3, marginTop: 10 }]}>
          Last export: {meta.lastExportAt ? formatDate(meta.lastExportAt.slice(0, 10)) : 'never'}
        </AppText>
        <Button label="Export backup" variant="primary" disabled={busy} onPress={() => void exportBackup()} />
      </Card>

      <SectionTitle>Import</SectionTitle>
      <Card>
        <Button label="Import from file" disabled={busy} onPress={() => void importFromFile()} />
        {preview ? <ImportPreview preview={preview} colors={colors} onReplace={() => void replaceImport()} busy={busy} /> : null}
        {undoSnapshot ? (
          <View style={styles.undo}>
            <AppText style={[typography.meta, { color: colors.text2 }]}>
              Previous data saved on {formatDate(undoSnapshot.savedAt)}
            </AppText>
            <Button label="Undo import" disabled={busy} onPress={() => void undo()} />
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
    `${summary.liabilities} liabilities`, `${summary.efEntries} emergency-fund entries`,
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
      <Button label="Replace my data" variant="danger-text" disabled={busy} onPress={onReplace} />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 12, gap: 8, marginTop: 12 },
  undo: { gap: 6, marginTop: 12 },
  message: { marginHorizontal: 20, marginVertical: 10 },
});
