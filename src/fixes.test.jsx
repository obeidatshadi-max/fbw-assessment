// Regression tests for the functionality/technical review of 2026-10-05.
// Each test pins one bug that was found in the running app or in the code.
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import App from './App.jsx';
import ManagerApp from './ManagerApp.jsx';
import AuthPanel from './components/AuthPanel.jsx';
import IntroScreen from './components/IntroScreen.jsx';
import ManagerScreen, { roleLabel } from './components/ManagerScreen.jsx';
import SessionLiveScreen from './components/SessionLiveScreen.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import { t as translate, tf as translateF } from './i18n/translations.js';
import { SCENARIOS } from './data/scenarios.js';
import { ORG_ITEMS } from './data/orgItems.js';
import { COMPLIANCE_ITEMS } from './data/complianceItems.js';
import { DIM } from './data/dimensions.js';
import { buildReportData } from './lib/scoring.js';
import { copyToClipboard } from './lib/clipboard.js';
import { localizeAuthError } from './lib/authErrors.js';

const en = (key) => translate('en', key);

// LanguageProvider persists the chosen language in localStorage, so the test
// that switches to Arabic would otherwise leak "ar" into every later test.
afterEach(() => { try { localStorage.clear(); } catch { /* storage unavailable */ } });

async function completeFullFlow() {
  fireEvent.click(screen.getByText('Start the reflection'));
  for (let i = 0; i < SCENARIOS.length; i++) {
    fireEvent.click(screen.getAllByText('Most like me')[0]);
    fireEvent.click(screen.getAllByText('Least like me')[1]);
    fireEvent.click(screen.getByText(i === SCENARIOS.length - 1 ? 'Continue to workplace' : 'Next'));
  }
  for (let i = 0; i < ORG_ITEMS.length; i++) fireEvent.click(screen.getAllByText('Often')[i]);
  fireEvent.click(screen.getByText('Continue'));
  for (let i = 0; i < COMPLIANCE_ITEMS.length; i++) fireEvent.click(screen.getAllByText('Often')[i]);
  fireEvent.click(screen.getByText('See my report'));
  await screen.findByText('The Function · Being · Will Matrix');
}

function makeSavingAdapter(extra = {}) {
  let authCallback;
  const adapter = {
    signInWithPassword: vi.fn().mockResolvedValue({ success: true }),
    signUpWithPassword: vi.fn().mockResolvedValue({ success: true }),
    saveAssessment: vi.fn().mockResolvedValue({ success: true, assessmentId: 'assess-1' }),
    exportMyData: vi.fn().mockResolvedValue({ success: true, data: { ok: true } }),
    getSession: vi.fn().mockResolvedValue(null),
    onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
    triggerAuth: (session) => authCallback(session),
    ...extra,
  };
  return adapter;
}

describe('report language switch', () => {
  it('re-renders the generated report sentences when the language changes on the report screen', async () => {
    render(<LanguageProvider initialLang="en"><App /></LanguageProvider>);
    fireEvent.change(screen.getByLabelText('Your role'), { target: { value: 'general' } });
    await completeFullFlow();

    const answers = SCENARIOS.map(() => ({ most: 0, least: 1 }));
    const org = ORG_ITEMS.map(() => 3);
    const comp = COMPLIANCE_ITEMS.map(() => 3);
    const enReport = buildReportData(answers, org, SCENARIOS, ORG_ITEMS, DIM, 'en', comp);
    const arReport = buildReportData(answers, org, SCENARIOS, ORG_ITEMS, DIM, 'ar', comp);
    expect(screen.getByText(enReport.summaryInsight.head)).toBeInTheDocument();

    fireEvent.click(screen.getByText('AR'));

    // The insight headline, the profile role labels and the compliance heading
    // are generated text; they used to stay English after the switch.
    expect(await screen.findByText(arReport.summaryInsight.head)).toBeInTheDocument();
    expect(screen.queryByText(enReport.summaryInsight.head)).not.toBeInTheDocument();
    expect(screen.getAllByText(arReport.compliance.head).length).toBeGreaterThan(0);
    expect(screen.queryByText(enReport.rankLines[0].role)).not.toBeInTheDocument();
  });
});

describe('saving only happens when the person asks', () => {
  it('does not save when a stored session replays before any sign-in click', async () => {
    const adapter = makeSavingAdapter();
    render(<App authAdapter={adapter} />);
    await completeFullFlow();

    // supabase-js replays the stored session to new subscribers; this must not save.
    await act(async () => { await adapter.triggerAuth({ user: { id: 'returning-user' } }); });

    expect(adapter.saveAssessment).not.toHaveBeenCalled();
  });

  it('still saves after the person presses Sign in', async () => {
    const adapter = makeSavingAdapter();
    render(<App authAdapter={adapter} />);
    await completeFullFlow();
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByLabelText('Store my results so I can see this report again'));
    fireEvent.click(screen.getByText('Sign in'));
    await act(async () => { await adapter.triggerAuth({ user: { id: 'user-1' } }); });
    expect(adapter.saveAssessment).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
  });
});

describe('download my data', () => {
  afterEach(() => vi.restoreAllMocks());

  it('is wired from the report screen through to the adapter', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const adapter = makeSavingAdapter();
    render(<App authAdapter={adapter} />);
    await completeFullFlow();
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByLabelText('Store my results so I can see this report again'));
    fireEvent.click(screen.getByText('Sign in'));
    await act(async () => { await adapter.triggerAuth({ user: { id: 'user-1' } }); });

    fireEvent.click(await screen.findByText(en('auth.exportDataLink')));
    await waitFor(() => expect(adapter.exportMyData).toHaveBeenCalledWith({ userId: 'user-1' }));
  });

  it('shows an error instead of hanging when no export handler is supplied', async () => {
    render(<AuthPanel authState={{ status: 'saved' }} />);
    fireEvent.click(screen.getByText(en('auth.exportDataLink')));
    expect(await screen.findByText(en('auth.exportError'))).toBeInTheDocument();
  });
});

describe('delete account confirmation', () => {
  it('accepts the word in any case with stray spaces', () => {
    render(<AuthPanel authState={{ status: 'saved' }} onDeleteAccount={vi.fn()} />);
    fireEvent.click(screen.getByText(en('auth.deleteAccountLink')));
    const button = screen.getByText(en('auth.deleteButton'));
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(en('auth.deleteConfirmLabel')), { target: { value: ' delete ' } });
    expect(button).not.toBeDisabled();
  });
});

describe('copyToClipboard', () => {
  const original = navigator.clipboard;
  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
    delete document.execCommand;
    vi.restoreAllMocks();
  });

  it('uses the async clipboard API when present', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    expect(await copyToClipboard('abc')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('abc');
  });

  it('falls back to execCommand when the API is missing (insecure origin, old WebView)', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    document.execCommand = vi.fn(() => true);
    expect(await copyToClipboard('abc')).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('falls back when the API rejects, and reports failure rather than throwing', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) }, configurable: true });
    document.execCommand = vi.fn(() => false);
    expect(await copyToClipboard('abc')).toBe(false);
  });
});

describe('localizeAuthError', () => {
  it('replaces raw English credential errors with the translated fallback', () => {
    expect(localizeAuthError('Invalid login credentials', 'FALLBACK')).toBe('FALLBACK');
    expect(localizeAuthError('Sign-in is not configured yet.', 'FALLBACK')).toBe('FALLBACK');
    expect(localizeAuthError(undefined, 'FALLBACK')).toBe('FALLBACK');
  });
  it('swaps the rate-limit message for the translated one when provided', () => {
    expect(localizeAuthError('Too many attempts. Try again later.', 'FALLBACK', 'LIMITED')).toBe('LIMITED');
    // without a translation it is left alone rather than shown as a credentials error
    expect(localizeAuthError('Too many attempts. Try again later.', 'FALLBACK')).toBe('Too many attempts. Try again later.');
  });
  it('keeps specific messages the user can act on', () => {
    expect(localizeAuthError('Password must be 8-128 characters.', 'FALLBACK')).toBe('Password must be 8-128 characters.');
  });
});

describe('role breakdown labels', () => {
  const L = (v) => v.en;
  it('shows the role label instead of the stored id', () => {
    expect(roleLabel('sales', L)).toBe('Sales / Medical Rep');
    expect(roleLabel('unspecified', L)).toBe('—');
    expect(roleLabel('legacy-role', L)).toBe('legacy-role');
  });
});

describe('join code on the intro screen', () => {
  it('holds the Start button while a code is being checked so a valid code is not dropped', async () => {
    let resolveCheck;
    const authAdapter = { validateCode: vi.fn(() => new Promise(r => { resolveCheck = r; })) };
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);

    fireEvent.click(screen.getByText(en('team.codeLabel')));
    fireEvent.change(screen.getByPlaceholderText(en('team.codePlaceholder')), { target: { value: 'ABC123' } });
    const start = screen.getByText(en('intro.start'));
    expect(start).toBeDisabled();

    await act(async () => { resolveCheck({ valid: true, kind: 'team', id: 'team-1' }); });
    await waitFor(() => expect(start).not.toBeDisabled());
    fireEvent.click(start);
    expect(onStart).toHaveBeenCalledWith('sales', { kind: 'team', id: 'team-1' });
  });
});

describe('manager / facilitator sign-out', () => {
  it('signs out and returns to the sign-in form so a shared laptop is not left signed in', async () => {
    let authCallback = () => {};
    const authAdapter = {
      signInWithPassword: vi.fn(),
      signUpWithPassword: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ success: true }),
      onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
      listTeams: vi.fn().mockResolvedValue({ success: true, teams: [] }),
    };
    render(<LanguageProvider><ManagerApp authAdapter={authAdapter} /></LanguageProvider>);
    await act(async () => { authCallback({ user: { id: 'u1' } }); });
    fireEvent.click(await screen.findByText(en('manager.signOut')));
    await waitFor(() => expect(authAdapter.signOut).toHaveBeenCalled());
    expect(await screen.findByText(en('team.signInHeading'))).toBeInTheDocument();
  });
});

describe('anonymity gate shown to managers and facilitators', () => {
  const dim = DIM;
  const base = { dim, createStatus: 'idle' };

  it('shows the minimum the server reports for a team (not a hard-coded 3)', () => {
    render(
      <LanguageProvider>
        <ManagerScreen {...base} authState={{ status: 'signedIn' }} team={{ id: 't', name: 'Team A', joinCode: 'ABC123' }} teams={[]} summary={{ count: 2, minGroupSize: 5, distribution: null, roleBreakdown: null }} />
      </LanguageProvider>
    );
    expect(screen.getByText(translateF('en', 'team.countWaiting', { count: 2, min: 5 }))).toBeInTheDocument();
  });

  it('shows the minimum the server reports for a live session', () => {
    render(
      <LanguageProvider>
        <SessionLiveScreen {...base} session={{ id: 's', name: 'Workshop', joinCode: 'XYZ789' }} summary={{ count: 1, minGroupSize: 6, distribution: null, roleBreakdown: null }} ended={false} />
      </LanguageProvider>
    );
    expect(screen.getByText(translateF('en', 'session.countWaiting', { count: 1, min: 6 }))).toBeInTheDocument();
  });

  it('falls back to 5 when an older server does not report a minimum', () => {
    render(
      <LanguageProvider>
        <ManagerScreen {...base} authState={{ status: 'signedIn' }} team={{ id: 't', name: 'Team A', joinCode: 'ABC123' }} teams={[]} summary={{ count: 0, distribution: null, roleBreakdown: null }} />
      </LanguageProvider>
    );
    expect(screen.getByText(translateF('en', 'team.countWaiting', { count: 0, min: 5 }))).toBeInTheDocument();
  });
});
