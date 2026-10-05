-- 0010_fbw_group_size_setting.sql
-- Makes the anonymity gate for TEAM and LIVE-SESSION summaries configurable
-- and raises the default from a hard-coded 3 to 5.
--
-- Why: with only 3 responses, an average plus the per-role breakdown can
-- identify one person (e.g. the only "management" respondent). Larger groups
-- are expected by enterprise HR. 360 feedback already has its own per-link
-- gate (fbw_rater_links.min_raters, see 0007) and is NOT changed here.
--
-- How to change it later (one statement, no deploy):
--   update fbw_settings set value = 4 where key = 'min_group_size';
-- The function below clamps to a floor of 3, so it can never be set lower.
-- The table has RLS enabled with no policies and no grants to API roles, so it
-- cannot be read or written through the REST API — only here, in SQL.

create table if not exists fbw_settings (
  key text primary key,
  value int not null
);

alter table fbw_settings enable row level security;
revoke all on fbw_settings from anon, authenticated;

insert into fbw_settings (key, value) values ('min_group_size', 5)
  on conflict (key) do nothing;

create or replace function fbw_min_group_size()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select greatest(3, coalesce((select value from fbw_settings where key = 'min_group_size'), 5));
$$;

-- Only other SECURITY DEFINER functions (running as the owner) call this.
revoke execute on function fbw_min_group_size() from public, anon, authenticated;

-- get_team_summary / get_session_summary: identical to 0006 except the
-- threshold now comes from fbw_min_group_size() and is returned as
-- minGroupSize so the UI can show "N of M responses needed" correctly.
create or replace function get_team_summary(p_team_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_manager uuid;
  v_min int;
  v_count int;
  v_distribution jsonb;
  v_role_breakdown jsonb;
begin
  select manager_id into v_manager from fbw_teams where id = p_team_id;

  if auth.uid() is null or v_manager is null or v_manager <> auth.uid() then
    raise exception 'not authorized';
  end if;

  v_min := fbw_min_group_size();
  select count(*) into v_count from fbw_assessments where team_id = p_team_id;

  if v_count < v_min then
    return jsonb_build_object('count', v_count, 'minGroupSize', v_min, 'distribution', null, 'roleBreakdown', null);
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

  return jsonb_build_object('count', v_count, 'minGroupSize', v_min, 'distribution', v_distribution, 'roleBreakdown', v_role_breakdown);
end;
$$;

revoke execute on function get_team_summary(uuid) from public, anon;
grant execute on function get_team_summary(uuid) to authenticated;

create or replace function get_session_summary(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_facilitator uuid;
  v_min int;
  v_count int;
  v_distribution jsonb;
  v_role_breakdown jsonb;
begin
  select facilitator_id into v_facilitator from fbw_sessions where id = p_session_id;

  if auth.uid() is null or v_facilitator is null or v_facilitator <> auth.uid() then
    raise exception 'not authorized';
  end if;

  v_min := fbw_min_group_size();
  select count(*) into v_count from fbw_assessments where session_id = p_session_id;

  if v_count < v_min then
    return jsonb_build_object('count', v_count, 'minGroupSize', v_min, 'distribution', null, 'roleBreakdown', null);
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

  return jsonb_build_object('count', v_count, 'minGroupSize', v_min, 'distribution', v_distribution, 'roleBreakdown', v_role_breakdown);
end;
$$;

revoke execute on function get_session_summary(uuid) from public, anon;
grant execute on function get_session_summary(uuid) to authenticated;
