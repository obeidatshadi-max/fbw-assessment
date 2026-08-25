export default function Header({ stepLabel, done, total, final }) {
  const each = total > 0 ? 100 / total : 0;
  const widths = final
    ? { F: 100 / 3, B: 100 / 3, W: 100 / 3 }
    : {
        F: each * Math.min(done, 5),
        B: each * Math.max(0, Math.min(done - 5, 5)),
        W: each * Math.max(0, done - 10),
      };
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="k">Integral Leadership Dynamics™</span>
          <span className="n">Function · Being · Will</span>
        </div>
        <span className="step-count">{stepLabel}</span>
      </div>
      <div className="progress">
        <i className="pf" style={{ width: `${widths.F}%` }} />
        <i className="pb" style={{ width: `${widths.B}%` }} />
        <i className="pw" style={{ width: `${widths.W}%` }} />
      </div>
    </header>
  );
}
