import { describe, it, expect } from 'vitest';
import { archetypeCode, HIGH_THRESHOLD } from './archetype.js';
import { ARCHETYPES } from '../data/archetypes.js';

describe('archetypeCode', () => {
  it('returns null when there are no rater scores yet', () => {
    expect(archetypeCode(null)).toBeNull();
  });

  it('marks a dimension High at the threshold and Low just below it, in F-B-W order', () => {
    expect(archetypeCode({ F: HIGH_THRESHOLD, B: HIGH_THRESHOLD - 0.01, W: 9, C: 3 })).toBe('HLH');
  });

  it('reaches both extremes, which the ipsative self-score cannot', () => {
    expect(archetypeCode({ F: 9, B: 9, W: 9 })).toBe('HHH');
    expect(archetypeCode({ F: 3, B: 3, W: 3 })).toBe('LLL');
  });

  it('accepts numeric strings, as Postgres avg() may arrive via JSON', () => {
    expect(archetypeCode({ F: '7.33', B: '5', W: '8' })).toBe('HLH');
  });

  it('every possible code maps to a slide-35 archetype with complete en/ar copy', () => {
    const codes = [];
    for (const f of 'HL') for (const b of 'HL') for (const w of 'HL') codes.push(f + b + w);
    expect(Object.keys(ARCHETYPES).sort()).toEqual(codes.sort());
    codes.forEach(c => {
      ['name', 'strength', 'shadow', 'develop'].forEach(field => {
        expect(ARCHETYPES[c][field].en, `${c}.${field}.en`).toBeTruthy();
        expect(ARCHETYPES[c][field].ar, `${c}.${field}.ar`).toBeTruthy();
      });
    });
  });
});
