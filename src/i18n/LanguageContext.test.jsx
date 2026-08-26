import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { LanguageProvider, useLanguage } from './LanguageContext.jsx';

function Probe() {
  const { lang, dir, setLang, t } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="text">{t('nav.back')}</span>
      <button onClick={() => setLang('ar')}>go-ar</button>
    </div>
  );
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
  });

  it('defaults to english/ltr with no stored preference', () => {
    render(<LanguageProvider><Probe /></LanguageProvider>);
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('dir')).toHaveTextContent('ltr');
    expect(screen.getByTestId('text')).toHaveTextContent('Back');
  });

  it('switches language, dir, and translated text when setLang is called', () => {
    render(<LanguageProvider><Probe /></LanguageProvider>);
    fireEvent.click(screen.getByText('go-ar'));
    expect(screen.getByTestId('lang')).toHaveTextContent('ar');
    expect(screen.getByTestId('dir')).toHaveTextContent('rtl');
    expect(screen.getByTestId('text')).toHaveTextContent('رجوع');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('persists the chosen language to localStorage and restores it on remount', () => {
    const { unmount } = render(<LanguageProvider><Probe /></LanguageProvider>);
    fireEvent.click(screen.getByText('go-ar'));
    expect(localStorage.getItem('fbw-lang')).toBe('ar');
    unmount();

    render(<LanguageProvider><Probe /></LanguageProvider>);
    expect(screen.getByTestId('lang')).toHaveTextContent('ar');
  });

  it('useLanguage works without a provider, defaulting to english', () => {
    render(<Probe />);
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('text')).toHaveTextContent('Back');
  });
});
