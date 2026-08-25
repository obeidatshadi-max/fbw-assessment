export default function ScenarioScreen({ scenario, index, total, answer, onChoose }) {
  return (
    <section className="screen active" id="screen-p1">
      <div className="card pad">
        <div className="scn-kicker">Part 1 · Situation {index + 1}/{total}</div>
        <div className="scn-q">{scenario.s}</div>
        <div className="scn-sub">Choose one <b>most like you</b> and one <b>least like you</b>.</div>
        {scenario.opts.map((o, idx) => {
          const mostOn = answer.most === idx;
          const leastOn = answer.least === idx;
          const stateCls = mostOn ? ' is-most' : leastOn ? ' is-least' : '';
          return (
            <div className={`opt${stateCls}`} key={idx}>
              <div className="txt">{o.t}</div>
              <div className="chips">
                <div className={`chip${mostOn ? ' on-most' : ''}`} onClick={() => onChoose('most', idx)}>
                  <span className="ic">✓</span> Most like me
                </div>
                <div className={`chip${leastOn ? ' on-least' : ''}`} onClick={() => onChoose('least', idx)}>
                  <span className="ic">✕</span> Least like me
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
