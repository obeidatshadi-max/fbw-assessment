import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminApp from './AdminApp.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';

function makeAdapter(overrides = {}) {
  let authCallback = () => {};
  return {
    signInWithPassword: vi.fn().mockResolvedValue({ success: true }),
    onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
    getAdminStats: vi.fn().mockResolvedValue({
      success: true,
      stats: {
        totalLeaders: 42, totalAssessments: 30, assessments7d: 5, assessments30d: 20,
        roleBreakdown: { sales: 10 }, totalTeams: 3, totalSessions: 1,
        totalRaterLinks: 4, totalRaterResponses: 9, dailyCompletions: [],
      },
    }),
    triggerAuth: (session) => authCallback(session),
    ...overrides,
  };
}

describe('AdminApp', () => {
  it('shows a link back to the main assessment', () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><AdminApp authAdapter={authAdapter} /></LanguageProvider>);
    expect(screen.getByText('Back to the assessment')).toHaveAttribute('href', '/');
  });

  it('fetches and renders stats after sign-in', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><AdminApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    await waitFor(() => expect(authAdapter.getAdminStats).toHaveBeenCalled());
    expect(await screen.findByText('42')).toBeInTheDocument();
  });

  it('shows "Not authorized." when getAdminStats fails', async () => {
    const authAdapter = makeAdapter({
      getAdminStats: vi.fn().mockResolvedValue({ success: false, error: 'not authorized' }),
    });
    render(<LanguageProvider><AdminApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    expect(await screen.findByText('Not authorized.')).toBeInTheDocument();
  });

  it('re-fetches stats when refresh is clicked', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><AdminApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    await screen.findByText('42');
    fireEvent.click(screen.getByText('Refresh'));
    await waitFor(() => expect(authAdapter.getAdminStats).toHaveBeenCalledTimes(2));
  });

  it('shows an error when sign-in fails', async () => {
    const authAdapter = makeAdapter({
      signInWithPassword: vi.fn().mockResolvedValue({ success: false, error: 'bad creds' }),
    });
    render(<LanguageProvider><AdminApp authAdapter={authAdapter} /></LanguageProvider>);

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@x.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('bad creds')).toBeInTheDocument();
    expect(authAdapter.signInWithPassword).toHaveBeenCalledWith({ email: 'a@x.com', password: 'secret123' });
  });
});
