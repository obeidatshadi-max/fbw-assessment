import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LegalScreen from './LegalScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

describe('LegalScreen', () => {
  it('renders the Privacy Policy in English', () => {
    render(<LanguageProvider><LegalScreen page="privacy" /></LanguageProvider>);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Draft', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Delete my account', { exact: false })).toBeInTheDocument();
  });

  it('renders the Terms of Service in English', () => {
    render(<LanguageProvider><LegalScreen page="terms" /></LanguageProvider>);
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Limitation of liability')).toBeInTheDocument();
  });

  it('renders in Arabic', () => {
    render(<LanguageProvider initialLang="ar"><LegalScreen page="privacy" /></LanguageProvider>);
    expect(screen.getByText('سياسة الخصوصية')).toBeInTheDocument();
  });

  it('links back to the assessment', () => {
    render(<LanguageProvider><LegalScreen page="privacy" /></LanguageProvider>);
    expect(screen.getByText('Back to the assessment')).toHaveAttribute('href', '/');
  });
});
