import AuthPanel from './AuthPanel.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { interpolate } from '../i18n/translations.js';
import { DEV_PLAN } from '../data/devPlan.js';
import { MANAGER_DEBRIEF_QUESTIONS } from '../data/managerDebrief.js';

function ProfileBlock({ dimEntry, data, roleLabel, mode, compliance }) {
  const { t, L } = useLanguage();
  return (
    <div className={`profile ${dimEntry.cls}`}>
      <div className="badge">{roleLabel}</div>
      <h3>{L(dimEntry.label)}</h3>
      <div className="tag">{L(dimEntry.tag)}</div>
      {dimEntry.key === 'W' && compliance && (
        <div className="orgbar" style={{ marginTop: 14, marginBottom: 4 }}>
          <div className="top">
            <span style={{ fontWeight: 600 }}>{t('report.complianceLineLabel')}</span>
            <span className="lvl">{compliance.level}</span>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${compliance.pct}%`, background: dimEntry.color }} />
          </div>
          <div className="insight" style={{ marginTop: 10 }}>
            <h4>{compliance.head}</h4>
            <p>{compliance.body}</p>
            <p style={{ marginTop: 8 }}>{compliance.note}</p>
          </div>
        </div>
      )}
      {mode === 'full' && (
        <>
          <p style={{ fontSize: 14.5, margin: '0 0 4px' }}>{t('report.fullIntro')}</p>
          <h4>{t('report.fullStrengthHeading')}</h4>
          <ul className="clean">{data.strength.map((x, i) => <li key={i}>{L(x)}</li>)}</ul>
          <h4>{t('report.fullWatchHeading')}</h4>
          <ul className="clean">{data.watch.map((x, i) => <li key={i}>{L(x)}</li>)}</ul>
        </>
      )}
      {mode === 'backup' && (
        <>
          <p style={{ fontSize: 14.5, margin: '0 0 4px' }}>{t('report.backupIntro')}</p>
          <h4>{t('report.backupStrengthHeading')}</h4>
          <ul className="clean">{data.strength.map((x, i) => <li key={i}>{L(x)}</li>)}</ul>
          <h4>{t('report.backupWatchHeading')}</h4>
          <ul className="clean">{data.watch.map((x, i) => <li key={i}>{L(x)}</li>)}</ul>
        </>
      )}
      {mode === 'develop' && (
        <>
          <p style={{ fontSize: 14.5, margin: '0 0 4px' }}>{t('report.developIntro')}</p>
          <h4>{t('report.developHeading')}</h4>
          <ul className="clean">{data.develop.map((x, i) => <li key={i}>{L(x)}</li>)}</ul>
        </>
      )}
    </div>
  );
}

export default function ReportScreen({ reportData, dim, authState, onRestart, onPrint, onSignIn }) {
  const { t, tf, L } = useLanguage();
  const { dominant, backup, developArea, band, rankLines, profiles, orgBars, summaryInsight, orgInsight, total, compliance } = reportData;

  const debriefVars = { dominant: L(dim[dominant].label), developArea: L(dim[developArea].label) };
  const plan = DEV_PLAN[developArea];
  const planPhases = [
    { key: 'day30', label: t('report.planDay30'), actions: plan.day30 },
    { key: 'day60', label: t('report.planDay60'), actions: plan.day60 },
    { key: 'day90', label: t('report.planDay90'), actions: plan.day90 },
  ];

  return (
    <section className="screen active" id="screen-report">
      <div className="eyebrow">{t('report.eyebrow')}</div>
      <h1 style={{ fontSize: 'clamp(26px,6.5vw,36px)', marginBottom: 6 }}>{t('report.title')}</h1>
      <p className="lead" style={{ marginBottom: 8 }}>
        {tf('report.lead', { dominant: L(dim[dominant].label), backup: L(dim[backup].label), developArea: L(dim[developArea].label) })}
      </p>

      <div className="sec-title">{t('report.summaryTitle')}</div>
      <div className="card pad">
        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--muted)' }}>
          {tf('report.summaryIntro', { n: total })}
        </p>
        <div className="band">
          {band.map(b => (
            <span key={b.key} className={dim[b.key].band} style={{ flexBasis: `${b.pct}%` }}>
              {b.count > 0 ? b.count : ''}
            </span>
          ))}
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--fn)' }} />{L(dim.F.label)}</span>
          <span><i style={{ background: 'var(--be)' }} />{L(dim.B.label)}</span>
          <span><i style={{ background: 'var(--wl)' }} />{L(dim.W.label)}</span>
        </div>
        <div style={{ marginTop: 18 }}>
          {rankLines.map(rl => (
            <div className="rankline" key={rl.key}>
              <span className="role">{rl.role}</span>
              <span className="name" style={{ color: dim[rl.key].color }}>{L(dim[rl.key].label)}</span>
              <span className="pct">{rl.count} {t('report.of')} {total} · {rl.pct}%</span>
            </div>
          ))}
        </div>
        <div className="insight">
          <h4>{summaryInsight.head}</h4>
          <p>{summaryInsight.body}</p>
          {summaryInsight.extra && <p>{summaryInsight.extra}</p>}
        </div>
      </div>

      <div className="sec-title">{t('report.detailedTitle')}</div>
      <div className="card pad">
        <ProfileBlock dimEntry={dim[dominant]} data={profiles.full} roleLabel={t('report.roleFull')} mode="full" compliance={compliance} />
        <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', margin: '20px 0' }} />
        <ProfileBlock dimEntry={dim[backup]} data={profiles.backup} roleLabel={t('report.roleBackup')} mode="backup" compliance={compliance} />
        <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', margin: '20px 0' }} />
        <ProfileBlock dimEntry={dim[developArea]} data={profiles.develop} roleLabel={t('report.roleDevelop')} mode="develop" compliance={compliance} />
      </div>

      <div className="sec-title">{t('report.orgTitle')}</div>
      <div className="card pad">
        <p style={{ margin: '0 0 6px', fontSize: 14.5, color: 'var(--text)' }}>{t('report.orgIntro')}</p>
        <div style={{ marginTop: 14 }}>
          {orgBars.map(b => (
            <div className="orgbar" key={b.key}>
              <div className="top">
                <span style={{ color: dim[b.key].color, fontWeight: 600 }}>{L(dim[b.key].label)}</span>
                <span className="lvl">{b.level} {t('report.emphasis')}</span>
              </div>
              <div className="track">
                <div className="fill" style={{ width: `${b.pct}%`, background: dim[b.key].color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="insight">
          <h4>{t('report.orgValuesHeading')}</h4>
          <p>
            {tf('report.orgValuesBody', {
              top: L(dim[orgInsight.top].label),
              topWord: orgInsight.topWord,
              low: L(dim[orgInsight.low].label),
              lowWord: orgInsight.lowWord,
            })}
          </p>
          <p style={{ marginTop: 8 }}>{orgInsight.note}</p>
        </div>
      </div>

      <div className="sec-title">{t('report.planTitle')}</div>
      <div className="card pad">
        <p style={{ margin: '0 0 14px', fontSize: 14.5, color: 'var(--text)' }}>
          {tf('report.planIntro', { developArea: L(dim[developArea].label) })}
        </p>
        {planPhases.map((phase, i) => (
          <div key={phase.key} style={i > 0 ? { marginTop: 16 } : undefined}>
            <h4 style={{ color: dim[developArea].color }}>{phase.label}</h4>
            <ul className="clean">{phase.actions.map((x, j) => <li key={j}>{L(x)}</li>)}</ul>
          </div>
        ))}
      </div>

      <div className="sec-title">{t('report.debriefTitle')}</div>
      <div className="card pad">
        <p style={{ margin: '0 0 12px', fontSize: 14.5, color: 'var(--text)' }}>{t('report.debriefIntro')}</p>
        <ol className="clean">
          {MANAGER_DEBRIEF_QUESTIONS.map((q, i) => (
            <li key={i}>{interpolate(L(q), debriefVars)}</li>
          ))}
        </ol>
      </div>

      <div className="disclaimer">
        <b>{t('report.disclaimerHeading')}</b> {t('report.disclaimerBody')}
      </div>

      <AuthPanel authState={authState} onSignIn={onSignIn} />

      <div className="no-print" style={{ marginTop: 22, display: 'flex', gap: 12 }}>
        <button className="btn ghost" onClick={onRestart}>{t('report.startAgain')}</button>
        <button className="btn" onClick={onPrint}>{t('report.savePrint')}</button>
      </div>
      <p className="foot">{t('report.footer')}</p>
    </section>
  );
}
