// src/components/IntroScreen.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IntroScreen from './IntroScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';
import { DEFAULT_ROLE } from '../data/roles.js';

describe('IntroScreen', () => {
  it('renders the heading and the three dimensions', () => {
    render(<IntroScreen onStart={() => {}} />);
    expect(screen.getByText('Where do you lead from?')).toBeInTheDocument();
    expect(screen.getByText('Function')).toBeInTheDocument();
    expect(screen.getByText('Being')).toBeInTheDocument();
    expect(screen.getByText('Will')).toBeInTheDocument();
  });

  it('calls onStart with the default role when the start button is clicked without changing role', () => {
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} />);
    screen.getByText('Start the reflection').click();
    expect(onStart).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE);
  });

  it('calls onStart with the selected role, and shows a draft note for drafted roles', () => {
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} />);
    expect(screen.queryByText(/early draft for this role/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Your role'), { target: { value: 'product_manager' } });
    expect(screen.getByText(/early draft for this role/)).toBeInTheDocument();

    screen.getByText('Start the reflection').click();
    expect(onStart).toHaveBeenCalledWith('product_manager');
  });

  it('renders in French when the language context is set to fr', () => {
    render(<LanguageProvider initialLang="fr"><IntroScreen onStart={() => {}} /></LanguageProvider>);
    expect(screen.getByText("D'où dirigez-vous ?")).toBeInTheDocument();
    expect(screen.getByText('Commencer la réflexion')).toBeInTheDocument();
  });
});
