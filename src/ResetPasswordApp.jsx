import { useEffect, useState } from 'react';
import ResetPasswordScreen from './components/ResetPasswordScreen.jsx';
import { noopAuthAdapter } from './lib/authAdapter.js';

// supabase-js parses the recovery token out of the URL fragment and
// establishes a session automatically (detectSessionInUrl, on by default).
// That parsing happens asynchronously, so we can't just call getSession()
// once on mount — we wait for either an existing session or the next
// auth-state change, with a timeout so a broken/expired link doesn't hang
// on "checking" forever.
const SESSION_WAIT_MS = 4000;

export default function ResetPasswordApp({ authAdapter = noopAuthAdapter }) {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    let settled = false;
    const unsubscribe = authAdapter.onAuthStateChange((session) => {
      if (settled) return;
      if (session) {
        settled = true;
        setStatus('form');
      }
    });

    authAdapter.getSession().then((session) => {
      if (settled) return;
      if (session) {
        settled = true;
        setStatus('form');
      }
    });

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      setStatus('invalid');
    }, SESSION_WAIT_MS);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [authAdapter]);

  async function handleSubmit(password) {
    setStatus('saving');
    setError(null);
    const result = await authAdapter.updatePassword({ password });
    if (result.success) {
      setStatus('done');
    } else {
      setStatus('form');
      setError(result.error);
    }
  }

  return (
    <main>
      <div className="wrap">
        <ResetPasswordScreen status={status} error={error} onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
