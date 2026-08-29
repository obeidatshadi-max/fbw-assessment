import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const MIN_RESPONSES = 3;

export default function ManagerScreen({ authState, team, teams = [], summary, imbalance, dim, createStatus, createError, onSignIn, onCreateAccount, onCreateTeam, onRefresh, onSwitchTeam }) {
  const { t, tf, L } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [copied, setCopied] = useState(false);

  function copyCode(code) {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (authState.status !== 'signedIn') {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('team.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('team.title')}</h1>
        <p className="lead" style={{ marginBottom: 18 }}>{t('team.lead')}</p>
        <div className="card pad">
          <p style={{ margin: '0 0 8px' }}><b>{t('team.signInHeading')}</b> {t('team.signInBody')}</p>
          <input
            type="email"
            value={email}
            placeholder={t('team.emailPlaceholder')}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
          />
          <input
            type="password"
            value={password}
            placeholder={t('team.passwordPlaceholder')}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn sm" disabled={!email || !password || authState.status === 'sending'} onClick={() => onSignIn(email, password)}>
              {authState.status === 'sending' ? t('team.sending') : t('team.signIn')}
            </button>
            <button className="btn sm ghost" disabled={!email || !password || authState.status === 'sending'} onClick={() => onCreateAccount(email, password)}>
              {authState.status === 'sending' ? t('team.sending') : t('team.createAccount')}
            </button>
          </div>
          {authState.status === 'error' && <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{authState.error || t('team.sendError')}</p>}
        </div>
      </section>
    );
  }

  if (!team) {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('team.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 18 }}>{t('team.createHeading')}</h1>
        <div className="card pad">
          <label htmlFor="team-name"><b>{t('team.createNameLabel')}</b></label>
          <input
            id="team-name"
            value={teamName}
            placeholder={t('team.createNamePlaceholder')}
            onChange={e => setTeamName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, margin: '8px 0 14px' }}
          />
          {createError && <p style={{ color: '#b3261e', fontSize: 13.5, margin: '0 0 10px' }}>{createError}</p>}
          <button className="btn" disabled={!teamName || createStatus === 'creating'} onClick={() => onCreateTeam(teamName)}>
            {createStatus === 'creating' ? t('team.sending') : t('team.createButton')}
          </button>
        </div>
      </section>
    );
  }

  const gapData = summary?.distribution
    ? ['F', 'B', 'W', 'C'].map(key => ({ key, pct: summary.distribution[key] }))
    : null;

  return (
    <section className="screen active">
      <div className="eyebrow">{t('team.eyebrow')}</div>
      <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{team.name}</h1>
      {teams.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="team-switch" style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{t('team.switchTeam')}</label>
          <select
            id="team-switch"
            value={team.id}
            onChange={e => onSwitchTeam(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
          >
            {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
          </select>
        </div>
      )}
      <div className="card pad" style={{ marginBottom: 18 }}>
        <p style={{ margin: '0 0 8px' }}>{t('team.joinCodeHeading')}</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            readOnly
            value={team.joinCode}
            style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, fontWeight: 700, letterSpacing: '0.08em' }}
            onFocus={e => e.target.select()}
          />
          <button className="btn sm" onClick={() => copyCode(team.joinCode)}>{copied ? t('team.copied') : t('team.copyCode')}</button>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 10px' }}>{t('team.joinCodeShareNote')}</p>
        {!gapData && (
          <p style={{ fontSize: 13.5 }}>{tf('team.countWaiting', { count: summary?.count || 0, min: MIN_RESPONSES })}</p>
        )}
        <button className="btn ghost sm" onClick={onRefresh}>{t('team.refresh')}</button>
      </div>

      {gapData && (
        <>
          <div className="sec-title">{t('team.dashboardTitle')}</div>
          <div className="card pad" style={{ marginBottom: 18 }}>
            {gapData.map(g => {
              const label = g.key === 'C' ? t('report.complianceLineLabel') : L(dim[g.key].label);
              const color = g.key === 'C' ? dim.W.color : dim[g.key].color;
              return (
                <div className="orgbar" key={g.key}>
                  <div className="top">
                    <span style={{ color, fontWeight: 600 }}>{label}</span>
                    <span className="lvl">{Math.round(g.pct)}%</span>
                  </div>
                  <div className="track"><div className="fill" style={{ width: `${g.pct}%`, background: color }} /></div>
                </div>
              );
            })}
          </div>

          <div className="sec-title">{t('team.roleBreakdownTitle')}</div>
          <div className="card pad" style={{ marginBottom: 18 }}>
            {Object.entries(summary.roleBreakdown || {}).map(([role, n]) => (
              <div key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                <span>{role}</span><span>{n}</span>
              </div>
            ))}
          </div>

          <div className="note">
            <b>{t('team.imbalanceHeading')}</b>
            <p style={{ margin: '6px 0 0' }}>
              {imbalance
                ? tf('team.imbalanceNote', {
                    high: L(dim[imbalance.high].label),
                    highPct: Math.round(summary.distribution[imbalance.high]),
                    low: L(dim[imbalance.low].label),
                    lowPct: Math.round(summary.distribution[imbalance.low]),
                  })
                : t('team.noFlag')}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
