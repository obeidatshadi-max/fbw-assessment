import { useEffect, useState } from 'react';
import ManagerScreen from './components/ManagerScreen.jsx';
import { noopAuthAdapter } from './lib/authAdapter.js';
import { computeImbalance } from './lib/teamScoring.js';
import { DIM } from './data/dimensions.js';

export default function ManagerApp({ authAdapter = noopAuthAdapter }) {
  const [authState, setAuthState] = useState({ status: 'anon' });
  const [teams, setTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [summary, setSummary] = useState(null);
  const [createStatus, setCreateStatus] = useState('idle');
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChange(async (session) => {
      if (!session) return;
      setAuthState({ status: 'signedIn', userId: session.user.id });
      const result = await authAdapter.listTeams({ userId: session.user.id });
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

  const imbalance = summary?.distribution ? computeImbalance(summary.distribution) : null;

  return (
    <main>
      <div className="wrap">
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
      </div>
    </main>
  );
}
