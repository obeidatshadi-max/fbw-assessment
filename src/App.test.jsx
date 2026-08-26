import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App.jsx';
import { SCENARIOS } from './data/scenarios.js';
import { SCENARIO_SETS } from './data/scenarioSets.js';
import { ORG_ITEMS } from './data/orgItems.js';
import { COMPLIANCE_ITEMS } from './data/complianceItems.js';
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
  fireEvent.click(screen.getByText('Continue'));

  for (let i = 0; i < COMPLIANCE_ITEMS.length; i++) {
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
    const expectedComplianceAnswers = COMPLIANCE_ITEMS.map(() => 3);
    const expected = buildReportData(expectedAnswers, expectedOrgAnswers, SCENARIOS, ORG_ITEMS, DIM, 'en', expectedComplianceAnswers);

    expect(screen.getByText('The Function · Being · Will Matrix')).toBeInTheDocument();
    // the dominant dimension's label legitimately appears more than once on the
    // report (intro line, rank line, profile heading) — assert presence, not uniqueness
    expect(screen.getAllByText(DIM[expected.dominant].label.en, { exact: false }).length).toBeGreaterThan(0);
  });

  it('shows the compliance courage line inside the Will profile block', () => {
    render(<App />);
    completeFullFlow();
    expect(screen.getByText('Compliance courage')).toBeInTheDocument();
    expect(screen.getByText('A strength to protect.')).toBeInTheDocument();
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

  it('loads the role-specific scenario set once a non-default role is chosen', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Your role'), { target: { value: 'product_manager' } });
    fireEvent.click(screen.getByText('Start the reflection'));

    const pmScenarios = SCENARIO_SETS.product_manager;
    expect(pmScenarios).not.toEqual(SCENARIOS);
    expect(screen.getByText(pmScenarios[0].s.en)).toBeInTheDocument();
    expect(screen.getByText('Situation 1 of 15')).toBeInTheDocument();
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

    await act(async () => {
      await authCallback({ user: { id: 'user-123' } });
    });

    expect(saveAssessment).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-123' }));
    expect(await screen.findByText('Saved to your account.', { exact: false })).toBeInTheDocument();
  });
});
