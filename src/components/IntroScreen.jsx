export default function IntroScreen({ onStart }) {
  return (
    <section className="screen active" id="screen-intro">
      <div className="hero">
        <div className="eyebrow">Leadership self-reflection</div>
        <h1>Where do you lead from?</h1>
        <p className="lead">
          Every leader draws on three inner sources. This short reflection shows which one leads for you,
          which one supports you, and which one is your growth edge — and how your current environment
          shapes all three.
        </p>
      </div>

      <div className="triple">
        <div className="dimrow dr-fn">
          <span className="dot" />
          <div><div className="lab">Function</div><div className="q">What I can do — my skills and delivery.</div></div>
        </div>
        <div className="dimrow dr-be">
          <span className="dot" />
          <div><div className="lab">Being</div><div className="q">Who I am — my character and presence.</div></div>
        </div>
        <div className="dimrow dr-wl">
          <span className="dot" />
          <div><div className="lab">Will</div><div className="q">Why I act — my purpose, drive, and courage.</div></div>
        </div>
      </div>

      <div className="note">
        <b>How to answer honestly.</b>
        <ul className="clean">
          <li>You will read <b>15 real work situations</b>. For each one, choose the answer that is <b>most like you</b> and the one that is <b>least like you</b>.</li>
          <li>All answers are good ones. There is no "correct" choice — pick what is <b>truly you</b>, not what sounds best.</li>
          <li>Answer <b>quickly and by instinct</b>. Your first reaction is the most honest.</li>
          <li>Then answer <b>9 short questions about your workplace</b>.</li>
          <li>Takes about <b>7 minutes</b>. Nothing is saved or sent anywhere unless you choose to save your report.</li>
        </ul>
      </div>

      <div style={{ height: 20 }} />
      <button className="btn" onClick={onStart}>Start the reflection</button>
    </section>
  );
}
