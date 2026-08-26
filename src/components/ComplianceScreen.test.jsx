// src/components/ComplianceScreen.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ComplianceScreen from './ComplianceScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

const items = [
  { t: 'I speak up when something feels off.', d: 'W' },
  { t: 'I report an adverse event promptly.', d: 'W' },
];

describe('ComplianceScreen', () => {
  it('renders every item with three answer buttons and the self-reflection note', () => {
    render(<ComplianceScreen items={items} answers={[null, null]} onSelect={() => {}} />);
    expect(screen.getByText('1. I speak up when something feels off.')).toBeInTheDocument();
    expect(screen.getAllByText('Often')).toHaveLength(2);
    expect(screen.getByText('This is self-reflection, not a compliance assessment or an audit.')).toBeInTheDocument();
  });

  it('calls onSelect with the item index and value', () => {
    const onSelect = vi.fn();
    render(<ComplianceScreen items={items} answers={[null, null]} onSelect={onSelect} />);
    screen.getAllByText('Sometimes')[0].click();
    expect(onSelect).toHaveBeenCalledWith(0, 2);
  });

  it('marks the selected answer as on', () => {
    render(<ComplianceScreen items={items} answers={[3, null]} onSelect={() => {}} />);
    expect(screen.getAllByText('Often')[0]).toHaveClass('on');
  });

  it('renders in French', () => {
    render(<LanguageProvider initialLang="fr"><ComplianceScreen items={items} answers={[null, null]} onSelect={() => {}} /></LanguageProvider>);
    expect(screen.getByText('Courage de conformité')).toBeInTheDocument();
    expect(screen.getAllByText('Souvent').length).toBeGreaterThan(0);
  });
});
