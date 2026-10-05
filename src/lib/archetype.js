// Maps averaged 360 rater scores to one of the eight archetypes in
// data/archetypes.js.
//
// Why 360-only: the self-assessment is ipsative (forced-choice, F+B+W = 15),
// so it can never show High on all three or Low on all three — two of the
// eight archetypes would be unreachable and the rest would be distorted.
// Rater scores are absolute Likert sums (3 items × 1-3 = 3-9 per dimension,
// averaged across raters by get_360_summary), so a High/Low cut is meaningful.
//
// The deck gives no numeric cut-off. HIGH_THRESHOLD = 7 reuses the app's
// existing "High" bucket for 3-9 Likert sums (orgBars / compliance in
// scoring.js): on average, raters answered "Often" on most items.
export const HIGH_THRESHOLD = 7;

export function archetypeCode(scores, threshold = HIGH_THRESHOLD) {
  if (!scores) return null;
  return ['F', 'B', 'W'].map(k => (Number(scores[k]) >= threshold ? 'H' : 'L')).join('');
}
