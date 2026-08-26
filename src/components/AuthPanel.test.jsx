import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthPanel from './AuthPanel.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

describe('AuthPanel', () => {
  it('shows the save prompt when anonymous', () => {
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} />);
    expect(screen.getByText('Want to save this report?', { exact: false })).toBeInTheDocument();
  });

  it('calls onSignIn with the typed email', () => {
    const onSignIn = vi.fn();
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={onSignIn} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Send link'));
    expect(onSignIn).toHaveBeenCalledWith('a@b.com');
  });

  it('shows the saved confirmation', () => {
    render(<AuthPanel authState={{ status: 'saved' }} onSignIn={() => {}} />);
    expect(screen.getByText('Saved to your account.', { exact: false })).toBeInTheDocument();
  });

  it('shows the save prompt in Arabic', () => {
    render(<LanguageProvider initialLang="ar"><AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} /></LanguageProvider>);
    expect(screen.getByText('تريد حفظ هذا التقرير؟', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('إرسال الرابط')).toBeInTheDocument();
  });
});
