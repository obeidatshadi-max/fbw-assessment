# Prompt 8 Sub-project 1: Consent + Privacy-Notice Gate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an explicit, granular consent step before any FBW self-assessment result is stored — closing the current gap where signing in silently saves results with no privacy notice — and record three separate opt-ins (store, longitudinal-track, share-with-manager) that later sub-projects will read.

**Architecture:** A new `fbw_consents` table (one row per profile) gates the existing `saveAssessment()` write path in `authAdapter.js`: the save now checks for a current, `store_results = true` consent row before touching `fbw_assessments`, and returns a `needsConsent` signal instead of silently failing when consent is missing or stale. `AuthPanel.jsx` grows the checkboxes for the normal sign-in path; a new `needsConsent` auth-state branch handles the edge case of an already-authenticated (restored) session with no fresh consent this browser session. `App.jsx` orchestrates: it threads consent captured at sign-in time through to the save, or shows the standalone consent screen when there's nothing to thread.

**Tech Stack:** React (no router lib — see `CLAUDE.md`), Supabase (Postgres + RLS) in the shared `madarlead-assessment` project, Vitest + Testing Library for component/unit tests.

**Spec:** `docs/superpowers/specs/2026-08-30-prompt8-consent-gate-design.md`

## Global Constraints

- Consent is **granular, per-purpose**: `store_results` (required to save at all), `longitudinal_tracking` (optional), `share_with_manager` (optional) — three independent booleans, not one blanket flag.
- The gate covers the **existing default save**, not just new features — every path that writes to `fbw_assessments` must go through the consent check.
- Consent is enforced **at the write path** (inside `saveAssessment` in `authAdapter.js`), not left to the UI alone.
- No retroactive backfill or compliance claim about already-stored past assessments — out of scope.
- `notice_version` is a plain string constant, bumped only when the notice text changes materially; a stale or missing version means the user must re-consent before the next save.
- New/changed UI copy needs both EN and AR (`src/i18n/translations.js`, `LANGS = ['en', 'ar']`) — the existing `translation completeness` test in `src/i18n/translations.test.js` will fail if AR is missing any key EN has.
- Follow existing repo conventions exactly: `fbw_` table prefix, RLS owner-only policies matching `fbw_assessments`' pattern, `noopAuthAdapter` fail-safe methods mirrored 1:1 with `supabaseAuthAdapter`.

---

### Task 1: Migration — `fbw_consents` table

**Files:**
- Create: `supabase/migrations/0008_fbw_consents.sql`

**Interfaces:**
- Produces: table `fbw_consents(profile_id uuid PK/FK, store_results bool, longitudinal_tracking bool, share_with_manager bool, notice_version text, consented_at timestamptz)`, referenced by Task 3's `authAdapter.js` queries.

This repo has no automated migration-testing harness (migrations are applied manually via the Supabase SQL editor/CLI against the shared `madarlead-assessment` project — same as every prior `fbw_*` migration). Verification here is a manual SQL check, not a vitest run.

- [ ] **Step 1: Write the migration file**

```sql
-- 0008_fbw_consents.sql
-- Prompt 8 sub-project 1: explicit consent + privacy-notice gate.
--
-- Closes a real gap: every signed-in self-assessment has been saving to
-- fbw_assessments (see 0002_fbw_360.sql) with no consent step or privacy
-- notice at all. From here on, authAdapter.saveAssessment() (Task 3)
-- checks this table before writing any result.
--
-- Three independent purposes, not one blanket flag:
--   store_results        — required to save anything at all.
--   longitudinal_tracking — optional; read by a future sub-project that
--                           lets a person see their own change over time.
--   share_with_manager    — optional; read by a future talent-review
--                           export sub-project.
--
-- notice_version lets a returning user be re-prompted only when the
-- notice text actually changes, not on every save (see src/lib/consent.js).

create table fbw_consents (
  profile_id uuid primary key references fbw_profiles(id) on delete cascade,
  store_results boolean not null default false,
  longitudinal_tracking boolean not null default false,
  share_with_manager boolean not null default false,
  notice_version text not null,
  consented_at timestamptz not null default now()
);

alter table fbw_consents enable row level security;

create policy "read own consent" on fbw_consents
  for select using (auth.uid() = profile_id);

create policy "insert own consent" on fbw_consents
  for insert with check (auth.uid() = profile_id);

create policy "update own consent" on fbw_consents
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
```

- [ ] **Step 2: Apply the migration to the shared Supabase project**

Apply via the Supabase SQL editor for project `kkhkxjvipamajvawxzpc` (or `supabase db push` if the CLI is linked locally), pasting the file's contents.

- [ ] **Step 3: Manually verify RLS is active and correct**

In the Supabase SQL editor, run:

```sql
select tablename, rowsecurity from pg_tables where tablename = 'fbw_consents';
select policyname, cmd, qual, with_check from pg_policies where tablename = 'fbw_consents';
```

Expected: `rowsecurity = true`; exactly 3 policies (`read own consent` / SELECT, `insert own consent` / INSERT, `update own consent` / UPDATE), each scoped to `auth.uid() = profile_id`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0008_fbw_consents.sql
git commit -m "feat: add fbw_consents table for Prompt 8 consent gate"
```

---

### Task 2: Consent copy — version constant + i18n keys

**Files:**
- Create: `src/lib/consent.js`
- Modify: `src/i18n/translations.js:190-191` (EN `auth` block) and `:436-437` (AR `auth` block)
- Test: `src/i18n/translations.test.js` (existing `translation completeness` test — no new test file needed, just must keep passing)

**Interfaces:**
- Produces: `CURRENT_NOTICE_VERSION` (string constant), imported by Task 3's `authAdapter.js`.
- Produces: i18n keys `auth.consentNotice`, `auth.consentStoreLabel`, `auth.consentLongitudinalLabel`, `auth.consentShareLabel`, `auth.consentContinue`, `auth.needsConsentHeading`, `auth.needsConsentBody`, used by Task 4's `AuthPanel.jsx` via `t('auth.<key>')`.

This is first-draft copy — flag to the user that the notice wording needs their review before real deployment (per `CLAUDE.md`: "any pharma scenario or Arabic wording it drafts is a first draft for you to correct").

- [ ] **Step 1: Create the notice-version constant module**

```js
// src/lib/consent.js
// Bump this string whenever the consent notice text changes materially.
// A returning user whose fbw_consents.notice_version doesn't match this
// value is re-prompted for consent before their next save (see
// authAdapter.saveAssessment and App.jsx's attemptSave).
export const CURRENT_NOTICE_VERSION = '2026-08-30';
```

- [ ] **Step 2: Add the EN consent keys**

In `src/i18n/translations.js`, in the EN `auth` block, insert after the `resetError` line (currently line 190, right before the block's closing `},`):

```js
      consentNotice: 'Choose what happens with your results before you continue. This is separate from your account password.',
      consentStoreLabel: 'Store my results so I can see this report again',
      consentLongitudinalLabel: 'Track my results over time so I can see my own change',
      consentShareLabel: 'Share a summary with my manager/HR for talent review',
      consentContinue: 'Continue',
      needsConsentHeading: 'Before we save this report',
      needsConsentBody: 'You are signed in. Choose what happens with your results, then continue.',
```

- [ ] **Step 3: Add the matching AR consent keys**

In the AR `auth` block, insert after the `resetError` line (currently line 436, right before the block's closing `},`):

```js
      consentNotice: 'اختر ما سيحدث لنتائجك قبل المتابعة. هذا منفصل عن كلمة مرور حسابك.',
      consentStoreLabel: 'احفظ نتائجي لأتمكن من رؤية هذا التقرير مرة أخرى',
      consentLongitudinalLabel: 'تتبّع نتائجي بمرور الوقت لأرى تطوري',
      consentShareLabel: 'شارك ملخصاً مع مديري أو الموارد البشرية لمراجعة المواهب',
      consentContinue: 'متابعة',
      needsConsentHeading: 'قبل حفظ هذا التقرير',
      needsConsentBody: 'أنت مسجّل الدخول. اختر ما سيحدث لنتائجك، ثم تابع.',
```

- [ ] **Step 4: Run the i18n completeness test to confirm parity**

Run: `npm test -- translations.test.js`
Expected: PASS — the `translation completeness` test walks every EN key and asserts AR has it; a mismatched key name between steps 2 and 3 would fail it here.

- [ ] **Step 5: Commit**

```bash
git add src/lib/consent.js src/i18n/translations.js
git commit -m "feat: add consent notice copy (en/ar) and notice-version constant"
```

---

### Task 3: `authAdapter.js` — consent-gated save + `recordConsent`

**Files:**
- Modify: `src/lib/authAdapter.js:3-58` (`noopAuthAdapter`), `:111-132` (`supabaseAuthAdapter.saveAssessment`)
- Test: `src/lib/authAdapter.test.js`

**Interfaces:**
- Consumes: `CURRENT_NOTICE_VERSION` from `src/lib/consent.js` (Task 2).
- Produces: `authAdapter.recordConsent({ userId, storeResults, longitudinalTracking, shareWithManager }) => Promise<{ success: bool, error?: string }>`, called by Task 6's `App.jsx`.
- Produces: `authAdapter.saveAssessment(...)` (unchanged params) now also returns `{ success: false, error: 'consent_required', needsConsent: true }` when consent is missing/stale — Task 6's `App.jsx` branches on `result.needsConsent`.

- [ ] **Step 1: Write the failing noop test for `recordConsent`**

Add to `src/lib/authAdapter.test.js` (new `describe` block, alongside the existing `noopAuthAdapter` describes):

```js
describe('noopAuthAdapter consent', () => {
  it('recordConsent fails safely when not configured', async () => {
    const result = await noopAuthAdapter.recordConsent({ userId: 'u1', storeResults: true, longitudinalTracking: false, shareWithManager: false });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- authAdapter.test.js`
Expected: FAIL — `noopAuthAdapter.recordConsent is not a function`

- [ ] **Step 3: Add `recordConsent` to `noopAuthAdapter` and the consent gate + `recordConsent` to `supabaseAuthAdapter`**

In `noopAuthAdapter` (after the existing `saveAssessment` noop method, `authAdapter.js:16-18`):

```js
  async recordConsent() {
    return { success: false, error: 'Saving is not configured yet.' };
  },
```

At the top of `src/lib/authAdapter.js`, add the import:

```js
import { CURRENT_NOTICE_VERSION } from './consent.js';
```

Replace `supabaseAuthAdapter.saveAssessment` (currently `authAdapter.js:111-132`) with:

```js
  async saveAssessment({ role, p1Answers, orgAnswers, complianceAnswers, reportData, userId, teamId, sessionId }) {
    if (!supabase) return { success: false, error: 'Saving is not configured yet.' };
    const { data: consentRow, error: consentReadError } = await supabase
      .from('fbw_consents')
      .select('store_results, notice_version')
      .eq('profile_id', userId)
      .maybeSingle();
    if (consentReadError) return { success: false, error: consentReadError.message };
    const hasCurrentConsent = Boolean(
      consentRow && consentRow.store_results === true && consentRow.notice_version === CURRENT_NOTICE_VERSION
    );
    if (!hasCurrentConsent) return { success: false, error: 'consent_required', needsConsent: true };

    const { error: profileError } = await supabase.from('fbw_profiles').upsert({ id: userId }, { ignoreDuplicates: true });
    if (profileError) return { success: false, error: profileError.message };
    const { data, error } = await supabase.from('fbw_assessments').insert({
      profile_id: userId,
      role: role || null,
      team_id: teamId || null,
      session_id: sessionId || null,
      scenario_answers: p1Answers,
      org_answers: orgAnswers,
      compliance_answers: complianceAnswers || null,
      scores: {
        most: reportData.ind.most,
        least: reportData.ind.least,
        org: reportData.org,
        complianceScore: reportData.compliance ? reportData.compliance.score : null,
      },
    }).select('id').single();
    if (error) return { success: false, error: error.message };
    return { success: true, assessmentId: data.id };
  },
  async recordConsent({ userId, storeResults, longitudinalTracking, shareWithManager }) {
    if (!supabase) return { success: false, error: 'Saving is not configured yet.' };
    const { error: profileError } = await supabase.from('fbw_profiles').upsert({ id: userId }, { ignoreDuplicates: true });
    if (profileError) return { success: false, error: profileError.message };
    const { error } = await supabase.from('fbw_consents').upsert({
      profile_id: userId,
      store_results: Boolean(storeResults),
      longitudinal_tracking: Boolean(longitudinalTracking),
      share_with_manager: Boolean(shareWithManager),
      notice_version: CURRENT_NOTICE_VERSION,
      consented_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });
    return error ? { success: false, error: error.message } : { success: true };
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- authAdapter.test.js`
Expected: PASS (all noop tests, including the new `recordConsent` one)

- [ ] **Step 5: Commit**

```bash
git add src/lib/authAdapter.js src/lib/authAdapter.test.js
git commit -m "feat: gate saveAssessment on fbw_consents, add recordConsent"
```

---

### Task 4: `AuthPanel.jsx` — consent checkboxes + `needsConsent` screen

**Files:**
- Modify: `src/components/AuthPanel.jsx` (full rewrite of the render logic)
- Test: `src/components/AuthPanel.test.jsx`

**Interfaces:**
- Consumes: `t('auth.<key>')` from Task 2.
- Consumes props: `authState` (now may have `status: 'needsConsent'`), `onSignIn(email, password, consent)`, `onCreateAccount(email, password, consent)` (signatures grow by one arg — `consent` is `{ storeResults, longitudinalTracking, shareWithManager }`), new prop `onConfirmConsent(consent)`.
- Produces: the same component, now consent-aware, consumed by Task 5's `ReportScreen.jsx`.

- [ ] **Step 1: Update existing tests for the new required-checkbox gate and write new tests**

Replace `src/components/AuthPanel.test.jsx` in full:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthPanel from './AuthPanel.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

function checkStoreConsent() {
  fireEvent.click(screen.getByLabelText('Store my results so I can see this report again'));
}

describe('AuthPanel', () => {
  it('shows the save prompt when anonymous', () => {
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    expect(screen.getByText('Want to save this report', { exact: false })).toBeInTheDocument();
  });

  it('disables sign-in and create-account until the store-results checkbox is checked', () => {
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    expect(screen.getByText('Sign in')).toBeDisabled();
    expect(screen.getByText('Create account')).toBeDisabled();
    checkStoreConsent();
    expect(screen.getByText('Sign in')).not.toBeDisabled();
    expect(screen.getByText('Create account')).not.toBeDisabled();
  });

  it('calls onSignIn with the typed email, password, and consent', () => {
    const onSignIn = vi.fn();
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={onSignIn} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    checkStoreConsent();
    fireEvent.click(screen.getByLabelText('Track my results over time so I can see my own change'));
    fireEvent.click(screen.getByText('Sign in'));
    expect(onSignIn).toHaveBeenCalledWith('a@b.com', 'secret123', { storeResults: true, longitudinalTracking: true, shareWithManager: false });
  });

  it('calls onCreateAccount with the typed email, password, and consent', () => {
    const onCreateAccount = vi.fn();
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={onCreateAccount} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password (min 8 characters)'), { target: { value: 'secret123' } });
    checkStoreConsent();
    fireEvent.click(screen.getByText('Create account'));
    expect(onCreateAccount).toHaveBeenCalledWith('a@b.com', 'secret123', { storeResults: true, longitudinalTracking: false, shareWithManager: false });
  });

  it('calls onRequestReset with the typed email and shows confirmation', async () => {
    const onRequestReset = vi.fn().mockResolvedValue({ success: true });
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={onRequestReset} onConfirmConsent={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Forgot password?'));
    expect(onRequestReset).toHaveBeenCalledWith('a@b.com');
    expect(await screen.findByText('reset link is on its way', { exact: false })).toBeInTheDocument();
  });

  it('shows an error when the reset request fails', async () => {
    const onRequestReset = vi.fn().mockResolvedValue({ success: false });
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={onRequestReset} onConfirmConsent={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Forgot password?'));
    expect(await screen.findByText('Could not send a reset link', { exact: false })).toBeInTheDocument();
  });

  it('shows the saved confirmation', () => {
    render(<AuthPanel authState={{ status: 'saved' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    expect(screen.getByText('Saved to your account.', { exact: false })).toBeInTheDocument();
  });

  it('shows the save prompt in Arabic', () => {
    render(<LanguageProvider initialLang="ar"><AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} /></LanguageProvider>);
    expect(screen.getByText('تريد حفظ هذا التقرير', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument();
  });

  it('shows a standalone consent screen with no email/password fields when status is needsConsent', () => {
    render(<AuthPanel authState={{ status: 'needsConsent', userId: 'u1' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={() => {}} />);
    expect(screen.getByText('Before we save this report')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('you@company.com')).not.toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeDisabled();
  });

  it('calls onConfirmConsent with the checked consent when Continue is clicked', () => {
    const onConfirmConsent = vi.fn();
    render(<AuthPanel authState={{ status: 'needsConsent', userId: 'u1' }} onSignIn={() => {}} onCreateAccount={() => {}} onRequestReset={() => {}} onConfirmConsent={onConfirmConsent} />);
    fireEvent.click(screen.getByLabelText('Store my results so I can see this report again'));
    fireEvent.click(screen.getByLabelText('Share a summary with my manager/HR for talent review'));
    fireEvent.click(screen.getByText('Continue'));
    expect(onConfirmConsent).toHaveBeenCalledWith({ storeResults: true, longitudinalTracking: false, shareWithManager: true });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- AuthPanel.test.jsx`
Expected: FAIL — checkboxes/labels don't exist yet, `onConfirmConsent` prop unused, buttons aren't disabled by consent.

- [ ] **Step 3: Rewrite `AuthPanel.jsx`**

```jsx
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

function ConsentCheckboxes({ consent, onChange, t }) {
  return (
    <div style={{ margin: '4px 0 10px' }}>
      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--muted)' }}>{t('auth.consentNotice')}</p>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '6px 0', fontSize: 13.5 }}>
        <input
          type="checkbox"
          checked={consent.storeResults}
          onChange={e => onChange({ ...consent, storeResults: e.target.checked })}
          style={{ marginTop: 3 }}
        />
        <span>{t('auth.consentStoreLabel')}</span>
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '6px 0', fontSize: 13.5 }}>
        <input
          type="checkbox"
          checked={consent.longitudinalTracking}
          onChange={e => onChange({ ...consent, longitudinalTracking: e.target.checked })}
          style={{ marginTop: 3 }}
        />
        <span>{t('auth.consentLongitudinalLabel')}</span>
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '6px 0', fontSize: 13.5 }}>
        <input
          type="checkbox"
          checked={consent.shareWithManager}
          onChange={e => onChange({ ...consent, shareWithManager: e.target.checked })}
          style={{ marginTop: 3 }}
        />
        <span>{t('auth.consentShareLabel')}</span>
      </label>
    </div>
  );
}

export default function AuthPanel({ authState, onSignIn, onCreateAccount, onRequestReset, onConfirmConsent }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetStatus, setResetStatus] = useState('idle'); // idle | sending | sent | error
  const [consent, setConsent] = useState({ storeResults: false, longitudinalTracking: false, shareWithManager: false });
  const { t } = useLanguage();

  function handleForgotPassword() {
    setResetStatus('sending');
    onRequestReset(email).then(result => setResetStatus(result.success ? 'sent' : 'error'));
  }

  if (authState.status === 'saved') {
    return (
      <div className="note no-print" style={{ marginTop: 16 }}>
        {t('auth.savedNote')}
      </div>
    );
  }

  if (authState.status === 'needsConsent') {
    return (
      <div className="note no-print" style={{ marginTop: 16 }}>
        <p style={{ margin: '0 0 8px' }}>
          <b>{t('auth.needsConsentHeading')}</b> {t('auth.needsConsentBody')}
        </p>
        <ConsentCheckboxes consent={consent} onChange={setConsent} t={t} />
        <button
          className="btn sm"
          disabled={!consent.storeResults}
          onClick={() => onConfirmConsent(consent)}
        >
          {t('auth.consentContinue')}
        </button>
      </div>
    );
  }

  return (
    <div className="note no-print" style={{ marginTop: 16 }}>
      {authState.status === 'signedIn' ? (
        <p style={{ margin: 0 }}>{t('auth.savingNote')}</p>
      ) : (
        <>
          <p style={{ margin: '0 0 8px' }}>
            <b>{t('auth.askHeading')}</b> {t('auth.askBody')}
          </p>
          <ConsentCheckboxes consent={consent} onChange={setConsent} t={t} />
          <input
            type="email"
            value={email}
            placeholder={t('auth.emailPlaceholder')}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
          />
          <input
            type="password"
            value={password}
            placeholder={t('auth.passwordPlaceholder')}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn sm"
              disabled={!email || !password || !consent.storeResults || authState.status === 'sending'}
              onClick={() => onSignIn(email, password, consent)}
            >
              {authState.status === 'sending' ? t('auth.sending') : t('auth.signIn')}
            </button>
            <button
              className="btn sm ghost"
              disabled={!email || !password || !consent.storeResults || authState.status === 'sending'}
              onClick={() => onCreateAccount(email, password, consent)}
            >
              {authState.status === 'sending' ? t('auth.sending') : t('auth.createAccount')}
            </button>
          </div>
          {authState.status === 'error' && (
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{authState.error}</p>
          )}
          {resetStatus === 'sent' ? (
            <p style={{ margin: '8px 0 0', fontSize: 13.5 }}>{t('auth.resetSent')}</p>
          ) : (
            <button
              type="button"
              className="btn ghost sm"
              style={{ marginTop: 8 }}
              disabled={!email || resetStatus === 'sending'}
              onClick={handleForgotPassword}
            >
              {resetStatus === 'sending' ? t('auth.sending') : t('auth.forgotPassword')}
            </button>
          )}
          {resetStatus === 'error' && (
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{t('auth.resetError')}</p>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- AuthPanel.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/AuthPanel.jsx src/components/AuthPanel.test.jsx
git commit -m "feat: add consent checkboxes and needsConsent screen to AuthPanel"
```

---

### Task 5: `ReportScreen.jsx` — thread `onConfirmConsent` through

**Files:**
- Modify: `src/components/ReportScreen.jsx:156`, `:209`

**Interfaces:**
- Consumes: `AuthPanel` from Task 4 (now requires `onConfirmConsent` prop).
- Produces: `ReportScreen` now accepts and forwards `onConfirmConsent`, consumed by Task 6's `App.jsx`.

No new test file — `ReportScreen` has no dedicated existing test file to extend (verified: only `AuthPanel.test.jsx` covers this area), and this is a pure prop-threading change with no new logic. It's covered end-to-end by Task 6's manual verification.

- [ ] **Step 1: Add the prop to the function signature**

In `src/components/ReportScreen.jsx:156`, change:

```jsx
export default function ReportScreen({ reportData, dim, authState, raterLink, onRestart, onPrint, onSignIn, onCreateAccount, onRequestReset, onCreateRaterLink, onRefreshRaterSummary }) {
```

to:

```jsx
export default function ReportScreen({ reportData, dim, authState, raterLink, onRestart, onPrint, onSignIn, onCreateAccount, onRequestReset, onConfirmConsent, onCreateRaterLink, onRefreshRaterSummary }) {
```

- [ ] **Step 2: Pass it to `AuthPanel`**

In `src/components/ReportScreen.jsx:209`, change:

```jsx
      <AuthPanel authState={authState} onSignIn={onSignIn} onCreateAccount={onCreateAccount} onRequestReset={onRequestReset} />
```

to:

```jsx
      <AuthPanel authState={authState} onSignIn={onSignIn} onCreateAccount={onCreateAccount} onRequestReset={onRequestReset} onConfirmConsent={onConfirmConsent} />
```

- [ ] **Step 3: Run the full test suite to confirm nothing broke**

Run: `npm test`
Expected: PASS (no test currently renders `ReportScreen` directly without `AuthPanel`'s own tests covering the checkbox behavior — this step only confirms no import/prop-shape regression elsewhere)

- [ ] **Step 4: Commit**

```bash
git add src/components/ReportScreen.jsx
git commit -m "feat: thread onConfirmConsent prop through ReportScreen"
```

---

### Task 6: `App.jsx` — orchestrate consent capture, save, and the needsConsent path

**Files:**
- Modify: `src/App.jsx:19-32` (state), `:89-99` (`handleRestart`), `:106-146` (`handleSignIn`/`handleCreateAccount`/save effect), `:195-208` (render props)

**Interfaces:**
- Consumes: `authAdapter.saveAssessment(...)` and `authAdapter.recordConsent(...)` from Task 3; `AuthPanel`'s `onConfirmConsent` from Tasks 4–5.
- Produces: `handleConfirmConsent(consent)` passed to `ReportScreen` as `onConfirmConsent`.

This is orchestration glue with no isolated unit-test seam of its own in this repo's existing test coverage (`supabaseAuthAdapter` and `App`'s effects are verified live, per the project's established pattern — see `CLAUDE.md` and the absence of any Supabase-mocking test elsewhere in `src`). Verification is Task 8's full-suite run plus a manual live walkthrough.

- [ ] **Step 1: Add the two new state slots**

In `src/App.jsx`, after line 32 (`const [raterLink, setRaterLink] = useState(null); // { id, count, scores }`), add:

```jsx
  const [pendingConsent, setPendingConsent] = useState(null); // consent captured at sign-in, consumed once by the save effect
  const [pendingSavePayload, setPendingSavePayload] = useState(null); // set when a returning session needs fresh consent before saving
```

- [ ] **Step 2: Reset the new state in `handleRestart`**

In `src/App.jsx:89-99`, change:

```jsx
  function handleRestart() {
    setP1Answers(scenarios.map(() => ({ most: null, least: null })));
    setP1Index(0);
    setOrgAnswers(ORG_ITEMS.map(() => null));
    setComplianceAnswers(COMPLIANCE_ITEMS.map(() => null));
    setReportData(null);
    setAuthState({ status: 'anon' });
    setRaterLink(null);
    setTeamId(null);
    setSessionId(null);
    setPhase('intro');
```

to:

```jsx
  function handleRestart() {
    setP1Answers(scenarios.map(() => ({ most: null, least: null })));
    setP1Index(0);
    setOrgAnswers(ORG_ITEMS.map(() => null));
    setComplianceAnswers(COMPLIANCE_ITEMS.map(() => null));
    setReportData(null);
    setAuthState({ status: 'anon' });
    setRaterLink(null);
    setTeamId(null);
    setSessionId(null);
    setPendingConsent(null);
    setPendingSavePayload(null);
    setPhase('intro');
```

- [ ] **Step 3: Update `handleSignIn`/`handleCreateAccount` to capture consent, and rewrite the save effect**

Replace `src/App.jsx:106-146` (from `async function handleSignIn` through the end of the `useEffect` block) with:

```jsx
  async function handleSignIn(email, password, consent) {
    setPendingConsent(consent);
    setAuthState({ status: 'sending' });
    const result = await authAdapter.signInWithPassword({ email, password });
    if (!result.success) setAuthState({ status: 'error', error: result.error || t('auth.sendError') });
    // On success, the onAuthStateChange listener below transitions to 'signedIn' and saves.
  }

  async function handleCreateAccount(email, password, consent) {
    setPendingConsent(consent);
    setAuthState({ status: 'sending' });
    const result = await authAdapter.signUpWithPassword({ email, password });
    if (!result.success) setAuthState({ status: 'error', error: result.error || t('auth.sendError') });
    // On success, the onAuthStateChange listener below transitions to 'signedIn' and saves.
  }

  function handleRequestReset(email) {
    return authAdapter.requestPasswordReset({ email });
  }

  async function attemptSave(userId, consent) {
    const payload = { role, p1Answers, orgAnswers, complianceAnswers, reportData, userId, teamId, sessionId };
    const result = await authAdapter.saveAssessment(payload);
    if (result.success) {
      setAuthState({ status: 'saved', assessmentId: result.assessmentId, userId });
      return;
    }
    if (result.needsConsent) {
      if (consent) {
        const recordResult = await authAdapter.recordConsent({ userId, ...consent });
        setPendingConsent(null);
        if (!recordResult.success) {
          setAuthState({ status: 'error', error: recordResult.error });
          return;
        }
        const retryResult = await authAdapter.saveAssessment(payload);
        setAuthState(
          retryResult.success
            ? { status: 'saved', assessmentId: retryResult.assessmentId, userId }
            : { status: 'error', error: retryResult.error }
        );
        return;
      }
      setPendingSavePayload(payload);
      setAuthState({ status: 'needsConsent', userId });
      return;
    }
    setAuthState({ status: 'error', error: result.error });
  }

  async function handleConfirmConsent(consent) {
    if (!pendingSavePayload) return;
    const { userId } = pendingSavePayload;
    setAuthState({ status: 'signedIn' });
    const recordResult = await authAdapter.recordConsent({ userId, ...consent });
    if (!recordResult.success) {
      setAuthState({ status: 'error', error: recordResult.error });
      return;
    }
    const result = await authAdapter.saveAssessment(pendingSavePayload);
    setPendingSavePayload(null);
    setAuthState(
      result.success
        ? { status: 'saved', assessmentId: result.assessmentId, userId }
        : { status: 'error', error: result.error }
    );
  }

  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChange(async (session) => {
      if (
        session &&
        reportData &&
        authState.status !== 'saved' &&
        authState.status !== 'signedIn' &&
        authState.status !== 'needsConsent'
      ) {
        setAuthState({ status: 'signedIn' });
        await attemptSave(session.user.id, pendingConsent);
      }
    });
    return unsubscribe;
  }, [authAdapter, reportData, authState.status, pendingConsent, role, p1Answers, orgAnswers, complianceAnswers, teamId, sessionId]);
```

- [ ] **Step 4: Pass `handleConfirmConsent` to `ReportScreen`**

In `src/App.jsx:195-208`, change:

```jsx
          {phase === 'report' && reportData && (
            <ReportScreen
              reportData={reportData}
              dim={DIM}
              authState={authState}
              raterLink={raterLink}
              onRestart={handleRestart}
              onPrint={handlePrint}
              onSignIn={handleSignIn}
              onCreateAccount={handleCreateAccount}
              onRequestReset={handleRequestReset}
              onCreateRaterLink={handleCreateRaterLink}
              onRefreshRaterSummary={handleRefreshRaterSummary}
            />
          )}
```

to:

```jsx
          {phase === 'report' && reportData && (
            <ReportScreen
              reportData={reportData}
              dim={DIM}
              authState={authState}
              raterLink={raterLink}
              onRestart={handleRestart}
              onPrint={handlePrint}
              onSignIn={handleSignIn}
              onCreateAccount={handleCreateAccount}
              onRequestReset={handleRequestReset}
              onConfirmConsent={handleConfirmConsent}
              onCreateRaterLink={handleCreateRaterLink}
              onRefreshRaterSummary={handleRefreshRaterSummary}
            />
          )}
```

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS — this confirms no other test (e.g. any that renders `App` directly, if one exists) broke from the signature changes.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: orchestrate consent capture and the needsConsent save path in App"
```

---

### Task 7: `CLAUDE.md` — expand the Prompt 8 data-protection checklist

**Files:**
- Modify: `CLAUDE.md` (the existing "Data-protection checklist (placeholder, expand at Prompt 8)" section at the bottom)

**Interfaces:** None — documentation only.

- [ ] **Step 1: Replace the placeholder checklist section**

Find the section starting `## Data-protection checklist (placeholder, expand at Prompt 8)` at the end of `CLAUDE.md` and replace its body with:

```markdown
## Data-protection checklist (Prompt 8)

Before deploying anything that stores 360/team/longitudinal/talent-review
data to a new country or customer:

- [ ] Verify the **current** data-protection law for that country against an
      **official current source** (e.g. Saudi Arabia's PDPL, UAE's PDPL,
      or the equivalent for wherever the deploying company operates) —
      never treat any specific rule stated in this repo as legal fact.
- [ ] Confirm whether that law requires a **local data-residency**
      arrangement (the shared `madarlead-assessment` Supabase project is
      hosted wherever Supabase's default region for that project is — check
      it, don't assume).
- [ ] Confirm the notice text in `src/lib/consent.js` /
      `src/i18n/translations.js` (`auth.consentNotice` and friends) has
      been reviewed by someone qualified to confirm it meets that law's
      plain-language and specificity requirements — the checked-in copy is
      a first draft, not legal advice.
- [ ] Confirm whether that law grants a right to **erasure/portability**
      that this tool does not yet implement (no "delete my data" flow
      exists as of this sub-project — see the consent-gate spec's "Not
      doing yet" section).
- [ ] If the deploying company has its own DPO/legal/compliance function,
      route this checklist through them rather than relying on this repo's
      notes alone.

This checklist is a reminder to verify, not a substitute for verifying.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: expand Prompt 8 data-protection checklist"
```

---

### Task 8: Full verification — automated + manual live walkthrough

**Files:** None (verification only).

**Interfaces:** None.

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`
Expected: PASS, all suites — including `translations.test.js` (EN/AR parity), `authAdapter.test.js` (noop consent methods), `AuthPanel.test.jsx` (checkbox gating + needsConsent screen).

- [ ] **Step 2: Manual live check — fresh sign-up path**

Run the dev server (`npm run dev`), complete a self-assessment as a brand-new email, and on the report screen: confirm the consent notice and 3 checkboxes render above the email/password fields; confirm Sign in/Create account stay disabled until "Store my results" is checked; check it, create the account, and confirm the report ends in the `saved` state (the `auth.savedNote` text appears).

- [ ] **Step 3: Manual live check — returning-session `needsConsent` path**

With the same account still signed in (persisted Supabase session), reload the page, complete a *second* self-assessment, and reach the report screen again without re-entering email/password. Confirm the `needsConsent` screen appears (heading "Before we save this report", 3 checkboxes, no email/password fields, Continue disabled until "Store my results" is checked) rather than an automatic silent save — this is the gap this sub-project closes.

- [ ] **Step 4: Manual live check — Arabic**

Switch language to Arabic and repeat step 2's flow; confirm all consent copy renders in Arabic and RTL layout isn't broken (checkboxes still align correctly).

- [ ] **Step 5: Manual DB check**

In the Supabase SQL editor, run `select * from fbw_consents order by consented_at desc limit 5;` and confirm rows exist with the expected `store_results`/`longitudinal_tracking`/`share_with_manager` values matching what was checked in the UI during steps 2–4.

No commit for this task — it's a verification-only checkpoint before considering Prompt 8 sub-project 1 complete.
