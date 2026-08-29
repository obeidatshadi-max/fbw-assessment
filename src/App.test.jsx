import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
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
      signInWithPassword: vi.fn().mockResolvedValue({ success: true }),
      signUpWithPassword: vi.fn().mockResolvedValue({ success: true }),
      saveAssessment,
      getSession: vi.fn().mockResolvedValue(null),
      onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
    };

    render(<App authAdapter={fakeAdapter} />);
    completeFullFlow();

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByText('Sign in'));

    await act(async () => {
      await authCallback({ user: { id: 'user-123' } });
    });

    expect(saveAssessment).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-123' }));
    expect(await screen.findByText('Saved to your account.', { exact: false })).toBeInTheDocument();
  });

  it('generates a rater link and shows the gap card once enough responses exist', async () => {
    let authCallback;
    const fakeAdapter = {
      signInWithPassword: vi.fn().mockResolvedValue({ success: true }),
      signUpWithPassword: vi.fn().mockResolvedValue({ success: true }),
      saveAssessment: vi.fn().mockResolvedValue({ success: true, assessmentId: 'assess-1' }),
      getSession: vi.fn().mockResolvedValue(null),
      onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
      createRaterLink: vi.fn().mockResolvedValue({ success: true, linkId: 'link-1' }),
      get360Summary: vi.fn().mockResolvedValue({ success: true, count: 3, scores: { F: 6, B: 6, W: 3, C: 3 } }),
    };

    render(<App authAdapter={fakeAdapter} />);
    completeFullFlow();

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByText('Sign in'));
    await act(async () => { await authCallback({ user: { id: 'user-123' } }); });

    fireEvent.click(await screen.findByText('Generate feedback link'));
    expect(await screen.findByDisplayValue(/\/rate\/link-1$/)).toBeInTheDocument();
    expect(fakeAdapter.createRaterLink).toHaveBeenCalledWith({ assessmentId: 'assess-1', userId: 'user-123' });

    fireEvent.click(screen.getByText('Check for new responses'));
    expect(await screen.findByText('Self vs. others')).toBeInTheDocument();
  });

  it('passes the joined teamId through to saveAssessment', async () => {
    let authCallback;
    const saveAssessment = vi.fn().mockResolvedValue({ success: true });
    const fakeAdapter = {
      signInWithPassword: vi.fn().mockResolvedValue({ success: true }),
      signUpWithPassword: vi.fn().mockResolvedValue({ success: true }),
      saveAssessment,
      getSession: vi.fn().mockResolvedValue(null),
      onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
      validateCode: vi.fn().mockResolvedValue({ valid: true, kind: 'team', id: 'team-9' }),
    };

    render(<App authAdapter={fakeAdapter} />);
    fireEvent.click(screen.getByText('Have a code?'));
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'ab12cd' } });
    await waitFor(() => expect(fakeAdapter.validateCode).toHaveBeenCalled());
    await screen.findByText('Joined — your result will count toward this team.');
    completeFullFlow();

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByText('Sign in'));
    await act(async () => { await authCallback({ user: { id: 'user-123' } }); });

    expect(saveAssessment).toHaveBeenCalledWith(expect.objectContaining({ teamId: 'team-9', sessionId: null }));
  });

  it('passes the joined sessionId through to saveAssessment', async () => {
    let authCallback;
    const saveAssessment = vi.fn().mockResolvedValue({ success: true });
    const fakeAdapter = {
      signInWithPassword: vi.fn().mockResolvedValue({ success: true }),
      signUpWithPassword: vi.fn().mockResolvedValue({ success: true }),
      saveAssessment,
      getSession: vi.fn().mockResolvedValue(null),
      onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
      validateCode: vi.fn().mockResolvedValue({ valid: true, kind: 'session', id: 'sess-9' }),
    };

    render(<App authAdapter={fakeAdapter} />);
    fireEvent.click(screen.getByText('Have a code?'));
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'ab12cd' } });
    await waitFor(() => expect(fakeAdapter.validateCode).toHaveBeenCalled());
    await screen.findByText('Joined — your result will count toward this live session.');
    completeFullFlow();

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByText('Sign in'));
    await act(async () => { await authCallback({ user: { id: 'user-123' } }); });

    expect(saveAssessment).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'sess-9', teamId: null }));
  });
});
