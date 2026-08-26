import { useLanguage } from '../i18n/LanguageContext.jsx';
import { RATER_ITEMS } from '../data/raterItems.js';
import { LANGS } from '../i18n/translations.js';

export default function RaterScreen({ status, answers, onSelect, onSubmit, error }) {
  const { t, L, lang, setLang } = useLanguage();
  const labels = [t('rate.rarely'), t('rate.sometimes'), t('rate.often')];
  const allAnswered = answers.every(v => v !== null);

  if (status === 'loading') {
    return <section className="screen active"><p>…</p></section>;
  }

  if (status === 'invalid') {
    return (
      <section className="screen active">
        <div className="card pad">
          <h1 style={{ fontSize: 22 }}>{t('rate.invalidHeading')}</h1>
          <p>{t('rate.invalidBody')}</p>
        </div>
      </section>
    );
  }

  if (status === 'done') {
    return (
      <section className="screen active">
        <div className="card pad">
          <h1 style={{ fontSize: 22 }}>{t('rate.doneHeading')}</h1>
          <p>{t('rate.doneBody')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="screen active">
      <div className="lang-switch no-print" style={{ marginBottom: 12 }}>
        {LANGS.map(l => (
          <button key={l} className={l === lang ? 'on' : ''} onClick={() => setLang(l)}>{t(`lang.${l}`)}</button>
        ))}
      </div>
      <div className="eyebrow">{t('rate.eyebrow')}</div>
      <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('rate.title')}</h1>
      <p className="lead" style={{ marginBottom: 18 }}>{t('rate.lead')}</p>
      <div className="card pad">
        {RATER_ITEMS.map((it, i) => (
          <div className="lk-item" key={i}>
            <div className="lk-txt">{i + 1}. {L(it.t)}</div>
            <div className="seg">
              {labels.map((label, v) => (
                <button
                  key={label}
                  className={answers[i] === v + 1 ? 'on' : ''}
                  onClick={() => onSelect(i, v + 1)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {error && <p style={{ color: '#b3261e' }}>{error}</p>}
      <div className="no-print" style={{ marginTop: 22 }}>
        <button className="btn" disabled={!allAnswered || status === 'submitting'} onClick={onSubmit}>
          {status === 'submitting' ? t('rate.submitting') : t('rate.submit')}
        </button>
      </div>
    </section>
  );
}
