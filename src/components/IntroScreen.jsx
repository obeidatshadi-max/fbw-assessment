import { useState, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { DIM } from '../data/dimensions.js';
import { ROLES, DEFAULT_ROLE } from '../data/roles.js';
import { isDraftRole } from '../data/scenarioSets.js';
import { noopAuthAdapter } from '../lib/authAdapter.js';

export default function IntroScreen({ onStart, authAdapter = noopAuthAdapter }) {
  const { t, tf, L } = useLanguage();
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [joinCode, setJoinCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [codeStatus, setCodeStatus] = useState('idle'); // idle | checking | valid | invalid
  const [codeResult, setCodeResult] = useState(null); // { kind, id } | null
  const latestCodeRef = useRef('');

  async function handleCodeChange(e) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    latestCodeRef.current = value;
    setJoinCode(value);
    setCodeResult(null);
    if (value.length < 6) {
      setCodeStatus('idle');
      return;
    }
    setCodeStatus('checking');
    const result = await authAdapter.validateCode({ code: value });
    if (latestCodeRef.current !== value) return; // a newer code was entered — discard this stale response
    if (result.valid) {
      setCodeStatus('valid');
      setCodeResult({ kind: result.kind, id: result.id });
    } else {
      setCodeStatus('invalid');
    }
  }

  return (
    <section className="screen active" id="screen-intro">
      <div className="hero-brand">
        <div className="hero-brand-kicker">{t('brand.kicker')}</div>
        <div className="hero-brand-name">{t('brand.name')}</div>
        <div className="hero-brand-bar" />
      </div>

      <div className="hero">
        <div className="eyebrow">{t('intro.eyebrow')}</div>
        <h1>{t('intro.title')}</h1>
        <p className="lead">{t('intro.lead')}</p>
      </div>

      <div className="triple">
        <div className="dimrow dr-wl">
          <span className="dot" />
          <div><div className="lab" style={{ fontSize: 16 }}>{t('intro.hook1Title')}</div><div className="q">{t('intro.hook1Body')}</div></div>
        </div>
        <div className="dimrow dr-fn">
          <span className="dot" />
          <div><div className="lab" style={{ fontSize: 16 }}>{t('intro.hook2Title')}</div><div className="q">{t('intro.hook2Body')}</div></div>
        </div>
        <div className="dimrow dr-be">
          <span className="dot" />
          <div><div className="lab" style={{ fontSize: 16 }}>{t('intro.hook3Title')}</div><div className="q">{t('intro.hook3Body')}</div></div>
        </div>
      </div>

      <div className="triple">
        <div className="dimrow dr-fn">
          <span className="dot" />
          <div><div className="lab">{L(DIM.F.label)}</div><div className="q">{t('intro.dimQ.F')}</div></div>
        </div>
        <div className="dimrow dr-be">
          <span className="dot" />
          <div><div className="lab">{L(DIM.B.label)}</div><div className="q">{t('intro.dimQ.B')}</div></div>
        </div>
        <div className="dimrow dr-wl">
          <span className="dot" />
          <div><div className="lab">{L(DIM.W.label)}</div><div className="q">{t('intro.dimQ.W')}</div></div>
        </div>
      </div>

      <div className="note">
        <b>{t('intro.noteHeading')}</b>
        <ul className="clean">
          <li>{tf('intro.note1', { n: 15, most: t('intro.note1Most'), least: t('intro.note1Least') })}</li>
          <li>{t('intro.note2')}</li>
          <li>{t('intro.note3')}</li>
          <li>{tf('intro.note4', { n: 9 })}</li>
          <li>{tf('intro.note5', { minutes: 7 })}</li>
          <li>{t('intro.note6')}</li>
        </ul>
      </div>

      <div className="note" style={{ marginTop: 16 }}>
        <label htmlFor="role-select"><b>{t('role.heading')}</b></label>
        <div className="q" style={{ marginBottom: 8 }}>{t('role.help')}</div>
        <select
          id="role-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
        >
          {ROLES.map(r => (
            <option key={r.id} value={r.id}>{L(r.label)}</option>
          ))}
        </select>
        {isDraftRole(role) && <div className="q" style={{ marginTop: 8 }}>{t('role.draftNote')}</div>}
      </div>

      {!showCode && (
        <button
          type="button"
          className="btn ghost sm"
          style={{ marginTop: 16 }}
          onClick={() => setShowCode(true)}
        >
          {t('team.codeLabel')}
        </button>
      )}
      {showCode && (
        <div className="note" style={{ marginTop: 16 }}>
          <label htmlFor="team-code"><b>{t('team.codeLabel')}</b></label>
          <div className="q" style={{ marginBottom: 8 }}>{t('team.codeHelp')}</div>
          <input
            id="team-code"
            value={joinCode}
            placeholder={t('team.codePlaceholder')}
            onChange={handleCodeChange}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--line)', textTransform: 'uppercase' }}
          />
          {codeStatus === 'checking' && <div className="q" style={{ marginTop: 8 }}>{t('team.codeChecking')}</div>}
          {codeStatus === 'valid' && (
            <div className="q" style={{ marginTop: 8, color: 'var(--fn)' }}>
              {codeResult?.kind === 'session' ? t('team.codeValidSession') : t('team.codeValidTeam')}
            </div>
          )}
          {codeStatus === 'invalid' && <div className="q" style={{ marginTop: 8, color: '#b3261e' }}>{t('team.codeInvalid')}</div>}
        </div>
      )}

      <div style={{ height: 20 }} />
      <button className="btn" onClick={() => onStart(role, codeStatus === 'valid' ? codeResult : null)}>{t('intro.start')}</button>

      <div className="footer-signature">
        {t('footer.developedBy')}{' '}
        <a href="https://madarlead.com" target="_blank" rel="noopener noreferrer" dir="ltr">Madarlead.com</a>
      </div>
    </section>
  );
}
