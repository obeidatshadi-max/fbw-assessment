# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone `/admin` route showing site-wide completion stats (signups, assessments, role/team/session/360 usage) gated to a single owner account, with no nav link anywhere in the app.

**Architecture:** New Supabase migration adds an `is_admin` flag on `fbw_profiles` and a `get_admin_stats()` SECURITY DEFINER RPC that raises if the caller isn't flagged. Frontend gets a new `AdminApp`/`AdminScreen` pair wired to `/admin` in `main.jsx`, following the exact `ManagerApp`/`ManagerScreen` sign-in pattern already in this repo — just sign-in (no account creation), then fetch-and-render aggregate stats.

**Tech Stack:** React 18 (no router lib — `window.location.pathname` matching in `main.jsx`), Supabase (Postgres + RLS + RPC), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-10-admin-dashboard-design.md`

## Global Constraints

- Project id for the shared Supabase project (`madarlead-assessment`): `kkhkxjvipamajvawxzpc`.
- No email/PII in the admin stats payload — aggregate counts only.
- No SELECT policy is ever added on raw tables for admin access — `get_admin_stats()` is the only read path (matches `get_team_summary` / `get_360_summary`).
- Every new UI string goes through `src/i18n/translations.js` under both `en` and `ar` — `src/i18n/translations.test.js`'s "translation completeness" test fails the whole suite if any key is missing from `ar`.
- Default test language is `en` (`LanguageProvider` with no props) — component tests assert on the literal English strings you write into `translations.js`.
- No nav link to `/admin` anywhere in the app — URL-only access.
- Test runner: `npm test` (`vitest run`).

---

### Task 1: Database migration — `is_admin` flag + `get_admin_stats()` RPC

**Files:**
- Create: `supabase/migrations/0009_fbw_admin.sql`

**Interfaces:**
- Produces: RPC `get_admin_stats()` (no args), callable via `supabase.rpc('get_admin_stats')` from an authenticated session. Returns a jsonb object with keys: `totalLeaders`, `totalAssessments`, `assessments7d`, `assessments30d`, `roleBreakdown` (object of `role -> count`), `totalTeams`, `totalSessions`, `totalRaterLinks`, `totalRaterResponses`, `dailyCompletions` (array of `{day, count}`, last 14 days, ascending). Raises a Postgres exception (message `not authorized`) if the caller's `fbw_profiles.is_admin` is not `true`.
- Consumes: existing tables `fbw_profiles`, `fbw_assessments`, `fbw_teams`, `fbw_sessions`, `fbw_rater_links`, `fbw_rater_responses` (all already exist per migrations 0002/0004/0005).

There is no automated test for this task (this repo has no SQL test harness — every prior migration was verified manually). The "test" is applying the migration and querying the RPC by hand.

- [ ] **Step 1: Write the migration file**

```sql
-- 0009_fbw_admin.sql
-- Owner-only standalone activity dashboard at /admin. See
-- docs/superpowers/specs/2026-09-10-admin-dashboard-design.md.

alter table fbw_profiles add column is_admin boolean not null default false;

create or replace function get_admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_result jsonb;
begin
  select is_admin into v_is_admin from fbw_profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'totalLeaders', (select count(*) from fbw_profiles),
    'totalAssessments', (select count(*) from fbw_assessments),
    'assessments7d', (select count(*) from fbw_assessments where completed_at >= now() - interval '7 days'),
    'assessments30d', (select count(*) from fbw_assessments where completed_at >= now() - interval '30 days'),
    'roleBreakdown', (
      select coalesce(jsonb_object_agg(coalesce(role, 'unspecified'), n), '{}'::jsonb)
      from (select role, count(*) n from fbw_assessments group by role) r
    ),
    'totalTeams', (select count(*) from fbw_teams),
    'totalSessions', (select count(*) from fbw_sessions),
    'totalRaterLinks', (select count(*) from fbw_rater_links),
    'totalRaterResponses', (select count(*) from fbw_rater_responses),
    'dailyCompletions', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', n) order by d), '[]'::jsonb)
      from (
        select date_trunc('day', completed_at)::date d, count(*) n
        from fbw_assessments
        where completed_at >= now() - interval '14 days'
        group by 1
      ) t
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function get_admin_stats() to authenticated;
```

- [ ] **Step 2: Apply the migration to the shared Supabase project**

Use the Supabase MCP tool (`mcp__plugin_supabase_supabase__apply_migration`) with `project_id: kkhkxjvipamajvawxzpc`, `name: fbw_admin`, and the SQL body above. If MCP isn't available in the execution environment, run via the Supabase SQL editor for that project instead — paste the file contents and execute.

- [ ] **Step 3: Verify the function exists and rejects a non-admin caller**

Run in the Supabase SQL editor, signed in as any non-flagged user (or via `mcp__plugin_supabase_supabase__execute_sql` with `project_id: kkhkxjvipamajvawxzpc`):

```sql
select proname from pg_proc where proname = 'get_admin_stats';
```

Expected: one row returned. Then confirm the column exists:

```sql
select column_name from information_schema.columns
where table_name = 'fbw_profiles' and column_name = 'is_admin';
```

Expected: one row (`is_admin`).

- [ ] **Step 4: Flip your own row's `is_admin` to true**

Find your user id and set the flag (run as the `postgres`/service role, e.g. via `mcp__plugin_supabase_supabase__execute_sql`):

```sql
update fbw_profiles set is_admin = true
where id = (select id from auth.users where email = '<your fbw-assessment login email>');
```

If your `fbw_profiles` row doesn't exist yet (you've never saved an assessment), insert it first:

```sql
insert into fbw_profiles (id, is_admin)
values ((select id from auth.users where email = '<your fbw-assessment login email>'), true)
on conflict (id) do update set is_admin = true;
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0009_fbw_admin.sql
git commit -m "feat: add is_admin flag and get_admin_stats RPC"
```

---

### Task 2: Auth adapter — `getAdminStats()`

**Files:**
- Modify: `src/lib/authAdapter.js`
- Test: `src/lib/authAdapter.test.js`

**Interfaces:**
- Consumes: `supabase` client from `./supabaseClient.js` (already imported in this file).
- Produces: `getAdminStats()` on both `noopAuthAdapter` and `supabaseAuthAdapter`. Return shape: `{ success: true, stats: {...} }` or `{ success: false, error: string }`. `stats` is the raw jsonb object returned by the `get_admin_stats` RPC (see Task 1's key list) — consumed as-is by `AdminScreen` in Task 4.

- [ ] **Step 1: Write the failing test**

Add to `src/lib/authAdapter.test.js`, inside a new `describe` block:

```js
describe('noopAuthAdapter admin stats', () => {
  it('getAdminStats fails safely when not configured', async () => {
    const result = await noopAuthAdapter.getAdminStats();
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- authAdapter`
Expected: FAIL with `noopAuthAdapter.getAdminStats is not a function`.

- [ ] **Step 3: Implement `getAdminStats` on both adapters**

In `src/lib/authAdapter.js`, add to `noopAuthAdapter` (alongside the other `getTeamSummary`-style stubs):

```js
  async getAdminStats() {
    return { success: false, error: 'Admin stats are not configured yet.' };
  },
```

Add to `supabaseAuthAdapter` (alongside `getTeamSummary`, near the bottom of the object):

```js
  // Admin dashboard — owner-only aggregate stats (authenticated)
  async getAdminStats() {
    if (!supabase) return { success: false, error: 'Admin stats are not configured yet.' };
    const { data, error } = await supabase.rpc('get_admin_stats');
    return error ? { success: false, error: error.message } : { success: true, stats: data };
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- authAdapter`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/authAdapter.js src/lib/authAdapter.test.js
git commit -m "feat: add getAdminStats to the auth adapter"
```

---

### Task 3: i18n — `admin.*` keys (English + Arabic)

**Files:**
- Modify: `src/i18n/translations.js`

**Interfaces:**
- Produces: `admin.*` keys under both `UI.en` and `UI.ar`, consumed via `t('admin.<key>')` / `tf('admin.<key>', vars)` from `useLanguage()` in Tasks 4–5. Exact key list below — Tasks 4–5 use only these names.

- [ ] **Step 1: Add the English block**

In `src/i18n/translations.js`, inside the `en` object, add a new top-level key right after the existing `manager: { ... }` block (around line 290):

```js
    admin: {
      eyebrow: 'Admin',
      title: 'Activity overview',
      signInHeading: 'Sign in',
      signInBody: 'Sign in with your account to view site activity.',
      emailPlaceholder: 'you@company.com',
      passwordPlaceholder: 'Password',
      sending: 'Sending…',
      signIn: 'Sign in',
      signInError: 'Could not sign in. Check your email and password.',
      unauthorized: 'Not authorized.',
      loading: 'Loading…',
      totalLeaders: 'Total signed-up leaders',
      totalAssessments: 'Total assessments completed',
      assessments7d: 'Completed in last 7 days',
      assessments30d: 'Completed in last 30 days',
      roleBreakdownTitle: 'By role',
      usageTitle: 'Feature usage',
      totalTeams: 'Teams created',
      totalSessions: 'Live sessions run',
      totalRaterLinks: '360 links created',
      totalRaterResponses: '360 responses submitted',
      dailyTitle: 'Completions — last 14 days',
      refresh: 'Refresh',
    },
```

- [ ] **Step 2: Add the matching Arabic block**

In the `ar` object, add the mirrored block right after its own `manager: { ... }` block (around line 602):

```js
    admin: {
      eyebrow: 'الإدارة',
      title: 'نظرة عامة على النشاط',
      signInHeading: 'تسجيل الدخول',
      signInBody: 'سجّل الدخول بحسابك للاطّلاع على نشاط الموقع.',
      emailPlaceholder: 'you@company.com',
      passwordPlaceholder: 'كلمة المرور',
      sending: 'جارٍ الإرسال…',
      signIn: 'تسجيل الدخول',
      signInError: 'تعذّر تسجيل الدخول. تحقّق من بريدك الإلكتروني وكلمة المرور.',
      unauthorized: 'غير مصرَّح.',
      loading: 'جارٍ التحميل…',
      totalLeaders: 'إجمالي القادة المسجَّلين',
      totalAssessments: 'إجمالي التقييمات المكتملة',
      assessments7d: 'المكتملة خلال آخر 7 أيام',
      assessments30d: 'المكتملة خلال آخر 30 يوماً',
      roleBreakdownTitle: 'حسب الدور',
      usageTitle: 'استخدام الميزات',
      totalTeams: 'الفرق المُنشأة',
      totalSessions: 'الجلسات المباشرة المُنفَّذة',
      totalRaterLinks: 'روابط تقييم 360 المُنشأة',
      totalRaterResponses: 'استجابات تقييم 360 المُقدَّمة',
      dailyTitle: 'الإكمالات — آخر 14 يوماً',
      refresh: 'تحديث',
    },
```

- [ ] **Step 3: Run the translation-completeness test**

Run: `npm test -- translations`
Expected: PASS (no `missing` entries — every English key has an Arabic match by construction).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/translations.js
git commit -m "feat: add admin.* i18n keys (en/ar)"
```

---

### Task 4: `AdminScreen` presentational component

**Files:**
- Create: `src/components/AdminScreen.jsx`
- Test: `src/components/AdminScreen.test.jsx`

**Interfaces:**
- Consumes: `useLanguage()` from `../i18n/LanguageContext.jsx` (same as `ManagerScreen.jsx`).
- Produces: default export `AdminScreen({ authState, statsState, onSignIn, onRefresh })`.
  - `authState`: `{ status: 'anon' | 'sending' | 'error' | 'signedIn', error?: string }`.
  - `statsState`: `{ status: 'idle' | 'loading' | 'ready' | 'error', stats?: object, error?: string }` — `stats` shape matches Task 1's RPC output (`totalLeaders`, `totalAssessments`, `assessments7d`, `assessments30d`, `roleBreakdown`, `totalTeams`, `totalSessions`, `totalRaterLinks`, `totalRaterResponses`, `dailyCompletions`).
  - `onSignIn(email, password)`: called on sign-in form submit.
  - `onRefresh()`: called by the refresh button.
- This component is used by `AdminApp.jsx` in Task 5, which owns all state and wiring — `AdminScreen` itself holds no adapter calls, only local `email`/`password` input state (same split as `ManagerApp`/`ManagerScreen`).

- [ ] **Step 1: Write the failing tests**

Create `src/components/AdminScreen.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminScreen from './AdminScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

function renderScreen(props) {
  return render(
    <LanguageProvider>
      <AdminScreen
        authState={{ status: 'anon' }}
        statsState={{ status: 'idle' }}
        onSignIn={() => {}}
        onRefresh={() => {}}
        {...props}
      />
    </LanguageProvider>
  );
}

describe('AdminScreen', () => {
  it('shows the sign-in form when not signed in', () => {
    renderScreen({});
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
  });

  it('calls onSignIn with the entered email and password', () => {
    const onSignIn = vi.fn();
    renderScreen({ onSignIn });
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@x.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByText('Sign in'));
    expect(onSignIn).toHaveBeenCalledWith('a@x.com', 'secret123');
  });

  it('shows a sign-in error', () => {
    renderScreen({ authState: { status: 'error', error: 'bad creds' } });
    expect(screen.getByText('bad creds')).toBeInTheDocument();
  });

  it('shows a loading state while stats are being fetched', () => {
    renderScreen({ authState: { status: 'signedIn' }, statsState: { status: 'loading' } });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows "Not authorized." when the stats RPC rejects the caller', () => {
    renderScreen({ authState: { status: 'signedIn' }, statsState: { status: 'error', error: 'not authorized' } });
    expect(screen.getByText('Not authorized.')).toBeInTheDocument();
  });

  it('renders stat tiles and role breakdown when stats are ready', () => {
    renderScreen({
      authState: { status: 'signedIn' },
      statsState: {
        status: 'ready',
        stats: {
          totalLeaders: 42,
          totalAssessments: 30,
          assessments7d: 5,
          assessments30d: 20,
          roleBreakdown: { sales: 10, unspecified: 20 },
          totalTeams: 3,
          totalSessions: 1,
          totalRaterLinks: 4,
          totalRaterResponses: 9,
          dailyCompletions: [{ day: '2026-09-09', count: 2 }],
        },
      },
    });
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('calls onRefresh when the refresh button is clicked', () => {
    const onRefresh = vi.fn();
    renderScreen({
      authState: { status: 'signedIn' },
      statsState: { status: 'ready', stats: { totalLeaders: 0, totalAssessments: 0, assessments7d: 0, assessments30d: 0, roleBreakdown: {}, totalTeams: 0, totalSessions: 0, totalRaterLinks: 0, totalRaterResponses: 0, dailyCompletions: [] } },
      onRefresh,
    });
    fireEvent.click(screen.getByText('Refresh'));
    expect(onRefresh).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- AdminScreen`
Expected: FAIL — `Cannot find module './AdminScreen.jsx'`.

- [ ] **Step 3: Implement `AdminScreen.jsx`**

Create `src/components/AdminScreen.jsx`:

```jsx
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function AdminScreen({ authState, statsState, onSignIn, onRefresh }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (authState.status !== 'signedIn') {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('admin.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('admin.title')}</h1>
        <div className="card pad">
          <p style={{ margin: '0 0 8px' }}><b>{t('admin.signInHeading')}</b> {t('admin.signInBody')}</p>
          <form onSubmit={e => { e.preventDefault(); onSignIn(email, password); }}>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              placeholder={t('admin.emailPlaceholder')}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
            />
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              placeholder={t('admin.passwordPlaceholder')}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, marginBottom: 8 }}
            />
            <button type="submit" className="btn sm" disabled={!email || !password || authState.status === 'sending'}>
              {authState.status === 'sending' ? t('admin.sending') : t('admin.signIn')}
            </button>
          </form>
          {authState.status === 'error' && <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{authState.error || t('admin.signInError')}</p>}
        </div>
      </section>
    );
  }

  if (statsState.status === 'loading' || statsState.status === 'idle') {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('admin.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('admin.title')}</h1>
        <p>{t('admin.loading')}</p>
      </section>
    );
  }

  if (statsState.status === 'error') {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('admin.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('admin.title')}</h1>
        <p>{t('admin.unauthorized')}</p>
      </section>
    );
  }

  const s = statsState.stats;
  const tiles = [
    [t('admin.totalLeaders'), s.totalLeaders],
    [t('admin.totalAssessments'), s.totalAssessments],
    [t('admin.assessments7d'), s.assessments7d],
    [t('admin.assessments30d'), s.assessments30d],
  ];
  const usage = [
    [t('admin.totalTeams'), s.totalTeams],
    [t('admin.totalSessions'), s.totalSessions],
    [t('admin.totalRaterLinks'), s.totalRaterLinks],
    [t('admin.totalRaterResponses'), s.totalRaterResponses],
  ];

  return (
    <section className="screen active">
      <div className="eyebrow">{t('admin.eyebrow')}</div>
      <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 18 }}>{t('admin.title')}</h1>

      <div className="card pad" style={{ marginBottom: 18 }}>
        {tiles.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <span>{label}</span><span style={{ fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>

      <div className="sec-title">{t('admin.roleBreakdownTitle')}</div>
      <div className="card pad" style={{ marginBottom: 18 }}>
        {Object.entries(s.roleBreakdown || {}).map(([role, n]) => (
          <div key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <span>{role}</span><span>{n}</span>
          </div>
        ))}
      </div>

      <div className="sec-title">{t('admin.usageTitle')}</div>
      <div className="card pad" style={{ marginBottom: 18 }}>
        {usage.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <span>{label}</span><span>{value}</span>
          </div>
        ))}
      </div>

      <div className="sec-title">{t('admin.dailyTitle')}</div>
      <div className="card pad" style={{ marginBottom: 18 }}>
        {(s.dailyCompletions || []).map(row => (
          <div key={row.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <span>{row.day}</span><span>{row.count}</span>
          </div>
        ))}
      </div>

      <button className="btn ghost sm" onClick={onRefresh}>{t('admin.refresh')}</button>
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- AdminScreen`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/AdminScreen.jsx src/components/AdminScreen.test.jsx
git commit -m "feat: add AdminScreen presentational component"
```

---

### Task 5: `AdminApp` container + `/admin` route wiring

**Files:**
- Create: `src/AdminApp.jsx`
- Test: `src/AdminApp.test.jsx`
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes: `AdminScreen` from Task 4 (`authState`, `statsState`, `onSignIn`, `onRefresh` props exactly as defined there); `authAdapter.signInWithPassword`, `authAdapter.onAuthStateChange`, `authAdapter.getAdminStats` from Task 2; `HomeLink` from `./components/HomeLink.jsx` (existing, used unchanged — same import as `ManagerApp.jsx`).
- Produces: default export `AdminApp({ authAdapter = noopAuthAdapter })`, rendered at the `/admin` route.

- [ ] **Step 1: Write the failing tests**

Create `src/AdminApp.test.jsx`:

```jsx
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminApp from './AdminApp.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';

function makeAdapter(overrides = {}) {
  let authCallback = () => {};
  return {
    signInWithPassword: vi.fn().mockResolvedValue({ success: true }),
    onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
    getAdminStats: vi.fn().mockResolvedValue({
      success: true,
      stats: {
        totalLeaders: 42, totalAssessments: 30, assessments7d: 5, assessments30d: 20,
        roleBreakdown: { sales: 10 }, totalTeams: 3, totalSessions: 1,
        totalRaterLinks: 4, totalRaterResponses: 9, dailyCompletions: [],
      },
    }),
    triggerAuth: (session) => authCallback(session),
    ...overrides,
  };
}

describe('AdminApp', () => {
  it('shows a link back to the main assessment', () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><AdminApp authAdapter={authAdapter} /></LanguageProvider>);
    expect(screen.getByText('Back to the assessment')).toHaveAttribute('href', '/');
  });

  it('fetches and renders stats after sign-in', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><AdminApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    await waitFor(() => expect(authAdapter.getAdminStats).toHaveBeenCalled());
    expect(await screen.findByText('42')).toBeInTheDocument();
  });

  it('shows "Not authorized." when getAdminStats fails', async () => {
    const authAdapter = makeAdapter({
      getAdminStats: vi.fn().mockResolvedValue({ success: false, error: 'not authorized' }),
    });
    render(<LanguageProvider><AdminApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    expect(await screen.findByText('Not authorized.')).toBeInTheDocument();
  });

  it('re-fetches stats when refresh is clicked', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><AdminApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    await screen.findByText('42');
    screen.getByText('Refresh').click();
    await waitFor(() => expect(authAdapter.getAdminStats).toHaveBeenCalledTimes(2));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- AdminApp`
Expected: FAIL — `Cannot find module './AdminApp.jsx'`.

- [ ] **Step 3: Implement `AdminApp.jsx`**

Create `src/AdminApp.jsx`:

```jsx
import { useEffect, useState } from 'react';
import HomeLink from './components/HomeLink.jsx';
import AdminScreen from './components/AdminScreen.jsx';
import { noopAuthAdapter } from './lib/authAdapter.js';

export default function AdminApp({ authAdapter = noopAuthAdapter }) {
  const [authState, setAuthState] = useState({ status: 'anon' });
  const [statsState, setStatsState] = useState({ status: 'idle' });

  async function fetchStats() {
    setStatsState({ status: 'loading' });
    const result = await authAdapter.getAdminStats();
    if (result.success) {
      setStatsState({ status: 'ready', stats: result.stats });
    } else {
      setStatsState({ status: 'error', error: result.error });
    }
  }

  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChange((session) => {
      if (!session) return;
      setAuthState({ status: 'signedIn' });
      fetchStats();
    });
    return unsubscribe;
  }, [authAdapter]);

  async function handleSignIn(email, password) {
    setAuthState({ status: 'sending' });
    const result = await authAdapter.signInWithPassword({ email, password });
    if (!result.success) setAuthState({ status: 'error', error: result.error });
    // On success, the onAuthStateChange listener above transitions to 'signedIn'.
  }

  return (
    <main>
      <HomeLink />
      <div className="wrap">
        <AdminScreen
          authState={authState}
          statsState={statsState}
          onSignIn={handleSignIn}
          onRefresh={fetchStats}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- AdminApp`
Expected: PASS.

- [ ] **Step 5: Wire the `/admin` route into `main.jsx`**

Modify `src/main.jsx`:

```js
import AdminApp from './AdminApp.jsx';
```

(add alongside the other App imports, e.g. after the `ManagerApp` import)

```js
const isAdminRoute = window.location.pathname === '/admin';
```

(add alongside `isManagerRoute`)

```jsx
        : isAdminRoute
        ? <AdminApp authAdapter={supabaseAuthAdapter} />
```

(add as a new branch in the ternary chain, alongside the `isManagerRoute` branch)

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS (all existing + new tests, including `translations.test.js`'s completeness check).

- [ ] **Step 7: Commit**

```bash
git add src/AdminApp.jsx src/AdminApp.test.jsx src/main.jsx
git commit -m "feat: add /admin route with owner-only activity dashboard"
```

---

### Task 6: Manual verification

**Files:** none (verification only).

- [ ] **Step 1: Local dev check**

Run: `npm run dev`, visit `http://localhost:5173/admin` (or whatever port Vite reports).

Expected: sign-in form appears (no "create account" button, unlike `/manager`). Sign in with your own account (the one flagged `is_admin = true` in Task 1, Step 4). Stats render.

- [ ] **Step 2: Confirm non-admin rejection**

Sign in on `/admin` with a different (non-flagged) test account, or sign out and back in with one. Expected: "Not authorized." — not a generic error, not a hint this is an admin route.

- [ ] **Step 3: Mobile check**

Resize the browser (or devtools device toolbar) to 375px width on `/admin` signed in. Expected: stat rows and tiles stay single-column and readable, no horizontal overflow — same as the existing `/manager` route.

- [ ] **Step 4: Deploy and verify in production**

Push to the branch Netlify builds from (per this repo's existing deploy flow). Once live, visit `https://fbw-assessment.netlify.app/admin`, confirm the same sign-in → stats flow works against the real Supabase project.

- [ ] **Step 5: Bookmark the URL**

No nav link exists by design (per spec) — bookmark `https://fbw-assessment.netlify.app/admin` for your own future use.
