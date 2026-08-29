import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function ResetPasswordScreen({ status, error, onSubmit }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState(null);

  if (status === 'checking') {
    return (
      <section className="screen active">
        <p>{t('resetPassword.checking')}</p>
      </section>
    );
  }

  if (status === 'invalid') {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('resetPassword.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('resetPassword.invalidHeading')}</h1>
        <p className="lead">{t('resetPassword.invalidBody')}</p>
      </section>
    );
  }

  if (status === 'done') {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('resetPassword.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('resetPassword.doneHeading')}</h1>
        <p className="lead">{t('resetPassword.doneBody')}</p>
      </section>
    );
  }

  function handleSubmit() {
    if (password.length < 8) {
      setLocalError(t('resetPassword.tooShort'));
      return;
    }
    if (password !== confirm) {
      setLocalError(t('resetPassword.mismatch'));
      return;
    }
    setLocalError(null);
    onSubmit(password);
  }

  return (
    <section className="screen active">
      <div className="eyebrow">{t('resetPassword.eyebrow')}</div>
      <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('resetPassword.heading')}</h1>
      <div className="card pad">
        <input
          type="password"
          value={password}
          placeholder={t('resetPassword.newPasswordPlaceholder')}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
        />
        <input
          type="password"
          value={confirm}
          placeholder={t('resetPassword.confirmPlaceholder')}
          onChange={e => setConfirm(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
        />
        {(localError || error) && (
          <p style={{ color: '#b3261e', fontSize: 13.5, margin: '0 0 10px' }}>{localError || error}</p>
        )}
        <button className="btn" disabled={!password || !confirm || status === 'saving'} onClick={handleSubmit}>
          {status === 'saving' ? t('resetPassword.saving') : t('resetPassword.submit')}
        </button>
      </div>
    </section>
  );
}
