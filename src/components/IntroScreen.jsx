import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { DIM } from '../data/dimensions.js';
import { ROLES, DEFAULT_ROLE } from '../data/roles.js';
import { isDraftRole } from '../data/scenarioSets.js';

export default function IntroScreen({ onStart }) {
  const { t, tf, L } = useLanguage();
  const [role, setRole] = useState(DEFAULT_ROLE);
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

      <div style={{ height: 20 }} />
      <button className="btn" onClick={() => onStart(role)}>{t('intro.start')}</button>
    </section>
  );
}
