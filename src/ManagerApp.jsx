import { useEffect, useState } from 'react';
import ManagerScreen from './components/ManagerScreen.jsx';
import SessionLiveScreen from './components/SessionLiveScreen.jsx';
import { noopAuthAdapter } from './lib/authAdapter.js';
import { computeImbalance } from './lib/teamScoring.js';
import { DIM } from './data/dimensions.js';
import { useLanguage } from './i18n/LanguageContext.jsx';

export default function ManagerApp({ authAdapter = noopAuthAdapter }) {
  const { t } = useLanguage();
  const [authState, setAuthState] = useState({ status: 'anon' });
  const [view, setView] = useState('team');

  const [teams, setTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [summary, setSummary] = useState(null);
  const [createStatus, setCreateStatus] = useState('idle');
  const [createError, setCreateError] = useState(null);

  const [session, setSession] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [sessionCreateStatus, setSessionCreateStatus] = useState('idle');
  const [sessionCreateError, setSessionCreateError] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChange(async (authSession) => {
      if (!authSession) return;
      setAuthState({ status: 'signedIn', userId: authSession.user.id });
      const result = await authAdapter.listTeams({ userId: authSession.user.id });
      if (result.success && result.teams.length > 0) {
        setTeams(result.teams);
        setTeam(result.teams[0]);
      }
    });
    return unsubscribe;
  }, [authAdapter]);

  async function handleSignIn(email) {
    setAuthState({ status: 'sending' });
    const result = await authAdapter.signInWithEmail(email);
    setAuthState(result.success ? { status: 'sent' } : { status: 'error', error: result.error });
  }

  async function handleCreateTeam(name) {
    setCreateStatus('creating');
    setCreateError(null);
    const result = await authAdapter.createTeam({ name, userId: authState.userId });
    if (result.success) {
      const newTeam = { id: result.teamId, name, joinCode: result.joinCode };
      setTeams(prev => [...prev, newTeam]);
      setTeam(newTeam);
      setCreateStatus('done');
    } else {
      setCreateStatus('idle');
      setCreateError(result.error);
    }
  }

  function handleSwitchTeam(teamId) {
    const next = teams.find(tm => tm.id === teamId);
    if (next) {
      setTeam(next);
      setSummary(null);
    }
  }

  async function handleRefresh() {
    if (!team) return;
    const result = await authAdapter.getTeamSummary({ teamId: team.id });
    if (result.success) {
      setSummary({ count: result.count, distribution: result.distribution, roleBreakdown: result.roleBreakdown });
    }
  }

  async function handleCreateSession(name) {
    setSessionCreateStatus('creating');
    setSessionCreateError(null);
    const result = await authAdapter.createSession({ name, userId: authState.userId });
    if (result.success) {
      setSession({ id: result.sessionId, name, joinCode: result.joinCode });
      setSessionEnded(false);
      setSessionCreateStatus('done');
    } else {
      setSessionCreateStatus('idle');
      setSessionCreateError(result.error);
    }
  }

  async function handleRefreshSession() {
    if (!session) return;
    const result = await authAdapter.getSessionSummary({ sessionId: session.id });
    if (result.success) {
      setSessionSummary({ count: result.count, distribution: result.distribution, roleBreakdown: result.roleBreakdown });
    }
  }

  // Live polling (not Realtime, per the design spec): re-checks the
  // aggregate every 5s while a session is open, so the facilitator's
  // screen keeps moving on its own during a workshop. Cleared whenever
  // there's no session, the session changes, or it has ended.
  useEffect(() => {
    if (!session || sessionEnded) return;
    const interval = setInterval(handleRefreshSession, 5000);
    return () => clearInterval(interval);
  }, [session, sessionEnded]);

  async function handleEndSession() {
    if (!session) return;
    const result = await authAdapter.endSession({ sessionId: session.id });
    if (result.success) setSessionEnded(true);
  }

  function handlePrintCards() {
    window.print();
  }

  const imbalance = summary?.distribution ? computeImbalance(summary.distribution) : null;
  const sessionImbalance = sessionSummary?.distribution ? computeImbalance(sessionSummary.distribution) : null;

  return (
    <main>
      <div className="wrap">
        {authState.status === 'signedIn' && (
          <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <button className={`btn sm${view === 'team' ? '' : ' ghost'}`} onClick={() => setView('team')}>{t('manager.tabTeam')}</button>
            <button className={`btn sm${view === 'session' ? '' : ' ghost'}`} onClick={() => setView('session')}>{t('manager.tabSession')}</button>
          </div>
        )}
        {authState.status !== 'signedIn' || view === 'team' ? (
          <ManagerScreen
            authState={authState}
            team={team}
            teams={teams}
            summary={summary}
            imbalance={imbalance}
            dim={DIM}
            createStatus={createStatus}
            createError={createError}
            onSignIn={handleSignIn}
            onCreateTeam={handleCreateTeam}
            onSwitchTeam={handleSwitchTeam}
            onRefresh={handleRefresh}
          />
        ) : (
          <SessionLiveScreen
            session={session}
            summary={sessionSummary}
            imbalance={sessionImbalance}
            dim={DIM}
            createStatus={sessionCreateStatus}
            createError={sessionCreateError}
            ended={sessionEnded}
            onCreateSession={handleCreateSession}
            onRefresh={handleRefreshSession}
            onEndSession={handleEndSession}
            onPrintCards={handlePrintCards}
          />
        )}
      </div>
    </main>
  );
}
