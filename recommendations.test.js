import { describe, expect, it } from 'vitest';
import content from '../src/content/recommendations.json';
import { pickRecommendations } from '../src/lib/recommendations.js';

const ids = (p) => pickRecommendations(p).map((b) => b.id);

describe('recommendations', () => {
  it('everyone gets the general blocks', () => {
    expect(ids({})).toEqual(expect.arrayContaining(['how-support-is-figured', 'common-mistakes']));
  });
  it('picks blocks by role, case type, goal and relationship', () => {
    const r = ids({ role: 'payor', case_type: 'modification', goal: 'reduce', relationship: 'never' });
    expect(r).toEqual(expect.arrayContaining(['modification', 'payor-reduce', 'never-married']));
    expect(r).not.toContain('payee-increase');
    expect(r).not.toContain('enforcement');
    expect(r[0]).toBe('payor-reduce'); // most specific first
  });
  it('every block is marked for attorney review and valid', () => {
    const keys = new Set(['role', 'case_type', 'goal', 'relationship']);
    for (const b of content.blocks) {
      expect(b.review, b.id).toMatch(/ATTORNEY TO REVIEW/);
      expect(b.title && b.body.length, b.id).toBeTruthy();
      for (const k of Object.keys(b.when)) expect(keys.has(k), `${b.id}.${k}`).toBe(true);
    }
  });
  it('makes no outcome promises', () => {
    const text = JSON.stringify(content.blocks);
    expect(text).not.toMatch(/\bwill (lower|reduce|raise|increase|win)\b|you will get|the court will order/i);
  });
});
