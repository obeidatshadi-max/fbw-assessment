import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function ScenarioScreen({ scenario, index, total, answer, onChoose }) {
  const { tf, t, L } = useLanguage();
  return (
    <section className="screen active" id="screen-p1">
      <div className="card pad">
        <div className="scn-kicker">{tf('scenario.kicker', { n: index + 1, total })}</div>
        <div className="scn-q">{L(scenario.s)}</div>
        <div className="scn-sub">{t('scenario.sub')}</div>
        {scenario.opts.map((o, idx) => {
          const mostOn = answer.most === idx;
          const leastOn = answer.least === idx;
          const stateCls = mostOn ? ' is-most' : leastOn ? ' is-least' : '';
          return (
            <div className={`opt${stateCls}`} key={idx}>
              <div className="txt">{L(o.t)}</div>
              <div className="chips">
                <div className={`chip${mostOn ? ' on-most' : ''}`} onClick={() => onChoose('most', idx)}>
                  <span className="ic">✓</span> {t('scenario.mostLike')}
                </div>
                <div className={`chip${leastOn ? ' on-least' : ''}`} onClick={() => onChoose('least', idx)}>
                  <span className="ic">✕</span> {t('scenario.leastLike')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
