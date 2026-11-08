import { gcm } from '@noble/ciphers/aes.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

import {
  DEFAULT_SCRYPT_PARAMS,
  ENCRYPTED_BACKUP_FORMAT,
  InvalidEnvelope,
  KdfParametersOutOfRange,
  PassphraseTooShort,
  UnsupportedEnvelopeVersion,
  WrongPassphraseOrTampered,
  decryptBackup,
  encryptBackup,
  isEncryptedBackup,
  validateEnvelope,
} from '../backupCrypto';

const params = { N: 2 ** 15, r: 8, p: 1, dkLen: 32 };
const options = {
  salt: Uint8Array.from({ length: 16 }, (_, index) => index),
  nonce: Uint8Array.from({ length: 12 }, (_, index) => index + 16),
  kdf: { name: 'scrypt' as const, params },
};
const passphrase = 'a sufficiently long passphrase';

async function encryptedFixture(plainText = '{"app":"wealthwise"}'): Promise<string> {
  return encryptBackup(plainText, passphrase, options);
}

function changedEnvelope(text: string, change: (envelope: Record<string, unknown>) => void): string {
  const envelope = JSON.parse(text) as Record<string, unknown>;
  change(envelope);
  return JSON.stringify(envelope);
}

describe('encrypted backup cryptography', () => {
  it('matches the RFC 7914 scrypt known-answer vector', async () => {
    const derived = await scryptAsync('', '', { N: 16, r: 1, p: 1, dkLen: 64 });
    expect(bytesToHex(derived)).toBe(
      '77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442'
      + 'fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906',
    );
  });

  it('matches the NIST AES-256-GCM known-answer vector', () => {
    const key = new Uint8Array(32);
    const nonce = new Uint8Array(12);
    const plaintext = new Uint8Array(16);
    const encrypted = gcm(key, nonce).encrypt(plaintext);
    expect(bytesToHex(encrypted)).toBe(
      'cea7403d4d606b6e074ec5d3baf39d18d0d1c8a799996bf0265b98b5d48ab919',
    );
  });

  it('round-trips deterministically with injected salt and nonce', async () => {
    const first = await encryptedFixture('{"message":"wealth 💰"}');
    const second = await encryptedFixture('{"message":"wealth 💰"}');
    expect(first).toBe(second);
    expect(await decryptBackup(first, passphrase)).toBe('{"message":"wealth 💰"}');
    expect(JSON.parse(first)).toMatchObject({
      format: ENCRYPTED_BACKUP_FORMAT,
      formatVersion: 1,
      kdf: { name: 'scrypt', params, salt: '000102030405060708090a0b0c0d0e0f' },
      cipher: { name: 'aes-256-gcm', nonce: '101112131415161718191a1b' },
    });
  });

  it('normalizes passphrases to NFKC before key derivation', async () => {
    const encrypted = await encryptBackup('normalized', 'café passphrase', options);
    await expect(decryptBackup(encrypted, 'cafe\u0301 passphrase')).resolves.toBe('normalized');
  });

  it('rejects passphrases shorter than 10 Unicode characters', async () => {
    await expect(encryptBackup('x', '123456789', options)).rejects.toBeInstanceOf(PassphraseTooShort);
    const valid = await encryptBackup('x', '1234567💰💰💰', options);
    await expect(decryptBackup(valid, '1234567💰💰💰')).resolves.toBe('x');
  });

  it('rejects invalid injected salt and nonce lengths', async () => {
    await expect(encryptBackup('x', passphrase, { ...options, salt: new Uint8Array(8) }))
      .rejects.toBeInstanceOf(InvalidEnvelope);
    await expect(encryptBackup('x', passphrase, { ...options, nonce: new Uint8Array(16) }))
      .rejects.toBeInstanceOf(InvalidEnvelope);
  });

  it('uses the same typed authentication failure for wrong passphrases and tampering', async () => {
    const encrypted = await encryptedFixture();
    await expect(decryptBackup(encrypted, passphrase))
      .resolves.toBe('{"app":"wealthwise"}');
    await expect(decryptBackup(encrypted, 'another sufficiently long passphrase')).rejects.toThrow(
      'AES-GCM cannot distinguish between those causes.',
    );
    await expect(decryptBackup(encrypted, 'another sufficiently long passphrase'))
      .rejects.toBeInstanceOf(WrongPassphraseOrTampered);
  });

  it.each(['salt', 'nonce', 'ciphertext'])('rejects a one-byte mutation in %s', async (part) => {
    const encrypted = await encryptedFixture();
    const changed = changedEnvelope(encrypted, (envelope) => {
      if (part === 'salt') {
        const kdf = envelope.kdf as Record<string, unknown>;
        const salt = String(kdf.salt);
        kdf.salt = `${salt[0] === '0' ? '1' : '0'}${salt.slice(1)}`;
      } else if (part === 'nonce') {
        const cipher = envelope.cipher as Record<string, unknown>;
        const nonce = String(cipher.nonce);
        cipher.nonce = `${nonce.slice(0, -2)}${nonce.slice(-2) === '00' ? '01' : '00'}`;
      } else {
        const ciphertext = String(envelope.ciphertext);
        envelope.ciphertext = `${ciphertext.slice(0, -2)}${ciphertext.slice(-2) === '00' ? '01' : '00'}`;
      }
    });
    await expect(decryptBackup(changed, passphrase)).rejects.toBeInstanceOf(WrongPassphraseOrTampered);
  });

  it('authenticates safe KDF header values as additional data', async () => {
    const encrypted = await encryptedFixture();
    const changed = changedEnvelope(encrypted, (envelope) => {
      const kdf = envelope.kdf as Record<string, unknown>;
      const kdfParams = kdf.params as Record<string, unknown>;
      kdfParams.N = 2 ** 16;
    });
    await expect(decryptBackup(changed, passphrase)).rejects.toBeInstanceOf(WrongPassphraseOrTampered);
  });

  it('classifies a structurally truncated envelope as invalid', async () => {
    const encrypted = await encryptedFixture();
    const truncated = encrypted.slice(0, -1);
    expect(isEncryptedBackup(truncated)).toBe(true);
    await expect(decryptBackup(truncated, passphrase)).rejects.toBeInstanceOf(InvalidEnvelope);
  });

  it('rejects authenticated plaintext that is not valid UTF-8', async () => {
    const header = {
      format: ENCRYPTED_BACKUP_FORMAT,
      formatVersion: 1,
      kdf: {
        name: 'scrypt',
        params,
        salt: bytesToHex(options.salt),
      },
      cipher: {
        name: 'aes-256-gcm',
        nonce: bytesToHex(options.nonce),
      },
    };
    const key = await scryptAsync(passphrase, options.salt, params);
    const ciphertext = bytesToHex(gcm(key, options.nonce, utf8ToBytes(JSON.stringify(header)))
      .encrypt(Uint8Array.of(0xff)));
    await expect(decryptBackup(JSON.stringify({ ...header, ciphertext }), passphrase))
      .rejects.toBeInstanceOf(InvalidEnvelope);
  });

  it('reports unsupported envelope versions distinctly', async () => {
    const encrypted = await encryptedFixture();
    const changed = changedEnvelope(encrypted, (envelope) => {
      envelope.formatVersion = 2;
    });
    await expect(decryptBackup(changed, passphrase)).rejects.toBeInstanceOf(UnsupportedEnvelopeVersion);
  });

  it.each([2 ** 14, 2 ** 17, 2 ** 30, 32769])('rejects scrypt N=%s outside the safe range', async (N) => {
    const encrypted = await encryptedFixture();
    const changed = changedEnvelope(encrypted, (envelope) => {
      const kdf = envelope.kdf as Record<string, unknown>;
      const kdfParams = kdf.params as Record<string, unknown>;
      kdfParams.N = N;
    });
    await expect(decryptBackup(changed, passphrase)).rejects.toBeInstanceOf(KdfParametersOutOfRange);
  });

  it('rejects unsafe scrypt r, p and derived-key length values', async () => {
    const encrypted = await encryptedFixture();
    for (const [key, value] of [['r', 9], ['p', 2], ['dkLen', 64]]) {
      const changed = changedEnvelope(encrypted, (envelope) => {
        const kdf = envelope.kdf as Record<string, unknown>;
        const kdfParams = kdf.params as Record<string, unknown>;
        kdfParams[key] = value;
      });
      await expect(decryptBackup(changed, passphrase)).rejects.toBeInstanceOf(KdfParametersOutOfRange);
    }
  });

  it('validates envelope structure and rejects malformed encodings', async () => {
    const encrypted = await encryptedFixture();
    const envelope = JSON.parse(encrypted) as unknown;
    expect(validateEnvelope(envelope)).toMatchObject({
      format: ENCRYPTED_BACKUP_FORMAT,
      cipher: { name: 'aes-256-gcm' },
    });
    expect(() => validateEnvelope(null)).toThrow(InvalidEnvelope);
    expect(() => validateEnvelope({ ...(envelope as Record<string, unknown>), extra: true })).toThrow(InvalidEnvelope);
    expect(() => validateEnvelope({ ...(envelope as Record<string, unknown>), format: 'plain' })).toThrow(InvalidEnvelope);
    expect(() => validateEnvelope({ ...(envelope as Record<string, unknown>), formatVersion: '1' }))
      .toThrow(InvalidEnvelope);
    expect(() => validateEnvelope({ ...(envelope as Record<string, unknown>), kdf: null })).toThrow(InvalidEnvelope);
    expect(() => validateEnvelope({
      ...(envelope as Record<string, unknown>),
      kdf: { name: 'argon2id', params, salt: '00'.repeat(16) },
    })).toThrow(InvalidEnvelope);
    expect(() => validateEnvelope({
      ...(envelope as Record<string, unknown>),
      kdf: { name: 'scrypt', params: { N: 32768 }, salt: 'bad' },
    })).toThrow(KdfParametersOutOfRange);
    expect(() => validateEnvelope({
      ...(envelope as Record<string, unknown>),
      kdf: { name: 'scrypt', params: { ...params, N: '32768' }, salt: '00'.repeat(16) },
    })).toThrow(KdfParametersOutOfRange);
    expect(() => validateEnvelope({
      ...(envelope as Record<string, unknown>),
      kdf: { name: 'scrypt', params, salt: 'not-hex'.repeat(3) },
    })).toThrow(InvalidEnvelope);
    expect(() => validateEnvelope({ ...(envelope as Record<string, unknown>), cipher: null })).toThrow(InvalidEnvelope);
    expect(() => validateEnvelope({
      ...(envelope as Record<string, unknown>),
      cipher: { name: 'aes-128-gcm', nonce: '00'.repeat(12) },
    })).toThrow(InvalidEnvelope);
    expect(() => validateEnvelope({
      ...(envelope as Record<string, unknown>),
      cipher: { name: 'aes-256-gcm', nonce: 'g'.repeat(24) },
    })).toThrow(InvalidEnvelope);
    expect(() => validateEnvelope({ ...(envelope as Record<string, unknown>), ciphertext: 'ff' }))
      .toThrow(InvalidEnvelope);
    expect(() => validateEnvelope({ ...(envelope as Record<string, unknown>), ciphertext: 'f'.repeat(17) }))
      .toThrow(InvalidEnvelope);
    await expect(decryptBackup(encrypted.replace('"aes-256-gcm"', '"unknown"'), passphrase))
      .rejects.toBeInstanceOf(InvalidEnvelope);
    await expect(decryptBackup(encrypted.replace('101112131415161718191a1b', 'zz'.repeat(12)), passphrase))
      .rejects.toBeInstanceOf(InvalidEnvelope);
    await expect(decryptBackup('x'.repeat(30_002_049), passphrase)).rejects.toBeInstanceOf(InvalidEnvelope);
  });

  it('detects encrypted envelopes without classifying plain backup JSON', async () => {
    const encrypted = await encryptedFixture();
    expect(isEncryptedBackup(encrypted)).toBe(true);
    expect(isEncryptedBackup('{"app":"wealthwise","formatVersion":1}')).toBe(false);
    expect(isEncryptedBackup('{"cipher":{},"ciphertext":"00"}')).toBe(false);
    expect(isEncryptedBackup('not json')).toBe(false);
    expect(isEncryptedBackup('null')).toBe(false);
    expect(isEncryptedBackup(encrypted.replace(ENCRYPTED_BACKUP_FORMAT, 'changed'))).toBe(false);
    expect(isEncryptedBackup('{"format":"wealthwise-encrypted-backup"')).toBe(true);
  });

  it('keeps bounded defaults for new exports', () => {
    expect(DEFAULT_SCRYPT_PARAMS).toEqual({ N: 2 ** 16, r: 8, p: 1, dkLen: 32 });
  });
});
