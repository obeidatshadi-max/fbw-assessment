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
