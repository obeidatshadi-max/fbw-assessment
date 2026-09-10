import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function AdminScreen({ authState, statsState, onSignIn, onRefresh }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (authState.status !== 'signedIn') {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('admin.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('admin.title')}</h1>
        <div className="card pad">
          <p style={{ margin: '0 0 8px' }}><b>{t('admin.signInHeading')}</b> {t('admin.signInBody')}</p>
          <form onSubmit={e => { e.preventDefault(); onSignIn(email, password); }}>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              placeholder={t('admin.emailPlaceholder')}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
            />
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              placeholder={t('admin.passwordPlaceholder')}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
            />
            <button type="submit" className="btn sm" disabled={!email || !password || authState.status === 'sending'}>
              {authState.status === 'sending' ? t('admin.sending') : t('admin.signIn')}
            </button>
          </form>
          {authState.status === 'error' && <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{authState.error || t('admin.signInError')}</p>}
        </div>
      </section>
    );
  }

  if (statsState.status === 'loading' || statsState.status === 'idle') {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('admin.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('admin.title')}</h1>
        <p>{t('admin.loading')}</p>
      </section>
    );
  }

  if (statsState.status === 'error') {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('admin.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('admin.title')}</h1>
        <p>{t('admin.unauthorized')}</p>
      </section>
    );
  }

  const s = statsState.stats;
  const tiles = [
    [t('admin.totalLeaders'), s.totalLeaders],
    [t('admin.totalAssessments'), s.totalAssessments],
    [t('admin.assessments7d'), s.assessments7d],
    [t('admin.assessments30d'), s.assessments30d],
  ];
  const usage = [
    [t('admin.totalTeams'), s.totalTeams],
    [t('admin.totalSessions'), s.totalSessions],
    [t('admin.totalRaterLinks'), s.totalRaterLinks],
    [t('admin.totalRaterResponses'), s.totalRaterResponses],
  ];

  return (
    <section className="screen active">
      <div className="eyebrow">{t('admin.eyebrow')}</div>
      <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 18 }}>{t('admin.title')}</h1>

      <div className="card pad" style={{ marginBottom: 18 }}>
        {tiles.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <span>{label}</span><span style={{ fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>

      <div className="sec-title">{t('admin.roleBreakdownTitle')}</div>
      <div className="card pad" style={{ marginBottom: 18 }}>
        {Object.entries(s.roleBreakdown || {}).map(([role, n]) => (
          <div key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <span>{role}</span><span>{n}</span>
          </div>
        ))}
      </div>

      <div className="sec-title">{t('admin.usageTitle')}</div>
      <div className="card pad" style={{ marginBottom: 18 }}>
        {usage.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <span>{label}</span><span>{value}</span>
          </div>
        ))}
      </div>

      <div className="sec-title">{t('admin.dailyTitle')}</div>
      <div className="card pad" style={{ marginBottom: 18 }}>
        {(s.dailyCompletions || []).map(row => (
          <div key={row.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <span>{row.day}</span><span>{row.count}</span>
          </div>
        ))}
      </div>

      <button className="btn ghost sm" onClick={onRefresh}>{t('admin.refresh')}</button>
    </section>
  );
}
