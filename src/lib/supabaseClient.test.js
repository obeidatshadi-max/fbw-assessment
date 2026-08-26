import { describe, it, expect } from 'vitest';
import { hasSupabaseConfig } from './supabaseClient.js';

describe('hasSupabaseConfig', () => {
  it('is false when either value is missing', () => {
    expect(hasSupabaseConfig(undefined, 'key')).toBe(false);
    expect(hasSupabaseConfig('url', undefined)).toBe(false);
    expect(hasSupabaseConfig('', '')).toBe(false);
  });

  it('is true when both values are present', () => {
    expect(hasSupabaseConfig('https://x.supabase.co', 'anon-key')).toBe(true);
  });
});
