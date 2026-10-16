import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { aadFor, decrypt, encrypt } from '../netlify/functions/_lib/crypto.js';

describe('answer encryption', () => {
  beforeEach(() => {
    process.env.ANSWERS_ENC_KEY = randomBytes(32).toString('base64');
    process.env.ANSWERS_ENC_KEY_VERSION = '1';
  });

  it('round-trips data', () => {
    const data = { full_name: 'Test Person', income: 1234.56, nested: { a: [1, 2] } };
    const blob = encrypt(data, aadFor('case-1', 'case_info'));
    expect(blob.startsWith('v1.')).toBe(true);
    expect(blob).not.toContain('Test Person');
    expect(decrypt(blob, aadFor('case-1', 'case_info'))).toEqual(data);
  });

  it('uses a fresh IV every time', () => {
    const a = encrypt({ x: 1 }, 'aad');
    const b = encrypt({ x: 1 }, 'aad');
    expect(a).not.toEqual(b);
  });

  it('refuses a blob moved to another case or section', () => {
    const blob = encrypt({ x: 1 }, aadFor('case-1', 'case_info'));
    expect(() => decrypt(blob, aadFor('case-2', 'case_info'))).toThrow();
    expect(() => decrypt(blob, aadFor('case-1', 'assets'))).toThrow();
  });

  it('detects tampering', () => {
    const blob = encrypt({ x: 1 }, 'aad');
    const parts = blob.split('.');
    const ct = Buffer.from(parts[3], 'base64'); ct[0] ^= 1;
    parts[3] = ct.toString('base64');
    expect(() => decrypt(parts.join('.'), 'aad')).toThrow();
  });

  it('decrypts old data after key rotation', () => {
    const oldKey = process.env.ANSWERS_ENC_KEY;
    const blob = encrypt({ x: 1 }, 'aad');
    process.env.ANSWERS_ENC_KEY_1 = oldKey;
    process.env.ANSWERS_ENC_KEY = randomBytes(32).toString('base64');
    process.env.ANSWERS_ENC_KEY_VERSION = '2';
    expect(decrypt(blob, 'aad')).toEqual({ x: 1 });
    expect(encrypt({ y: 2 }, 'aad').startsWith('v2.')).toBe(true);
  });

  it('fails clearly without a key', () => {
    delete process.env.ANSWERS_ENC_KEY;
    expect(() => encrypt({ x: 1 }, 'aad')).toThrow(/not configured/);
  });
});
