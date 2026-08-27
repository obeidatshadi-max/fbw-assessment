import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { DIM } from '../data/dimensions.js';
import { ROLES, DEFAULT_ROLE } from '../data/roles.js';
import { isDraftRole } from '../data/scenarioSets.js';
import { noopAuthAdapter } from '../lib/authAdapter.js';

export default function IntroScreen({ onStart, authAdapter = noopAuthAdapter }) {
  const { t, tf, L } = useLanguage();
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [teamCode, setTeamCode] = useState('');
  const [teamStatus, setTeamStatus] = useState('idle'); // idle | checking | valid | invalid
  const [teamId, setTeamId] = useState(null);

  async function handleTeamCodeChange(e) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setTeamCode(value);
    setTeamId(null);
    if (value.length < 6) {
      setTeamStatus('idle');
      return;
    }
    setTeamStatus('checking');
    const result = await authAdapter.validateTeamCode({ code: value });
    if (result.valid) {
      setTeamStatus('valid');
      setTeamId(result.teamId);
    } else {
      setTeamStatus('invalid');
    }
  }

  return (
    <section className="screen active" id="screen-intro">
      <div className="hero">
        <div className="eyebrow">{t('intro.eyebrow')}</div>
        <h1>{t('intro.title')}</h1>
        <p className="lead">{t('intro.lead')}</p>
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

      <div className="note" style={{ marginTop: 16 }}>
        <label htmlFor="team-code"><b>{t('team.codeLabel')}</b></label>
        <div className="q" style={{ marginBottom: 8 }}>{t('team.codeHelp')}</div>
        <input
          id="team-code"
          value={teamCode}
          placeholder={t('team.codePlaceholder')}
          onChange={handleTeamCodeChange}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--line)', textTransform: 'uppercase' }}
        />
        {teamStatus === 'checking' && <div className="q" style={{ marginTop: 8 }}>{t('team.codeChecking')}</div>}
        {teamStatus === 'valid' && <div className="q" style={{ marginTop: 8, color: 'var(--fn)' }}>{t('team.codeValid')}</div>}
        {teamStatus === 'invalid' && <div className="q" style={{ marginTop: 8, color: '#b3261e' }}>{t('team.codeInvalid')}</div>}
      </div>

      <div style={{ height: 20 }} />
      <button className="btn" onClick={() => onStart(role, teamStatus === 'valid' ? teamId : null)}>{t('intro.start')}</button>
    </section>
  );
}
