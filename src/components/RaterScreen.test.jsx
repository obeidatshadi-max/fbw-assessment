import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RaterScreen from './RaterScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';
import { RATER_ITEMS } from '../data/raterItems.js';

function renderScreen(props) {
  return render(
    <LanguageProvider>
      <RaterScreen answers={RATER_ITEMS.map(() => null)} onSelect={() => {}} onSubmit={() => {}} error={null} {...props} />
    </LanguageProvider>
  );
}

describe('RaterScreen', () => {
  it('shows the invalid-link message when status is invalid', () => {
    renderScreen({ status: 'invalid' });
    expect(screen.getByText('This link is not available')).toBeInTheDocument();
  });

  it('renders all 12 rater items and disables submit until all are answered', () => {
    renderScreen({ status: 'form' });
    expect(screen.getAllByText('Rarely').length).toBe(RATER_ITEMS.length);
    expect(screen.getByText('Submit feedback')).toBeDisabled();
  });

  it('enables submit once every item has an answer', () => {
    renderScreen({ status: 'form', answers: RATER_ITEMS.map(() => 2) });
    expect(screen.getByText('Submit feedback')).not.toBeDisabled();
  });

  it('calls onSelect with item index and value', () => {
    const onSelect = vi.fn();
    renderScreen({ status: 'form', onSelect });
    screen.getAllByText('Often')[0].click();
    expect(onSelect).toHaveBeenCalledWith(0, 3);
  });

  it('shows the thank-you message when status is done', () => {
    renderScreen({ status: 'done' });
    expect(screen.getByText('Thank you')).toBeInTheDocument();
  });
});
