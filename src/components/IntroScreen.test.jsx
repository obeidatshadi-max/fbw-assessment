// src/components/IntroScreen.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IntroScreen from './IntroScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

describe('IntroScreen', () => {
  it('renders the heading and the three dimensions', () => {
    render(<IntroScreen onStart={() => {}} />);
    expect(screen.getByText('Where do you lead from?')).toBeInTheDocument();
    expect(screen.getByText('Function')).toBeInTheDocument();
    expect(screen.getByText('Being')).toBeInTheDocument();
    expect(screen.getByText('Will')).toBeInTheDocument();
  });

  it('calls onStart when the start button is clicked', () => {
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} />);
    screen.getByText('Start the reflection').click();
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('renders in French when the language context is set to fr', () => {
    render(<LanguageProvider initialLang="fr"><IntroScreen onStart={() => {}} /></LanguageProvider>);
    expect(screen.getByText("D'où dirigez-vous ?")).toBeInTheDocument();
    expect(screen.getByText('Commencer la réflexion')).toBeInTheDocument();
  });
});
