import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function ComplianceScreen({ items, answers, onSelect }) {
  const { t, L } = useLanguage();
  const labels = [t('org.rarely'), t('org.sometimes'), t('org.often')];
  return (
    <section className="screen active" id="screen-p3">
      <div className="eyebrow" style={{ marginBottom: 6 }}>{t('compliance.eyebrow')}</div>
      <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('compliance.title')}</h1>
      <p className="lead" style={{ marginBottom: 18 }}>{t('compliance.lead')}</p>
      <div className="card pad">
        {items.map((it, i) => (
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
      <div className="note" style={{ marginTop: 14 }}>{t('compliance.note')}</div>
    </section>
  );
}
