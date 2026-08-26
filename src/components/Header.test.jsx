import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from './Header.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

describe('Header', () => {
  it('shows the step label', () => {
    render(<Header stepLabel="Situation 3 of 15" done={2} total={24} final={false} />);
    expect(screen.getByText('Situation 3 of 15')).toBeInTheDocument();
  });

  it('renders the brand name', () => {
    render(<Header stepLabel="" done={0} total={24} final={false} />);
    expect(screen.getByText('Function · Being · Will')).toBeInTheDocument();
  });

  it('switches the brand name and marks the active language when a language button is clicked', () => {
    render(<LanguageProvider><Header stepLabel="" done={0} total={24} final={false} /></LanguageProvider>);
    expect(screen.getByText('EN')).toHaveClass('on');
    fireEvent.click(screen.getByText('AR'));
    expect(screen.getByText('الوظيفة · الكينونة · الإرادة')).toBeInTheDocument();
    expect(screen.getByText('AR')).toHaveClass('on');
  });
});
