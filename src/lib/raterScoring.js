// Scoring for the 360 rater form (RATER_ITEMS) and normalization that makes
// a leader's ipsative self-score comparable to averaged rater Likert scores.
// See docs/superpowers/specs/2026-08-26-prompt4-360-design.md for why the
// two sides use different raw scales but a shared "% of profile" shape.

const DIMS = ['F', 'B', 'W', 'C'];

export function scoreRaterResponse(answers, items) {
  const scores = { F: 0, B: 0, W: 0, C: 0 };
  items.forEach((item, i) => { scores[item.d] += answers[i]; });
  return scores;
}

// self.most is the existing ipsative {F,B,W} (sum 15); complianceScore is the
// existing 3-9 compliance-courage sum from scoring.js, or null/undefined if
// that sub-scale wasn't completed.
export function normalizeSelf(most, complianceScore) {
  const total = most.F + most.B + most.W || 1;
  const compliancePct = complianceScore ? Math.max(0, ((complianceScore - 3) / 6) * 100) : 0;
  return {
    F: (most.F / total) * 100,
    B: (most.B / total) * 100,
    W: (most.W / total) * 100,
    C: compliancePct,
  };
}

// responses: array of {F,B,W,C} raw 3-9 sums, one per rater.
export function normalizeRaters(responses) {
  if (!responses || responses.length === 0) return null;
  const avg = { F: 0, B: 0, W: 0, C: 0 };
  responses.forEach(r => DIMS.forEach(k => { avg[k] += r[k]; }));
  DIMS.forEach(k => { avg[k] /= responses.length; });
  const total = DIMS.reduce((sum, k) => sum + avg[k], 0) || 1;
  const pct = {};
  DIMS.forEach(k => { pct[k] = (avg[k] / total) * 100; });
  return pct;
}

export function buildGapData(selfPct, raterPct) {
  return DIMS.map(key => ({
    key,
    selfPct: selfPct[key],
    raterPct: raterPct[key],
    gap: raterPct[key] - selfPct[key],
  }));
}
