import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function AuthPanel({ authState, onSignIn }) {
  const [email, setEmail] = useState('');
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
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              placeholder={t('auth.emailPlaceholder')}
              onChange={e => setEmail(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10 }}
            />
            <button
              className="btn sm"
              disabled={!email || authState.status === 'sending'}
              onClick={() => onSignIn(email)}
            >
              {authState.status === 'sending' ? t('auth.sending') : t('auth.sendLink')}
            </button>
          </div>
          {authState.status === 'sent' && (
            <p style={{ margin: '8px 0 0', fontSize: 13.5 }}>{t('auth.checkEmail')}</p>
          )}
          {authState.status === 'error' && (
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{authState.error}</p>
          )}
        </>
      )}
    </div>
  );
}
