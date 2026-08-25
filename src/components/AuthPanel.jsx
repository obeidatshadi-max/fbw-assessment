import { useState } from 'react';

export default function AuthPanel({ authState, onSignIn }) {
  const [email, setEmail] = useState('');

  if (authState.status === 'saved') {
    return (
      <div className="note no-print" style={{ marginTop: 16 }}>
        Saved to your account. You can find this report next time you sign in.
      </div>
    );
  }

  return (
    <div className="note no-print" style={{ marginTop: 16 }}>
      {authState.status === 'signedIn' ? (
        <p style={{ margin: 0 }}>Saving your report…</p>
      ) : (
        <>
          <p style={{ margin: '0 0 8px' }}>
            <b>Want to save this report?</b> Enter your email for a sign-in link. Nothing is saved unless you do this.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              placeholder="you@company.com"
              onChange={e => setEmail(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10 }}
            />
            <button
              className="btn sm"
              disabled={!email || authState.status === 'sending'}
              onClick={() => onSignIn(email)}
            >
              {authState.status === 'sending' ? 'Sending…' : 'Send link'}
            </button>
          </div>
          {authState.status === 'sent' && (
            <p style={{ margin: '8px 0 0', fontSize: 13.5 }}>Check your email for the sign-in link.</p>
          )}
          {authState.status === 'error' && (
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{authState.error}</p>
          )}
        </>
      )}
    </div>
  );
}
