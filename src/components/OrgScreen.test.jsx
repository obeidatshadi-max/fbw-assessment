// src/components/OrgScreen.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrgScreen from './OrgScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

const items = [
  { t: 'Results and performance get the most attention here.', d: 'F' },
  { t: 'People feel safe to be themselves here.', d: 'B' },
];

describe('OrgScreen', () => {
  it('renders every item with three answer buttons', () => {
    render(<OrgScreen items={items} answers={[null, null]} onSelect={() => {}} />);
    expect(screen.getByText('1. Results and performance get the most attention here.')).toBeInTheDocument();
    expect(screen.getAllByText('Often')).toHaveLength(2);
  });

  it('calls onSelect with the item index and value', () => {
    const onSelect = vi.fn();
    render(<OrgScreen items={items} answers={[null, null]} onSelect={onSelect} />);
    screen.getAllByText('Sometimes')[0].click();
    expect(onSelect).toHaveBeenCalledWith(0, 2);
  });

  it('marks the selected answer as on', () => {
    render(<OrgScreen items={items} answers={[3, null]} onSelect={() => {}} />);
    expect(screen.getAllByText('Often')[0]).toHaveClass('on');
  });

  it('renders the answer scale labels in French', () => {
    render(<LanguageProvider initialLang="fr"><OrgScreen items={items} answers={[null, null]} onSelect={() => {}} /></LanguageProvider>);
    expect(screen.getAllByText('Souvent').length).toBeGreaterThan(0);
    expect(screen.getByText('Votre environnement de travail')).toBeInTheDocument();
  });
});
