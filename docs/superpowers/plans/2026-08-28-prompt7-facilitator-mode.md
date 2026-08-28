# Facilitator / Workshop Mode (Prompt 7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a facilitator run the FBW assessment live in a workshop —
start a session, participants join with a code and take the full
assessment on their phones, the facilitator watches an anonymized
Function/Being/Will pattern build up in real time, and gets 4-5 printable
discussion cards matched to whatever group pattern emerges.

**Architecture:** A new `fbw_sessions` table, structurally separate from
Prompt 5's persistent `fbw_teams`, holds one live occasion with a 24h (or
manually early) expiry. A single `validate_code` RPC replaces
`validate_team_code` as the intro screen's one entry point and checks both
`fbw_teams` and `fbw_sessions`. `get_session_summary` mirrors
`get_team_summary` exactly (same anonymity gate, same F/B/W/C shape). The
facilitator's live view polls that RPC every 5s — no Realtime, no new
dependency. Discussion cards reuse Prompt 5's `computeImbalance` unchanged
as the classifier. `ManagerApp.jsx` gains a tab switcher; the existing
`ManagerScreen.jsx` (Team tab) is untouched — a new `SessionLiveScreen.jsx`
handles the Session tab entirely.

**Tech Stack:** React (Vite), Supabase (Postgres + RLS + RPC), Vitest +
Testing Library. Shared Supabase project `madarlead-assessment`
(`kkhkxjvipamajvawxzpc`), tables namespaced `fbw_`.

**Spec:** `docs/superpowers/specs/2026-08-28-prompt7-facilitator-mode-design.md`

## Global Constraints

- No SELECT policy on `fbw_assessments` is ever added for facilitators —
  `get_session_summary` is the only read path for session-level data,
  same structural-anonymity rule as Prompts 4 and 5.
- Minimum-response gate is 3, matching the existing 360 and team modules.
- `fbw_sessions` is a separate table from `fbw_teams` — do not merge them
  or add a "live mode" flag to `fbw_teams`.
- Live updates are polling only (5s interval) — do not add a Supabase
  Realtime subscription.
- All new user-facing strings go in `src/i18n/translations.js`, `en` and
  `ar` only (French was removed from this app on 2026-08-27 — do not
  reintroduce an `fr` block anywhere).
- Follow existing component/file conventions exactly: a state/logic
  container (`ManagerApp.jsx`) paired with presentational screen
  components in `src/components/`, both with a co-located `.test.jsx`.
- `ManagerScreen.jsx` and its test file are not modified by this plan —
  the Team tab (Prompt 5) is untouched, isolating this feature's risk.

---

### Task 1: Database migration — schema and RPCs

**Files:**
- Create: `supabase/migrations/0005_fbw_facilitator_sessions.sql`

**Interfaces:**
- Produces: table `fbw_sessions(id, facilitator_id, name, join_code,
  created_at, ends_at)`, column `fbw_assessments.session_id`, RPC
  `validate_code(p_code text) → jsonb {valid, kind: 'team'|'session',
  id}` (granted to `anon, authenticated`), RPC
  `get_session_summary(p_session_id uuid) → jsonb {count, distribution:
  {F,B,W,C}|null, roleBreakdown}` (granted to `authenticated`), RPC
  `end_session(p_session_id uuid) → void` (granted to `authenticated`).
  These exact names/shapes are what Task 3's `authAdapter.js` calls.

- [ ] **Step 1: Write the migration file**

```sql
-- 0005_fbw_facilitator_sessions.sql
-- Prompt 7: live facilitator/workshop sessions. See
-- docs/superpowers/specs/2026-08-28-prompt7-facilitator-mode-design.md.
--
-- fbw_sessions is kept separate from fbw_teams (Prompt 5): teams are a
-- persistent, async join-code construct with no expiry; sessions are a
-- live, ephemeral one-off occasion that naturally or manually expires.

create table fbw_sessions (
  id uuid primary key default gen_random_uuid(),
  facilitator_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  join_code text not null unique default upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  created_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '24 hours')
);

alter table fbw_sessions enable row level security;

create policy "facilitator full access to own sessions" on fbw_sessions
  for all using (auth.uid() = facilitator_id) with check (auth.uid() = facilitator_id);

alter table fbw_assessments add column session_id uuid references fbw_sessions(id);

-- No SELECT policy is added for facilitators on fbw_assessments —
-- get_session_summary below is the only sanctioned read path, so an
-- individual assessment is never queryable by a facilitator, structurally.

-- validate_code: single anon-callable entry point for the intro screen's
-- "have a code?" field. Checks both fbw_teams and fbw_sessions so a rep
-- never has to know or pick which kind of code they were given. Replaces
-- validate_team_code as the client's only call site (that function is
-- left in place, unused, rather than dropped — no other caller depends
-- on removing it, and dropping a function in the same migration that
-- stops calling it is unnecessary churn).
create or replace function validate_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_session_id uuid;
begin
  select id into v_team_id from fbw_teams where join_code = upper(p_code);
  if v_team_id is not null then
    return jsonb_build_object('valid', true, 'kind', 'team', 'id', v_team_id);
  end if;

  select id into v_session_id from fbw_sessions
    where join_code = upper(p_code) and now() < ends_at;
  if v_session_id is not null then
    return jsonb_build_object('valid', true, 'kind', 'session', 'id', v_session_id);
  end if;

  return jsonb_build_object('valid', false);
end;
$$;

grant execute on function validate_code(text) to anon, authenticated;

-- get_session_summary: the only way a facilitator reads session-level
-- data. Same anonymity gate and F/B/W/C shape as get_team_summary, so
-- the two dashboards stay numerically comparable.
create or replace function get_session_summary(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_facilitator uuid;
  v_count int;
  v_distribution jsonb;
  v_role_breakdown jsonb;
begin
  select facilitator_id into v_facilitator from fbw_sessions where id = p_session_id;

  if v_facilitator is null or v_facilitator <> auth.uid() then
    raise exception 'not authorized';
  end if;

  select count(*) into v_count from fbw_assessments where session_id = p_session_id;

  if v_count < 3 then
    return jsonb_build_object('count', v_count, 'distribution', null, 'roleBreakdown', null);
  end if;

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
  from fbw_assessments where session_id = p_session_id;

  select jsonb_object_agg(coalesce(role, 'unspecified'), n) into v_role_breakdown
  from (
    select role, count(*) n from fbw_assessments
    where session_id = p_session_id group by role
  ) role_counts;

  return jsonb_build_object('count', v_count, 'distribution', v_distribution, 'roleBreakdown', v_role_breakdown);
end;
$$;

grant execute on function get_session_summary(uuid) to authenticated;

-- end_session: facilitator-initiated early close. Setting ends_at to now()
-- is sufficient to make validate_code refuse the code immediately — no
-- separate "active" flag needed.
create or replace function end_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update fbw_sessions set ends_at = now()
  where id = p_session_id and facilitator_id = auth.uid();
end;
$$;

grant execute on function end_session(uuid) to authenticated;
```

- [ ] **Step 2: Apply the migration to the shared Supabase project**

Load the Supabase MCP tool if not already available:

```
ToolSearch query: "select:mcp__plugin_supabase_supabase__apply_migration"
```

Call it with `project_id: "kkhkxjvipamajvawxzpc"`, `name:
"0005_fbw_facilitator_sessions"`, and `query` set to the exact SQL from
Step 1.

- [ ] **Step 3: Verify the migration applied cleanly**

Call `mcp__plugin_supabase_supabase__list_migrations` with
`project_id: "kkhkxjvipamajvawxzpc"` and confirm
`0005_fbw_facilitator_sessions` appears. Call
`mcp__plugin_supabase_supabase__get_advisors` with `type: "security"` for
the same project and confirm no new advisory appears for `fbw_sessions`
or the three new functions (RLS enabled + policy present is the expected
clean state).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0005_fbw_facilitator_sessions.sql
git commit -m "feat: add facilitator session schema + RPCs (Prompt 7 backend)"
```

---

### Task 2: Discussion cards content bank

**Files:**
- Create: `src/data/discussionCards.js`
- Test: `src/data/discussionCards.test.js`

**Interfaces:**
- Produces: `DISCUSSION_CARDS` (object keyed `'F-W'|'F-B'|'B-F'|'B-W'|
  'W-F'|'W-B'|'balanced'`, each value an array of 4 `{en, ar}` objects),
  `getDiscussionCardKey(imbalance: {high,low}|null) → string`. Consumed
  by `SessionLiveScreen.jsx` (Task 8) and its test.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest';
import { DISCUSSION_CARDS, getDiscussionCardKey } from './discussionCards.js';

describe('getDiscussionCardKey', () => {
  it('builds a "high-low" key from an imbalance flag', () => {
    expect(getDiscussionCardKey({ high: 'F', low: 'W' })).toBe('F-W');
    expect(getDiscussionCardKey({ high: 'W', low: 'B' })).toBe('W-B');
  });

  it('returns "balanced" when there is no imbalance', () => {
    expect(getDiscussionCardKey(null)).toBe('balanced');
  });
});

describe('DISCUSSION_CARDS', () => {
  const ALL_KEYS = ['F-W', 'F-B', 'B-F', 'B-W', 'W-F', 'W-B', 'balanced'];

  it('has all 6 imbalance keys plus balanced, each with 4 cards in en and ar', () => {
    expect(Object.keys(DISCUSSION_CARDS).sort()).toEqual(ALL_KEYS.sort());
    ALL_KEYS.forEach(key => {
      expect(DISCUSSION_CARDS[key]).toHaveLength(4);
      DISCUSSION_CARDS[key].forEach(card => {
        expect(card.en).toBeTruthy();
        expect(card.ar).toBeTruthy();
      });
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/data/discussionCards.test.js`
Expected: FAIL — `discussionCards.js` does not exist yet.

- [ ] **Step 3: Write the implementation**

```js
// REVIEW: Arabic translations below are a first draft — Shadi is the
// domain/language owner for this framework and should review before ship.
//
// Discussion cards for facilitator/workshop mode (Prompt 7). Keyed by the
// same "high-low" pair computeImbalance() (src/lib/teamScoring.js,
// Prompt 5) already produces from a session's aggregated distribution,
// plus 'balanced' for a null (no strong imbalance) result. 4 short,
// simple-English prompts per key — a facilitator reads these aloud to
// the room, not a script to follow word-for-word.
export const DISCUSSION_CARDS = {
  'F-W': [
    { en: 'This room delivers. Where have you personally held back from a hard call recently?', ar: 'هذه المجموعة تنجز جيداً. أين تراجعت شخصياً عن اتخاذ قرار صعب مؤخراً؟' },
    { en: 'Think of a decision you avoided because it felt risky. What was the actual risk?', ar: 'فكّر بقرار تجنبته لأنه بدا محفوفاً بالمخاطر. ما هي المخاطرة الفعلية؟' },
    { en: 'What would change if "good enough" stopped being the safe choice here?', ar: 'ماذا سيتغير لو توقف "الجيد بما يكفي" عن كونه الخيار الآمن هنا؟' },
    { en: 'Name one thing this team keeps deferring to "next quarter."', ar: 'اذكر أمراً واحداً يواصل هذا الفريق تأجيله إلى "الربع القادم".' },
  ],
  'F-B': [
    { en: 'We are strong on getting things done. When did you last really listen without planning your reply?', ar: 'نحن أقوياء في إنجاز الأمور. متى كانت آخر مرة استمعت فيها حقاً دون التخطيط لردك؟' },
    { en: 'Think of a colleague you know less than you should. What is one question you could ask them this week?', ar: 'فكّر بزميل تعرفه أقل مما ينبغي. ما هو سؤال واحد يمكنك طرحه عليه هذا الأسبوع؟' },
    { en: 'Where does "busy" get used as an excuse to skip a real conversation here?', ar: 'أين تُستخدم كلمة "مشغول" هنا كعذر لتجنب محادثة حقيقية؟' },
    { en: 'What would it look like to slow down for five minutes in your next meeting?', ar: 'كيف سيبدو التمهل لخمس دقائق في اجتماعك القادم؟' },
  ],
  'B-F': [
    { en: 'This room connects well. What is one task everyone agrees on but nobody has finished?', ar: 'هذه المجموعة تتواصل جيداً. ما هي مهمة واحدة يتفق عليها الجميع لكن لم ينهها أحد؟' },
    { en: 'Where do good conversations here not turn into clear next steps?', ar: 'أين لا تتحول المحادثات الجيدة هنا إلى خطوات تالية واضحة؟' },
    { en: 'Name one small commitment you can close out by next week.', ar: 'اذكر التزاماً صغيراً واحداً يمكنك إنجازه بحلول الأسبوع القادم.' },
    { en: 'What gets in the way of turning agreement into action here?', ar: 'ما الذي يعيق تحويل الاتفاق إلى فعل هنا؟' },
  ],
  'B-W': [
    { en: 'People here read each other well. What is a hard truth this team avoids saying out loud?', ar: 'الأشخاص هنا يفهمون بعضهم جيداً. ما هي الحقيقة الصعبة التي يتجنب هذا الفريق قولها بصوت مسموع؟' },
    { en: 'Think of a disagreement you smoothed over instead of resolving. What did that cost?', ar: 'فكّر بخلاف قمت بتلطيفه بدلاً من حله. ما الذي كلّفه ذلك؟' },
    { en: 'What would it take for this room to disagree openly and still stay close?', ar: 'ما الذي يتطلبه أن تختلف هذه المجموعة علناً وتبقى مترابطة؟' },
    { en: 'Name one boundary you have not set that you need to.', ar: 'اذكر حداً واحداً لم تضعه بعد وتحتاج إلى وضعه.' },
  ],
  'W-F': [
    { en: 'This room does not back down. Where does that courage outrun the plan behind it?', ar: 'هذه المجموعة لا تتراجع. أين تسبق هذه الشجاعة الخطة التي تدعمها؟' },
    { en: 'Think of a bold call that did not have the follow-through to match. What was missing?', ar: 'فكّر بقرار جريء لم يحظَ بالمتابعة المناسبة. ما الذي كان ناقصاً؟' },
    { en: 'What is one place where more structure would make your courage go further?', ar: 'أين يمكن لمزيد من التنظيم أن يجعل شجاعتك أكثر فاعلية؟' },
    { en: 'Name a commitment made here that still needs a concrete next step.', ar: 'اذكر التزاماً تم هنا وما زال يحتاج إلى خطوة تالية ملموسة.' },
  ],
  'W-B': [
    { en: 'This team pushes hard. Who might feel pushed past, not just forward?', ar: 'هذا الفريق يدفع بقوة. من قد يشعر بأنه دُفع بعيداً، لا فقط إلى الأمام؟' },
    { en: 'Think of a moment you were right but the room still felt bruised afterward. What happened?', ar: 'فكّر بلحظة كنت فيها محقاً لكن المجموعة شعرت بالأذى بعدها. ماذا حدث؟' },
    { en: 'What would it look like to pair your next hard stand with one honest check-in?', ar: 'كيف سيبدو أن تقرن موقفك الصعب القادم بلقاء صادق واحد؟' },
    { en: 'Name someone here you have not really checked on lately.', ar: 'اذكر شخصاً هنا لم تطمئن عليه فعلاً مؤخراً.' },
  ],
  balanced: [
    { en: 'No single pattern dominates this room — where is that a strength, and where might it blur ownership?', ar: 'لا يهيمن نمط واحد على هذه المجموعة — أين تكمن قوة ذلك، وأين قد يُضعف وضوح المسؤولية؟' },
    { en: 'When the room needs to move fast, who normally steps up? Is that by design or by default?', ar: 'حين تحتاج المجموعة للتحرك بسرعة، من يتقدم عادة؟ هل ذلك بتصميم أم بحكم العادة؟' },
    { en: 'What is one decision this group made recently that used all three — planning, people, and courage?', ar: 'ما هو قرار اتخذته هذه المجموعة مؤخراً واستخدم الثلاثة معاً — التخطيط والناس والشجاعة؟' },
    { en: 'Where could this balance tip if the workload doubled tomorrow?', ar: 'أين قد يختل هذا التوازن لو تضاعف حجم العمل غداً؟' },
  ],
};

export function getDiscussionCardKey(imbalance) {
  return imbalance ? `${imbalance.high}-${imbalance.low}` : 'balanced';
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/data/discussionCards.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/discussionCards.js src/data/discussionCards.test.js
git commit -m "feat: add discussion-card content bank keyed by group imbalance pattern"
```

---

### Task 3: Auth adapter — session methods, unified `validateCode`, `sessionId` in `saveAssessment`

**Files:**
- Modify: `src/lib/authAdapter.js`
- Modify: `src/lib/authAdapter.test.js`

**Interfaces:**
- Consumes: RPCs from Task 1 (`validate_code`, `get_session_summary`,
  `end_session`), table `fbw_sessions`.
- Produces (both `noopAuthAdapter` and `supabaseAuthAdapter`):
  `createSession({name, userId}) → {success, sessionId?, joinCode?,
  error?}`, `endSession({sessionId}) → {success, error?}`,
  `getSessionSummary({sessionId}) → {success, count?, distribution?,
  roleBreakdown?, error?}`, `validateCode({code}) → {valid, kind?:
  'team'|'session', id?}` (replaces `validateTeamCode`).
  `saveAssessment(...)` gains one new optional param `sessionId`,
  alongside the existing `teamId`. These are the exact names/shapes Tasks
  5, 6, and 7 call.

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `src/lib/authAdapter.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { noopAuthAdapter } from './authAdapter.js';

describe('noopAuthAdapter team methods', () => {
  it('createTeam fails safely when not configured', async () => {
    const result = await noopAuthAdapter.createTeam({ name: 'X', userId: 'u1' });
    expect(result.success).toBe(false);
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

describe('noopAuthAdapter session methods', () => {
  it('createSession fails safely when not configured', async () => {
    const result = await noopAuthAdapter.createSession({ name: 'X', userId: 'u1' });
    expect(result.success).toBe(false);
  });

  it('endSession fails safely when not configured', async () => {
    const result = await noopAuthAdapter.endSession({ sessionId: 's1' });
    expect(result.success).toBe(false);
  });

  it('getSessionSummary fails safely when not configured', async () => {
    const result = await noopAuthAdapter.getSessionSummary({ sessionId: 's1' });
    expect(result.success).toBe(false);
  });

  it('validateCode is invalid when not configured', async () => {
    const result = await noopAuthAdapter.validateCode({ code: 'ABC123' });
    expect(result.valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/authAdapter.test.js`
Expected: FAIL — `noopAuthAdapter.createSession` is not a function
(`validateTeamCode` tests are gone, so no failure from those).

- [ ] **Step 3: Implement — `noopAuthAdapter` changes**

In `src/lib/authAdapter.js`, remove the existing `async validateTeamCode()
{ return { valid: false }; }` method from `noopAuthAdapter` and replace it
with these four methods (keep `createTeam`, `listTeams`, `getTeamSummary`
unchanged):

```js
  async createSession() {
    return { success: false, error: 'Live sessions are not configured yet.' };
  },
  async endSession() {
    return { success: false, error: 'Live sessions are not configured yet.' };
  },
  async getSessionSummary() {
    return { success: false, error: 'Live sessions are not configured yet.' };
  },
  async validateCode() {
    return { valid: false };
  },
```

- [ ] **Step 4: Implement — `supabaseAuthAdapter` changes**

Remove the existing `async validateTeamCode({ code }) { ... }` method from
`supabaseAuthAdapter` (it becomes dead code once Task 5 stops calling it)
and add these in its place, after the existing `getTeamSummary` method:

```js
  // Live sessions — facilitator side (authenticated)
  async createSession({ name, userId }) {
    if (!supabase) return { success: false, error: 'Live sessions are not configured yet.' };
    const { data, error } = await supabase.from('fbw_sessions')
      .insert({ facilitator_id: userId, name })
      .select('id, join_code').single();
    return error ? { success: false, error: error.message } : { success: true, sessionId: data.id, joinCode: data.join_code };
  },
  async endSession({ sessionId }) {
    if (!supabase) return { success: false, error: 'Live sessions are not configured yet.' };
    const { error } = await supabase.rpc('end_session', { p_session_id: sessionId });
    return error ? { success: false, error: error.message } : { success: true };
  },
  async getSessionSummary({ sessionId }) {
    if (!supabase) return { success: false, error: 'Live sessions are not configured yet.' };
    const { data, error } = await supabase.rpc('get_session_summary', { p_session_id: sessionId });
    return error ? { success: false, error: error.message } : { success: true, count: data.count, distribution: data.distribution, roleBreakdown: data.roleBreakdown };
  },

  // Unified join code — rep side (anonymous, called during self-assessment).
  // Replaces validateTeamCode: checks both fbw_teams and fbw_sessions via
  // one RPC, so the intro screen never needs to know which kind of code
  // the person was given.
  async validateCode({ code }) {
    if (!supabase) return { valid: false };
    const { data, error } = await supabase.rpc('validate_code', { p_code: code });
    if (error) return { valid: false };
    return { valid: Boolean(data.valid), kind: data.kind || null, id: data.id || null };
  },
```

- [ ] **Step 5: Modify `saveAssessment` to accept `sessionId`**

Replace the existing `saveAssessment` method in `supabaseAuthAdapter`
with:

```js
  async saveAssessment({ role, p1Answers, orgAnswers, complianceAnswers, reportData, userId, teamId, sessionId }) {
    if (!supabase) return { success: false, error: 'Saving is not configured yet.' };
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
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/lib/authAdapter.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 7: Run the full suite to see what else needs updating**

Run: `npx vitest run`
Expected: FAIL — `src/components/IntroScreen.test.jsx` and
`src/App.test.jsx` still call `validateTeamCode` on their fake adapters;
Tasks 5 and 6 fix these. This is expected at this point in the plan — do
not fix them here.

- [ ] **Step 8: Commit**

```bash
git add src/lib/authAdapter.js src/lib/authAdapter.test.js
git commit -m "feat: add facilitator-session methods to auth adapter, unify join-code validation"
```

---

### Task 4: Translations — `manager` tab labels, `session` namespace, generalized `team` code-field copy

**Files:**
- Modify: `src/i18n/translations.js`

**Interfaces:**
- Produces: `manager.*` and `session.*` keys under `en`, `ar` in `UI`;
  changes existing `team.codeLabel`/`team.codeHelp` text and replaces
  `team.codeValid` with `team.codeValidTeam` + `team.codeValidSession`.
  Consumed by Tasks 5, 7, and 8.

- [ ] **Step 1: Update `UI.en.team`**

In the `en` block's `team: { ... }` (currently lines 197-231), change
these three lines:

```js
      codeLabel: 'Have a team code?',
```
becomes
```js
      codeLabel: 'Have a code?',
```

```js
      codeHelp: 'Optional — enter the code your manager shared to include your result in the team pattern.',
```
becomes
```js
      codeHelp: 'Optional — enter the code your manager or facilitator shared to include your result.',
```

```js
      codeValid: 'Joined — your result will count toward this team.',
```
becomes
```js
      codeValidTeam: 'Joined — your result will count toward this team.',
      codeValidSession: 'Joined — your result will count toward this live session.',
```

- [ ] **Step 2: Add `manager` and `session` blocks to `UI.en`**

Insert immediately after the `team: { ... }` block's closing `},` (i.e.
right before the `en`-block's own closing `},`):

```js
    manager: {
      tabTeam: 'Team',
      tabSession: 'Live session',
    },
    session: {
      eyebrow: 'Live session',
      title: 'Run a live workshop',
      lead: 'Start a session, share the code with the room, and watch the Function/Being/Will pattern build up live as people answer. Individual results are never shown.',
      createHeading: 'Start a live session',
      createNameLabel: 'Session name',
      createNamePlaceholder: 'e.g. Leadership Workshop — Aug 28',
      createButton: 'Start session',
      createError: 'Could not start the session. Try again.',
      joinCodeHeading: 'Share this code with the room',
      joinCodeShareNote: 'Anyone who enters this code before finishing their own self-assessment joins this session live.',
      countWaiting: '{count} of {min} responses needed before the group pattern appears.',
      dashboardTitle: 'Live results',
      cardsHeading: 'Discussion cards',
      printCards: 'Print discussion cards',
      endSession: 'End session',
      endedNote: 'This session has ended — the code no longer works.',
    },
```

- [ ] **Step 3: Update `UI.ar.team`**

In the `ar` block's `team: { ... }` (currently lines 388-422), change:

```js
      codeLabel: 'هل لديك رمز فريق؟',
```
becomes
```js
      codeLabel: 'هل لديك رمز؟',
```

```js
      codeHelp: 'اختياري — أدخل الرمز الذي شاركه مديرك لتضمين نتيجتك في نمط الفريق.',
```
becomes
```js
      codeHelp: 'اختياري — أدخل الرمز الذي شاركه مديرك أو ميسّر الجلسة لتضمين نتيجتك.',
```

```js
      codeValid: 'تم الانضمام — ستُحتسب نتيجتك ضمن هذا الفريق.',
```
becomes
```js
      codeValidTeam: 'تم الانضمام — ستُحتسب نتيجتك ضمن هذا الفريق.',
      codeValidSession: 'تم الانضمام — ستُحتسب نتيجتك ضمن هذه الجلسة المباشرة.',
```

- [ ] **Step 4: Add `manager` and `session` blocks to `UI.ar`**

Insert immediately after the `ar` block's `team: { ... }` closing `},`
(same relative position as Step 2):

```js
    manager: {
      tabTeam: 'الفريق',
      tabSession: 'جلسة مباشرة',
    },
    session: {
      eyebrow: 'جلسة مباشرة',
      title: 'أدر ورشة عمل مباشرة',
      lead: 'ابدأ جلسة، شارك الرمز مع الحضور، وشاهد نمط الوظيفة/الكينونة/الإرادة يتكوّن مباشرة أثناء الإجابة. لا تُعرض النتائج الفردية أبداً.',
      createHeading: 'ابدأ جلسة مباشرة',
      createNameLabel: 'اسم الجلسة',
      createNamePlaceholder: 'مثال: ورشة القيادة — 28 أغسطس',
      createButton: 'ابدأ الجلسة',
      createError: 'تعذّر بدء الجلسة. حاول مرة أخرى.',
      joinCodeHeading: 'شارك هذا الرمز مع الحضور',
      joinCodeShareNote: 'أي شخص يُدخل هذا الرمز قبل إنهاء تقييمه الذاتي ينضم إلى هذه الجلسة مباشرة.',
      countWaiting: '{count} من {min} استجابات مطلوبة قبل ظهور نمط المجموعة.',
      dashboardTitle: 'النتائج المباشرة',
      cardsHeading: 'بطاقات النقاش',
      printCards: 'طباعة بطاقات النقاش',
      endSession: 'إنهاء الجلسة',
      endedNote: 'انتهت هذه الجلسة — لم يعد الرمز صالحاً.',
    },
```

- [ ] **Step 5: Run the translations test**

Run: `npx vitest run src/i18n/translations.test.js`
Expected: PASS — the existing completeness test walks `UI.en` generically
and confirms every new `manager.*`/`session.*` key has a matching `ar`
entry.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/translations.js
git commit -m "feat: add facilitator-session translations (en/ar), generalize code-field copy"
```

---

### Task 5: Intro screen — unified code field (team or session)

**Files:**
- Modify: `src/components/IntroScreen.jsx`
- Modify: `src/components/IntroScreen.test.jsx`

**Interfaces:**
- Consumes: `authAdapter.validateCode({code}) → {valid, kind, id}`
  (Task 3).
- Produces: `onStart(role: string, code: {kind: 'team'|'session', id:
  string} | null)` — Task 6 (`App.jsx`) updates `handleStart` to match
  this shape.

- [ ] **Step 1: Write the failing tests**

Replace the `describe('IntroScreen team code', ...)` block in
`src/components/IntroScreen.test.jsx` (keep the first `describe('IntroScreen', ...)`
block unchanged) with:

```js
describe('IntroScreen join code', () => {
  function makeAdapter(overrides = {}) {
    return { validateCode: vi.fn().mockResolvedValue({ valid: true, kind: 'team', id: 'team-1' }), ...overrides };
  }

  it('starts with a null code when nothing is entered', () => {
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={makeAdapter()} />);
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, null);
  });

  it('validates a team code and passes {kind: "team", id} to onStart', async () => {
    const authAdapter = makeAdapter();
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'ab12cd' } });
    await waitFor(() => expect(authAdapter.validateCode).toHaveBeenCalledWith({ code: 'AB12CD' }));
    await screen.findByText('Joined — your result will count toward this team.');
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, { kind: 'team', id: 'team-1' });
  });

  it('validates a session code and passes {kind: "session", id} to onStart, with session-specific copy', async () => {
    const authAdapter = makeAdapter({ validateCode: vi.fn().mockResolvedValue({ valid: true, kind: 'session', id: 'sess-1' }) });
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'zz99zz' } });
    await screen.findByText('Joined — your result will count toward this live session.');
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, { kind: 'session', id: 'sess-1' });
  });

  it('shows an error for an invalid code and passes null', async () => {
    const authAdapter = makeAdapter({ validateCode: vi.fn().mockResolvedValue({ valid: false }) });
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'zzzzzz' } });
    await screen.findByText('That code was not found. Check it and try again, or leave it blank.');
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, null);
  });

  it('discards a stale validation response when a newer code was entered before it resolved', async () => {
    let resolveFirst, resolveSecond;
    const validateCode = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
    const authAdapter = { validateCode };
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);

    const input = screen.getByPlaceholderText('e.g. A1B2C3');
    fireEvent.change(input, { target: { value: 'aaaaaa' } });
    await waitFor(() => expect(validateCode).toHaveBeenCalledWith({ code: 'AAAAAA' }));

    fireEvent.change(input, { target: { value: 'bbbbbb' } });
    await waitFor(() => expect(validateCode).toHaveBeenCalledWith({ code: 'BBBBBB' }));

    resolveSecond({ valid: true, kind: 'team', id: 'team-b' });
    await screen.findByText('Joined — your result will count toward this team.');

    resolveFirst({ valid: true, kind: 'team', id: 'team-a' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, { kind: 'team', id: 'team-b' });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/IntroScreen.test.jsx`
Expected: FAIL — `IntroScreen.jsx` still calls `validateTeamCode` and
tracks a bare `teamId`, not a `{kind, id}` pair.

- [ ] **Step 3: Implement**

Replace the state/handler block at the top of
`src/components/IntroScreen.jsx` (currently lines 8-34):

```jsx
export default function IntroScreen({ onStart, authAdapter = noopAuthAdapter }) {
  const { t, tf, L } = useLanguage();
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [joinCode, setJoinCode] = useState('');
  const [codeStatus, setCodeStatus] = useState('idle'); // idle | checking | valid | invalid
  const [codeResult, setCodeResult] = useState(null); // { kind, id } | null
  const latestCodeRef = useRef('');

  async function handleCodeChange(e) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    latestCodeRef.current = value;
    setJoinCode(value);
    setCodeResult(null);
    if (value.length < 6) {
      setCodeStatus('idle');
      return;
    }
    setCodeStatus('checking');
    const result = await authAdapter.validateCode({ code: value });
    if (latestCodeRef.current !== value) return; // a newer code was entered — discard this stale response
    if (result.valid) {
      setCodeStatus('valid');
      setCodeResult({ kind: result.kind, id: result.id });
    } else {
      setCodeStatus('invalid');
    }
  }
```

Replace the code-field JSX block (currently the `<div className="note"
style={{ marginTop: 16 }}>` block for `team.codeLabel`, lines 86-99):

```jsx
      <div className="note" style={{ marginTop: 16 }}>
        <label htmlFor="team-code"><b>{t('team.codeLabel')}</b></label>
        <div className="q" style={{ marginBottom: 8 }}>{t('team.codeHelp')}</div>
        <input
          id="team-code"
          value={joinCode}
          placeholder={t('team.codePlaceholder')}
          onChange={handleCodeChange}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--line)', textTransform: 'uppercase' }}
        />
        {codeStatus === 'checking' && <div className="q" style={{ marginTop: 8 }}>{t('team.codeChecking')}</div>}
        {codeStatus === 'valid' && (
          <div className="q" style={{ marginTop: 8, color: 'var(--fn)' }}>
            {codeResult?.kind === 'session' ? t('team.codeValidSession') : t('team.codeValidTeam')}
          </div>
        )}
        {codeStatus === 'invalid' && <div className="q" style={{ marginTop: 8, color: '#b3261e' }}>{t('team.codeInvalid')}</div>}
      </div>
```

Update the start button:

```jsx
      <button className="btn" onClick={() => onStart(role, codeStatus === 'valid' ? codeResult : null)}>{t('intro.start')}</button>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/IntroScreen.test.jsx`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/IntroScreen.jsx src/components/IntroScreen.test.jsx
git commit -m "feat: unify intro-screen join code to accept either a team or session code"
```

---

### Task 6: Wire `{kind, id}` through `App.jsx`

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

**Interfaces:**
- Consumes: `IntroScreen`'s new `onStart(role, code)` (Task 5),
  `authAdapter.saveAssessment(...)`'s new `sessionId` param (Task 3).

- [ ] **Step 1: Update state and handlers in `App.jsx`**

Replace the existing `teamId` state declaration with:

```jsx
  const [teamId, setTeamId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
```

Update `handleStart`:

```jsx
  function handleStart(selectedRole, code = null) {
    const nextScenarios = getScenariosForRole(selectedRole);
    setRole(selectedRole);
    setTeamId(code?.kind === 'team' ? code.id : null);
    setSessionId(code?.kind === 'session' ? code.id : null);
    setScenarios(nextScenarios);
    setP1Answers(nextScenarios.map(() => ({ most: null, least: null })));
    setP1Index(0);
    setPhase('p1');
  }
```

Update `handleRestart` to also reset `sessionId`:

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
  }
```

Update the `saveAssessment` call inside the `onAuthStateChange` effect to
pass `sessionId`, and add it to the effect's dependency array:

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
          sessionId,
        });
        setAuthState(
          result.success
            ? { status: 'saved', assessmentId: result.assessmentId, userId: session.user.id }
            : { status: 'error', error: result.error }
        );
      }
    });
    return unsubscribe;
  }, [authAdapter, reportData, authState.status, role, p1Answers, orgAnswers, complianceAnswers, teamId, sessionId]);
```

- [ ] **Step 2: Update `App.test.jsx`'s fake adapters**

Any place in `src/App.test.jsx` where a fake `authAdapter` object is
constructed for use with `IntroScreen`'s code field must provide
`validateCode` instead of `validateTeamCode`, matching Task 5's new
interface. Search the file for `validateTeamCode` and rename each
occurrence to `validateCode`, updating the mock's resolved value shape
from `{ valid, teamId }` to `{ valid, kind: 'team', id }` — for example:

```js
      validateTeamCode: vi.fn().mockResolvedValue({ valid: true, teamId: 'team-9' }),
```
becomes
```js
      validateCode: vi.fn().mockResolvedValue({ valid: true, kind: 'team', id: 'team-9' }),
```

And update the corresponding assertion:

```js
    expect(saveAssessment).toHaveBeenCalledWith(expect.objectContaining({ teamId: 'team-9' }));
```
becomes
```js
    expect(saveAssessment).toHaveBeenCalledWith(expect.objectContaining({ teamId: 'team-9', sessionId: null }));
```

- [ ] **Step 3: Add one test confirming `sessionId` reaches `saveAssessment`**

Add to `src/App.test.jsx`, inside the `describe('App with a fake auth
adapter', ...)` block:

```js
  it('passes the joined sessionId through to saveAssessment', async () => {
    let authCallback;
    const saveAssessment = vi.fn().mockResolvedValue({ success: true });
    const fakeAdapter = {
      signInWithEmail: vi.fn().mockResolvedValue({ success: true }),
      saveAssessment,
      getSession: vi.fn().mockResolvedValue(null),
      onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
      validateCode: vi.fn().mockResolvedValue({ valid: true, kind: 'session', id: 'sess-9' }),
    };

    render(<App authAdapter={fakeAdapter} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'ab12cd' } });
    await waitFor(() => expect(fakeAdapter.validateCode).toHaveBeenCalled());
    await screen.findByText('Joined — your result will count toward this live session.');
    completeFullFlow();

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Send link'));
    await act(async () => { await authCallback({ user: { id: 'user-123' } }); });

    expect(saveAssessment).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'sess-9', teamId: null }));
  });
```

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`
Expected: PASS — everything in `App.test.jsx` and `IntroScreen.test.jsx`
green.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/App.test.jsx
git commit -m "feat: wire optional live-session join code through the self-assessment flow"
```

---

### Task 7: `ManagerApp.jsx` — tab switcher between Team and Live session

**Files:**
- Modify: `src/ManagerApp.jsx`
- Modify: `src/ManagerApp.test.jsx`

**Interfaces:**
- Consumes: `authAdapter.createSession`, `.endSession`,
  `.getSessionSummary` (Task 3); `computeImbalance` (existing,
  `src/lib/teamScoring.js`); `SessionLiveScreen` (Task 8, imported here).
- Produces: session state/handlers passed into `SessionLiveScreen`. Does
  not change any prop `ManagerScreen` receives — that component and its
  test file are untouched by this task.
- **Polling, not Realtime** (per spec): once a session exists and has not
  ended, `ManagerApp` calls `getSessionSummary` automatically on a 5-second
  `setInterval`, independent of the manual "Check for new responses"
  button `SessionLiveScreen` also exposes (the button gives an immediate
  refresh on demand; the interval is what keeps the facilitator's screen
  current without anyone touching it during a live workshop). The interval
  is cleared on unmount, when `session` changes, and once `sessionEnded`
  becomes true.

- [ ] **Step 1: Write the failing tests**

Add to `src/ManagerApp.test.jsx` (keep the existing `describe('ManagerApp',
...)` block and its 3 tests unchanged; add a new block below it):

```jsx
describe('ManagerApp session tab', () => {
  function makeAdapter(overrides = {}) {
    let authCallback = () => {};
    return {
      signInWithEmail: vi.fn().mockResolvedValue({ success: true }),
      onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
      listTeams: vi.fn().mockResolvedValue({ success: true, teams: [] }),
      createSession: vi.fn().mockResolvedValue({ success: true, sessionId: 's1', joinCode: 'ZZ99ZZ' }),
      endSession: vi.fn().mockResolvedValue({ success: true }),
      getSessionSummary: vi.fn().mockResolvedValue({ success: true, count: 5, distribution: { F: 50, B: 32, W: 18, C: 60 }, roleBreakdown: { rep: 5 } }),
      triggerAuth: (session) => authCallback(session),
      ...overrides,
    };
  }

  it('switches to the session tab, starts a session, and shows the join code', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><ManagerApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    await screen.findByPlaceholderText('e.g. Baghdad District');

    fireEvent.click(screen.getByText('Live session'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Leadership Workshop — Aug 28'), { target: { value: 'Workshop A' } });
    fireEvent.click(screen.getByText('Start session'));

    await waitFor(() => expect(authAdapter.createSession).toHaveBeenCalledWith({ name: 'Workshop A', userId: 'u1' }));
    expect(await screen.findByDisplayValue('ZZ99ZZ')).toBeInTheDocument();
  });

  it('refreshes the session summary and computes the imbalance flag', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><ManagerApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    fireEvent.click(screen.getByText('Live session'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Leadership Workshop — Aug 28'), { target: { value: 'Workshop A' } });
    fireEvent.click(screen.getByText('Start session'));
    await screen.findByDisplayValue('ZZ99ZZ');

    fireEvent.click(screen.getByText('Check for new responses'));
    await waitFor(() => expect(authAdapter.getSessionSummary).toHaveBeenCalledWith({ sessionId: 's1' }));
    expect(await screen.findByText('Function is strong (50%), Will is low (18%) across the team — a rule-of-thumb signal, not a statistical finding.')).toBeInTheDocument();
  });

  it('polls getSessionSummary automatically every 5 seconds while an unended session is open', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const authAdapter = makeAdapter();
    render(<LanguageProvider><ManagerApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    fireEvent.click(screen.getByText('Live session'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Leadership Workshop — Aug 28'), { target: { value: 'Workshop A' } });
    fireEvent.click(screen.getByText('Start session'));
    await screen.findByDisplayValue('ZZ99ZZ');

    expect(authAdapter.getSessionSummary).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(authAdapter.getSessionSummary).toHaveBeenCalledWith({ sessionId: 's1' });
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(authAdapter.getSessionSummary).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('ends the session', async () => {
    const authAdapter = makeAdapter();
    render(<LanguageProvider><ManagerApp authAdapter={authAdapter} /></LanguageProvider>);

    await act(async () => { authAdapter.triggerAuth({ user: { id: 'u1' } }); });
    fireEvent.click(screen.getByText('Live session'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Leadership Workshop — Aug 28'), { target: { value: 'Workshop A' } });
    fireEvent.click(screen.getByText('Start session'));
    await screen.findByDisplayValue('ZZ99ZZ');

    fireEvent.click(screen.getByText('End session'));
    await waitFor(() => expect(authAdapter.endSession).toHaveBeenCalledWith({ sessionId: 's1' }));
    expect(await screen.findByText('This session has ended — the code no longer works.')).toBeInTheDocument();
  });
});
```

Add `LanguageProvider` and `act` to the existing `@testing-library/react`
and local imports at the top of `src/ManagerApp.test.jsx` if not already
present (the existing `describe('ManagerApp', ...)` block already imports
these — reuse the same import lines, do not duplicate).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/ManagerApp.test.jsx`
Expected: FAIL — no tab switcher exists yet, `getByText('Live session')`
finds nothing.

- [ ] **Step 3: Implement `src/ManagerApp.jsx`**

Replace the file's full contents:

```jsx
import { useEffect, useState } from 'react';
import ManagerScreen from './components/ManagerScreen.jsx';
import SessionLiveScreen from './components/SessionLiveScreen.jsx';
import { noopAuthAdapter } from './lib/authAdapter.js';
import { computeImbalance } from './lib/teamScoring.js';
import { DIM } from './data/dimensions.js';
import { useLanguage } from './i18n/LanguageContext.jsx';

export default function ManagerApp({ authAdapter = noopAuthAdapter }) {
  const { t } = useLanguage();
  const [authState, setAuthState] = useState({ status: 'anon' });
  const [view, setView] = useState('team');

  const [teams, setTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [summary, setSummary] = useState(null);
  const [createStatus, setCreateStatus] = useState('idle');
  const [createError, setCreateError] = useState(null);

  const [session, setSession] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [sessionCreateStatus, setSessionCreateStatus] = useState('idle');
  const [sessionCreateError, setSessionCreateError] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChange(async (authSession) => {
      if (!authSession) return;
      setAuthState({ status: 'signedIn', userId: authSession.user.id });
      const result = await authAdapter.listTeams({ userId: authSession.user.id });
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

  async function handleCreateSession(name) {
    setSessionCreateStatus('creating');
    setSessionCreateError(null);
    const result = await authAdapter.createSession({ name, userId: authState.userId });
    if (result.success) {
      setSession({ id: result.sessionId, name, joinCode: result.joinCode });
      setSessionEnded(false);
      setSessionCreateStatus('done');
    } else {
      setSessionCreateStatus('idle');
      setSessionCreateError(result.error);
    }
  }

  async function handleRefreshSession() {
    if (!session) return;
    const result = await authAdapter.getSessionSummary({ sessionId: session.id });
    if (result.success) {
      setSessionSummary({ count: result.count, distribution: result.distribution, roleBreakdown: result.roleBreakdown });
    }
  }

  // Live polling (not Realtime, per the design spec): re-checks the
  // aggregate every 5s while a session is open, so the facilitator's
  // screen keeps moving on its own during a workshop. Cleared whenever
  // there's no session, the session changes, or it has ended.
  useEffect(() => {
    if (!session || sessionEnded) return;
    const interval = setInterval(handleRefreshSession, 5000);
    return () => clearInterval(interval);
  }, [session, sessionEnded]);

  async function handleEndSession() {
    if (!session) return;
    const result = await authAdapter.endSession({ sessionId: session.id });
    if (result.success) setSessionEnded(true);
  }

  function handlePrintCards() {
    window.print();
  }

  const imbalance = summary?.distribution ? computeImbalance(summary.distribution) : null;
  const sessionImbalance = sessionSummary?.distribution ? computeImbalance(sessionSummary.distribution) : null;

  return (
    <main>
      <div className="wrap">
        {authState.status === 'signedIn' && (
          <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <button className={`btn sm${view === 'team' ? '' : ' ghost'}`} onClick={() => setView('team')}>{t('manager.tabTeam')}</button>
            <button className={`btn sm${view === 'session' ? '' : ' ghost'}`} onClick={() => setView('session')}>{t('manager.tabSession')}</button>
          </div>
        )}
        {authState.status !== 'signedIn' || view === 'team' ? (
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
        ) : (
          <SessionLiveScreen
            session={session}
            summary={sessionSummary}
            imbalance={sessionImbalance}
            dim={DIM}
            createStatus={sessionCreateStatus}
            createError={sessionCreateError}
            ended={sessionEnded}
            onCreateSession={handleCreateSession}
            onRefresh={handleRefreshSession}
            onEndSession={handleEndSession}
            onPrintCards={handlePrintCards}
          />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run the `ManagerApp` tests**

Run: `npx vitest run src/ManagerApp.test.jsx`
Expected: still FAIL at this point (Step 3 imports `SessionLiveScreen`,
which does not exist yet) — this is expected; Task 8 creates it. Confirm
the failure is specifically a missing-module error for
`./components/SessionLiveScreen.jsx`, not something else.

- [ ] **Step 5: Commit**

```bash
git add src/ManagerApp.jsx src/ManagerApp.test.jsx
git commit -m "feat: add team/live-session tab switcher to the manager app"
```

(Committing here with a known-red test is intentional and matches this
plan's task boundaries — Task 8 makes it green. If your workflow requires
every commit to be green, merge Steps 1-5 of this task into Task 8's
commit instead.)

---

### Task 8: `SessionLiveScreen` component + print CSS for discussion cards

**Files:**
- Create: `src/components/SessionLiveScreen.jsx`
- Create: `src/components/SessionLiveScreen.test.jsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `DISCUSSION_CARDS`, `getDiscussionCardKey` (Task 2); `DIM`
  from `src/data/dimensions.js`.
- Produces: `SessionLiveScreen({session, summary, imbalance, dim,
  createStatus, createError, ended, onCreateSession, onRefresh,
  onEndSession, onPrintCards})` default export, rendered by `ManagerApp`
  (Task 7).

- [ ] **Step 1: Write the failing tests**

Create `src/components/SessionLiveScreen.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SessionLiveScreen from './SessionLiveScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';
import { DIM } from '../data/dimensions.js';

function renderScreen(props) {
  return render(
    <LanguageProvider>
      <SessionLiveScreen
        session={null}
        summary={null}
        imbalance={null}
        dim={DIM}
        createStatus="idle"
        createError={null}
        ended={false}
        onCreateSession={() => {}}
        onRefresh={() => {}}
        onEndSession={() => {}}
        onPrintCards={() => {}}
        {...props}
      />
    </LanguageProvider>
  );
}

describe('SessionLiveScreen', () => {
  it('shows the create-session form when there is no session yet', () => {
    renderScreen({});
    expect(screen.getByPlaceholderText('e.g. Leadership Workshop — Aug 28')).toBeInTheDocument();
  });

  it('calls onCreateSession with the entered name', () => {
    const onCreateSession = vi.fn();
    renderScreen({ onCreateSession });
    fireEvent.change(screen.getByPlaceholderText('e.g. Leadership Workshop — Aug 28'), { target: { value: 'Workshop A' } });
    fireEvent.click(screen.getByText('Start session'));
    expect(onCreateSession).toHaveBeenCalledWith('Workshop A');
  });

  it('shows the join code and waiting message before the gate is reached', () => {
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 1, distribution: null, roleBreakdown: null },
    });
    expect(screen.getByDisplayValue('ZZ99ZZ')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 responses needed before the group pattern appears.')).toBeInTheDocument();
  });

  it('shows the live dashboard and a matched discussion card once revealed', () => {
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 5, distribution: { F: 50, B: 32, W: 18, C: 60 }, roleBreakdown: { rep: 5 } },
      imbalance: { high: 'F', low: 'W' },
    });
    expect(screen.getByText('Live results')).toBeInTheDocument();
    expect(screen.getByText('Discussion cards')).toBeInTheDocument();
    expect(screen.getByText('This room delivers. Where have you personally held back from a hard call recently?')).toBeInTheDocument();
  });

  it('shows the balanced discussion cards when there is no imbalance', () => {
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 5, distribution: { F: 34, B: 33, W: 33, C: 60 }, roleBreakdown: { rep: 5 } },
      imbalance: null,
    });
    expect(screen.getByText('No single pattern dominates this room — where is that a strength, and where might it blur ownership?')).toBeInTheDocument();
  });

  it('calls onEndSession when the end-session button is clicked', () => {
    const onEndSession = vi.fn();
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 1, distribution: null, roleBreakdown: null },
      onEndSession,
    });
    fireEvent.click(screen.getByText('End session'));
    expect(onEndSession).toHaveBeenCalled();
  });

  it('shows the ended note and no end-session button once the session has ended', () => {
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 5, distribution: { F: 34, B: 33, W: 33, C: 60 }, roleBreakdown: { rep: 5 } },
      ended: true,
    });
    expect(screen.getByText('This session has ended — the code no longer works.')).toBeInTheDocument();
    expect(screen.queryByText('End session')).not.toBeInTheDocument();
  });

  it('calls onPrintCards when the print button is clicked', () => {
    const onPrintCards = vi.fn();
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 5, distribution: { F: 34, B: 33, W: 33, C: 60 }, roleBreakdown: { rep: 5 } },
      onPrintCards,
    });
    fireEvent.click(screen.getByText('Print discussion cards'));
    expect(onPrintCards).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/SessionLiveScreen.test.jsx`
Expected: FAIL — `SessionLiveScreen.jsx` does not exist yet.

- [ ] **Step 3: Implement `src/components/SessionLiveScreen.jsx`**

```jsx
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { DISCUSSION_CARDS, getDiscussionCardKey } from '../data/discussionCards.js';

const MIN_RESPONSES = 3;

export default function SessionLiveScreen({ session, summary, imbalance, dim, createStatus, createError, ended, onCreateSession, onRefresh, onEndSession, onPrintCards }) {
  const { t, tf, L } = useLanguage();
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);

  function copyCode(code) {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!session) {
    return (
      <section className="screen active">
        <div className="eyebrow">{t('session.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>{t('session.title')}</h1>
        <p className="lead" style={{ marginBottom: 18 }}>{t('session.lead')}</p>
        <div className="card pad">
          <label htmlFor="session-name"><b>{t('session.createNameLabel')}</b></label>
          <input
            id="session-name"
            value={name}
            placeholder={t('session.createNamePlaceholder')}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, margin: '8px 0 14px' }}
          />
          {createError && <p style={{ color: '#b3261e', fontSize: 13.5, margin: '0 0 10px' }}>{createError}</p>}
          <button className="btn" disabled={!name || createStatus === 'creating'} onClick={() => onCreateSession(name)}>
            {createStatus === 'creating' ? t('team.sending') : t('session.createButton')}
          </button>
        </div>
      </section>
    );
  }

  const gapData = summary?.distribution
    ? ['F', 'B', 'W', 'C'].map(key => ({ key, pct: summary.distribution[key] }))
    : null;

  const cards = DISCUSSION_CARDS[getDiscussionCardKey(imbalance)];

  return (
    <section className="screen active" id="screen-session-live">
      <div className="no-print">
        <div className="eyebrow">{t('session.eyebrow')}</div>
        <h1 style={{ fontSize: 'clamp(28px,7vw,40px)', marginBottom: 6 }}>{session.name}</h1>

        <div className="card pad" style={{ marginBottom: 18 }}>
          <p style={{ margin: '0 0 8px' }}>{t('session.joinCodeHeading')}</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              readOnly
              value={session.joinCode}
              style={{ flex: 1, padding: '14px 16px', border: '1.5px solid var(--line)', borderRadius: 10, fontWeight: 700, fontSize: 'clamp(20px,5vw,32px)', letterSpacing: '0.1em' }}
              onFocus={e => e.target.select()}
            />
            <button className="btn sm" onClick={() => copyCode(session.joinCode)}>{copied ? t('team.copied') : t('team.copyCode')}</button>
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 10px' }}>{t('session.joinCodeShareNote')}</p>
          {ended ? (
            <p style={{ fontSize: 13.5, fontWeight: 600 }}>{t('session.endedNote')}</p>
          ) : (
            <>
              {!gapData && (
                <p style={{ fontSize: 13.5 }}>{tf('session.countWaiting', { count: summary?.count || 0, min: MIN_RESPONSES })}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn ghost sm" onClick={onRefresh}>{t('team.refresh')}</button>
                <button className="btn ghost sm" onClick={onEndSession}>{t('session.endSession')}</button>
              </div>
            </>
          )}
        </div>

        {gapData && (
          <>
            <div className="sec-title">{t('session.dashboardTitle')}</div>
            <div className="card pad" style={{ marginBottom: 18 }}>
              {gapData.map(g => {
                const label = g.key === 'C' ? t('report.complianceLineLabel') : L(dim[g.key].label);
                const color = g.key === 'C' ? dim.W.color : dim[g.key].color;
                return (
                  <div className="orgbar" key={g.key}>
                    <div className="top">
                      <span style={{ color, fontWeight: 600, fontSize: 'clamp(16px,3vw,22px)' }}>{label}</span>
                      <span className="lvl" style={{ fontSize: 'clamp(16px,3vw,22px)' }}>{Math.round(g.pct)}%</span>
                    </div>
                    <div className="track"><div className="fill" style={{ width: `${g.pct}%`, background: color }} /></div>
                  </div>
                );
              })}
            </div>

            <div className="card pad" style={{ marginBottom: 18 }}>
              {Object.entries(summary.roleBreakdown || {}).map(([role, n]) => (
                <div key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                  <span>{role}</span><span>{n}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <button className="btn sm" onClick={onPrintCards}>{t('session.printCards')}</button>
            </div>
          </>
        )}
      </div>

      {gapData && (
        <>
          <div className="sec-title">{t('session.cardsHeading')}</div>
          <div className="card pad">
            <ul className="clean">
              {cards.map((card, i) => <li key={i} style={{ marginBottom: 10, fontSize: 15 }}>{L(card)}</li>)}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Add the print rule to `src/styles/global.css`**

Modify the existing `@media print{ ... }` block (currently lines
185-192): add a rule for `#screen-session-live` alongside the existing
`#screen-report` rule, so it goes from:

```css
  @media print{
    .topbar,.navbar,.no-print{display:none !important;}
    body{background:#fff;}
    main{padding:0;}
    .card{box-shadow:none; border-color:#ccc;}
    .screen{display:none !important;}
    #screen-report{display:block !important;}
  }
```

to:

```css
  @media print{
    .topbar,.navbar,.no-print{display:none !important;}
    body{background:#fff;}
    main{padding:0;}
    .card{box-shadow:none; border-color:#ccc;}
    .screen{display:none !important;}
    #screen-report{display:block !important;}
    #screen-session-live{display:block !important;}
  }
```

This is the mechanism that makes "Print discussion cards" print only the
cards: `.no-print` (wrapping everything in `SessionLiveScreen` except the
cards block) is hidden by the existing `.no-print` rule, while
`#screen-session-live` itself is forced visible, overriding the general
`.screen{display:none}` rule — leaving just the cards on the printed
page.

- [ ] **Step 5: Run the `SessionLiveScreen` tests to verify they pass**

Run: `npx vitest run src/components/SessionLiveScreen.test.jsx`
Expected: PASS, all 8 tests.

- [ ] **Step 6: Run the `ManagerApp` tests from Task 7 — they should now pass**

Run: `npx vitest run src/ManagerApp.test.jsx`
Expected: PASS, all 7 tests (3 existing + 4 from Task 7).

- [ ] **Step 7: Run the full suite**

Run: `npx vitest run`
Expected: PASS — everything green.

- [ ] **Step 8: Commit**

```bash
git add src/components/SessionLiveScreen.jsx src/components/SessionLiveScreen.test.jsx src/styles/global.css
git commit -m "feat: add live-session dashboard, discussion cards, and print support"
```

---

### Task 9: Manual QA — mobile participant view and big-screen facilitator view

**Files:** none (verification only, matches the playbook's standing
instruction and the precedent of this repo's existing manual-QA commits).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Test the participant flow at a 375px viewport**

Resize the browser (or use device emulation) to 375px wide. On the intro
screen, enter an invalid code (confirm the generic "not found" message —
no mention of "team" specifically), then leave it blank and start the
assessment normally to confirm the optional field still doesn't block the
existing flow.

- [ ] **Step 3: Test the facilitator flow — create, watch it fill, end**

Navigate to `/manager`, sign in, click the "Live session" tab, start a
session, confirm the join code displays and copies correctly at a normal
desktop width. Using 3 separate anonymous browser windows, complete the
self-assessment as 3 different reps entering that session's join code
(use at least two different roles, and pick answers on each that skew
toward Function to produce a visible F-W or F-B imbalance flag for this
check). Back in the facilitator tab, click "Check for new responses" and
confirm the live dashboard reveals with F/B/W/Compliance bars, role
breakdown, and a matched discussion card set. Click "Print discussion
cards" and confirm only the cards section appears in the print preview
(use the browser's print-preview, not an actual physical print). Click
"End session," confirm the ended note appears and the join code no longer
validates for a 4th anonymous rep (should show the "not found" message).

- [ ] **Step 4: Resize to a big-screen width and re-check the live view**

Resize the browser (or use device emulation) to ~1920px wide, viewing the
live session tab from Step 3 before ending it (repeat Steps 2-3 if
already ended). Confirm the join code and F/B/W/Compliance percentages
are legible from a distance — large, high-contrast — not just readable up
close.

- [ ] **Step 5: Record the result**

If everything works, commit a short note (mirroring this repo's existing
"docs: record ... manual mobile QA results" commit style):

```bash
git commit --allow-empty -m "docs: record Prompt 7 manual QA results (mobile participant + big-screen facilitator view)"
```

If anything is broken, fix it as a normal follow-up commit before
considering Prompt 7 done — do not mark the prompt complete with a known
issue outstanding.
