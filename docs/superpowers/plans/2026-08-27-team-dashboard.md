# Team/Affiliate Dashboard (Prompt 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a line manager an aggregated, anonymized Function/Being/Will
view of their team, gated behind a minimum-response count, with no way to
see any individual's result.

**Architecture:** A manager creates a team (Supabase-authenticated) and
gets a join code. A rep entering that code before finishing their own
self-assessment gets their (still anonymous) assessment tagged with
`team_id`. A SECURITY DEFINER Postgres RPC is the only read path for team
data — it enforces both manager ownership and a 3-response minimum before
returning any aggregate. No SELECT policy exists on raw assessment rows
for managers, so anonymity is structural, not a UI convention. This
mirrors the Prompt 4 360-feedback module's `get_360_summary` /
`validate_rater_link` pattern already in this codebase.

**Tech Stack:** React (Vite), Supabase (Postgres + RLS + RPC), Vitest +
Testing Library. Shared Supabase project `madarlead-assessment`
(`kkhkxjvipamajvawxzpc`), tables namespaced `fbw_`.

**Spec:** `docs/superpowers/specs/2026-08-27-prompt5-team-dashboard-design.md`

## Global Constraints

- No SELECT policy on `fbw_assessments` is ever added for managers — the
  `get_team_summary` RPC is the only read path for team-level data.
- Minimum-response gate is 3, matching the existing 360 module.
- No name, email, or other rep identity is ever captured for team
  membership — only an optional `team_id` tag on an otherwise-unchanged
  assessment row.
- `fbw_managers` mirrors `fbw_profiles` exactly (`id` + `created_at`, no
  email column) — do not add an email column or an `auth.getUser()` call.
- All new user-facing strings go in `src/i18n/translations.js` under a
  `team` key, with `en`, `ar`, and `fr` values (Arabic/French are
  first-draft, matching the file's existing REVIEW banner — not a
  placeholder to fill in later, an actual draft translation).
- Follow existing component/file conventions exactly: `App.jsx` /
  `RaterApp.jsx` (state + logic) paired with a presentational screen
  component in `src/components/`, both with a co-located `.test.jsx`.

---

### Task 1: Database migration — schema and RPCs

**Files:**
- Create: `supabase/migrations/0004_fbw_team_dashboard.sql`

**Interfaces:**
- Produces: table `fbw_managers(id, created_at)`, table
  `fbw_teams(id, manager_id, name, join_code, created_at)`, column
  `fbw_assessments.team_id`, RPC `validate_team_code(p_code text) →
  jsonb {valid, team_id}` (granted to `anon, authenticated`), RPC
  `get_team_summary(p_team_id uuid) → jsonb {count, distribution,
  roleBreakdown}` (granted to `authenticated`). These exact RPC names and
  return shapes are what Task 3's `authAdapter.js` calls.

- [ ] **Step 1: Write the migration file**

```sql
-- 0004_fbw_team_dashboard.sql
-- Prompt 5: anonymized team/affiliate dashboard for line managers. See
-- docs/superpowers/specs/2026-08-27-prompt5-team-dashboard-design.md.
--
-- fbw_managers mirrors fbw_profiles exactly (id + created_at only, no
-- email column) rather than the sps_managers shape from the SPS Style
-- app, to match this app's existing profile pattern and avoid an extra
-- auth.getUser() round trip from the client.

create extension if not exists pgcrypto;

create table fbw_managers (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table fbw_managers enable row level security;

create policy "read own manager profile" on fbw_managers
  for select using (auth.uid() = id);

create policy "insert own manager profile" on fbw_managers
  for insert with check (auth.uid() = id);

create table fbw_teams (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  join_code text not null unique default upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  created_at timestamptz not null default now()
);

alter table fbw_teams enable row level security;

create policy "manager full access to own teams" on fbw_teams
  for all using (auth.uid() = manager_id) with check (auth.uid() = manager_id);

alter table fbw_assessments add column team_id uuid references fbw_teams(id);

-- No SELECT policy is added for managers on fbw_assessments — the RPC
-- below is the only sanctioned read path for team data, so an individual
-- assessment is never queryable by a manager, structurally.

-- validate_team_code: anon-callable, returns only {valid, team_id} for a
-- rep entering a code before their own self-assessment — same pattern as
-- validate_rater_link in 0003_fbw_360_hardening.sql.
create or replace function validate_team_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  select id into v_team_id from fbw_teams where join_code = upper(p_code);
  if v_team_id is null then
    return jsonb_build_object('valid', false);
  end if;
  return jsonb_build_object('valid', true, 'team_id', v_team_id);
end;
$$;

grant execute on function validate_team_code(text) to anon, authenticated;

-- get_team_summary: the only way a manager reads team-level data.
-- Enforces both ownership and the 3-response anonymity gate server-side.
create or replace function get_team_summary(p_team_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_manager uuid;
  v_count int;
  v_distribution jsonb;
  v_role_breakdown jsonb;
begin
  select manager_id into v_manager from fbw_teams where id = p_team_id;

  if v_manager is null or v_manager <> auth.uid() then
    raise exception 'not authorized';
  end if;

  select count(*) into v_count from fbw_assessments where team_id = p_team_id;

  if v_count < 3 then
    return jsonb_build_object('count', v_count, 'distribution', null, 'roleBreakdown', null);
  end if;

  -- most.F/B/W always sum to 15 per assessment (ipsative constraint), so
  -- avg(F)/15*100 is exactly equal to averaging each assessment's own
  -- F/15*100 — not an approximation.
  select jsonb_build_object(
    'F', round(avg((scores->'most'->>'F')::numeric) / 15 * 100, 1),
    'B', round(avg((scores->'most'->>'B')::numeric) / 15 * 100, 1),
    'W', round(avg((scores->'most'->>'W')::numeric) / 15 * 100, 1),
    'C', round(coalesce(avg(
      case when scores->>'complianceScore' is not null
        then greatest(0, ((scores->>'complianceScore')::numeric - 3) / 6 * 100)
      end
    ), 0), 1)
  ) into v_distribution
  from fbw_assessments where team_id = p_team_id;

  select jsonb_object_agg(coalesce(role, 'unspecified'), n) into v_role_breakdown
  from (
    select role, count(*) n from fbw_assessments
    where team_id = p_team_id group by role
  ) role_counts;

  return jsonb_build_object('count', v_count, 'distribution', v_distribution, 'roleBreakdown', v_role_breakdown);
end;
$$;

grant execute on function get_team_summary(uuid) to authenticated;
```

- [ ] **Step 2: Apply the migration to the shared Supabase project**

Load the Supabase MCP tool if not already available:

```
ToolSearch query: "select:mcp__plugin_supabase_supabase__apply_migration"
```

Call it with `project_id: "kkhkxjvipamajvawxzpc"`, `name:
"0004_fbw_team_dashboard"`, and `query` set to the exact SQL from Step 1.

- [ ] **Step 3: Verify the migration applied cleanly**

Call `mcp__plugin_supabase_supabase__list_migrations` with
`project_id: "kkhkxjvipamajvawxzpc"` and confirm `0004_fbw_team_dashboard`
appears. Call `mcp__plugin_supabase_supabase__get_advisors` with
`type: "security"` for the same project and confirm no new advisory
appears for `fbw_managers`, `fbw_teams`, or the two new functions (RLS
enabled + policies present on both new tables is the expected clean
state).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0004_fbw_team_dashboard.sql
git commit -m "feat: add team dashboard schema + RPCs (Prompt 5 backend)"
```

---

### Task 2: Team imbalance heuristic (`teamScoring.js`)

**Files:**
- Create: `src/lib/teamScoring.js`
- Test: `src/lib/teamScoring.test.js`

**Interfaces:**
- Produces: `computeImbalance(distribution: {F,B,W,C}) → {high, low} |
  null`. Consumed by `ManagerApp.jsx` (Task 7) and `ManagerScreen.jsx`
  (Task 7).

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest';
import { computeImbalance } from './teamScoring.js';

describe('computeImbalance', () => {
  it('flags a high Function / low Will team', () => {
    expect(computeImbalance({ F: 50, B: 32, W: 18 })).toEqual({ high: 'F', low: 'W' });
  });

  it('flags a high Will / low Being team', () => {
    expect(computeImbalance({ F: 40, B: 15, W: 45 })).toEqual({ high: 'W', low: 'B' });
  });

  it('returns null for a balanced team', () => {
    expect(computeImbalance({ F: 34, B: 33, W: 33 })).toBeNull();
  });

  it('returns null when the high dimension qualifies but the low one is not low enough', () => {
    expect(computeImbalance({ F: 45, B: 30, W: 25 })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/teamScoring.test.js`
Expected: FAIL — `teamScoring.js` does not exist yet.

- [ ] **Step 3: Write the implementation**

```js
// Client-side imbalance flag for the team dashboard. `distribution` is
// the {F,B,W,C} percent-of-team values already averaged server-side by
// the get_team_summary RPC. This is a rule-of-thumb heuristic, not a
// statistical test — see
// docs/superpowers/specs/2026-08-27-prompt5-team-dashboard-design.md.

const HIGH_THRESHOLD = 45;
const LOW_THRESHOLD = 20;
const PAIRS = [
  ['F', 'W'], ['F', 'B'],
  ['B', 'F'], ['B', 'W'],
  ['W', 'F'], ['W', 'B'],
];

export function computeImbalance(distribution) {
  for (const [high, low] of PAIRS) {
    if (distribution[high] >= HIGH_THRESHOLD && distribution[low] <= LOW_THRESHOLD) {
      return { high, low };
    }
  }
  return null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/teamScoring.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/teamScoring.js src/lib/teamScoring.test.js
git commit -m "feat: add team imbalance heuristic"
```

---

### Task 3: Auth adapter — team methods + compliance score in saved scores

**Files:**
- Modify: `src/lib/authAdapter.js`
- Test: `src/lib/authAdapter.test.js` (new file)

**Interfaces:**
- Consumes: RPCs/tables from Task 1 (`validate_team_code`,
  `get_team_summary`, `fbw_managers`, `fbw_teams`).
- Produces (both `noopAuthAdapter` and `supabaseAuthAdapter`):
  `createTeam({name, userId}) → {success, teamId?, joinCode?, error?}`,
  `listTeams({userId}) → {success, teams?: [{id, name, joinCode}],
  error?}`, `validateTeamCode({code}) → {valid, teamId?}`,
  `getTeamSummary({teamId}) → {success, count?, distribution?,
  roleBreakdown?, error?}`. `saveAssessment(...)` gains one new optional
  param `teamId`. These are the exact names/shapes Tasks 5 and 7 call.
  `listTeams` is what lets a manager who signs in again see the team they
  already created, instead of being shown the create-team form every
  time — without it a returning manager would silently lose access to
  their own dashboard.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { noopAuthAdapter } from './authAdapter.js';

describe('noopAuthAdapter team methods', () => {
  it('createTeam fails safely when not configured', async () => {
    const result = await noopAuthAdapter.createTeam({ name: 'X', userId: 'u1' });
    expect(result.success).toBe(false);
  });

  it('validateTeamCode is invalid when not configured', async () => {
    const result = await noopAuthAdapter.validateTeamCode({ code: 'ABC123' });
    expect(result.valid).toBe(false);
  });

  it('listTeams fails safely when not configured', async () => {
    const result = await noopAuthAdapter.listTeams({ userId: 'u1' });
    expect(result.success).toBe(false);
  });

  it('getTeamSummary fails safely when not configured', async () => {
    const result = await noopAuthAdapter.getTeamSummary({ teamId: 't1' });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/authAdapter.test.js`
Expected: FAIL — `noopAuthAdapter.createTeam` is not a function.

- [ ] **Step 3: Implement — add to `noopAuthAdapter`**

Add these three methods inside the existing `noopAuthAdapter` object in
`src/lib/authAdapter.js` (alongside `createRaterLink` etc.):

```js
  async createTeam() {
    return { success: false, error: 'Team dashboard is not configured yet.' };
  },
  async validateTeamCode() {
    return { valid: false };
  },
  async listTeams() {
    return { success: false, error: 'Team dashboard is not configured yet.' };
  },
  async getTeamSummary() {
    return { success: false, error: 'Team dashboard is not configured yet.' };
  },
```

- [ ] **Step 4: Implement — add to `supabaseAuthAdapter`**

Add these three methods inside the existing `supabaseAuthAdapter` object,
after `submitRaterResponse`:

```js
  // Team dashboard — manager side (authenticated)
  async createTeam({ name, userId }) {
    if (!supabase) return { success: false, error: 'Team dashboard is not configured yet.' };
    const { error: managerError } = await supabase.from('fbw_managers').upsert({ id: userId }, { ignoreDuplicates: true });
    if (managerError) return { success: false, error: managerError.message };
    const { data, error } = await supabase.from('fbw_teams')
      .insert({ manager_id: userId, name })
      .select('id, join_code').single();
    return error ? { success: false, error: error.message } : { success: true, teamId: data.id, joinCode: data.join_code };
  },
  async listTeams({ userId }) {
    if (!supabase) return { success: false, error: 'Team dashboard is not configured yet.' };
    const { data, error } = await supabase.from('fbw_teams')
      .select('id, name, join_code')
      .eq('manager_id', userId)
      .order('created_at', { ascending: true });
    if (error) return { success: false, error: error.message };
    return { success: true, teams: data.map(row => ({ id: row.id, name: row.name, joinCode: row.join_code })) };
  },
  async getTeamSummary({ teamId }) {
    if (!supabase) return { success: false, error: 'Team dashboard is not configured yet.' };
    const { data, error } = await supabase.rpc('get_team_summary', { p_team_id: teamId });
    return error ? { success: false, error: error.message } : { success: true, count: data.count, distribution: data.distribution, roleBreakdown: data.roleBreakdown };
  },

  // Team dashboard — rep side (anonymous, called during self-assessment)
  async validateTeamCode({ code }) {
    if (!supabase) return { valid: false };
    const { data, error } = await supabase.rpc('validate_team_code', { p_code: code });
    if (error) return { valid: false };
    return { valid: Boolean(data.valid), teamId: data.team_id || null };
  },
```

- [ ] **Step 5: Modify `saveAssessment` to accept `teamId` and store the compliance score**

Replace the existing `saveAssessment` method in `supabaseAuthAdapter`
with:

```js
  async saveAssessment({ role, p1Answers, orgAnswers, complianceAnswers, reportData, userId, teamId }) {
    if (!supabase) return { success: false, error: 'Saving is not configured yet.' };
    const { error: profileError } = await supabase.from('fbw_profiles').upsert({ id: userId }, { ignoreDuplicates: true });
    if (profileError) return { success: false, error: profileError.message };
    const { data, error } = await supabase.from('fbw_assessments').insert({
      profile_id: userId,
      role: role || null,
      team_id: teamId || null,
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
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/lib/authAdapter.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 7: Run the full suite to confirm nothing else broke**

Run: `npx vitest run`
Expected: PASS, all existing + new tests.

- [ ] **Step 8: Commit**

```bash
git add src/lib/authAdapter.js src/lib/authAdapter.test.js
git commit -m "feat: add team-dashboard methods to auth adapter, store compliance score"
```

---

### Task 4: Translations — `team` namespace

**Files:**
- Modify: `src/i18n/translations.js`

**Interfaces:**
- Produces: `team.*` keys under `en`, `ar`, `fr` in `UI`. Consumed by
  Tasks 5 and 7. No new export — the existing `t`/`tf`/`L` functions pick
  these up automatically via dot-path lookup.

- [ ] **Step 1: Add the `team` block to `UI.en`**

Insert immediately after the closing `},` of the `rate: { ... }` block
inside `UI.en` (i.e. right before the `en`-block's own closing `},` at
line 197 in the current file):

```js
    team: {
      eyebrow: 'Team dashboard',
      title: 'See your team’s pattern',
      lead: 'Create a team, share the code with your reps, and see the aggregated Function/Being/Will pattern once enough people have answered. Individual results are never shown.',
      signInHeading: 'Sign in to manage your team',
      signInBody: 'Enter your email for a sign-in link.',
      emailPlaceholder: 'you@company.com',
      sending: 'Sending…',
      sendLink: 'Send link',
      checkEmail: 'Check your email for the sign-in link.',
      sendError: 'Could not send the link. Try again.',
      createHeading: 'Create a team',
      createNameLabel: 'Team name',
      createNamePlaceholder: 'e.g. Baghdad District',
      createButton: 'Create team',
      createError: 'Could not create the team. Try again.',
      joinCodeHeading: 'Share this code with your team',
      joinCodeShareNote: 'Anyone who enters this code before finishing their own self-assessment joins this team. No names or emails are collected.',
      copyCode: 'Copy code',
      copied: 'Copied!',
      countWaiting: '{count} of {min} responses needed before the team pattern appears.',
      dashboardTitle: 'Team pattern',
      roleBreakdownTitle: 'By role',
      imbalanceHeading: 'Pattern flag',
      imbalanceNote: '{high} is strong ({highPct}%), {low} is low ({lowPct}%) across the team — a rule-of-thumb signal, not a statistical finding.',
      noFlag: 'No strong imbalance detected across the team.',
      refresh: 'Check for new responses',
      switchTeam: 'Switch team',
      codeLabel: 'Have a team code?',
      codeHelp: 'Optional — enter the code your manager shared to include your result in the team pattern.',
      codePlaceholder: 'e.g. A1B2C3',
      codeChecking: 'Checking…',
      codeValid: 'Joined — your result will count toward this team.',
      codeInvalid: 'That code was not found. Check it and try again, or leave it blank.',
    },
```

- [ ] **Step 2: Add the `team` block to `UI.ar`**

Insert in the same relative position (right after the `ar`-block's
`rate: { ... }` closing `},`):

```js
    team: {
      eyebrow: 'لوحة الفريق',
      title: 'اطّلع على نمط فريقك',
      lead: 'أنشئ فريقاً، شارك الرمز مع مندوبيك، واطّلع على نمط الوظيفة/الكينونة/الإرادة المجمّع بعد استجابة عدد كافٍ من الأشخاص. لا تُعرض النتائج الفردية أبداً.',
      signInHeading: 'سجّل الدخول لإدارة فريقك',
      signInBody: 'أدخل بريدك الإلكتروني لتصلك رابط تسجيل الدخول.',
      emailPlaceholder: 'you@company.com',
      sending: 'جارٍ الإرسال…',
      sendLink: 'إرسال الرابط',
      checkEmail: 'تحقّق من بريدك الإلكتروني للحصول على رابط تسجيل الدخول.',
      sendError: 'تعذّر إرسال الرابط. حاول مرة أخرى.',
      createHeading: 'إنشاء فريق',
      createNameLabel: 'اسم الفريق',
      createNamePlaceholder: 'مثال: منطقة بغداد',
      createButton: 'إنشاء الفريق',
      createError: 'تعذّر إنشاء الفريق. حاول مرة أخرى.',
      joinCodeHeading: 'شارك هذا الرمز مع فريقك',
      joinCodeShareNote: 'أي شخص يُدخل هذا الرمز قبل إنهاء تقييمه الذاتي ينضم إلى هذا الفريق. لا يتم جمع أي أسماء أو بريد إلكتروني.',
      copyCode: 'نسخ الرمز',
      copied: 'تم النسخ!',
      countWaiting: '{count} من {min} استجابات مطلوبة قبل ظهور نمط الفريق.',
      dashboardTitle: 'نمط الفريق',
      roleBreakdownTitle: 'حسب الدور',
      imbalanceHeading: 'إشارة نمطية',
      imbalanceNote: '{high} قوي ،({highPct}%)، و{low} منخفض ({lowPct}%) عبر الفريق — إشارة تقريبية، وليست نتيجة إحصائية.',
      noFlag: 'لم يتم رصد اختلال واضح عبر الفريق.',
      refresh: 'التحقّق من استجابات جديدة',
      switchTeam: 'تبديل الفريق',
      codeLabel: 'هل لديك رمز فريق؟',
      codeHelp: 'اختياري — أدخل الرمز الذي شاركه مديرك لتضمين نتيجتك في نمط الفريق.',
      codePlaceholder: 'مثال: A1B2C3',
      codeChecking: 'جارٍ التحقّق…',
      codeValid: 'تم الانضمام — ستُحتسب نتيجتك ضمن هذا الفريق.',
      codeInvalid: 'لم يتم العثور على هذا الرمز. تحقّق منه أو اتركه فارغاً.',
    },
```

- [ ] **Step 3: Add the `team` block to `UI.fr`**

Insert in the same relative position (right after the `fr`-block's
`rate: { ... }` closing `},`):

```js
    team: {
      eyebrow: 'Tableau de bord d’équipe',
      title: 'Découvrez le profil de votre équipe',
      lead: 'Créez une équipe, partagez le code avec vos représentants, et consultez le profil Fonction/Être/Volonté agrégé une fois que suffisamment de personnes ont répondu. Les résultats individuels ne sont jamais affichés.',
      signInHeading: 'Connectez-vous pour gérer votre équipe',
      signInBody: 'Entrez votre e-mail pour recevoir un lien de connexion.',
      emailPlaceholder: 'vous@entreprise.com',
      sending: 'Envoi…',
      sendLink: 'Envoyer le lien',
      checkEmail: 'Consultez votre e-mail pour le lien de connexion.',
      sendError: 'Impossible d’envoyer le lien. Réessayez.',
      createHeading: 'Établir une équipe',
      createNameLabel: 'Nom de l’équipe',
      createNamePlaceholder: 'ex. District de Bagdad',
      createButton: 'Établir l’équipe',
      createError: 'Impossible d’établir l’équipe. Réessayez.',
      joinCodeHeading: 'Partagez ce code avec votre équipe',
      joinCodeShareNote: 'Toute personne qui saisit ce code avant de terminer sa propre auto-évaluation rejoint cette équipe. Aucun nom ni e-mail n’est collecté.',
      copyCode: 'Copier le code',
      copied: 'Copié !',
      countWaiting: '{count} réponse(s) sur {min} nécessaires avant que le profil d’équipe apparaisse.',
      dashboardTitle: 'Profil de l’équipe',
      roleBreakdownTitle: 'Par rôle',
      imbalanceHeading: 'Signal de déséquilibre',
      imbalanceNote: '{high} est fort ({highPct} %), {low} est faible ({lowPct} %) dans l’équipe — un signal indicatif, pas un résultat statistique.',
      noFlag: 'Aucun déséquilibre marqué détecté dans l’équipe.',
      refresh: 'Vérifier les nouvelles réponses',
      switchTeam: 'Changer d’équipe',
      codeLabel: 'Vous avez un code d’équipe ?',
      codeHelp: 'Facultatif — saisissez le code partagé par votre manager pour inclure votre résultat dans le profil d’équipe.',
      codePlaceholder: 'ex. A1B2C3',
      codeChecking: 'Vérification…',
      codeValid: 'Rejoint — votre résultat comptera pour cette équipe.',
      codeInvalid: 'Code introuvable. Vérifiez-le ou laissez le champ vide.',
    },
```

- [ ] **Step 4: Run the translations test**

Run: `npx vitest run src/i18n/translations.test.js`
Expected: PASS — the existing "translation completeness" test walks
`UI.en` generically and will confirm every new `team.*` key has matching
`ar`/`fr` entries.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/translations.js
git commit -m "feat: add team-dashboard translations (en/ar/fr)"
```

---

### Task 5: Intro screen — optional team join code

**Files:**
- Modify: `src/components/IntroScreen.jsx`
- Modify: `src/components/IntroScreen.test.jsx`

**Interfaces:**
- Consumes: `authAdapter.validateTeamCode({code}) → {valid, teamId}`
  (Task 3).
- Produces: `onStart(role: string, teamId: string|null)` — the second
  argument is new; Task 6 (`App.jsx`) updates its `handleStart` signature
  to match.

- [ ] **Step 1: Read the current `IntroScreen.test.jsx` to see existing conventions**

(No code change in this step — just confirms the render helper shape
before editing.)

- [ ] **Step 2: Write the failing tests**

Add to `src/components/IntroScreen.test.jsx` (new `describe` block,
alongside the existing ones):

```js
describe('IntroScreen team code', () => {
  function makeAdapter(overrides = {}) {
    return { validateTeamCode: vi.fn().mockResolvedValue({ valid: true, teamId: 'team-1' }), ...overrides };
  }

  it('starts with a null teamId when no code is entered', () => {
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={makeAdapter()} />);
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, null);
  });

  it('validates a 6-character code and passes the resolved teamId to onStart', async () => {
    const authAdapter = makeAdapter();
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'ab12cd' } });
    await waitFor(() => expect(authAdapter.validateTeamCode).toHaveBeenCalledWith({ code: 'AB12CD' }));
    await screen.findByText('Joined — your result will count toward this team.');
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, 'team-1');
  });

  it('shows an error for an invalid code and does not pass a teamId', async () => {
    const authAdapter = makeAdapter({ validateTeamCode: vi.fn().mockResolvedValue({ valid: false }) });
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'zzzzzz' } });
    await screen.findByText('That code was not found. Check it and try again, or leave it blank.');
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, null);
  });
});
```

Check the top of `IntroScreen.test.jsx` already imports `render, screen,
fireEvent` from `@testing-library/react`, `vi` from `vitest`, and
`DEFAULT_ROLE` from `../data/roles.js` — add `waitFor` to the existing
`@testing-library/react` import line, since it is not there yet.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/components/IntroScreen.test.jsx`
Expected: FAIL — no team-code input exists yet, `onStart` is called with
only one argument.

- [ ] **Step 4: Implement — add team-code state and field to `IntroScreen.jsx`**

Modify the top of `src/components/IntroScreen.jsx`:

```jsx
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { DIM } from '../data/dimensions.js';
import { ROLES, DEFAULT_ROLE } from '../data/roles.js';
import { isDraftRole } from '../data/scenarioSets.js';
import { noopAuthAdapter } from '../lib/authAdapter.js';

export default function IntroScreen({ onStart, authAdapter = noopAuthAdapter }) {
  const { t, tf, L } = useLanguage();
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [teamCode, setTeamCode] = useState('');
  const [teamStatus, setTeamStatus] = useState('idle'); // idle | checking | valid | invalid
  const [teamId, setTeamId] = useState(null);

  async function handleTeamCodeChange(e) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setTeamCode(value);
    setTeamId(null);
    if (value.length < 6) {
      setTeamStatus('idle');
      return;
    }
    setTeamStatus('checking');
    const result = await authAdapter.validateTeamCode({ code: value });
    if (result.valid) {
      setTeamStatus('valid');
      setTeamId(result.teamId);
    } else {
      setTeamStatus('invalid');
    }
  }

  return (
```

Insert this block into the JSX, right after the existing `role.heading`
`<div className="note" ...>` block and before the `<div
style={{ height: 20 }} />`:

```jsx
      <div className="note" style={{ marginTop: 16 }}>
        <label htmlFor="team-code"><b>{t('team.codeLabel')}</b></label>
        <div className="q" style={{ marginBottom: 8 }}>{t('team.codeHelp')}</div>
        <input
          id="team-code"
          value={teamCode}
          placeholder={t('team.codePlaceholder')}
          onChange={handleTeamCodeChange}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--line)', textTransform: 'uppercase' }}
        />
        {teamStatus === 'checking' && <div className="q" style={{ marginTop: 8 }}>{t('team.codeChecking')}</div>}
        {teamStatus === 'valid' && <div className="q" style={{ marginTop: 8, color: 'var(--fn)' }}>{t('team.codeValid')}</div>}
        {teamStatus === 'invalid' && <div className="q" style={{ marginTop: 8, color: '#b3261e' }}>{t('team.codeInvalid')}</div>}
      </div>
```

Change the final button's `onClick`:

```jsx
      <button className="btn" onClick={() => onStart(role, teamStatus === 'valid' ? teamId : null)}>{t('intro.start')}</button>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/IntroScreen.test.jsx`
Expected: PASS, all tests including the 3 new ones.

- [ ] **Step 6: Run the full suite**

Run: `npx vitest run`
Expected: initial run FAILS on two pre-existing assertions in
`src/components/IntroScreen.test.jsx`, because `onStart` is now always
called with a second argument. Fix both in that file:

```js
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE);
```
becomes
```js
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, null);
```

and

```js
    expect(onStart).toHaveBeenCalledWith('product_manager');
```
becomes
```js
    expect(onStart).toHaveBeenCalledWith('product_manager', null);
```

Re-run `npx vitest run` after the fix.
Expected: PASS, full suite green.

- [ ] **Step 7: Commit**

```bash
git add src/components/IntroScreen.jsx src/components/IntroScreen.test.jsx
git commit -m "feat: add optional team join code to intro screen"
```

---

### Task 6: Wire `teamId` through `App.jsx`

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

**Interfaces:**
- Consumes: `IntroScreen`'s new `onStart(role, teamId)` (Task 5),
  `authAdapter.saveAssessment(...)`'s new `teamId` param (Task 3).

- [ ] **Step 1: Update state and handlers in `App.jsx`**

Add a new state variable near the existing `role` state:

```jsx
  const [teamId, setTeamId] = useState(null);
```

Update `handleStart` to accept and store the second argument:

```jsx
  function handleStart(selectedRole, selectedTeamId = null) {
    const nextScenarios = getScenariosForRole(selectedRole);
    setRole(selectedRole);
    setTeamId(selectedTeamId);
    setScenarios(nextScenarios);
    setP1Answers(nextScenarios.map(() => ({ most: null, least: null })));
    setP1Index(0);
    setPhase('p1');
  }
```

Update `handleRestart` to reset it, alongside the other resets:

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
    setPhase('intro');
  }
```

Update the `saveAssessment` call inside the `onAuthStateChange` effect to
pass `teamId`, and add `teamId` to the effect's dependency array:

```jsx
  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChange(async (session) => {
      if (session && reportData && authState.status !== 'saved' && authState.status !== 'signedIn') {
        setAuthState({ status: 'signedIn' });
        const result = await authAdapter.saveAssessment({
          role,
          p1Answers,
          orgAnswers,
          complianceAnswers,
          reportData,
          userId: session.user.id,
          teamId,
        });
        setAuthState(
          result.success
            ? { status: 'saved', assessmentId: result.assessmentId, userId: session.user.id }
            : { status: 'error', error: result.error }
        );
      }
    });
    return unsubscribe;
  }, [authAdapter, reportData, authState.status, role, p1Answers, orgAnswers, complianceAnswers, teamId]);
```

Pass `authAdapter` through to `IntroScreen`:

```jsx
          {phase === 'intro' && <IntroScreen onStart={handleStart} authAdapter={authAdapter} />}
```

- [ ] **Step 2: Run the full suite**

Run: `npx vitest run`
Expected: PASS. The existing App tests use
`expect.objectContaining({...})` for `saveAssessment` assertions, so
adding `teamId` to the call does not break them.

- [ ] **Step 3: Add one test confirming `teamId` reaches `saveAssessment`**

Add to `src/App.test.jsx`, inside the `describe('App with a fake auth
adapter', ...)` block:

```js
  it('passes the joined teamId through to saveAssessment', async () => {
    let authCallback;
    const saveAssessment = vi.fn().mockResolvedValue({ success: true });
    const fakeAdapter = {
      signInWithEmail: vi.fn().mockResolvedValue({ success: true }),
      saveAssessment,
      getSession: vi.fn().mockResolvedValue(null),
      onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
      validateTeamCode: vi.fn().mockResolvedValue({ valid: true, teamId: 'team-9' }),
    };

    render(<App authAdapter={fakeAdapter} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'ab12cd' } });
    await waitFor(() => expect(fakeAdapter.validateTeamCode).toHaveBeenCalled());
    await screen.findByText('Joined — your result will count toward this team.');
    completeFullFlow();

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Send link'));
    await act(async () => { await authCallback({ user: { id: 'user-123' } }); });

    expect(saveAssessment).toHaveBeenCalledWith(expect.objectContaining({ teamId: 'team-9' }));
  });
```

Confirm `waitFor` is imported at the top of `App.test.jsx` (add it to the
existing `@testing-library/react` import if missing).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/App.test.jsx`
Expected: PASS, including the new test.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/App.test.jsx
git commit -m "feat: wire optional team join code through the self-assessment flow"
```

---

### Task 7: Manager app + screen

**Files:**
- Create: `src/ManagerApp.jsx`
- Create: `src/ManagerApp.test.jsx`
- Create: `src/components/ManagerScreen.jsx`
- Create: `src/components/ManagerScreen.test.jsx`

**Interfaces:**
- Consumes: `authAdapter.signInWithEmail`, `.onAuthStateChange`,
  `.createTeam`, `.listTeams`, `.getTeamSummary` (Task 3);
  `computeImbalance(distribution)` (Task 2); `DIM` from
  `src/data/dimensions.js`.
- Produces: `ManagerApp({authAdapter})` default export, rendered by
  `main.jsx` (Task 8) for the `/manager` route.

- [ ] **Step 1: Write the failing `ManagerScreen` tests**

Create `src/components/ManagerScreen.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ManagerScreen from './ManagerScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';
import { DIM } from '../data/dimensions.js';

function renderScreen(props) {
  return render(
    <LanguageProvider>
      <ManagerScreen
        authState={{ status: 'anon' }}
        team={null}
        teams={[]}
        summary={null}
        imbalance={null}
        dim={DIM}
        createStatus="idle"
        createError={null}
        onSignIn={() => {}}
        onCreateTeam={() => {}}
        onRefresh={() => {}}
        onSwitchTeam={() => {}}
        {...props}
      />
    </LanguageProvider>
  );
}

describe('ManagerScreen', () => {
  it('shows the sign-in form when not signed in', () => {
    renderScreen({});
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
  });

  it('calls onSignIn with the entered email', () => {
    const onSignIn = vi.fn();
    renderScreen({ onSignIn });
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'm@x.com' } });
    fireEvent.click(screen.getByText('Send link'));
    expect(onSignIn).toHaveBeenCalledWith('m@x.com');
  });

  it('shows the create-team form once signed in with no team', () => {
    renderScreen({ authState: { status: 'signedIn', userId: 'u1' } });
    expect(screen.getByPlaceholderText('e.g. Baghdad District')).toBeInTheDocument();
  });

  it('calls onCreateTeam with the entered name', () => {
    const onCreateTeam = vi.fn();
    renderScreen({ authState: { status: 'signedIn', userId: 'u1' }, onCreateTeam });
    fireEvent.change(screen.getByPlaceholderText('e.g. Baghdad District'), { target: { value: 'District A' } });
    fireEvent.click(screen.getByText('Create team'));
    expect(onCreateTeam).toHaveBeenCalledWith('District A');
  });

  it('shows the waiting message when the team has fewer than 3 responses', () => {
    renderScreen({
      authState: { status: 'signedIn', userId: 'u1' },
      team: { id: 't1', name: 'District A', joinCode: 'AB12CD' },
      summary: { count: 1, distribution: null, roleBreakdown: null },
    });
    expect(screen.getByText('1 of 3 responses needed before the team pattern appears.')).toBeInTheDocument();
  });

  it('shows the dashboard and imbalance flag once revealed', () => {
    renderScreen({
      authState: { status: 'signedIn', userId: 'u1' },
      team: { id: 't1', name: 'District A', joinCode: 'AB12CD' },
      summary: { count: 5, distribution: { F: 50, B: 32, W: 18, C: 60 }, roleBreakdown: { rep: 3, manager: 2 } },
      imbalance: { high: 'F', low: 'W' },
    });
    expect(screen.getByText('Team pattern')).toBeInTheDocument();
    expect(screen.getByText('Function is strong (50%), Will is low (18%) across the team — a rule-of-thumb signal, not a statistical finding.')).toBeInTheDocument();
  });

  it('shows the no-flag message when imbalance is null but the dashboard is revealed', () => {
    renderScreen({
      authState: { status: 'signedIn', userId: 'u1' },
      team: { id: 't1', name: 'District A', joinCode: 'AB12CD' },
      summary: { count: 5, distribution: { F: 34, B: 33, W: 33, C: 60 }, roleBreakdown: { rep: 5 } },
      imbalance: null,
    });
    expect(screen.getByText('No strong imbalance detected across the team.')).toBeInTheDocument();
  });

  it('shows no team switcher when the manager has only one team', () => {
    renderScreen({
      authState: { status: 'signedIn', userId: 'u1' },
      team: { id: 't1', name: 'District A', joinCode: 'AB12CD' },
      teams: [{ id: 't1', name: 'District A', joinCode: 'AB12CD' }],
      summary: { count: 1, distribution: null, roleBreakdown: null },
    });
    expect(screen.queryByText('Switch team')).not.toBeInTheDocument();
  });

  it('shows a team switcher and calls onSwitchTeam when the manager has more than one team', () => {
    const onSwitchTeam = vi.fn();
    renderScreen({
      authState: { status: 'signedIn', userId: 'u1' },
      team: { id: 't1', name: 'District A', joinCode: 'AB12CD' },
      teams: [
        { id: 't1', name: 'District A', joinCode: 'AB12CD' },
        { id: 't2', name: 'District B', joinCode: 'ZZ99XX' },
      ],
      summary: { count: 1, distribution: null, roleBreakdown: null },
      onSwitchTeam,
    });
    fireEvent.change(screen.getByLabelText('Switch team'), { target: { value: 't2' } });
    expect(onSwitchTeam).toHaveBeenCalledWith('t2');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/ManagerScreen.test.jsx`
Expected: FAIL — `ManagerScreen.jsx` does not exist yet.

- [ ] **Step 3: Implement `src/components/ManagerScreen.jsx`**

```jsx
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const MIN_RESPONSES = 3;

export default function ManagerScreen({ authState, team, teams = [], summary, imbalance, dim, createStatus, createError, onSignIn, onCreateTeam, onRefresh, onSwitchTeam }) {
  const { t, tf, L } = useLanguage();
  const [email, setEmail] = useState('');
  const [teamName, setTeamName] = useState('');
  const [copied, setCopied] = useState(false);

  function copyCode(code) {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (authState.status !== 'signedIn') {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('team.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('team.title')}</h1>
        <p className="lead" style={{ marginBottom: 18 }}>{t('team.lead')}</p>
        <div className="card pad">
          <p style={{ margin: '0 0 8px' }}><b>{t('team.signInHeading')}</b> {t('team.signInBody')}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              placeholder={t('team.emailPlaceholder')}
              onChange={e => setEmail(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10 }}
            />
            <button className="btn sm" disabled={!email || authState.status === 'sending'} onClick={() => onSignIn(email)}>
              {authState.status === 'sending' ? t('team.sending') : t('team.sendLink')}
            </button>
          </div>
          {authState.status === 'sent' && <p style={{ margin: '8px 0 0', fontSize: 13.5 }}>{t('team.checkEmail')}</p>}
          {authState.status === 'error' && <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{authState.error || t('team.sendError')}</p>}
        </div>
      </section>
    );
  }

  if (!team) {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('team.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 18 }}>{t('team.createHeading')}</h1>
        <div className="card pad">
          <label htmlFor="team-name"><b>{t('team.createNameLabel')}</b></label>
          <input
            id="team-name"
            value={teamName}
            placeholder={t('team.createNamePlaceholder')}
            onChange={e => setTeamName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, margin: '8px 0 14px' }}
          />
          {createError && <p style={{ color: '#b3261e', fontSize: 13.5, margin: '0 0 10px' }}>{createError}</p>}
          <button className="btn" disabled={!teamName || createStatus === 'creating'} onClick={() => onCreateTeam(teamName)}>
            {createStatus === 'creating' ? t('team.sending') : t('team.createButton')}
          </button>
        </div>
      </section>
    );
  }

  const gapData = summary?.distribution
    ? ['F', 'B', 'W', 'C'].map(key => ({ key, pct: summary.distribution[key] }))
    : null;

  return (
    <section className="screen active">
      <div className="eyebrow">{t('team.eyebrow')}</div>
      <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{team.name}</h1>
      {teams.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="team-switch" style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{t('team.switchTeam')}</label>
          <select
            id="team-switch"
            value={team.id}
            onChange={e => onSwitchTeam(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
          >
            {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
          </select>
        </div>
      )}
      <div className="card pad" style={{ marginBottom: 18 }}>
        <p style={{ margin: '0 0 8px' }}>{t('team.joinCodeHeading')}</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            readOnly
            value={team.joinCode}
            style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, fontWeight: 700, letterSpacing: '0.08em' }}
            onFocus={e => e.target.select()}
          />
          <button className="btn sm" onClick={() => copyCode(team.joinCode)}>{copied ? t('team.copied') : t('team.copyCode')}</button>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 10px' }}>{t('team.joinCodeShareNote')}</p>
        {!gapData && (
          <p style={{ fontSize: 13.5 }}>{tf('team.countWaiting', { count: summary?.count || 0, min: MIN_RESPONSES })}</p>
        )}
        <button className="btn ghost sm" onClick={onRefresh}>{t('team.refresh')}</button>
      </div>

      {gapData && (
        <>
          <div className="sec-title">{t('team.dashboardTitle')}</div>
          <div className="card pad" style={{ marginBottom: 18 }}>
            {gapData.map(g => {
              const label = g.key === 'C' ? t('report.complianceLineLabel') : L(dim[g.key].label);
              const color = g.key === 'C' ? dim.W.color : dim[g.key].color;
              return (
                <div className="orgbar" key={g.key}>
                  <div className="top">
                    <span style={{ color, fontWeight: 600 }}>{label}</span>
                    <span className="lvl">{Math.round(g.pct)}%</span>
                  </div>
                  <div className="track"><div className="fill" style={{ width: `${g.pct}%`, background: color }} /></div>
                </div>
              );
            })}
          </div>

          <div className="sec-title">{t('team.roleBreakdownTitle')}</div>
          <div className="card pad" style={{ marginBottom: 18 }}>
            {Object.entries(summary.roleBreakdown || {}).map(([role, n]) => (
              <div key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                <span>{role}</span><span>{n}</span>
              </div>
            ))}
          </div>

          <div className="note">
            <b>{t('team.imbalanceHeading')}</b>
            <p style={{ margin: '6px 0 0' }}>
              {imbalance
                ? tf('team.imbalanceNote', {
                    high: L(dim[imbalance.high].label),
                    highPct: Math.round(summary.distribution[imbalance.high]),
                    low: L(dim[imbalance.low].label),
                    lowPct: Math.round(summary.distribution[imbalance.low]),
                  })
                : t('team.noFlag')}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run the `ManagerScreen` tests to verify they pass**

Run: `npx vitest run src/components/ManagerScreen.test.jsx`
Expected: PASS, all 9 tests.

- [ ] **Step 5: Write the failing `ManagerApp` tests**

Create `src/ManagerApp.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ManagerApp from './ManagerApp.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';

function makeAdapter(overrides = {}) {
  let authCallback = () => {};
  return {
    signInWithEmail: vi.fn().mockResolvedValue({ success: true }),
    onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
    createTeam: vi.fn().mockResolvedValue({ success: true, teamId: 't1', joinCode: 'AB12CD' }),
    listTeams: vi.fn().mockResolvedValue({ success: true, teams: [] }),
    getTeamSummary: vi.fn().mockResolvedValue({ success: true, count: 5, distribution: { F: 50, B: 32, W: 18, C: 60 }, roleBreakdown: { rep: 5 } }),
    triggerAuth: (session) => authCallback(session),
    ...overrides,
  };
}

describe('ManagerApp', () => {
  it('creates a team and shows the join code when the manager has none yet', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><ManagerApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    await waitFor(() => expect(authAdapter.listTeams).toHaveBeenCalledWith({ userId: 'u1' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. Baghdad District'), { target: { value: 'District A' } });
    fireEvent.click(screen.getByText('Create team'));

    await waitFor(() => expect(authAdapter.createTeam).toHaveBeenCalledWith({ name: 'District A', userId: 'u1' }));
    expect(await screen.findByDisplayValue('AB12CD')).toBeInTheDocument();
  });

  it('loads the manager\'s existing team on sign-in instead of showing the create form', async () => {
    const authAdapter = makeAdapter({
      listTeams: vi.fn().mockResolvedValue({ success: true, teams: [{ id: 't1', name: 'District A', joinCode: 'AB12CD' }] }),
    });
    render(<LanguageProvider><ManagerApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    expect(await screen.findByDisplayValue('AB12CD')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. Baghdad District')).not.toBeInTheDocument();
  });

  it('refreshes the summary and computes the imbalance flag', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><ManagerApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    await screen.findByPlaceholderText('e.g. Baghdad District');
    fireEvent.change(screen.getByPlaceholderText('e.g. Baghdad District'), { target: { value: 'District A' } });
    fireEvent.click(screen.getByText('Create team'));
    await screen.findByDisplayValue('AB12CD');

    fireEvent.click(screen.getByText('Check for new responses'));
    await waitFor(() => expect(authAdapter.getTeamSummary).toHaveBeenCalledWith({ teamId: 't1' }));
    expect(await screen.findByText('Function is strong (50%), Will is low (18%) across the team — a rule-of-thumb signal, not a statistical finding.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the `ManagerApp` tests to verify they fail**

Run: `npx vitest run src/ManagerApp.test.jsx`
Expected: FAIL — `ManagerApp.jsx` does not exist yet.

- [ ] **Step 7: Implement `src/ManagerApp.jsx`**

```jsx
import { useEffect, useState } from 'react';
import ManagerScreen from './components/ManagerScreen.jsx';
import { noopAuthAdapter } from './lib/authAdapter.js';
import { computeImbalance } from './lib/teamScoring.js';
import { DIM } from './data/dimensions.js';

export default function ManagerApp({ authAdapter = noopAuthAdapter }) {
  const [authState, setAuthState] = useState({ status: 'anon' });
  const [teams, setTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [summary, setSummary] = useState(null);
  const [createStatus, setCreateStatus] = useState('idle');
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChange(async (session) => {
      if (!session) return;
      setAuthState({ status: 'signedIn', userId: session.user.id });
      const result = await authAdapter.listTeams({ userId: session.user.id });
      if (result.success && result.teams.length > 0) {
        setTeams(result.teams);
        setTeam(result.teams[0]);
      }
    });
    return unsubscribe;
  }, [authAdapter]);

  async function handleSignIn(email) {
    setAuthState({ status: 'sending' });
    const result = await authAdapter.signInWithEmail(email);
    setAuthState(result.success ? { status: 'sent' } : { status: 'error', error: result.error });
  }

  async function handleCreateTeam(name) {
    setCreateStatus('creating');
    setCreateError(null);
    const result = await authAdapter.createTeam({ name, userId: authState.userId });
    if (result.success) {
      const newTeam = { id: result.teamId, name, joinCode: result.joinCode };
      setTeams(prev => [...prev, newTeam]);
      setTeam(newTeam);
      setCreateStatus('done');
    } else {
      setCreateStatus('idle');
      setCreateError(result.error);
    }
  }

  function handleSwitchTeam(teamId) {
    const next = teams.find(tm => tm.id === teamId);
    if (next) {
      setTeam(next);
      setSummary(null);
    }
  }

  async function handleRefresh() {
    if (!team) return;
    const result = await authAdapter.getTeamSummary({ teamId: team.id });
    if (result.success) {
      setSummary({ count: result.count, distribution: result.distribution, roleBreakdown: result.roleBreakdown });
    }
  }

  const imbalance = summary?.distribution ? computeImbalance(summary.distribution) : null;

  return (
    <main>
      <div className="wrap">
        <ManagerScreen
          authState={authState}
          team={team}
          teams={teams}
          summary={summary}
          imbalance={imbalance}
          dim={DIM}
          createStatus={createStatus}
          createError={createError}
          onSignIn={handleSignIn}
          onCreateTeam={handleCreateTeam}
          onSwitchTeam={handleSwitchTeam}
          onRefresh={handleRefresh}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Run the `ManagerApp` tests to verify they pass**

Run: `npx vitest run src/ManagerApp.test.jsx`
Expected: PASS, all 3 tests.

- [ ] **Step 9: Run the full suite**

Run: `npx vitest run`
Expected: PASS — everything green.

- [ ] **Step 10: Commit**

```bash
git add src/ManagerApp.jsx src/ManagerApp.test.jsx src/components/ManagerScreen.jsx src/components/ManagerScreen.test.jsx
git commit -m "feat: add manager app and team dashboard screen"
```

---

### Task 8: Route `/manager` in `main.jsx`

**Files:**
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes: `ManagerApp` (Task 7).

- [ ] **Step 1: Add the route**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import RaterApp from './RaterApp.jsx';
import ManagerApp from './ManagerApp.jsx';
import { supabaseAuthAdapter } from './lib/authAdapter.js';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import './styles/global.css';

const raterMatch = window.location.pathname.match(/^\/rate\/([0-9a-f-]{36})$/i);
const isManagerRoute = window.location.pathname === '/manager';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      {raterMatch
        ? <RaterApp linkId={raterMatch[1]} authAdapter={supabaseAuthAdapter} />
        : isManagerRoute
        ? <ManagerApp authAdapter={supabaseAuthAdapter} />
        : <App authAdapter={supabaseAuthAdapter} />}
    </LanguageProvider>
  </React.StrictMode>
);
```

- [ ] **Step 2: Run the full suite**

Run: `npx vitest run`
Expected: PASS — `main.jsx` has no existing test file (consistent with
the current codebase, which does not test the routing entrypoint
directly), so this step just confirms nothing else regressed.

- [ ] **Step 3: Commit**

```bash
git add src/main.jsx
git commit -m "feat: route /manager to the team dashboard app"
```

---

### Task 9: Manual mobile QA

**Files:** none (verification only, matches the playbook's standing
instruction and the precedent of the existing "Task 15 manual mobile QA"
commit in this repo's history).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Test the rep-side flow at a 375px viewport**

Open the app, resize the browser (or use device emulation) to 375px
wide. On the intro screen, enter a team code — first an invalid one
(confirm the "not found" message), then leave it blank and start the
assessment normally to confirm the optional field doesn't block the
existing flow.

- [ ] **Step 3: Test the manager flow at a 375px viewport**

Navigate to `/manager`. Sign in (check the email inbox for the magic
link, or use a Supabase test user if one exists for this project). Create
a team, confirm the join code displays and copies correctly. Using a
second browser/incognito window, complete 3 self-assessments as different
anonymous reps entering that team's join code, with at least two
different roles selected. Return to the manager tab, click "Check for new
responses," and confirm the dashboard reveals with the F/B/W/Compliance
bars, the role breakdown, and either an imbalance flag or the "no strong
imbalance" message, all rendering correctly at 375px.

- [ ] **Step 4: Record the result**

If everything works, commit a short note (mirroring the existing "docs:
record Task 15 manual mobile QA results" commit style):

```bash
git commit --allow-empty -m "docs: record Prompt 5 manual mobile QA results"
```

If anything is broken, fix it as a normal follow-up commit before
considering Prompt 5 done — do not mark the prompt complete with a known
mobile issue outstanding.
