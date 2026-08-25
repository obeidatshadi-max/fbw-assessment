import { describe, it, expect } from 'vitest';
import { scoreIndividual, scoreOrg, rank, buildReportData } from './scoring.js';

const scenarios = [
  { s: 'a', opts: [{ t: 'f', d: 'F' }, { t: 'b', d: 'B' }, { t: 'w', d: 'W' }] },
  { s: 'b', opts: [{ t: 'f', d: 'F' }, { t: 'b', d: 'B' }, { t: 'w', d: 'W' }] },
  { s: 'c', opts: [{ t: 'f', d: 'F' }, { t: 'b', d: 'B' }, { t: 'w', d: 'W' }] },
];

describe('scoreIndividual', () => {
  it('counts most and least per dimension', () => {
    const answers = [
      { most: 0, least: 1 },
      { most: 0, least: 2 },
      { most: 1, least: 0 },
    ];
    const result = scoreIndividual(answers, scenarios);
    expect(result.most).toEqual({ F: 2, B: 1, W: 0 });
    expect(result.least).toEqual({ F: 1, B: 1, W: 1 });
  });

  it('ignores unanswered scenarios', () => {
    const answers = [{ most: null, least: null }, { most: 0, least: 1 }, { most: null, least: null }];
    const result = scoreIndividual(answers, scenarios);
    expect(result.most).toEqual({ F: 1, B: 0, W: 0 });
  });
});

describe('scoreOrg', () => {
  it('sums values per dimension', () => {
    const items = [{ t: 'x', d: 'F' }, { t: 'y', d: 'F' }, { t: 'z', d: 'B' }];
    const answers = [3, 2, 1];
    expect(scoreOrg(answers, items)).toEqual({ F: 5, B: 1, W: 0 });
  });
});

describe('rank', () => {
  it('orders by score descending', () => {
    expect(rank({ F: 5, B: 8, W: 2 })).toEqual(['B', 'F', 'W']);
  });

  it('breaks ties using fewer least picks', () => {
    const most = { F: 5, B: 5, W: 2 };
    const least = { F: 1, B: 3, W: 4 };
    expect(rank(most, least)).toEqual(['F', 'B', 'W']);
  });

  it('leaves tie order at F,B,W without a tiebreak (documents the org-ranking limitation)', () => {
    expect(rank({ F: 5, B: 5, W: 2 })).toEqual(['F', 'B', 'W']);
  });
});

const dim = {
  F: { key: 'F', label: 'Function', tag: 't', cls: 'pf', band: 'bf', color: 'var(--fn)',
       strength: ['s1', 's2', 's3', 's4'], watch: ['w1', 'w2', 'w3', 'w4'], develop: ['d1', 'd2', 'd3', 'd4'] },
  B: { key: 'B', label: 'Being', tag: 't', cls: 'pb', band: 'bb', color: 'var(--be)',
       strength: ['s1', 's2', 's3', 's4'], watch: ['w1', 'w2', 'w3', 'w4'], develop: ['d1', 'd2', 'd3', 'd4'] },
  W: { key: 'W', label: 'Will', tag: 't', cls: 'pw', band: 'bw', color: 'var(--wl)',
       strength: ['s1', 's2', 's3', 's4'], watch: ['w1', 'w2', 'w3', 'w4'], develop: ['d1', 'd2', 'd3', 'd4'] },
};

describe('buildReportData', () => {
  it('produces a dominant/backup/develop order matching individual ranking', () => {
    const answers = [
      { most: 0, least: 1 },
      { most: 0, least: 1 },
      { most: 1, least: 2 },
    ];
    const orgItems = [{ t: 'x', d: 'F' }, { t: 'y', d: 'B' }, { t: 'z', d: 'W' }];
    const orgAnswers = [3, 2, 1];

    const report = buildReportData(answers, orgAnswers, scenarios, orgItems, dim);

    expect(report.dominant).toBe('F');
    expect(report.total).toBe(3);
    expect(report.band.map(b => b.key)).toEqual(['F', 'B', 'W']);
    expect(report.profiles.full.key).toBe('F');
    expect(report.profiles.full.strength).toHaveLength(4);
    expect(report.profiles.backup.strength).toHaveLength(3);
    expect(report.profiles.backup.watch).toHaveLength(1);
    expect(report.profiles.develop.develop).toHaveLength(4);
    expect(report.orgBars).toHaveLength(3);
    expect(report.orgInsight.top).toBe(report.orgOrder[0]);
  });

  it('flags when the org pushes hardest on the growth-edge dimension', () => {
    const answers = [
      { most: 0, least: 2 },
      { most: 0, least: 2 },
      { most: 1, least: 2 },
    ]; // F=2 most, B=1 most, W=0 most -> develop = W
    const orgItems = [{ t: 'x', d: 'F' }, { t: 'y', d: 'B' }, { t: 'z', d: 'W' }];
    const orgAnswers = [1, 1, 3]; // org top = W = develop area

    const report = buildReportData(answers, orgAnswers, scenarios, orgItems, dim);
    expect(report.developArea).toBe('W');
    expect(report.summaryInsight.extra).toBeTruthy();
  });
});
