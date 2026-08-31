// fbw-assessment/netlify/functions/account-delete.js
//
// Self-serve account erasure — closes the gap the Prompt 8 data-protection
// checklist (CLAUDE.md) explicitly flagged as missing: "no delete my data
// flow exists". A signed-in user cannot delete their own auth.users row
// with the anon key, so this mirrors account-signup.js's service-role
// pattern in reverse: verify the caller's own access token identifies a
// real user, then admin.deleteUser() exactly that id. Every dependent row
// (fbw_profiles, fbw_consents, fbw_assessments, fbw_rater_links, ...)
// cascades via `on delete cascade` (0001_init.sql, 0008_fbw_consents.sql),
// so one call erases the account and everything it owns.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kkhkxjvipamajvawxzpc.supabase.co';
const GENERIC_ERROR = 'Could not delete your account. Try again.';

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return json(401, { error: 'Not signed in.' });

  const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Resolve the token to a user server-side — never trust a client-supplied
  // id, or any caller could delete any other account by guessing a uuid.
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return json(401, { error: 'Session expired. Sign in again.' });

  const { error } = await admin.auth.admin.deleteUser(userData.user.id);
  if (error) {
    console.error('account-delete: deleteUser failed:', error.message);
    return json(500, { error: GENERIC_ERROR });
  }

  return json(200, { ok: true });
};
