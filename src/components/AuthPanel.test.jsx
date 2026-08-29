import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthPanel from './AuthPanel.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

describe('AuthPanel', () => {
  it('shows the save prompt when anonymous', () => {
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} />);
    expect(screen.getByText('Want to save this report', { exact: false })).toBeInTheDocument();
  });

  it('calls onSignIn with the typed email and password', () => {
    const onSignIn = vi.fn();
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={onSignIn} onCreateAccount={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByText('Sign in'));
    expect(onSignIn).toHaveBeenCalledWith('a@b.com', 'secret123');
  });

  it('calls onCreateAccount with the typed email and password', () => {
    const onCreateAccount = vi.fn();
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={onCreateAccount} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByText('Create account'));
    expect(onCreateAccount).toHaveBeenCalledWith('a@b.com', 'secret123');
  });

  it('shows the saved confirmation', () => {
    render(<AuthPanel authState={{ status: 'saved' }} onSignIn={() => {}} onCreateAccount={() => {}} />);
    expect(screen.getByText('Saved to your account.', { exact: false })).toBeInTheDocument();
  });

  it('shows the save prompt in Arabic', () => {
    render(<LanguageProvider initialLang="ar"><AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} /></LanguageProvider>);
    expect(screen.getByText('تريد حفظ هذا التقرير', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument();
  });
});
