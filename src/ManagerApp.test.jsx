import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ManagerApp from './ManagerApp.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';

function makeAdapter(overrides = {}) {
  let authCallback = () => {};
  return {
    signInWithEmail: vi.fn().mockResolvedValue({ success: true }),
    onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
    createTeam: vi.fn().mockResolvedValue({ success: true, teamId: 't1', joinCode: 'AB12CD' }),
    listTeams: vi.fn().mockResolvedValue({ success: true, teams: [] }),
    getTeamSummary: vi.fn().mockResolvedValue({ success: true, count: 5, distribution: { F: 50, B: 32, W: 18, C: 60 }, roleBreakdown: { rep: 5 } }),
    triggerAuth: (session) => authCallback(session),
    ...overrides,
  };
}

describe('ManagerApp', () => {
  it('creates a team and shows the join code when the manager has none yet', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><ManagerApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    await waitFor(() => expect(authAdapter.listTeams).toHaveBeenCalledWith({ userId: 'u1' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. Baghdad District'), { target: { value: 'District A' } });
    fireEvent.click(screen.getByText('Create team'));

    await waitFor(() => expect(authAdapter.createTeam).toHaveBeenCalledWith({ name: 'District A', userId: 'u1' }));
    expect(await screen.findByDisplayValue('AB12CD')).toBeInTheDocument();
  });

  it('loads the manager\'s existing team on sign-in instead of showing the create form', async () => {
    const authAdapter = makeAdapter({
      listTeams: vi.fn().mockResolvedValue({ success: true, teams: [{ id: 't1', name: 'District A', joinCode: 'AB12CD' }] }),
    });
    render(<LanguageProvider><ManagerApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    expect(await screen.findByDisplayValue('AB12CD')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. Baghdad District')).not.toBeInTheDocument();
  });

  it('refreshes the summary and computes the imbalance flag', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><ManagerApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    await screen.findByPlaceholderText('e.g. Baghdad District');
    fireEvent.change(screen.getByPlaceholderText('e.g. Baghdad District'), { target: { value: 'District A' } });
    fireEvent.click(screen.getByText('Create team'));
    await screen.findByDisplayValue('AB12CD');

    fireEvent.click(screen.getByText('Check for new responses'));
    await waitFor(() => expect(authAdapter.getTeamSummary).toHaveBeenCalledWith({ teamId: 't1' }));
    expect(await screen.findByText('Function is strong (50%), Will is low (18%) across the team — a rule-of-thumb signal, not a statistical finding.')).toBeInTheDocument();
  });
});
