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
