// Auth failures come back from Supabase and our Netlify functions as raw
// English strings ("Invalid login credentials", ...). Showing those in the
// Arabic UI is jarring, so the common ones are swapped for the already-
// translated `fallback` text. Anything unrecognised (e.g. the signup
// function's specific "Password must be 8-128 characters.") is passed through
// unchanged so the user still gets the detail.
const GENERIC_PATTERN = /invalid login credentials|email not confirmed|not configured|could not (create|reach|sign)/i;

export function localizeAuthError(error, fallback) {
  if (!error) return fallback;
  return GENERIC_PATTERN.test(error) ? fallback : error;
}
