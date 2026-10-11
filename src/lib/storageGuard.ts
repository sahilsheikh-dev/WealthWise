export const STORAGE_WARN_BYTES = 1_000_000;
export const STORAGE_CRITICAL_BYTES = 1_600_000;

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function storageLevel(bytes: number): 'ok' | 'warn' | 'critical' {
  if (bytes >= STORAGE_CRITICAL_BYTES) return 'critical';
  if (bytes >= STORAGE_WARN_BYTES) return 'warn';
  return 'ok';
}

export function storageSummary(bytes: number): string {
  const unit = bytes < 1024 ? 'B' : bytes < 1024 * 1024 ? 'KB' : 'MB';
  const value = bytes < 1024 ? bytes : bytes < 1024 * 1024 ? bytes / 1024 : bytes / (1024 * 1024);
  const rounded = Number(value.toFixed(1));
  return `${rounded} ${unit} of about 2 MB`;
}
