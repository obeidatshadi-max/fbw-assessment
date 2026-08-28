import { describe, it, expect } from 'vitest';
import { DISCUSSION_CARDS, getDiscussionCardKey } from './discussionCards.js';

describe('getDiscussionCardKey', () => {
  it('builds a "high-low" key from an imbalance flag', () => {
    expect(getDiscussionCardKey({ high: 'F', low: 'W' })).toBe('F-W');
    expect(getDiscussionCardKey({ high: 'W', low: 'B' })).toBe('W-B');
  });

  it('returns "balanced" when there is no imbalance', () => {
    expect(getDiscussionCardKey(null)).toBe('balanced');
  });
});

describe('DISCUSSION_CARDS', () => {
  const ALL_KEYS = ['F-W', 'F-B', 'B-F', 'B-W', 'W-F', 'W-B', 'balanced'];

  it('has all 6 imbalance keys plus balanced, each with 4 cards in en and ar', () => {
    expect(Object.keys(DISCUSSION_CARDS).sort()).toEqual(ALL_KEYS.sort());
    ALL_KEYS.forEach(key => {
      expect(DISCUSSION_CARDS[key]).toHaveLength(4);
      DISCUSSION_CARDS[key].forEach(card => {
        expect(card.en).toBeTruthy();
        expect(card.ar).toBeTruthy();
      });
    });
  });
});
