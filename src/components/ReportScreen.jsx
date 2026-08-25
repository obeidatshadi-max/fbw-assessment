import AuthPanel from './AuthPanel.jsx';

function ProfileBlock({ dimEntry, data, roleLabel, mode }) {
  return (
    <div className={`profile ${dimEntry.cls}`}>
      <div className="badge">{roleLabel}</div>
      <h3>{dimEntry.label}</h3>
      <div className="tag">{dimEntry.tag}</div>
      {mode === 'full' && (
        <>
          <p style={{ fontSize: 14.5, margin: '0 0 4px' }}>
            This is the source you turn to first. It is your main strength as a leader — and, when overused, your main risk.
          </p>
          <h4>Where it makes you strong</h4>
          <ul className="clean">{data.strength.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <h4>Watch-outs when overused</h4>
          <ul className="clean">{data.watch.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </>
      )}
      {mode === 'backup' && (
        <>
          <p style={{ fontSize: 14.5, margin: '0 0 4px' }}>
            This is your second source. You use it well to support your main style, especially when the situation asks for it.
          </p>
          <h4>How it supports you</h4>
          <ul className="clean">{data.strength.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <h4>One thing to watch</h4>
          <ul className="clean">{data.watch.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </>
      )}
      {mode === 'develop' && (
        <>
          <p style={{ fontSize: 14.5, margin: '0 0 4px' }}>
            You chose this style least often. It is not a weakness in you — it is simply the least developed source right now.
            Growing here makes your leadership more complete and balanced.
          </p>
          <h4>Simple ways to grow here</h4>
          <ul className="clean">{data.develop.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </>
      )}
    </div>
  );
}

export default function ReportScreen({ reportData, dim, authState, onRestart, onPrint, onSignIn }) {
  const { dominant, backup, developArea, band, rankLines, profiles, orgBars, summaryInsight, orgInsight, total } = reportData;

  return (
    <section className="screen active" id="screen-report">
      <div className="eyebrow">Your reflection report</div>
      <h1 style={{ fontSize: 'clamp(26px,6.5vw,36px)', marginBottom: 6 }}>The Function · Being · Will Matrix</h1>
      <p className="lead" style={{ marginBottom: 8 }}>
        You lead most from {dim[dominant].label}, supported by {dim[backup].label}. Your growth edge is {dim[developArea].label}.
      </p>

      <div className="sec-title">Summary</div>
      <div className="card pad">
        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--muted)' }}>
          How often you chose each style across the 15 situations:
        </p>
        <div className="band">
          {band.map(b => (
            <span key={b.key} className={dim[b.key].band} style={{ flexBasis: `${b.pct}%` }}>
              {b.count > 0 ? b.count : ''}
            </span>
          ))}
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--fn)' }} />Function</span>
          <span><i style={{ background: 'var(--be)' }} />Being</span>
          <span><i style={{ background: 'var(--wl)' }} />Will</span>
        </div>
        <div style={{ marginTop: 18 }}>
          {rankLines.map(rl => (
            <div className="rankline" key={rl.key}>
              <span className="role">{rl.role}</span>
              <span className="name" style={{ color: dim[rl.key].color }}>{dim[rl.key].label}</span>
              <span className="pct">{rl.count} of {total} · {rl.pct}%</span>
            </div>
          ))}
        </div>
        <div className="insight">
          <h4>{summaryInsight.head}</h4>
          <p>{summaryInsight.body}</p>
          {summaryInsight.extra && <p>{summaryInsight.extra}</p>}
        </div>
      </div>

      <div className="sec-title">Detailed profile</div>
      <div className="card pad">
        <ProfileBlock dimEntry={dim[dominant]} data={profiles.full} roleLabel="Comprehensive profile" mode="full" />
        <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', margin: '20px 0' }} />
        <ProfileBlock dimEntry={dim[backup]} data={profiles.backup} roleLabel="Backup profile" mode="backup" />
        <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', margin: '20px 0' }} />
        <ProfileBlock dimEntry={dim[developArea]} data={profiles.develop} roleLabel="Area to develop" mode="develop" />
      </div>

      <div className="sec-title">Organization profile</div>
      <div className="card pad">
        <p style={{ margin: '0 0 6px', fontSize: 14.5, color: 'var(--text)' }}>
          What your environment rewards and expects — because your answers above are shaped by where you work.
        </p>
        <div style={{ marginTop: 14 }}>
          {orgBars.map(b => (
            <div className="orgbar" key={b.key}>
              <div className="top">
                <span style={{ color: dim[b.key].color, fontWeight: 600 }}>{dim[b.key].label}</span>
                <span className="lvl">{b.level} emphasis</span>
              </div>
              <div className="track">
                <div className="fill" style={{ width: `${b.pct}%`, background: dim[b.key].color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="insight">
          <h4>What your environment values</h4>
          <p>
            Your workplace puts the most weight on{' '}
            <b style={{ color: dim[orgInsight.top].color }}>{dim[orgInsight.top].label}</b> ({orgInsight.topWord}) and the least on{' '}
            <b style={{ color: dim[orgInsight.low].color }}>{dim[orgInsight.low].label}</b> ({orgInsight.lowWord}).
          </p>
          <p style={{ marginTop: 8 }}>{orgInsight.note}</p>
        </div>
      </div>

      <div className="disclaimer">
        <b>Please read this.</b> This is a structured self-reflection tool built on the Integral Leadership Dynamics™ framework.
        It is <b>not a validated psychometric test</b>. Because you choose between options, your scores are <b>relative to your own answers only</b> —
        they show which style you lean to more than the others, and they cannot be compared to other people or read as percentiles.
        Your results describe <b>how you answered today</b> and can be shaped by your current role, mood, and workplace.
        Use it to start reflection and conversation, not as a final judgment.
      </div>

      <AuthPanel authState={authState} onSignIn={onSignIn} />

      <div className="no-print" style={{ marginTop: 22, display: 'flex', gap: 12 }}>
        <button className="btn ghost" onClick={onRestart}>Start again</button>
        <button className="btn" onClick={onPrint}>Save / print</button>
      </div>
      <p className="foot">Integral Leadership Dynamics™ · Function · Being · Will</p>
    </section>
  );
}
