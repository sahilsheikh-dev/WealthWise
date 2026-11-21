import { gcm } from '@noble/ciphers/aes.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

import { MAX_BACKUP_CHARS } from './backup';

export const ENCRYPTED_BACKUP_FORMAT = 'wealthwise-encrypted-backup';
export const ENCRYPTED_BACKUP_VERSION = 1;
export const DEFAULT_SCRYPT_PARAMS = {
  N: 2 ** 16,
  r: 8,
  p: 1,
  dkLen: 32,
} as const;

const MIN_SCRYPT_N = 2 ** 15;
const MAX_SCRYPT_N = 2 ** 16;
const SALT_BYTES = 16;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const MAX_ENCRYPTED_BACKUP_CHARS = MAX_BACKUP_CHARS * 6 + 2048;
const SCRYPT_MAX_MEMORY = 80 * 1024 * 1024;
const ENVELOPE_KEYS = ['format', 'formatVersion', 'kdf', 'cipher', 'ciphertext'];

export type ScryptParams = {
  N: number;
  r: number;
  p: number;
  dkLen: number;
};

export type EncryptedBackupEnvelope = {
  format: typeof ENCRYPTED_BACKUP_FORMAT;
  formatVersion: typeof ENCRYPTED_BACKUP_VERSION;
  kdf: {
    name: 'scrypt';
    params: ScryptParams;
    salt: string;
  };
  cipher: {
    name: 'aes-256-gcm';
    nonce: string;
  };
  ciphertext: string;
};

export class WrongPassphraseOrTampered extends Error {
  constructor() {
    super('This encrypted backup could not be authenticated. The passphrase may be incorrect, or the file may be damaged. AES-GCM cannot distinguish between those causes.');
    this.name = 'WrongPassphraseOrTampered';
  }
}

export class UnsupportedEnvelopeVersion extends Error {
  constructor() {
    super('This encrypted backup uses an unsupported format version.');
    this.name = 'UnsupportedEnvelopeVersion';
  }
}

export class InvalidEnvelope extends Error {
  constructor() {
    super('This encrypted backup is malformed or incomplete.');
    this.name = 'InvalidEnvelope';
  }
}

export class KdfParametersOutOfRange extends Error {
  constructor() {
    super('This encrypted backup uses unsafe key-derivation parameters.');
    this.name = 'KdfParametersOutOfRange';
  }
}

export class PassphraseTooShort extends Error {
  constructor() {
    super('Use a passphrase with at least 10 characters.');
    this.name = 'PassphraseTooShort';
  }
}

export async function encryptBackup(
  plainText: string,
  passphrase: string,
  options: {
    salt: Uint8Array;
    nonce: Uint8Array;
    kdf: { name: 'scrypt'; params: ScryptParams };
  },
): Promise<string> {
  const normalizedPassphrase = normalizePassphrase(passphrase);
  validateParameters(options.kdf.params);
  if (!(options.salt instanceof Uint8Array) || !(options.nonce instanceof Uint8Array)
    || options.salt.length !== SALT_BYTES || options.nonce.length !== NONCE_BYTES) {
    throw new InvalidEnvelope();
  }

  const envelope: EncryptedBackupEnvelope = {
    format: ENCRYPTED_BACKUP_FORMAT,
    formatVersion: ENCRYPTED_BACKUP_VERSION,
    kdf: {
      name: options.kdf.name,
      params: { ...options.kdf.params },
      salt: bytesToHex(options.salt),
    },
    cipher: {
      name: 'aes-256-gcm',
      nonce: bytesToHex(options.nonce),
    },
    ciphertext: '',
  };
  const key = await deriveKey(normalizedPassphrase, options.salt, envelope.kdf.params);
  try {
    const plaintext = utf8ToBytes(plainText);
    let encrypted: Uint8Array;
    try {
      encrypted = gcm(key, options.nonce, encodeHeader(envelope)).encrypt(plaintext);
    } finally {
      plaintext.fill(0);
    }
    try {
      envelope.ciphertext = bytesToHex(encrypted);
      return JSON.stringify(envelope);
    } finally {
      encrypted.fill(0);
    }
  } finally {
    key.fill(0);
  }
}

export async function decryptBackup(envelopeText: string, passphrase: string): Promise<string> {
  if (envelopeText.length > MAX_ENCRYPTED_BACKUP_CHARS) throw new InvalidEnvelope();
  const envelope = parseAndValidateEnvelope(envelopeText);
  const normalizedPassphrase = normalizePassphrase(passphrase);
  const salt = hexToBytes(envelope.kdf.salt);
  const nonce = hexToBytes(envelope.cipher.nonce);
  const key = await deriveKey(normalizedPassphrase, salt, envelope.kdf.params);
  let plaintext: Uint8Array;
  try {
    plaintext = gcm(key, nonce, encodeHeader(envelope)).decrypt(hexToBytes(envelope.ciphertext));
  } catch {
    throw new WrongPassphraseOrTampered();
  } finally {
    key.fill(0);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
  } catch {
    throw new InvalidEnvelope();
  } finally {
    plaintext.fill(0);
  }
}

export function isEncryptedBackup(text: string): boolean {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) return false;
    return parsed.format === ENCRYPTED_BACKUP_FORMAT;
  } catch {
    return text.includes(ENCRYPTED_BACKUP_FORMAT);
  }
}

export function validateEnvelope(envelope: unknown): EncryptedBackupEnvelope {
  if (!isRecord(envelope) || !hasExactKeys(envelope, ENVELOPE_KEYS)) {
    throw new InvalidEnvelope();
  }
  if (envelope.format !== ENCRYPTED_BACKUP_FORMAT) throw new InvalidEnvelope();
  if (typeof envelope.formatVersion !== 'number' || !Number.isInteger(envelope.formatVersion)) {
    throw new InvalidEnvelope();
  }
  if (envelope.formatVersion !== ENCRYPTED_BACKUP_VERSION) {
    throw new UnsupportedEnvelopeVersion();
  }
  if (!isRecord(envelope.kdf) || !hasExactKeys(envelope.kdf, ['name', 'params', 'salt'])) {
    throw new InvalidEnvelope();
  }
  if (envelope.kdf.name !== 'scrypt') throw new InvalidEnvelope();
  const params = parseScryptParams(envelope.kdf.params);
  if (typeof envelope.kdf.salt !== 'string' || !isHex(envelope.kdf.salt, SALT_BYTES)) {
    throw new InvalidEnvelope();
  }
  if (!isRecord(envelope.cipher) || !hasExactKeys(envelope.cipher, ['name', 'nonce'])) {
    throw new InvalidEnvelope();
  }
  if (envelope.cipher.name !== 'aes-256-gcm') throw new InvalidEnvelope();
  if (typeof envelope.cipher.nonce !== 'string' || !isHex(envelope.cipher.nonce, NONCE_BYTES)) {
    throw new InvalidEnvelope();
  }
  if (typeof envelope.ciphertext !== 'string'
    || !isHex(envelope.ciphertext)
    || envelope.ciphertext.length < TAG_BYTES * 2
    || envelope.ciphertext.length > MAX_ENCRYPTED_BACKUP_CHARS) {
    throw new InvalidEnvelope();
  }

  return {
    format: ENCRYPTED_BACKUP_FORMAT,
    formatVersion: ENCRYPTED_BACKUP_VERSION,
    kdf: {
      name: 'scrypt',
      params,
      salt: envelope.kdf.salt,
    },
    cipher: {
      name: 'aes-256-gcm',
      nonce: envelope.cipher.nonce,
    },
    ciphertext: envelope.ciphertext,
  };
}

function parseAndValidateEnvelope(text: string): EncryptedBackupEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidEnvelope();
  }
  return validateEnvelope(parsed);
}

function normalizePassphrase(passphrase: string): string {
  const normalized = passphrase.normalize('NFKC');
  if (Array.from(normalized).length < 10) throw new PassphraseTooShort();
  return normalized;
}

function validateParameters(params: ScryptParams): void {
  if (!Number.isInteger(params.N) || params.N < MIN_SCRYPT_N || params.N > MAX_SCRYPT_N
    || (params.N & (params.N - 1)) !== 0
    || params.r !== 8 || params.p !== 1 || params.dkLen !== 32) {
    throw new KdfParametersOutOfRange();
  }
}

function parseScryptParams(value: unknown): ScryptParams {
  if (!isRecord(value) || !hasExactKeys(value, ['N', 'r', 'p', 'dkLen'])) {
    throw new KdfParametersOutOfRange();
  }
  const { N, r, p, dkLen } = value;
  if (typeof N !== 'number' || typeof r !== 'number' || typeof p !== 'number' || typeof dkLen !== 'number') {
    throw new KdfParametersOutOfRange();
  }
  const params = { N, r, p, dkLen };
  validateParameters(params);
  return params;
}

async function deriveKey(passphrase: string, salt: Uint8Array, params: ScryptParams): Promise<Uint8Array> {
  return scryptAsync(passphrase, salt, {
    ...params,
    asyncTick: 10,
    maxmem: SCRYPT_MAX_MEMORY,
  });
}

function encodeHeader(envelope: EncryptedBackupEnvelope): Uint8Array {
  const header = {
    format: envelope.format,
    formatVersion: envelope.formatVersion,
    kdf: {
      name: envelope.kdf.name,
      params: {
        N: envelope.kdf.params.N,
        r: envelope.kdf.params.r,
        p: envelope.kdf.params.p,
        dkLen: envelope.kdf.params.dkLen,
      },
      salt: envelope.kdf.salt,
    },
    cipher: {
      name: envelope.cipher.name,
      nonce: envelope.cipher.nonce,
    },
  };
  return utf8ToBytes(JSON.stringify(header));
}

function isHex(value: string, byteLength?: number): boolean {
  return value.length % 2 === 0
    && (byteLength === undefined || value.length === byteLength * 2)
    && /^[0-9a-f]*$/i.test(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
