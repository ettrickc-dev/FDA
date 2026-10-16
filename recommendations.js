// Goal-based recommendations (spec Section 7): an attorney-authored decision tree, not AI output.
// Content lives in src/content/recommendations.json.
import content from '../content/recommendations.json';

const KEYS = ['role', 'case_type', 'goal', 'relationship'];

export function pickRecommendations(profile = {}, blocks = content.blocks) {
  const matches = blocks.filter((b) => KEYS.every((k) => !b.when?.[k] || b.when[k].includes(profile[k])));
  // More specific blocks first; general blocks (no conditions) last.
  const specificity = (b) => KEYS.filter((k) => b.when?.[k]).length;
  return matches
    .map((b, i) => ({ b, i }))
    .sort((x, y) => specificity(y.b) - specificity(x.b) || x.i - y.i)
    .map(({ b }) => b);
}

export const RECOMMENDATIONS_VERSION = content.version;
