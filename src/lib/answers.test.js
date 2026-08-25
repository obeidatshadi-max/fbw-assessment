import { describe, it, expect } from 'vitest';
import { applyChoice } from './answers.js';

describe('applyChoice', () => {
  it('sets most and clears least if it pointed at the same option', () => {
    const result = applyChoice({ most: null, least: 1 }, 'most', 1);
    expect(result).toEqual({ most: 1, least: null });
  });

  it('sets least and clears most if it pointed at the same option', () => {
    const result = applyChoice({ most: 0, least: null }, 'least', 0);
    expect(result).toEqual({ most: null, least: 0 });
  });

  it('toggles off when clicking the same chip again', () => {
    const result = applyChoice({ most: 2, least: null }, 'most', 2);
    expect(result).toEqual({ most: null, least: null });
  });

  it('leaves the other field untouched when unrelated', () => {
    const result = applyChoice({ most: 0, least: 1 }, 'most', 0);
    expect(result).toEqual({ most: null, least: 1 });
  });
});
