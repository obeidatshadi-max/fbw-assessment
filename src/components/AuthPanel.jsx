import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function AuthPanel({ authState, onSignIn, onCreateAccount }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t } = useLanguage();

  if (authState.status === 'saved') {
    return (
      <div className="note no-print" style={{ marginTop: 16 }}>
        {t('auth.savedNote')}
      </div>
    );
  }

  return (
    <div className="note no-print" style={{ marginTop: 16 }}>
      {authState.status === 'signedIn' ? (
        <p style={{ margin: 0 }}>{t('auth.savingNote')}</p>
      ) : (
        <>
          <p style={{ margin: '0 0 8px' }}>
            <b>{t('auth.askHeading')}</b> {t('auth.askBody')}
          </p>
          <input
            type="email"
            value={email}
            placeholder={t('auth.emailPlaceholder')}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
          />
          <input
            type="password"
            value={password}
            placeholder={t('auth.passwordPlaceholder')}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn sm"
              disabled={!email || !password || authState.status === 'sending'}
              onClick={() => onSignIn(email, password)}
            >
              {authState.status === 'sending' ? t('auth.sending') : t('auth.signIn')}
            </button>
            <button
              className="btn sm ghost"
              disabled={!email || !password || authState.status === 'sending'}
              onClick={() => onCreateAccount(email, password)}
            >
              {authState.status === 'sending' ? t('auth.sending') : t('auth.createAccount')}
            </button>
          </div>
          {authState.status === 'error' && (
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{authState.error}</p>
          )}
        </>
      )}
    </div>
  );
}
