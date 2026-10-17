import { describe, expect, it } from 'vitest';
import { ACCEPTED_TERMS_VERSIONS, CURRENT_TERMS_VERSION } from '../netlify/functions/consent.js';
import { TERMS_VERSION } from '../src/config.js';

describe('terms version', () => {
  it('server accepts the version the Terms screen sends, and treats it as current', () => {
    expect(ACCEPTED_TERMS_VERSIONS).toContain(TERMS_VERSION);
    expect(CURRENT_TERMS_VERSION).toBe(TERMS_VERSION);
  });
});
