const LABELS = ['Rarely', 'Sometimes', 'Often'];

export default function OrgScreen({ items, answers, onSelect }) {
  return (
    <section className="screen active" id="screen-p2">
      <div className="eyebrow" style={{ marginBottom: 6 }}>Part 2 of 2</div>
      <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>Your workplace</h1>
      <p className="lead" style={{ marginBottom: 18 }}>
        Think about your team or organization <b>as it is today</b>. How often is each statement true?
      </p>
      <div className="card pad">
        {items.map((it, i) => (
          <div className="lk-item" key={i}>
            <div className="lk-txt">{i + 1}. {it.t}</div>
            <div className="seg">
              {LABELS.map((label, v) => (
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
