# Prompt 7 — Facilitator / workshop mode

## Goal

A facilitator can run the FBW assessment live in a leadership workshop:
start a session, participants join with a code and take the full
assessment on their phones, the facilitator watches an aggregated
Function/Being/Will spread build up on a big screen without ever seeing
an individual's result, and gets 4-5 printable discussion cards tied to
whatever group pattern emerges. Matches `fbw-claude-code-prompts.md`
Prompt 7. Storage reuses the shared Supabase project `madarlead-assessment`
(`kkhkxjvipamajvawxzpc`), same as Prompts 4 and 5.

## Relationship to Prompt 5 (team dashboard)

Prompt 5's `fbw_teams` is a **persistent, async** construct: a rep joins
once via a join code, a manager checks the aggregate whenever, no live
component, no expiry. Prompt 7 is a **live, ephemeral** occasion: a
facilitator starts a session for one workshop, watches responses arrive
in real time, and the session naturally ends when the workshop does.

Decided during brainstorming: these stay **separate concepts**
(`fbw_sessions`, new table) rather than overloading `fbw_teams` with a
"live mode" flag. Rationale: coupling a persistent async use case and a
one-off live event onto one table risks workshop noise polluting a
manager's long-term team data, and the expiry/end-session semantics
don't apply to teams at all.

## Data model

New migration `supabase/migrations/0005_fbw_facilitator_sessions.sql`,
same namespacing/RLS conventions as Prompt 5:

```sql
create table public.fbw_sessions (
  id uuid primary key default gen_random_uuid(),
  facilitator_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  join_code text not null unique default upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  created_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.fbw_assessments add column session_id uuid references public.fbw_sessions(id);
```

- `fbw_sessions`: RLS `for all using (facilitator_id = auth.uid())`, no
  anon access. A facilitator is just a signed-in manager who can also
  start live sessions — no new auth concept.
- `fbw_assessments`: existing table, existing RLS unchanged. No new
  SELECT policy for facilitators — the only read path is the aggregation
  RPC below, same structural-anonymity guarantee as Prompts 4 and 5.
- "End session" is a manager-initiated `update fbw_sessions set ends_at =
  now() where id = ... and facilitator_id = auth.uid()` — no new column,
  reuses `ends_at` both for natural (24h default) and manual expiry.

## Unified join-code RPC

The existing intro-screen "have a code?" field currently only checks
`fbw_teams`. Rather than add a second, visually-identical 6-character
code field for sessions (confusing UI, and two independently-random
code spaces of the same shape risk a rep not knowing which box to use),
one RPC now checks both tables:

```sql
create or replace function public.validate_code(p_code text)
returns jsonb
language plpgsql security definer as $$
declare
  v_team_id uuid;
  v_session_id uuid;
begin
  select id into v_team_id from public.fbw_teams where join_code = upper(p_code);
  if v_team_id is not null then
    return jsonb_build_object('valid', true, 'kind', 'team', 'id', v_team_id);
  end if;

  select id into v_session_id from public.fbw_sessions
    where join_code = upper(p_code) and now() < ends_at;
  if v_session_id is not null then
    return jsonb_build_object('valid', true, 'kind', 'session', 'id', v_session_id);
  end if;

  return jsonb_build_object('valid', false);
end;
$$;
grant execute on function public.validate_code(text) to anon;
```

Replaces `validate_team_code` as the intro-screen's entry point (kept as
an internal implementation detail if other call sites need it, otherwise
retired — implementation plan to confirm no other caller exists before
removing it). `App.jsx`'s existing team-code state becomes a generic
`{kind, id}` pair; `saveAssessment` sets `team_id` or `session_id`
depending on `kind` (both columns nullable, mutually exclusive by
construction, not enforced by a DB constraint — low risk, single write
path).

## Aggregation RPC

Same shape as Prompt 5's `get_team_summary`, same 3-response anonymity
gate, scoped to `fbw_sessions` instead:

```sql
create or replace function public.get_session_summary(p_session_id uuid)
returns jsonb
language plpgsql security definer as $$
declare
  v_count integer;
begin
  if not exists (
    select 1 from public.fbw_sessions
    where id = p_session_id and facilitator_id = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  select count(*) into v_count from public.fbw_assessments where session_id = p_session_id;

  if v_count < 3 then
    return jsonb_build_object('count', v_count, 'distribution', null);
  end if;

  return jsonb_build_object(
    'count', v_count,
    'distribution', jsonb_build_object(
      'F', avg((scores->'most'->>'F')::numeric),
      'B', avg((scores->'most'->>'B')::numeric),
      'W', avg((scores->'most'->>'W')::numeric)
    ),
    'roleBreakdown', (
      select jsonb_object_agg(coalesce(role, 'unspecified'), n)
      from (select role, count(*) n from public.fbw_assessments
            where session_id = p_session_id group by role) t
    )
  ) from public.fbw_assessments where session_id = p_session_id;
end;
$$;
grant execute on function public.get_session_summary(uuid) to authenticated;
```

Exact math reuses the same "% of profile" conversion already shared by
`raterScoring.js`/`teamScoring.js` — implementation detail for the plan,
kept consistent so numbers read the same across the app.

## Live updates: polling, not Realtime

Decided during brainstorming: the facilitator's screen re-calls
`get_session_summary` on a 5-second interval rather than opening a
Supabase Realtime subscription. Rationale: no new dependency or pattern
in a codebase that has none today, workshop rooms are small (10-40
people, not scale-sensitive), and a realtime channel would need its own
anonymity review (nothing currently guarantees a raw-row subscription
can't leak individual data the way the RPC gate does). A few seconds of
lag on a projector screen is a non-issue.

## Group pattern → discussion cards

Decided during brainstorming: reuse `teamScoring.js`'s existing
imbalance-flag function unchanged as the classifier — it already
computes one of six ordered dominant/weak dimension-pair flags (or
"balanced") from a `{F,B,W}` distribution, and Prompt 7's `distribution`
is the same shape Prompt 5 already produces.

New `src/data/discussionCards.js`: a content bank keyed by the same
seven pattern keys (six imbalance flags + balanced), each holding 4-5
short EN/AR discussion prompts for the facilitator to raise with the
room. Same `// REVIEW:` first-pass-content convention as `devPlan.js`
and `managerDebrief.js` — this is Shadi's domain content, flagged for
his review before treating any of it as final, per the standing rule in
[[project_fbw_assessment]].

## UI / flow

- **Facilitator**: `ManagerApp.jsx` gains a second tab — "Team"
  (existing Prompt 5 flow, unchanged) and "Live session" (new). Session
  tab: name a session → get a join code shown in large, high-contrast
  text (this screen doubles as the projector display) → live view below
  it, gated the same way as the 360/team gap card: pre-3-responses shows
  just the code + a running participant count; post-3 shows F/B/W bars,
  role breakdown, and the matched discussion card(s). "End session"
  button sets `ends_at = now()`. A print button triggers `window.print()`
  scoped via `@media print` to just the discussion cards — one clean
  page, same print-CSS pattern Prompt 6 already established.
- **Participant**: the existing intro-screen "have a code?" field is
  relabeled generically (works for either a team or session code) and
  now calls `validateCode`. On a session match, the person takes the
  full normal flow — scenarios, org items — through the same screens
  everyone else uses, ending in their own personal report exactly as
  today (nothing about their own report screen changes; only the
  background tag differs).
- **Mobile-first for participants, big-screen-first for the facilitator
  live view**: the live view needs its own CSS treatment (larger type,
  higher contrast) distinct from `ManagerScreen.jsx`'s existing
  phone-sized dashboard — it's meant to be read from across a room.

## Auth adapter changes

`src/lib/authAdapter.js` gains:

- `createSession({ name, userId })` → insert into `fbw_sessions`, return
  `{success, sessionId, joinCode}`.
- `endSession({ sessionId })` → update `ends_at = now()`.
- `getSessionSummary({ sessionId })` → RPC `get_session_summary`.
- `validateCode({ code })` → RPC `validate_code`, returns
  `{valid, kind, id}` — replaces the narrower `validateTeamCode` at the
  intro-screen call site.
- `saveAssessment(...)` gains an optional `sessionId` param alongside the
  existing `teamId`, mutually exclusive in practice, both passed through
  unchanged to the insert.

## Testing

- `discussionCards.test.js` — content-bank completeness (all 7 pattern
  keys × en/ar present), mirrors `data.test.js`.
- Auth adapter tests for the four new/changed methods, mocked, following
  the existing `get360Summary`/`getTeamSummary` test pattern.
- Component tests: unified code-entry screen (team match / session match
  / invalid), `SessionLiveScreen` gated/revealed states, join-code
  display, end-session button, print button.
- Manual check on two viewport sizes before calling this done: 375px
  (participant) and ~1920px (facilitator live view on a projector/big
  screen) — per the standing playbook instruction.

## Out of scope for this pass

- Multiple concurrent sessions shown together in one facilitator view
  (v1: one session at a time, same as Prompt 5's single-team-at-a-time
  UI).
- Session history or replay after `ends_at` passes.
- QR-code join — text code only, consistent with every other join-code
  flow in this app.
- Removing/editing a session once started, beyond the one "end early"
  action.
