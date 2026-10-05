// Auth failures come back from Supabase and our Netlify functions as raw
// English strings ("Invalid login credentials", ...). Showing those in the
// Arabic UI is jarring, so the common ones are swapped for translated text.
// Anything unrecognised (e.g. the signup function's specific "Password must
// be 8-128 characters.") is passed through unchanged so the user still gets
// the detail.
const GENERIC_PATTERN = /invalid login credentials|email not confirmed|not configured|could not (create|reach|sign)/i;
const RATE_LIMIT_PATTERN = /too many/i;

// `fallback` is the translated "check your email and password" message;
// `rateLimited` is the translated "too many attempts" message (optional).
export function localizeAuthError(error, fallback, rateLimited) {
  if (!error) return fallback;
  if (rateLimited && RATE_LIMIT_PATTERN.test(error)) return rateLimited;
  return GENERIC_PATTERN.test(error) ? fallback : error;
}
