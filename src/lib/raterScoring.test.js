import { describe, it, expect } from 'vitest';
import { scoreRaterResponse, normalizeSelf, normalizeRaters, buildGapData } from './raterScoring.js';
import { RATER_ITEMS } from '../data/raterItems.js';

describe('scoreRaterResponse', () => {
  it('sums 1-3 answers per dimension across the 12-item bank', () => {
    const answers = RATER_ITEMS.map(() => 2); // every item answered "Sometimes"
    const scores = scoreRaterResponse(answers, RATER_ITEMS);
    expect(scores).toEqual({ F: 6, B: 6, W: 6, C: 6 });
  });

  it('reflects an uneven split', () => {
    const answers = RATER_ITEMS.map(it => (it.d === 'F' ? 3 : 1));
    const scores = scoreRaterResponse(answers, RATER_ITEMS);
    expect(scores.F).toBe(9);
    expect(scores.B).toBe(3);
  });
});

describe('normalizeSelf', () => {
  it('converts ipsative F/B/W counts (sum 15) to percentages summing to 100', () => {
    const pct = normalizeSelf({ F: 9, B: 3, W: 3 }, 6);
    expect(pct.F).toBeCloseTo(60);
    expect(pct.B).toBeCloseTo(20);
    expect(pct.W).toBeCloseTo(20);
    expect(pct.C).toBeCloseTo(50); // (6-3)/6*100, same clamp as scoring.js
  });

  it('falls back to 0 compliance pct when no compliance score exists', () => {
    const pct = normalizeSelf({ F: 5, B: 5, W: 5 }, null);
    expect(pct.C).toBe(0);
  });
});

describe('normalizeRaters', () => {
  it('averages responses, then gives F/B/W as % of the F+B+W total (same basis as normalizeSelf)', () => {
    const responses = [
      { F: 9, B: 3, W: 3, C: 3 },
      { F: 9, B: 3, W: 3, C: 3 },
      { F: 9, B: 3, W: 3, C: 3 },
    ];
    const pct = normalizeRaters(responses);
    // 9/15 = 60%, matching normalizeSelf({F:9,B:3,W:3}) exactly
    expect(pct.F).toBeCloseTo(60);
    expect(pct.B).toBeCloseTo(20);
    expect(pct.F + pct.B + pct.W).toBeCloseTo(100);
  });

  it('puts compliance on the same absolute (avg-3)/6 scale as the self side', () => {
    const pct = normalizeRaters([{ F: 6, B: 6, W: 6, C: 7 }, { F: 6, B: 6, W: 6, C: 7 }]);
    expect(pct.C).toBeCloseTo(66.67, 1);
    expect(normalizeRaters([{ F: 6, B: 6, W: 6, C: 3 }]).C).toBe(0);
  });

  it('accepts numeric strings, as Postgres avg() may arrive via JSON', () => {
    const pct = normalizeRaters([{ F: '9', B: '3', W: '3', C: '9' }]);
    expect(pct.F).toBeCloseTo(60);
    expect(pct.C).toBeCloseTo(100);
  });

  it('shows no gap when raters see the same profile shape and compliance level as the leader', () => {
    const self = normalizeSelf({ F: 9, B: 3, W: 3 }, 6);
    const raters = normalizeRaters([{ F: 9, B: 3, W: 3, C: 6 }]);
    buildGapData(self, raters).forEach(g => expect(g.gap).toBeCloseTo(0));
  });

  it('returns null when there are no responses', () => {
    expect(normalizeRaters([])).toBeNull();
  });
});

describe('buildGapData', () => {
  it('computes rater-minus-self gap per dimension, ordered F/B/W/C', () => {
    const gaps = buildGapData({ F: 60, B: 20, W: 20, C: 50 }, { F: 50, B: 16.67, W: 16.67, C: 16.67 });
    expect(gaps.map(g => g.key)).toEqual(['F', 'B', 'W', 'C']);
    expect(gaps.find(g => g.key === 'F').gap).toBeCloseTo(-10);
    expect(gaps.find(g => g.key === 'C').gap).toBeCloseTo(-33.33, 1);
  });
});
