import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RaterApp from './RaterApp.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import { RATER_ITEMS } from './data/raterItems.js';

function makeAdapter(overrides = {}) {
  return {
    validateRaterLink: vi.fn().mockResolvedValue({ valid: true }),
    submitRaterResponse: vi.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };
}

describe('RaterApp', () => {
  it('validates the link on mount and shows the form when valid', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><RaterApp linkId="abc" authAdapter={authAdapter} /></LanguageProvider>);
    await waitFor(() => expect(screen.getByText('Submit feedback')).toBeInTheDocument());
    expect(authAdapter.validateRaterLink).toHaveBeenCalledWith({ linkId: 'abc' });
  });

  it('shows the invalid message when the link does not validate', async () => {
    const authAdapter = makeAdapter({ validateRaterLink: vi.fn().mockResolvedValue({ valid: false }) });
    render(<LanguageProvider><RaterApp linkId="bad" authAdapter={authAdapter} /></LanguageProvider>);
    await waitFor(() => expect(screen.getByText('This link is not available')).toBeInTheDocument());
  });

  it('submits scored answers and shows the thank-you screen', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><RaterApp linkId="abc" authAdapter={authAdapter} /></LanguageProvider>);
    await waitFor(() => expect(screen.getByText('Submit feedback')).toBeInTheDocument());

    RATER_ITEMS.forEach((_, i) => {
      fireEvent.click(screen.getAllByText('Often')[i]);
    });
    fireEvent.click(screen.getByText('Submit feedback'));

    await waitFor(() => expect(screen.getByText('Thank you')).toBeInTheDocument());
    expect(authAdapter.submitRaterResponse).toHaveBeenCalledWith({
      linkId: 'abc',
      scores: { F: 9, B: 9, W: 9, C: 9 },
    });
  });

  it('shows an error and stays on the form when submission fails', async () => {
    const authAdapter = makeAdapter({ submitRaterResponse: vi.fn().mockResolvedValue({ success: false, error: 'nope' }) });
    render(<LanguageProvider><RaterApp linkId="abc" authAdapter={authAdapter} /></LanguageProvider>);
    await waitFor(() => expect(screen.getByText('Submit feedback')).toBeInTheDocument());

    RATER_ITEMS.forEach((_, i) => {
      fireEvent.click(screen.getAllByText('Often')[i]);
    });
    fireEvent.click(screen.getByText('Submit feedback'));

    await waitFor(() => expect(screen.getByText('nope')).toBeInTheDocument());
  });
});
