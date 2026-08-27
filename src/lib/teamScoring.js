// Client-side imbalance flag for the team dashboard. `distribution` is
// the {F,B,W,C} percent-of-team values already averaged server-side by
// the get_team_summary RPC. This is a rule-of-thumb heuristic, not a
// statistical test — see
// docs/superpowers/specs/2026-08-27-prompt5-team-dashboard-design.md.

const HIGH_THRESHOLD = 45;
const LOW_THRESHOLD = 20;
const PAIRS = [
  ['F', 'W'], ['F', 'B'],
  ['B', 'F'], ['B', 'W'],
  ['W', 'F'], ['W', 'B'],
];

export function computeImbalance(distribution) {
  for (const [high, low] of PAIRS) {
    if (distribution[high] >= HIGH_THRESHOLD && distribution[low] <= LOW_THRESHOLD) {
      return { high, low };
    }
  }
  return null;
}
