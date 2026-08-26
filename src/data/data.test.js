import { describe, it, expect } from 'vitest';
import { SCENARIOS } from './scenarios.js';
import { ORG_ITEMS } from './orgItems.js';
import { COMPLIANCE_ITEMS } from './complianceItems.js';
import { DEV_PLAN } from './devPlan.js';
import { MANAGER_DEBRIEF_QUESTIONS } from './managerDebrief.js';
import { DIM } from './dimensions.js';

describe('SCENARIOS', () => {
  it('has 15 scenarios, each with exactly one F, one B, one W option', () => {
    expect(SCENARIOS).toHaveLength(15);
    SCENARIOS.forEach(sc => {
      expect(sc.opts).toHaveLength(3);
      const dims = sc.opts.map(o => o.d).sort();
      expect(dims).toEqual(['B', 'F', 'W']);
    });
  });
});

describe('ORG_ITEMS', () => {
  it('has 9 items, 3 per dimension', () => {
    expect(ORG_ITEMS).toHaveLength(9);
    const counts = { F: 0, B: 0, W: 0 };
    ORG_ITEMS.forEach(it => counts[it.d]++);
    expect(counts).toEqual({ F: 3, B: 3, W: 3 });
  });
});

describe('COMPLIANCE_ITEMS', () => {
  it('has 3 items, one per named compliance-courage behavior', () => {
    expect(COMPLIANCE_ITEMS).toHaveLength(3);
  });
});

describe('DEV_PLAN', () => {
  it('has F, B, W each with 2 concrete actions per 30/60/90 phase', () => {
    ['F', 'B', 'W'].forEach(k => {
      const plan = DEV_PLAN[k];
      ['day30', 'day60', 'day90'].forEach(phase => {
        expect(plan[phase]).toHaveLength(2);
      });
    });
  });
});

describe('MANAGER_DEBRIEF_QUESTIONS', () => {
  it('has 5-6 questions, most grounded in the person\'s dominant/growth-edge dimension', () => {
    expect(MANAGER_DEBRIEF_QUESTIONS.length).toBeGreaterThanOrEqual(5);
    expect(MANAGER_DEBRIEF_QUESTIONS.length).toBeLessThanOrEqual(6);
    const withPlaceholder = MANAGER_DEBRIEF_QUESTIONS.filter(q => /\{dominant\}|\{developArea\}/.test(q.en));
    expect(withPlaceholder.length).toBeGreaterThanOrEqual(4);
  });
});

describe('DIM', () => {
  it('has F, B, W with complete content', () => {
    ['F', 'B', 'W'].forEach(k => {
      const d = DIM[k];
      expect(d.key).toBe(k);
      expect(d.label).toBeTruthy();
      expect(d.strength).toHaveLength(4);
      expect(d.watch).toHaveLength(4);
      expect(d.develop).toHaveLength(4);
    });
  });
});
