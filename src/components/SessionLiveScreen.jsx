import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { DISCUSSION_CARDS, getDiscussionCardKey } from '../data/discussionCards.js';

const MIN_RESPONSES = 3;

export default function SessionLiveScreen({ session, summary, imbalance, dim, createStatus, createError, ended, onCreateSession, onRefresh, onEndSession, onPrintCards, onStartNewSession }) {
  const { t, tf, L } = useLanguage();
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);

  function copyCode(code) {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!session) {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('session.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('session.title')}</h1>
        <p className="lead" style={{ marginBottom: 18 }}>{t('session.lead')}</p>
        <div className="card pad">
          <label htmlFor="session-name"><b>{t('session.createNameLabel')}</b></label>
          <input
            id="session-name"
            value={name}
            placeholder={t('session.createNamePlaceholder')}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, margin: '8px 0 14px' }}
          />
          {createError && <p style={{ color: '#b3261e', fontSize: 13.5, margin: '0 0 10px' }}>{createError}</p>}
          <button className="btn" disabled={!name || createStatus === 'creating'} onClick={() => onCreateSession(name)}>
            {createStatus === 'creating' ? t('team.sending') : t('session.createButton')}
          </button>
        </div>
      </section>
    );
  }

  const gapData = summary?.distribution
    ? ['F', 'B', 'W', 'C'].map(key => ({ key, pct: summary.distribution[key] }))
    : null;

  const cards = DISCUSSION_CARDS[getDiscussionCardKey(imbalance)];

  return (
    <section className="screen active" id="screen-session-live">
      <div className="no-print">
        <div className="eyebrow">{t('session.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(28px,7vw,40px)', marginBottom: 6 }}>{session.name}</h1>

        <div className="card pad" style={{ marginBottom: 18 }}>
          <p style={{ margin: '0 0 8px' }}>{t('session.joinCodeHeading')}</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              readOnly
              value={session.joinCode}
              style={{ flex: 1, padding: '14px 16px', border: '1.5px solid var(--line)', borderRadius: 10, fontWeight: 700, fontSize: 'clamp(20px,5vw,32px)', letterSpacing: '0.1em' }}
              onFocus={e => e.target.select()}
            />
            <button className="btn sm" onClick={() => copyCode(session.joinCode)}>{copied ? t('team.copied') : t('team.copyCode')}</button>
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 10px' }}>{t('session.joinCodeShareNote')}</p>
          {ended ? (
            <>
              <p style={{ fontSize: 13.5, fontWeight: 600 }}>{t('session.endedNote')}</p>
              <button className="btn sm" onClick={onStartNewSession}>{t('session.startNew')}</button>
            </>
          ) : (
            <>
              {!gapData && (
                <p style={{ fontSize: 13.5 }}>{tf('session.countWaiting', { count: summary?.count || 0, min: MIN_RESPONSES })}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn ghost sm" onClick={onRefresh}>{t('team.refresh')}</button>
                <button className="btn ghost sm" onClick={onEndSession}>{t('session.endSession')}</button>
              </div>
            </>
          )}
        </div>

        {gapData && (
          <>
            <div className="sec-title">{t('session.dashboardTitle')}</div>
            <div className="card pad" style={{ marginBottom: 18 }}>
              {gapData.map(g => {
                const label = g.key === 'C' ? t('report.complianceLineLabel') : L(dim[g.key].label);
                const color = g.key === 'C' ? dim.W.color : dim[g.key].color;
                return (
                  <div className="orgbar" key={g.key}>
                    <div className="top">
                      <span style={{ color, fontWeight: 600, fontSize: 'clamp(16px,3vw,22px)' }}>{label}</span>
                      <span className="lvl" style={{ fontSize: 'clamp(16px,3vw,22px)' }}>{Math.round(g.pct)}%</span>
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

            <div style={{ marginBottom: 12 }}>
              <button className="btn sm" onClick={onPrintCards}>{t('session.printCards')}</button>
            </div>
          </>
        )}
      </div>

      {gapData && (
        <>
          <div className="sec-title">{t('session.cardsHeading')}</div>
          <div className="card pad">
            <ul className="clean">
              {cards.map((card, i) => <li key={i} style={{ marginBottom: 10, fontSize: 15 }}>{L(card)}</li>)}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
