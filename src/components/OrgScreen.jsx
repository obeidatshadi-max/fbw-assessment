import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function OrgScreen({ items, answers, onSelect }) {
  const { t, L } = useLanguage();
  const labels = [t('org.rarely'), t('org.sometimes'), t('org.often')];
  return (
    <section className="screen active" id="screen-p2">
      <div className="eyebrow" style={{ marginBottom: 6 }}>{t('org.eyebrow')}</div>
      <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('org.title')}</h1>
      <p className="lead" style={{ marginBottom: 18 }}>{t('org.lead')}</p>
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
    </section>
  );
}
