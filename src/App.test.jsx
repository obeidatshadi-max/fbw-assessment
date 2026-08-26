import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App.jsx';
import { SCENARIOS } from './data/scenarios.js';
import { ORG_ITEMS } from './data/orgItems.js';
import { DIM } from './data/dimensions.js';
import { buildReportData } from './lib/scoring.js';

function completeFullFlow() {
  fireEvent.click(screen.getByText('Start the reflection'));

  for (let i = 0; i < SCENARIOS.length; i++) {
    const mostChips = screen.getAllByText('Most like me');
    const leastChips = screen.getAllByText('Least like me');
    fireEvent.click(mostChips[0]);
    fireEvent.click(leastChips[1]);
    const nextLabel = i === SCENARIOS.length - 1 ? 'Continue to workplace' : 'Next';
    fireEvent.click(screen.getByText(nextLabel));
  }

  for (let i = 0; i < ORG_ITEMS.length; i++) {
    const oftenButtons = screen.getAllByText('Often');
    fireEvent.click(oftenButtons[i]);
  }
  fireEvent.click(screen.getByText('See my report'));
}

describe('App', () => {
  it('walks the full flow and renders a report matching buildReportData directly', () => {
    render(<App />);
    completeFullFlow();

    const expectedAnswers = SCENARIOS.map(() => ({ most: 0, least: 1 }));
    const expectedOrgAnswers = ORG_ITEMS.map(() => 3);
    const expected = buildReportData(expectedAnswers, expectedOrgAnswers, SCENARIOS, ORG_ITEMS, DIM);

    expect(screen.getByText('The Function · Being · Will Matrix')).toBeInTheDocument();
    // the dominant dimension's label legitimately appears more than once on the
    // report (intro line, rank line, profile heading) — assert presence, not uniqueness
    expect(screen.getAllByText(DIM[expected.dominant].label, { exact: false }).length).toBeGreaterThan(0);
  });

  it('restarts back to the intro screen', () => {
    render(<App />);
    completeFullFlow();
    fireEvent.click(screen.getByText('Start again'));
    expect(screen.getByText('Where do you lead from?')).toBeInTheDocument();
  });

  it('keeps the next button disabled until both most and least are chosen', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(screen.getByText('Next')).toBeDisabled();
    fireEvent.click(screen.getAllByText('Most like me')[0]);
    expect(screen.getByText('Next')).toBeDisabled();
    fireEvent.click(screen.getAllByText('Least like me')[1]);
    expect(screen.getByText('Next')).toBeEnabled();
  });
});

describe('App with a fake auth adapter', () => {
  it('saves the assessment once a session appears after the report is built', async () => {
    let authCallback;
    const saveAssessment = vi.fn().mockResolvedValue({ success: true });
    const fakeAdapter = {
      signInWithEmail: vi.fn().mockResolvedValue({ success: true }),
      saveAssessment,
      getSession: vi.fn().mockResolvedValue(null),
      onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
    };

    render(<App authAdapter={fakeAdapter} />);
    completeFullFlow();

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Send link'));

    await authCallback({ user: { id: 'user-123' } });

    expect(saveAssessment).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-123' }));
    expect(await screen.findByText('Saved to your account.', { exact: false })).toBeInTheDocument();
  });
});
