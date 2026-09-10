import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminScreen from './AdminScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

function renderScreen(props) {
  return render(
    <LanguageProvider>
      <AdminScreen
        authState={{ status: 'anon' }}
        statsState={{ status: 'idle' }}
        onSignIn={() => {}}
        onRefresh={() => {}}
        {...props}
      />
    </LanguageProvider>
  );
}

describe('AdminScreen', () => {
  it('shows the sign-in form when not signed in', () => {
    renderScreen({});
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
  });

  it('calls onSignIn with the entered email and password', () => {
    const onSignIn = vi.fn();
    renderScreen({ onSignIn });
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@x.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSignIn).toHaveBeenCalledWith('a@x.com', 'secret123');
  });

  it('shows a sign-in error', () => {
    renderScreen({ authState: { status: 'error', error: 'bad creds' } });
    expect(screen.getByText('bad creds')).toBeInTheDocument();
  });

  it('shows a loading state while stats are being fetched', () => {
    renderScreen({ authState: { status: 'signedIn' }, statsState: { status: 'loading' } });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows "Not authorized." when the stats RPC rejects the caller', () => {
    renderScreen({ authState: { status: 'signedIn' }, statsState: { status: 'error', error: 'not authorized' } });
    expect(screen.getByText('Not authorized.')).toBeInTheDocument();
  });

  it('renders stat tiles and role breakdown when stats are ready', () => {
    renderScreen({
      authState: { status: 'signedIn' },
      statsState: {
        status: 'ready',
        stats: {
          totalLeaders: 42,
          totalAssessments: 30,
          assessments7d: 5,
          assessments30d: 20,
          roleBreakdown: { sales: 10, unspecified: 20 },
          totalTeams: 3,
          totalSessions: 1,
          totalRaterLinks: 4,
          totalRaterResponses: 9,
          dailyCompletions: [{ day: '2026-09-09', count: 2 }],
        },
      },
    });
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('calls onRefresh when the refresh button is clicked', () => {
    const onRefresh = vi.fn();
    renderScreen({
      authState: { status: 'signedIn' },
      statsState: { status: 'ready', stats: { totalLeaders: 0, totalAssessments: 0, assessments7d: 0, assessments30d: 0, roleBreakdown: {}, totalTeams: 0, totalSessions: 0, totalRaterLinks: 0, totalRaterResponses: 0, dailyCompletions: [] } },
      onRefresh,
    });
    fireEvent.click(screen.getByText('Refresh'));
    expect(onRefresh).toHaveBeenCalled();
  });
});
