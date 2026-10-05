import { useState } from 'react';
import AuthPanel from './AuthPanel.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { interpolate } from '../i18n/translations.js';
import { DEV_PLAN } from '../data/devPlan.js';
import { MANAGER_DEBRIEF_QUESTIONS } from '../data/managerDebrief.js';
import { normalizeSelf, normalizeRaters, buildGapData } from '../lib/raterScoring.js';
import { archetypeCode } from '../lib/archetype.js';
import { ARCHETYPES } from '../data/archetypes.js';
import {
  PAIRING, PAIRING_ALL, CRISIS, CRISIS_FULL, FEEDBACK_RISK, FEEDBACK_MATURE,
  CHANGE_RISK, CHANGE_BALANCE, ACTIVATION, DIAGNOSTIC_QUESTIONS,
} from '../data/modelInsights.js';

const MIN_RATERS = 3;
const GAP_THRESHOLD = 5;

function InviteFeedback({ raterLink, ind, compliance, dim, onCreateRaterLink, onRefreshRaterSummary }) {
  const { t, tf, L } = useLanguage();
  const [copied, setCopied] = useState(false);

  function copyLink(url) {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const gapData = raterLink?.scores
    ? buildGapData(normalizeSelf(ind.most, compliance?.score), normalizeRaters([raterLink.scores]))
    : null;

  return (
    <>
      <div className="sec-title no-print">{t('report.inviteHeading')}</div>
      <div className="card pad no-print">
        <p style={{ margin: '0 0 14px', fontSize: 14.5, color: 'var(--text)' }}>{t('report.inviteBody')}</p>
        {!raterLink && (
          <button className="btn" onClick={onCreateRaterLink}>{t('report.inviteGenerate')}</button>
        )}
        {raterLink?.status === 'creating' && (
          <button className="btn" disabled>{t('report.inviteGenerating')}</button>
        )}
        {raterLink?.status === 'error' && (
          <>
            <p style={{ color: '#b3261e', margin: '0 0 8px' }}>{raterLink.error || t('report.inviteError')}</p>
            <button className="btn" onClick={onCreateRaterLink}>{t('report.inviteGenerate')}</button>
          </>
        )}
        {raterLink?.status === 'ready' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                readOnly
                value={`${window.location.origin}/rate/${raterLink.id}`}
                style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10 }}
                onFocus={e => e.target.select()}
              />
              <button className="btn sm" onClick={() => copyLink(`${window.location.origin}/rate/${raterLink.id}`)}>
                {copied ? t('report.inviteCopied') : t('report.inviteCopy')}
              </button>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 10px' }}>{t('report.inviteShareNote')}</p>
            {!gapData && (
              <p style={{ fontSize: 13.5 }}>{tf('report.inviteCountWaiting', { count: raterLink.count || 0, min: MIN_RATERS })}</p>
            )}
            <button className="btn ghost sm" onClick={onRefreshRaterSummary}>{t('report.gapRefresh')}</button>
          </>
        )}
      </div>

      {gapData && (
        <>
          <div className="sec-title">{t('report.gapTitle')}</div>
          <div className="card pad">
            <p style={{ margin: '0 0 14px', fontSize: 14.5, color: 'var(--text)' }}>
              {tf('report.gapIntro', { count: raterLink.count })}
            </p>
            {gapData.map(g => {
              const label = g.key === 'C' ? t('report.complianceLineLabel') : L(dim[g.key].label);
              const color = g.key === 'C' ? dim.W.color : dim[g.key].color;
              const note = g.gap <= -GAP_THRESHOLD ? t('report.gapBlindSpot')
                : g.gap >= GAP_THRESHOLD ? t('report.gapHiddenStrength')
                : t('report.gapAligned');
              return (
                <div className="orgbar" key={g.key} style={{ marginBottom: 14 }}>
                  <div className="top">
                    <span style={{ color, fontWeight: 600 }}>{label}</span>
                  </div>
                  <div className="track">
                    <div className="fill" style={{ width: `${g.selfPct}%`, background: color, opacity: 0.5 }} />
                  </div>
                  <div className="track" style={{ marginTop: 4 }}>
                    <div className="fill" style={{ width: `${g.raterPct}%`, background: color }} />
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '4px 0 0' }}>
                    {t('report.gapSelfLabel')}: {Math.round(g.selfPct)}% · {t('report.gapOthersLabel')}: {Math.round(g.raterPct)}%
                  </p>
                  <p style={{ fontSize: 13.5, marginTop: 4 }}>{note}</p>
                </div>
              );
            })}
          </div>
          <ArchetypeCard scores={raterLink.scores} count={raterLink.count} dim={dim} />
        </>
      )}
    </>
  );
}

function ArchetypeCard({ scores, count, dim }) {
  const { t, tf, L } = useLanguage();
  const code = archetypeCode(scores);
  const archetype = code && ARCHETYPES[code];
  if (!archetype) return null;
  return (
    <>
      <div className="sec-title">{t('report.archetypeTitle')}</div>
      <div className="card pad">
        <p style={{ margin: '0 0 14px', fontSize: 14.5, color: 'var(--text)' }}>
          {tf('report.archetypeIntro', { count })}
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          {['F', 'B', 'W'].map((k, i) => (
            <span key={k} style={{ color: dim[k].color, fontWeight: 600 }}>
              {L(dim[k].label)}: {code[i] === 'H' ? t('report.archetypeHigh') : t('report.archetypeLow')}
            </span>
          ))}
        </div>
        <h3 style={{ margin: '0 0 4px' }}>{L(archetype.name)}</h3>
        {archetype.sentence && <p style={{ margin: '0 0 10px', fontStyle: 'italic' }}>{L(archetype.sentence)}</p>}
        <div className="insight">
          <h4>{t('report.archetypeStrength')}</h4>
          <p>{L(archetype.strength)}</p>
          <h4 style={{ marginTop: 10 }}>{t('report.archetypeShadow')}</h4>
          <p>{L(archetype.shadow)}</p>
          <h4 style={{ marginTop: 10 }}>{t('report.archetypeDevelop')}</h4>
          <p>{L(archetype.develop)}</p>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '10px 0 0' }}>{t('report.archetypeNote')}</p>
      </div>
    </>
  );
}

function WholeLeader({ dim, dominant, backup, developArea }) {
  const { t, tf, L } = useLanguage();
  const pairing = PAIRING[developArea];
  const crisis = CRISIS[developArea];
  return (
    <>
      <div className="sec-title">{t('report.wholeTitle')}</div>
      <div className="card pad">
        <p style={{ margin: '0 0 6px', fontSize: 14.5, color: 'var(--text)' }}>{t('report.wholeIntro')}</p>

        <div className="insight">
          <h4>{t('report.pairingHeading')}</h4>
          <p>{L(pairing.pair)}</p>
          <p>{L(pairing.missing)}</p>
          <p style={{ color: 'var(--muted)' }}>{L(PAIRING_ALL)}</p>
        </div>

        <div className="insight">
          <h4>{t('report.crisisHeading')}</h4>
          <p>{tf('report.crisisSetup', { dominant: L(dim[dominant].label), backup: L(dim[backup].label) })}</p>
          <p><b>{L(crisis.reflex)}</b></p>
          <p>{t('report.crisisTeam')}: {L(crisis.team)}</p>
          <p style={{ marginTop: 10 }}>{t('report.crisisFull')}</p>
          <p><b>{L(CRISIS_FULL.reflex)}</b></p>
          <p>{t('report.crisisTeam')}: {L(CRISIS_FULL.team)}</p>
        </div>

        <div className="insight">
          <h4>{t('report.feedbackHeading')}</h4>
          <p>{t('report.feedbackRiskLabel')}: {L(FEEDBACK_RISK[developArea])}</p>
          <p>{t('report.feedbackMatureLabel')}: {L(FEEDBACK_MATURE)}</p>
        </div>

        <div className="insight">
          <h4>{t('report.changeHeading')}</h4>
          <p>{L(CHANGE_RISK[developArea])}</p>
          <p style={{ color: 'var(--muted)' }}>{L(CHANGE_BALANCE)}</p>
        </div>
      </div>
    </>
  );
}

const PURPOSE_FIELDS = [
  { key: 'lead', label: 'report.purposeLead', hint: 'report.purposeLeadHint' },
  { key: 'intend', label: 'report.purposeIntend', hint: 'report.purposeIntendHint' },
  { key: 'willing', label: 'report.purposeWilling', hint: 'report.purposeWillingHint' },
];

// Kept in component state only — never saved or sent anywhere, so the
// "nothing is stored unless you choose" promise holds. It prints with the report.
function PurposeStatement() {
  const { t } = useLanguage();
  const [values, setValues] = useState({ lead: '', intend: '', willing: '' });
  return (
    <>
      <div className="sec-title">{t('report.purposeTitle')}</div>
      <div className="card pad">
        <p style={{ margin: '0 0 14px', fontSize: 14.5, color: 'var(--text)' }}>{t('report.purposeIntro')}</p>
        {PURPOSE_FIELDS.map(f => (
          <label key={f.key} style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>{t(f.label)}</span>
            <input
              type="text"
              value={values[f.key]}
              placeholder={t(f.hint)}
              onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, boxSizing: 'border-box' }}
            />
          </label>
        ))}
      </div>
    </>
  );
}

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
          {ACTIVATION[dimEntry.key] && (
            <>
              <h4>{t('report.activationHeading')}</h4>
              <ul className="clean">{ACTIVATION[dimEntry.key].map((x, i) => <li key={i}>{L(x)}</li>)}</ul>
            </>
          )}
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

export default function ReportScreen({ reportData, dim, authState, raterLink, onRestart, onPrint, onSignIn, onCreateAccount, onRequestReset, onConfirmConsent, onDeleteAccount, onCreateRaterLink, onRefreshRaterSummary }) {
  const { t, tf, L, lang } = useLanguage();
  const { dominant, backup, developArea, band, rankLines, profiles, orgBars, summaryInsight, orgInsight, total, compliance } = reportData;
  const generatedOn = new Date().toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  const debriefVars = { dominant: L(dim[dominant].label), developArea: L(dim[developArea].label) };
  const plan = DEV_PLAN[developArea];
  const planPhases = [
    { key: 'day30', label: t('report.planDay30'), actions: plan.day30 },
    { key: 'day60', label: t('report.planDay60'), actions: plan.day60 },
    { key: 'day90', label: t('report.planDay90'), actions: plan.day90 },
  ];

  return (
    <section className="screen active" id="screen-report">
      <div className="print-header">
        <span className="brandline">{t('brand.kicker')} · {t('brand.name')}</span>
        <span className="metaline">{generatedOn}</span>
      </div>
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

      <AuthPanel authState={authState} onSignIn={onSignIn} onCreateAccount={onCreateAccount} onRequestReset={onRequestReset} onConfirmConsent={onConfirmConsent} onDeleteAccount={onDeleteAccount} />

      {authState.status === 'saved' && onCreateRaterLink && (
        <InviteFeedback
          raterLink={raterLink}
          ind={reportData.ind}
          compliance={compliance}
          dim={dim}
          onCreateRaterLink={onCreateRaterLink}
          onRefreshRaterSummary={onRefreshRaterSummary}
        />
      )}

      <div className="sec-title">{t('report.detailedTitle')}</div>
      <div className="card pad">
        <ProfileBlock dimEntry={dim[dominant]} data={profiles.full} roleLabel={t('report.roleFull')} mode="full" compliance={compliance} />
        <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', margin: '20px 0' }} />
        <ProfileBlock dimEntry={dim[backup]} data={profiles.backup} roleLabel={t('report.roleBackup')} mode="backup" compliance={compliance} />
        <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', margin: '20px 0' }} />
        <ProfileBlock dimEntry={dim[developArea]} data={profiles.develop} roleLabel={t('report.roleDevelop')} mode="develop" compliance={compliance} />
      </div>

      <WholeLeader dim={dim} dominant={dominant} backup={backup} developArea={developArea} />

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

      <div className="sec-title">{t('report.antigravityTitle')}</div>
      <div className="card pad">
        <p style={{ margin: '0 0 14px', fontSize: 14.5, color: 'var(--text)' }}>
          {tf('report.antigravityIntro', { dominant: L(dim[dominant].label) })}
        </p>
        {reportData.antigravity.pairs.map((pair, i) => (
          <div key={i} style={i > 0 ? { marginTop: 14 } : undefined}>
            <h4 style={{ color: dim[dominant].color, margin: '0 0 4px' }}>{t('report.antigravityGravityHeading')}</h4>
            <p style={{ margin: '0 0 8px' }}>{L(pair.gravityPattern)}</p>
            <h4 style={{ margin: '0 0 4px' }}>{t('report.antigravityForceHeading')}</h4>
            <p>{L(pair.antigravityForce)}</p>
          </div>
        ))}
      </div>

      <div className="sec-title">{t('report.planTitle')}</div>
      <div className="card pad">
        <p style={{ margin: '0 0 14px', fontSize: 14.5, color: 'var(--text)' }}>
          {tf('report.planIntro', { developArea: L(dim[developArea].label) })}
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--muted)' }}>{t('report.planRule')}</p>
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
        {DIAGNOSTIC_QUESTIONS[developArea] && (
          <>
            <h4 style={{ marginTop: 14 }}>{tf('report.diagnosticHeading', { developArea: L(dim[developArea].label) })}</h4>
            <ul className="clean">{DIAGNOSTIC_QUESTIONS[developArea].map((q, i) => <li key={i}>{L(q)}</li>)}</ul>
          </>
        )}
      </div>

      <PurposeStatement />

      <div className="disclaimer">
        <b>{t('report.disclaimerHeading')}</b> {t('report.disclaimerBody')}
      </div>

      <div className="no-print" style={{ marginTop: 22, display: 'flex', gap: 12 }}>
        <button className="btn ghost" onClick={onRestart}>{t('report.startAgain')}</button>
        <button className="btn" onClick={onPrint}>{t('report.savePrint')}</button>
      </div>
      <p className="foot">{t('report.footer')}</p>
    </section>
  );
}
