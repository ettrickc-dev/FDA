// Application-level encryption for answer data (spec Section 3).
// AES-256-GCM. Ciphertext format:  v<keyVersion>.<iv b64>.<tag b64>.<ciphertext b64>
// The case id and section name are bound as "additional authenticated data", so an
// encrypted blob copied to another case or section will fail to decrypt.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function keyFor(version) {
  const current = String(process.env.ANSWERS_ENC_KEY_VERSION || '1');
  const raw = String(version) === current
    ? process.env.ANSWERS_ENC_KEY
    : process.env[`ANSWERS_ENC_KEY_${version}`];
  if (!raw) throw new Error('Encryption key not configured');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('Encryption key must be 32 bytes (base64)');
  return key;
}

export function currentKeyVersion() {
  return Number(process.env.ANSWERS_ENC_KEY_VERSION || 1);
}

export function encrypt(obj, aad) {
  const version = currentKeyVersion();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFor(version), iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ct = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v${version}.${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
}

export function decrypt(blob, aad) {
  const [v, ivB, tagB, ctB] = String(blob).split('.');
  if (!v?.startsWith('v') || !ivB || !tagB || ctB === undefined) throw new Error('Bad ciphertext');
  const decipher = createDecipheriv('aes-256-gcm', keyFor(v.slice(1)), Buffer.from(ivB, 'base64'));
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(Buffer.from(tagB, 'base64'));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB, 'base64')), decipher.final()]);
  return JSON.parse(pt.toString('utf8'));
}

export const aadFor = (caseId, section) => `${caseId}:${section}`;
