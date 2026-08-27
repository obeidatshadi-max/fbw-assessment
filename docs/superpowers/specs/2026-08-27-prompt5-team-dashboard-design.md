# Prompt 5 — Team / affiliate dashboard for line managers

## Goal

A manager can see the Function/Being/Will pattern of their whole team in
one aggregated view, without ever seeing an individual person's result.
Matches `fbw-claude-code-prompts.md` Prompt 5. Storage reuses the shared
Supabase project `madarlead-assessment` (`kkhkxjvipamajvawxzpc`), same as
the Prompt 4 360 module.

## Decisions made during brainstorming

- **Team membership**: no named roster (unlike the SPS Style app's
  `sps_reps` pattern). A manager creates a team and gets a short join
  code. A rep optionally enters that code once during their own
  self-assessment flow; their assessment row is tagged with `team_id`.
  No name or email is captured for team membership — this keeps the
  existing anonymous self-assessment flow unchanged for reps.
- **Individual visibility**: aggregate-only. A manager can never query or
  see one person's score, structurally (no SELECT policy on raw
  `fbw_assessments` for managers — only a SECURITY DEFINER RPC), not just
  hidden in the UI. This satisfies Prompt 5's "never expose one person's
  individual report from the aggregate view without their consent" more
  strictly than the SPS pattern (which does expose named individual
  results to the manager) — deliberately different because FBW's
  self-assessment is personal reflection, not a manager-observed
  assessment like SPS's.
- **Minimum-response gate**: reuse the Prompt 4 360 module's threshold of
  3 responses before any aggregate is revealed, for the same anonymity
  reason.
- **Region/country filter**: out of scope for this pass. No region field
  exists anywhere in the app today; Prompt 5 asks for it but the schema,
  UI cost, and lack of a settled MENA market list make it a bad fit to
  bolt on here. Role filtering ships; region can be added later once
  real usage shows what values matter.

## Data model

New migration `supabase/migrations/0004_fbw_team_dashboard.sql`, tables
namespaced `fbw_`, RLS scoped to `manager_id = auth.uid()`:

```sql
-- manager profile, auto-created on first sign-in (same pattern as
-- fbw_profiles / sps_managers)
create table public.fbw_managers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.fbw_teams (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  join_code text not null unique default upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  created_at timestamptz not null default now()
);

alter table public.fbw_assessments add column team_id uuid references public.fbw_teams(id);
```

- `fbw_managers` and `fbw_teams`: RLS `for all using (manager_id = auth.uid())`
  (managers), no anon access.
- `fbw_assessments`: existing table, existing RLS unchanged for the
  profile owner; **no new SELECT policy is added for managers** — the
  only way a manager reads team data is the RPC below.
- Join-code lookup for reps is via a SECURITY DEFINER RPC
  (`validate_team_code(code)`), granted to `anon`, exactly like
  `validate_rater_link` — returns `{valid, team_id}` without exposing
  anything else, and the team_id it returns is only ever used
  client-side to attach to the rep's own `saveAssessment` call.

## Aggregation RPC

```sql
create or replace function public.get_team_summary(p_team_id uuid)
returns jsonb
language plpgsql security definer as $$
declare
  v_count integer;
  v_result jsonb;
begin
  if not exists (
    select 1 from public.fbw_teams
    where id = p_team_id and manager_id = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  select count(*) into v_count
  from public.fbw_assessments where team_id = p_team_id;

  if v_count < 3 then
    return jsonb_build_object('count', v_count, 'distribution', null);
  end if;

  -- averages F/B/W/Compliance % of profile (reuse the same "% of
  -- profile" conversion as raterScoring.js) + role breakdown counts,
  -- computed in teamScoring.js from the raw scores column, OR computed
  -- in SQL here — implementation detail for the plan to settle, both
  -- read from fbw_assessments.scores (jsonb) which already exists.
  select jsonb_build_object(
    'count', v_count,
    'distribution', jsonb_build_object(
      'F', avg((scores->'most'->>'F')::numeric),
      'B', avg((scores->'most'->>'B')::numeric),
      'W', avg((scores->'most'->>'W')::numeric)
    ),
    'roleBreakdown', (
      select jsonb_object_agg(coalesce(role, 'unspecified'), n)
      from (select role, count(*) n from public.fbw_assessments
            where team_id = p_team_id group by role) t
    )
  ) into v_result
  from public.fbw_assessments where team_id = p_team_id;

  return v_result;
end;
$$;
grant execute on function public.get_team_summary(uuid) to authenticated;
```

Exact aggregation math (raw `most` counts vs. the ipsative "% of profile"
conversion already used in `raterScoring.js`) is an implementation detail
for the plan — reuse the existing conversion so team and 360 numbers stay
comparable across the app.

## Imbalance flag

Computed client-side (`src/lib/teamScoring.js`, pure function, unit
tested) from the RPC's `distribution` — not stored, not asserted as
statistical fact:

- If Function share ≥45% and Will share ≤20% → "heavily Function, low
  Will" flag (execution-strong, may be brittle under pressure).
- Symmetric checks for the other four dominant/weak dimension pairs
  (Function/Being, Being/Will, Will/Function, Will/Being, Being/Function
  — six ordered pairs total, F/B/W all considered).
- Thresholds (45% / 20%) are a first-pass default, clearly labeled in the
  UI as a rule of thumb, not a validated psychometric claim — consistent
  with the existing report's ipsative disclaimer.

## UI / flow

- **Routing**: `main.jsx` gains a third pathname match, `^/manager$`,
  rendering a new `ManagerApp.jsx` — same pattern as the existing
  `/rate/<uuid>` → `RaterApp` match.
- **ManagerApp**: sign in (reuses `signInWithEmail` / `onAuthStateChange`
  from the existing auth adapter, no new auth code) → if no team yet,
  "Create team" (name only) → shows the join code/shareable text →
  dashboard below: aggregate F/B/W/Compliance bars, role-breakdown
  counts, the imbalance flag line, gated on the RPC's `count < 3` state
  (reuse the same "waiting for N more responses" pattern the 360 gap
  card already renders).
- **Rep side**: one new optional screen inserted into the existing
  `App.jsx` flow, between intro and role-select — "Have a team code?"
  text input with a skip option. On submit, calls
  `validateTeamCode(code)`; on success stores `team_id` in component
  state, passed through unchanged to the existing `saveAssessment` call
  (adapter gains one new optional field, no signature break).
- **Multiple teams**: schema supports many teams per manager
  (`manager_id` → many `fbw_teams` rows). v1 UI shows one team at a time
  with a simple dropdown switcher if a manager has more than one — no
  multi-team aggregate view in this pass.
- **Mobile-first**: same CSS/component conventions as `RaterScreen.jsx`
  / `ReportScreen.jsx` — this app is used from phones in the field.

## Auth adapter changes

`src/lib/authAdapter.js` (both `noopAuthAdapter` and
`supabaseAuthAdapter`) gains:

- `createTeam({ name, userId })` → insert into `fbw_teams`, return
  `{success, teamId, joinCode}`.
- `validateTeamCode({ code })` → RPC `validate_team_code`, return
  `{valid, teamId}`.
- `getTeamSummary({ teamId })` → RPC `get_team_summary`, return
  `{success, count, distribution, roleBreakdown}`.
- `saveAssessment(...)` gains one new optional param, `teamId`, passed
  through to the insert — existing callers unaffected.

## Testing

- `teamScoring.test.js` — pure aggregation/imbalance-flag logic, unit
  tested like `raterScoring.test.js`.
- Auth adapter tests for the three new methods, mocked, like the
  existing `get360Summary` tests.
- Component tests: team-code entry screen (join/skip), `ManagerApp`
  dashboard screen (gated state + revealed state), following the
  existing `RaterScreen.test.jsx` pattern.
- Manual 375px mobile check on both new screens before calling this
  prompt done, per the playbook's standing instruction.

## Out of scope for this pass

- Region/country field and filter (Prompt 5 asks for it; deferred, see
  Decisions above).
- Removing a rep from a team, deleting/renaming a team, or any team
  management beyond create + view.
- Multi-team combined/rollup view.
