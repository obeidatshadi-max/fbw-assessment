// Tests for the abuse guards on netlify/functions/account-signup.js (open
// signup endpoint): same-origin check and the per-IP rate limiter.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@netlify/blobs', () => ({ getStore: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));

import { getStore } from '@netlify/blobs';
import { createClient } from '@supabase/supabase-js';
import { handler, isSameOrigin, checkRateLimit } from '../netlify/functions/account-signup.js';

function memoryStore() {
  const data = new Map();
  return {
    data,
    get: vi.fn(async (k) => data.get(k) ?? null),
    set: vi.fn(async (k, v) => { data.set(k, v); }),
  };
}

const goodHeaders = { origin: 'https://fbw-assessment.netlify.app', host: 'fbw-assessment.netlify.app', 'x-nf-client-connection-ip': '1.2.3.4' };
const post = (body = { email: 'a@b.com', password: 'secret123' }, headers = goodHeaders) =>
  ({ httpMethod: 'POST', headers, body: JSON.stringify(body) });

describe('isSameOrigin', () => {
  it('accepts an Origin whose host matches the request host', () => {
    expect(isSameOrigin({ origin: 'https://fbw-assessment.netlify.app', host: 'fbw-assessment.netlify.app' })).toBe(true);
    expect(isSameOrigin({ Origin: 'http://localhost:8888', Host: 'localhost:8888' })).toBe(true);
  });
  it('rejects other origins, missing headers and garbage', () => {
    expect(isSameOrigin({ origin: 'https://evil.example', host: 'fbw-assessment.netlify.app' })).toBe(false);
    expect(isSameOrigin({ host: 'fbw-assessment.netlify.app' })).toBe(false);
    expect(isSameOrigin({ origin: 'https://fbw-assessment.netlify.app' })).toBe(false);
    expect(isSameOrigin({ origin: 'not a url', host: 'x' })).toBe(false);
    expect(isSameOrigin(undefined)).toBe(false);
  });
});

describe('checkRateLimit', () => {
  const now = new Date('2026-10-05T10:00:00Z');

  it('allows up to 5 requests an hour from one address, then blocks', async () => {
    const store = memoryStore();
    for (let i = 0; i < 5; i++) expect((await checkRateLimit('9.9.9.9', store, now)).ok).toBe(true);
    const sixth = await checkRateLimit('9.9.9.9', store, now);
    expect(sixth.ok).toBe(false);
    expect(sixth.retryAfter).toBe(3600);
  });

  it('counts each address separately', async () => {
    const store = memoryStore();
    for (let i = 0; i < 5; i++) await checkRateLimit('9.9.9.9', store, now);
    expect((await checkRateLimit('8.8.8.8', store, now)).ok).toBe(true);
  });

  it('resets in the next hour but still enforces the daily cap', async () => {
    const store = memoryStore();
    let blockedAt = null;
    for (let h = 0; h < 6 && blockedAt === null; h++) {
      const t = new Date(now.getTime() + h * 3600000);
      for (let i = 0; i < 5; i++) {
        const r = await checkRateLimit('7.7.7.7', store, t);
        if (!r.ok) { blockedAt = r; break; }
      }
    }
    // 4 full hours = 20 requests; the 21st in the same day hits the daily cap.
    expect(blockedAt).not.toBeNull();
    expect(blockedAt.retryAfter).toBe(86400);
  });

  it('does not limit when the client address is unknown, to avoid locking everyone out', async () => {
    const store = memoryStore();
    for (let i = 0; i < 30; i++) expect((await checkRateLimit('unknown', store, now)).ok).toBe(true);
    expect(store.set).not.toHaveBeenCalled();
  });

  it('fails open when storage errors', async () => {
    const store = { get: vi.fn().mockRejectedValue(new Error('blobs down')), set: vi.fn() };
    expect((await checkRateLimit('9.9.9.9', store, now)).ok).toBe(true);
  });
});

describe('account-signup handler', () => {
  let createUser;
  beforeEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    createUser = vi.fn().mockResolvedValue({ error: null });
    createClient.mockReturnValue({ auth: { admin: { createUser } } });
    getStore.mockReturnValue(memoryStore());
  });

  it('rejects non-POST', async () => {
    expect((await handler({ httpMethod: 'GET', headers: goodHeaders })).statusCode).toBe(405);
  });

  it('rejects a request from another origin before touching Supabase', async () => {
    const res = await handler(post(undefined, { ...goodHeaders, origin: 'https://evil.example' }));
    expect(res.statusCode).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('creates the account for a same-origin request', async () => {
    const res = await handler(post());
    expect(res.statusCode).toBe(200);
    expect(createUser).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret123', email_confirm: true });
  });

  it('returns 429 with Retry-After once an address exceeds the limit, without creating accounts', async () => {
    for (let i = 0; i < 5; i++) await handler(post());
    createUser.mockClear();
    const res = await handler(post());
    expect(res.statusCode).toBe(429);
    expect(res.headers['Retry-After']).toBe('3600');
    expect(JSON.parse(res.body).error).toMatch(/too many/i);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('still allows signup when Blobs is unavailable', async () => {
    getStore.mockImplementation(() => { throw new Error('no blobs'); });
    expect((await handler(post())).statusCode).toBe(200);
  });
});
