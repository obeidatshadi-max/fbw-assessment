import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ManagerScreen from './ManagerScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';
import { DIM } from '../data/dimensions.js';

function renderScreen(props) {
  return render(
    <LanguageProvider>
      <ManagerScreen
        authState={{ status: 'anon' }}
        team={null}
        teams={[]}
        summary={null}
        imbalance={null}
        dim={DIM}
        createStatus="idle"
        createError={null}
        onSignIn={() => {}}
        onCreateTeam={() => {}}
        onRefresh={() => {}}
        onSwitchTeam={() => {}}
        {...props}
      />
    </LanguageProvider>
  );
}

describe('ManagerScreen', () => {
  it('shows the sign-in form when not signed in', () => {
    renderScreen({});
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
  });

  it('calls onSignIn with the entered email', () => {
    const onSignIn = vi.fn();
    renderScreen({ onSignIn });
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'm@x.com' } });
    fireEvent.click(screen.getByText('Send link'));
    expect(onSignIn).toHaveBeenCalledWith('m@x.com');
  });

  it('shows the create-team form once signed in with no team', () => {
    renderScreen({ authState: { status: 'signedIn', userId: 'u1' } });
    expect(screen.getByPlaceholderText('e.g. Baghdad District')).toBeInTheDocument();
  });

  it('calls onCreateTeam with the entered name', () => {
    const onCreateTeam = vi.fn();
    renderScreen({ authState: { status: 'signedIn', userId: 'u1' }, onCreateTeam });
    fireEvent.change(screen.getByPlaceholderText('e.g. Baghdad District'), { target: { value: 'District A' } });
    fireEvent.click(screen.getByText('Create team'));
    expect(onCreateTeam).toHaveBeenCalledWith('District A');
  });

  it('shows the waiting message when the team has fewer than 3 responses', () => {
    renderScreen({
      authState: { status: 'signedIn', userId: 'u1' },
      team: { id: 't1', name: 'District A', joinCode: 'AB12CD' },
      summary: { count: 1, distribution: null, roleBreakdown: null },
    });
    expect(screen.getByText('1 of 3 responses needed before the team pattern appears.')).toBeInTheDocument();
  });

  it('shows the dashboard and imbalance flag once revealed', () => {
    renderScreen({
      authState: { status: 'signedIn', userId: 'u1' },
      team: { id: 't1', name: 'District A', joinCode: 'AB12CD' },
      summary: { count: 5, distribution: { F: 50, B: 32, W: 18, C: 60 }, roleBreakdown: { rep: 3, manager: 2 } },
      imbalance: { high: 'F', low: 'W' },
    });
    expect(screen.getByText('Team pattern')).toBeInTheDocument();
    expect(screen.getByText('Function is strong (50%), Will is low (18%) across the team — a rule-of-thumb signal, not a statistical finding.')).toBeInTheDocument();
  });

  it('shows the no-flag message when imbalance is null but the dashboard is revealed', () => {
    renderScreen({
      authState: { status: 'signedIn', userId: 'u1' },
      team: { id: 't1', name: 'District A', joinCode: 'AB12CD' },
      summary: { count: 5, distribution: { F: 34, B: 33, W: 33, C: 60 }, roleBreakdown: { rep: 5 } },
      imbalance: null,
    });
    expect(screen.getByText('No strong imbalance detected across the team.')).toBeInTheDocument();
  });

  it('shows no team switcher when the manager has only one team', () => {
    renderScreen({
      authState: { status: 'signedIn', userId: 'u1' },
      team: { id: 't1', name: 'District A', joinCode: 'AB12CD' },
      teams: [{ id: 't1', name: 'District A', joinCode: 'AB12CD' }],
      summary: { count: 1, distribution: null, roleBreakdown: null },
    });
    expect(screen.queryByText('Switch team')).not.toBeInTheDocument();
  });

  it('shows a team switcher and calls onSwitchTeam when the manager has more than one team', () => {
    const onSwitchTeam = vi.fn();
    renderScreen({
      authState: { status: 'signedIn', userId: 'u1' },
      team: { id: 't1', name: 'District A', joinCode: 'AB12CD' },
      teams: [
        { id: 't1', name: 'District A', joinCode: 'AB12CD' },
        { id: 't2', name: 'District B', joinCode: 'ZZ99XX' },
      ],
      summary: { count: 1, distribution: null, roleBreakdown: null },
      onSwitchTeam,
    });
    fireEvent.change(screen.getByLabelText('Switch team'), { target: { value: 't2' } });
    expect(onSwitchTeam).toHaveBeenCalledWith('t2');
  });
});
