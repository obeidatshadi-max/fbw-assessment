import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResetPasswordApp from './ResetPasswordApp.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';

function makeAdapter(overrides = {}) {
  let authCallback = () => {};
  return {
    getSession: vi.fn().mockResolvedValue(null),
    onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
    updatePassword: vi.fn().mockResolvedValue({ success: true }),
    triggerAuth: (session) => authCallback(session),
    ...overrides,
  };
}

describe('ResetPasswordApp', () => {
  it('shows the form once a recovery session is found via getSession', async () => {
    const authAdapter = makeAdapter({ getSession: vi.fn().mockResolvedValue({ user: { id: 'u1' } }) });
    render(<LanguageProvider><ResetPasswordApp authAdapter={authAdapter} /></LanguageProvider>);
    await waitFor(() => expect(screen.getByText('Set new password')).toBeInTheDocument());
  });

  it('shows the form once a recovery session arrives via onAuthStateChange', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><ResetPasswordApp authAdapter={authAdapter} /></LanguageProvider>);
    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    expect(await screen.findByText('Set new password')).toBeInTheDocument();
  });

  it('shows an invalid-link message if no session appears in time', async () => {
    vi.useFakeTimers();
    const authAdapter = makeAdapter();
    render(<LanguageProvider><ResetPasswordApp authAdapter={authAdapter} /></LanguageProvider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(screen.getByText('This reset link is not valid')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('submits a new password and shows the done screen', async () => {
    const authAdapter = makeAdapter({ getSession: vi.fn().mockResolvedValue({ user: { id: 'u1' } }) });
    render(<LanguageProvider><ResetPasswordApp authAdapter={authAdapter} /></LanguageProvider>);
    await screen.findByText('Set new password');

    fireEvent.change(screen.getByPlaceholderText('New password (min 8 characters)'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByText('Set new password'));

    await waitFor(() => expect(authAdapter.updatePassword).toHaveBeenCalledWith({ password: 'newpass123' }));
    expect(await screen.findByText('Password updated')).toBeInTheDocument();
  });

  it('shows a local error when the passwords do not match, without calling updatePassword', async () => {
    const authAdapter = makeAdapter({ getSession: vi.fn().mockResolvedValue({ user: { id: 'u1' } }) });
    render(<LanguageProvider><ResetPasswordApp authAdapter={authAdapter} /></LanguageProvider>);
    await screen.findByText('Set new password');

    fireEvent.change(screen.getByPlaceholderText('New password (min 8 characters)'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByText('Set new password'));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(authAdapter.updatePassword).not.toHaveBeenCalled();
  });

  it('shows the adapter error and stays on the form when updatePassword fails', async () => {
    const authAdapter = makeAdapter({
      getSession: vi.fn().mockResolvedValue({ user: { id: 'u1' } }),
      updatePassword: vi.fn().mockResolvedValue({ success: false, error: 'Link expired' }),
    });
    render(<LanguageProvider><ResetPasswordApp authAdapter={authAdapter} /></LanguageProvider>);
    await screen.findByText('Set new password');

    fireEvent.change(screen.getByPlaceholderText('New password (min 8 characters)'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByText('Set new password'));

    expect(await screen.findByText('Link expired')).toBeInTheDocument();
  });
});
