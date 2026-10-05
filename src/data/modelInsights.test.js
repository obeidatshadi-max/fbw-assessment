import { describe, it, expect } from 'vitest';
import {
  PAIRING, CRISIS, FEEDBACK_RISK, CHANGE_RISK, ACTIVATION, DIAGNOSTIC_QUESTIONS,
} from './modelInsights.js';

function texts(node) {
  if (node && typeof node.en === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  return Object.values(node).flatMap(texts);
}

describe('modelInsights', () => {
  const banks = { PAIRING, CRISIS, FEEDBACK_RISK, CHANGE_RISK, ACTIVATION, DIAGNOSTIC_QUESTIONS };

  Object.entries(banks).forEach(([name, bank]) => {
    it(`${name} covers every dimension with en and ar copy`, () => {
      expect(Object.keys(bank).sort()).toEqual(['B', 'F', 'W']);
      texts(bank).forEach(x => {
        expect(x.en).toBeTruthy();
        expect(x.ar).toBeTruthy();
      });
    });
  });

  it('has two activation lines and three diagnostic questions per dimension', () => {
    ['F', 'B', 'W'].forEach(k => {
      expect(ACTIVATION[k]).toHaveLength(2);
      expect(DIAGNOSTIC_QUESTIONS[k]).toHaveLength(3);
    });
  });
});
