-- 0006_fbw_facilitator_sessions_hardening.sql
-- Fixes a real, live vulnerability found by review in 0005, plus the
-- byte-identical pre-existing bug it revealed in 0004 (already shipped).
--
-- 1. Anonymous-callable SECURITY DEFINER functions with a broken auth
--    gate: get_session_summary, end_session (0005) and get_team_summary
--    (0004) all used the pattern
--      if v_owner is null or v_owner <> auth.uid() then raise exception...
--    For an anonymous caller, auth.uid() is NULL. `v_owner <> NULL`
--    evaluates to NULL, and PL/pgSQL's IF treats NULL as not-true, so the
--    exception never fires — the function proceeds. Confirmed live via
--    get_advisors(type:"security"): Postgres grants EXECUTE to PUBLIC by
--    default on new functions, and `grant execute ... to authenticated`
--    does not revoke that, so all three were reachable by anon and
--    flagged as anon_security_definer_function_executable /
--    authenticated_security_definer_function_executable.
--
-- 2. Fix is two layers, both applied to all three functions:
--    a. Explicitly revoke PUBLIC/anon execute, re-grant only to
--       authenticated — closes the actual hole.
--    b. Add `auth.uid() is null` to the ownership check as defense in
--       depth, so the function fails closed even if a grant is ever
--       misconfigured again. end_session gets an explicit early-return
--       guard instead (it already degraded safely to a silent no-op for
--       anon, since `facilitator_id = auth.uid()` with auth.uid() null
--       matches no row — this makes that intent explicit rather than
--       incidental).
--
-- validate_code and validate_team_code are intentionally anon-callable
-- (the whole point is a rep can enter a code before authenticating) and
-- are untouched here.

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

  if auth.uid() is null or v_facilitator is null or v_facilitator <> auth.uid() then
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

revoke execute on function get_session_summary(uuid) from public, anon;
grant execute on function get_session_summary(uuid) to authenticated;

create or replace function end_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  update fbw_sessions set ends_at = now()
  where id = p_session_id and facilitator_id = auth.uid();
end;
$$;

revoke execute on function end_session(uuid) from public, anon;
grant execute on function end_session(uuid) to authenticated;

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

  if auth.uid() is null or v_manager is null or v_manager <> auth.uid() then
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

revoke execute on function get_team_summary(uuid) from public, anon;
grant execute on function get_team_summary(uuid) to authenticated;
