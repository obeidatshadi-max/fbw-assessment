// fbw-assessment/netlify/functions/account-signup.js
//
// Creates an already-confirmed account server-side for anyone who needs to
// authenticate in this app — a leader saving their own self-assessment and
// generating a 360 feedback link, or a facilitator running a team/live
// session. Unlike the client auth.signUp() flow, admin.createUser({
// email_confirm: true }) sends NO confirmation email, so this never
// touches Supabase's built-in email quota or SMTP at all. The client
// signs in with the password right after this returns ok. Mirrors
// sps-style/team's and styleshift-app's manager-signup function against
// the same shared Supabase project (kkhkxjvipamajvawxzpc) — see CLAUDE.md.
//
// Open signup, same as those siblings — no invite code. This deliberately
// bypasses Supabase's own signup protections (email confirmation, its rate
// limiter), so two guards of our own stand in for them:
//   1. same-origin check — the browser's Origin header must match this
//      site's own host, which stops casual cross-site abuse (it does not stop
//      a determined script that forges headers; the limiter below does that
//      job).
//   2. per-IP rate limit in Netlify Blobs — HOURLY_LIMIT / DAILY_LIMIT
//      requests per address. Soft: read-modify-write is not atomic, and it
//      FAILS OPEN on any storage error so a Blobs outage never blocks signup.
import { createClient } from '@supabase/supabase-js';
import { getStore } from '@netlify/blobs';

const SUPABASE_URL = 'https://kkhkxjvipamajvawxzpc.supabase.co';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOURLY_LIMIT = 5;
const DAILY_LIMIT = 20;
const GENERIC_ERROR = 'Could not create account. Check your details, or sign in if you already have one.';

function json(statusCode, body, extraHeaders = {}) {
  return { statusCode, headers: { 'Content-Type': 'application/json', ...extraHeaders }, body: JSON.stringify(body) };
}

// A browser POST always carries Origin; require it to be this very site.
export function isSameOrigin(headers = {}) {
  const origin = headers.origin || headers.Origin;
  const host = headers.host || headers.Host;
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Returns { ok: true } or { ok: false, retryAfter } (seconds). `store` is
// injectable so the limiter can be tested without Netlify Blobs.
export async function checkRateLimit(ip, store, now = new Date()) {
  // Without a client address every caller would share one bucket and a few
  // requests would lock everyone out, so only limit when the IP is known.
  if (!ip || ip === 'unknown') return { ok: true };
  const hourKey = `h:${ip}:${Math.floor(now.getTime() / 3600000)}`;
  const dayKey = `d:${ip}:${now.toISOString().slice(0, 10)}`;
  try {
    const [hRaw, dRaw] = await Promise.all([store.get(hourKey), store.get(dayKey)]);
    const h = Number(hRaw) || 0;
    const d = Number(dRaw) || 0;
    if (h >= HOURLY_LIMIT) return { ok: false, retryAfter: 3600 };
    if (d >= DAILY_LIMIT) return { ok: false, retryAfter: 86400 };
    await Promise.all([store.set(hourKey, String(h + 1)), store.set(dayKey, String(d + 1))]);
    return { ok: true };
  } catch {
    return { ok: true }; // fail open
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const headers = event.headers || {};
  if (!isSameOrigin(headers)) return json(403, { error: 'Forbidden' });

  let store = null;
  try {
    store = getStore({ name: 'rl-fbw-signup', consistency: 'strong' });
  } catch {
    // Blobs not available (e.g. local dev) — skip limiting rather than block signup.
  }
  if (store) {
    const ip = headers['x-nf-client-connection-ip'] || headers['x-forwarded-for'] || 'unknown';
    const limit = await checkRateLimit(String(ip).split(',')[0].trim(), store);
    if (!limit.ok) {
      return json(429, { error: 'Too many attempts. Try again later.' }, { 'Retry-After': String(limit.retryAfter) });
    }
  }

  let email, password;
  try {
    ({ email, password } = JSON.parse(event.body || '{}'));
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  email = typeof email === 'string' ? email.trim() : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json(400, { error: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return json(400, { error: 'Password must be 8-128 characters.' });
  }

  const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });

  if (error) {
    // Never surface Supabase's raw error text (implementation details, and
    // for an already-registered email it differs from the new-account path,
    // which would let a caller enumerate existing facilitator emails).
    console.error('account-signup: createUser failed:', error.message);
    return json(400, { error: GENERIC_ERROR });
  }

  return json(200, { ok: true });
};
