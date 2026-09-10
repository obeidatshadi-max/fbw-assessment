import { useEffect, useState } from 'react';
import AdminScreen from './components/AdminScreen.jsx';
import { noopAuthAdapter } from './lib/authAdapter.js';
import { useLanguage } from './i18n/LanguageContext.jsx';

export default function AdminApp({ authAdapter = noopAuthAdapter }) {
  const { t } = useLanguage();
  const [authState, setAuthState] = useState({ status: 'anon' });
  const [statsState, setStatsState] = useState({ status: 'idle' });

  async function fetchStats() {
    setStatsState({ status: 'loading' });
    const result = await authAdapter.getAdminStats();
    if (result.success) {
      setStatsState({ status: 'ready', stats: result.stats });
    } else {
      setStatsState({ status: 'error', error: result.error });
    }
  }

  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChange((session) => {
      if (!session) return;
      setAuthState({ status: 'signedIn' });
      fetchStats();
    });
    return unsubscribe;
  }, [authAdapter]);

  async function handleSignIn(email, password) {
    setAuthState({ status: 'sending' });
    const result = await authAdapter.signInWithPassword({ email, password });
    if (!result.success) setAuthState({ status: 'error', error: result.error });
    // On success, the onAuthStateChange listener above transitions to 'signedIn'.
  }

  return (
    <main>
      <div className="wrap">
        {/* No shared HomeLink component exists in this repo yet (ManagerApp.jsx
            has no such link either, despite the task brief's claim) — inlined
            here using the same pattern LegalScreen.jsx already uses. */}
        <a href="/" style={{ display: 'inline-block', marginBottom: 12, fontSize: 13.5 }}>{t('legal.backLink')}</a>
        <AdminScreen
          authState={authState}
          statsState={statsState}
          onSignIn={handleSignIn}
          onRefresh={fetchStats}
        />
      </div>
    </main>
  );
}
