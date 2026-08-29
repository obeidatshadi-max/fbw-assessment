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
// limiter), so it is a public, unauthenticated "create an account"
// endpoint with no rate limit. Accepted tradeoff for signup friction, same
// as the sibling apps' version of this endpoint.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kkhkxjvipamajvawxzpc.supabase.co';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = 'Could not create account. Check your details, or sign in if you already have one.';

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

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
