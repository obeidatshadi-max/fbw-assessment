import { describe, it, expect } from 'vitest';
import { computeImbalance } from './teamScoring.js';

describe('computeImbalance', () => {
  it('flags a high Function / low Will team', () => {
    expect(computeImbalance({ F: 50, B: 32, W: 18 })).toEqual({ high: 'F', low: 'W' });
  });

  it('flags a high Will / low Being team', () => {
    expect(computeImbalance({ F: 40, B: 15, W: 45 })).toEqual({ high: 'W', low: 'B' });
  });

  it('returns null for a balanced team', () => {
    expect(computeImbalance({ F: 34, B: 33, W: 33 })).toBeNull();
  });

  it('returns null when the high dimension qualifies but the low one is not low enough', () => {
    expect(computeImbalance({ F: 45, B: 30, W: 25 })).toBeNull();
  });
});
