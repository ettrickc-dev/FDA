// Automated checks for the spec's Section 2 hard rules, run over all user-facing source.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}
const uiFiles = [...files('src'), ...(() => { try { return files('content'); } catch { return []; } })()]
  .filter((f) => /\.(jsx?|json|md)$/.test(f));
const uiText = uiFiles.map((f) => [f, readFileSync(f, 'utf8')]);

describe('Rule 2.4 banned words', () => {
  const banned = [/\bexact(ly)?\b/i, /\bguarantee(d)?\b/i, /court[- ]approved/i, /mathematically verified/i, /\bprove[sn]?\b/i];
  for (const re of banned) {
    it(`no "${re.source}" in UI`, () => {
      const hits = uiText.filter(([f, t]) => {
        // The attorney advertising label legally requires "do not guarantee".
        const cleaned = t.replace(/Prior results do not guarantee a similar outcome/g, '');
        return re.test(cleaned);
      }).map(([f]) => f);
      expect(hits).toEqual([]);
    });
  }

  it('"free" only appears in approved, qualified phrases', () => {
    const allowed = [
      'Free to build and preview. Pay only to download your final forms.',
      'Previewing is free. Downloading or printing the final, unwatermarked forms requires payment.',
      'Free legal help',
    ];
    const hits = [];
    for (const [f, t] of uiText) {
      let s = t;
      for (const a of allowed) s = s.split(a).join('');
      if (/\bfree\b/i.test(s.replace(/FREE_HELP_URL/g, ''))) hits.push(f);
    }
    expect(hits).toEqual([]);
  });
});

describe('Rule 2.1 fee wording', () => {
  it('landing page has exact required sentence', () => {
    expect(readFileSync('src/pages/Landing.jsx', 'utf8'))
      .toContain('Free to build and preview. Pay only to download your final forms.');
  });
  it('terms screen has exact required sentence', () => {
    expect(readFileSync('src/pages/Terms.jsx', 'utf8'))
      .toContain('Previewing is free. Downloading or printing the final, unwatermarked forms requires payment.');
  });
});

describe('Rule 2.2 no price before paywall', () => {
  it('no dollar amounts or PRICE_CENTS in browser source', () => {
    const hits = uiText.filter(([, t]) => /\$\s?\d|PRICE_CENTS/.test(t)).map(([f]) => f);
    expect(hits).toEqual([]);
  });
});

describe('Rule 2.10 advertising label', () => {
  it('matches required wording', () => {
    const t = readFileSync('src/config.js', 'utf8');
    expect(t).toContain('Attorney Advertising.');
    expect(t).toContain('Attorney at Law');
    expect(t).toContain('Prior results do not guarantee a similar outcome. This tool provides general legal information, not legal advice.');
  });
});

describe('Rule 2.8 no trackers', () => {
  it('no analytics or replay scripts', () => {
    const all = [...uiText, ['index.html', readFileSync('index.html', 'utf8')]];
    const hits = all.filter(([, t]) => /gtag|googletagmanager|google-analytics|hotjar|fullstory|segment\.com|mixpanel|sentry|posthog|clarity\.ms/i.test(t));
    expect(hits.map(([f]) => f)).toEqual([]);
  });
});
