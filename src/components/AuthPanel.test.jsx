import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthPanel from './AuthPanel.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

function checkStoreConsent() {
  fireEvent.click(screen.getByLabelText('Store my results so I can see this report again'));
}

describe('AuthPanel', () => {
  it('shows the save prompt when anonymous', () => {
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    expect(screen.getByText('Want to save this report', { exact: false })).toBeInTheDocument();
  });

  it('disables sign-in and create-account until the store-results checkbox is checked', () => {
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    expect(screen.getByText('Sign in')).toBeDisabled();
    expect(screen.getByText('Create account')).toBeDisabled();
    checkStoreConsent();
    expect(screen.getByText('Sign in')).not.toBeDisabled();
    expect(screen.getByText('Create account')).not.toBeDisabled();
  });

  it('calls onSignIn with the typed email, password, and consent', () => {
    const onSignIn = vi.fn();
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={onSignIn} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    checkStoreConsent();
    fireEvent.click(screen.getByLabelText('Track my results over time so I can see my own change'));
    fireEvent.click(screen.getByText('Sign in'));
    expect(onSignIn).toHaveBeenCalledWith('a@b.com', 'secret123', { storeResults: true, longitudinalTracking: true, shareWithManager: false });
  });

  it('calls onCreateAccount with the typed email, password, and consent', () => {
    const onCreateAccount = vi.fn();
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={onCreateAccount} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    checkStoreConsent();
    fireEvent.click(screen.getByText('Create account'));
    expect(onCreateAccount).toHaveBeenCalledWith('a@b.com', 'secret123', { storeResults: true, longitudinalTracking: false, shareWithManager: false });
  });

  it('calls onRequestReset with the typed email and shows confirmation', async () => {
    const onRequestReset = vi.fn().mockResolvedValue({ success: true });
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={onRequestReset} onConfirmConsent={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Forgot password?'));
    expect(onRequestReset).toHaveBeenCalledWith('a@b.com');
    expect(await screen.findByText('reset link is on its way', { exact: false })).toBeInTheDocument();
  });

  it('shows an error when the reset request fails', async () => {
    const onRequestReset = vi.fn().mockResolvedValue({ success: false });
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={onRequestReset} onConfirmConsent={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Forgot password?'));
    expect(await screen.findByText('Could not send a reset link', { exact: false })).toBeInTheDocument();
  });

  it('shows the saved confirmation', () => {
    render(<AuthPanel authState={{ status: 'saved' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    expect(screen.getByText('Saved to your account.', { exact: false })).toBeInTheDocument();
  });

  it('shows the save prompt in Arabic', () => {
    render(<LanguageProvider initialLang="ar"><AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} /></LanguageProvider>);
    expect(screen.getByText('تريد حفظ هذا التقرير', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument();
  });

  it('shows a standalone consent screen with no email/password fields when status is needsConsent', () => {
    render(<AuthPanel authState={{ status: 'needsConsent', userId: 'u1' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    expect(screen.getByText('Before we save this report')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('you@company.com')).not.toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeDisabled();
  });

  it('calls onConfirmConsent with the checked consent when Continue is clicked', () => {
    const onConfirmConsent = vi.fn();
    render(<AuthPanel authState={{ status: 'needsConsent', userId: 'u1' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={onConfirmConsent} />);
    fireEvent.click(screen.getByLabelText('Store my results so I can see this report again'));
    fireEvent.click(screen.getByLabelText('Share a summary with my manager/HR for talent review'));
    fireEvent.click(screen.getByText('Continue'));
    expect(onConfirmConsent).toHaveBeenCalledWith({ storeResults: true, longitudinalTracking: false, shareWithManager: true });
  });
});
