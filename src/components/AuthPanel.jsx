import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

function ConsentCheckboxes({ consent, onChange, t }) {
  return (
    <div style={{ margin: '4px 0 10px' }}>
      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--muted)' }}>
        {t('auth.consentNotice')} <a href="/privacy" target="_blank" rel="noopener noreferrer">{t('footer.privacyLink')}</a>
      </p>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '6px 0', fontSize: 13.5 }}>
        <input
          type="checkbox"
          checked={consent.storeResults}
          onChange={e => onChange({ ...consent, storeResults: e.target.checked })}
          style={{ marginTop: 3 }}
        />
        <span>{t('auth.consentStoreLabel')}</span>
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '6px 0', fontSize: 13.5 }}>
        <input
          type="checkbox"
          checked={consent.longitudinalTracking}
          onChange={e => onChange({ ...consent, longitudinalTracking: e.target.checked })}
          style={{ marginTop: 3 }}
        />
        <span>{t('auth.consentLongitudinalLabel')}</span>
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '6px 0', fontSize: 13.5 }}>
        <input
          type="checkbox"
          checked={consent.shareWithManager}
          onChange={e => onChange({ ...consent, shareWithManager: e.target.checked })}
          style={{ marginTop: 3 }}
        />
        <span>{t('auth.consentShareLabel')}</span>
      </label>
    </div>
  );
}

export default function AuthPanel({ authState, onSignIn, onCreateAccount, onRequestReset, onConfirmConsent, onDeleteAccount }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetStatus, setResetStatus] = useState('idle'); // idle | sending | sent | error
  const [consent, setConsent] = useState({ storeResults: false, longitudinalTracking: false, shareWithManager: false });
  const [deleteStep, setDeleteStep] = useState('idle'); // idle | confirming | deleting | error | done
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const { t, tf } = useLanguage();

  function handleForgotPassword() {
    setResetStatus('sending');
    onRequestReset(email).then(result => setResetStatus(result.success ? 'sent' : 'error'));
  }

  async function handleDeleteAccount() {
    setDeleteStep('deleting');
    const result = await onDeleteAccount();
    setDeleteStep(result.success ? 'done' : 'error');
  }

  if (authState.status === 'saved') {
    if (deleteStep === 'done') {
      return (
        <div className="note no-print" style={{ marginTop: 16 }}>
          {t('auth.deleteDone')}
        </div>
      );
    }
    return (
      <div className="note no-print" style={{ marginTop: 16 }}>
        {t('auth.savedNote')}
        {deleteStep === 'idle' && (
          <div style={{ marginTop: 10 }}>
            <button type="button" className="btn ghost sm" onClick={() => setDeleteStep('confirming')}>
              {t('auth.deleteAccountLink')}
            </button>
          </div>
        )}
        {(deleteStep === 'confirming' || deleteStep === 'deleting' || deleteStep === 'error') && (
          <div style={{ marginTop: 10 }}>
            <p style={{ margin: '0 0 8px' }}>
              <b>{t('auth.deleteHeading')}</b> {t('auth.deleteBody')}
            </p>
            <label htmlFor="delete-confirm" style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
              {t('auth.deleteConfirmLabel')}
            </label>
            <input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn sm"
                disabled={deleteConfirmText !== 'DELETE' || deleteStep === 'deleting'}
                onClick={handleDeleteAccount}
              >
                {deleteStep === 'deleting' ? t('auth.deleting') : t('auth.deleteButton')}
              </button>
              <button
                type="button"
                className="btn ghost sm"
                disabled={deleteStep === 'deleting'}
                onClick={() => { setDeleteStep('idle'); setDeleteConfirmText(''); }}
              >
                {t('auth.deleteCancel')}
              </button>
            </div>
            {deleteStep === 'error' && (
              <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>
                {tf('auth.deleteError', { email: 'obeidatshadi@gmail.com' })}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (authState.status === 'needsConsent') {
    return (
      <div className="note no-print" style={{ marginTop: 16 }}>
        <p style={{ margin: '0 0 8px' }}>
          <b>{t('auth.needsConsentHeading')}</b> {t('auth.needsConsentBody')}
        </p>
        <ConsentCheckboxes consent={consent} onChange={setConsent} t={t} />
        <button
          className="btn sm"
          disabled={!consent.storeResults}
          onClick={() => onConfirmConsent(consent)}
        >
          {t('auth.consentContinue')}
        </button>
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
          <ConsentCheckboxes consent={consent} onChange={setConsent} t={t} />
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
              disabled={!email || !password || !consent.storeResults || authState.status === 'sending'}
              onClick={() => onSignIn(email, password, consent)}
            >
              {authState.status === 'sending' ? t('auth.sending') : t('auth.signIn')}
            </button>
            <button
              className="btn sm ghost"
              disabled={!email || !password || !consent.storeResults || authState.status === 'sending'}
              onClick={() => onCreateAccount(email, password, consent)}
            >
              {authState.status === 'sending' ? t('auth.sending') : t('auth.createAccount')}
            </button>
          </div>
          {authState.status === 'error' && (
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{authState.error}</p>
          )}
          {resetStatus === 'sent' ? (
            <p style={{ margin: '8px 0 0', fontSize: 13.5 }}>{t('auth.resetSent')}</p>
          ) : (
            <button
              type="button"
              className="btn ghost sm"
              style={{ marginTop: 8 }}
              disabled={!email || resetStatus === 'sending'}
              onClick={handleForgotPassword}
            >
              {resetStatus === 'sending' ? t('auth.sending') : t('auth.forgotPassword')}
            </button>
          )}
          {resetStatus === 'error' && (
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{t('auth.resetError')}</p>
          )}
        </>
      )}
    </div>
  );
}
