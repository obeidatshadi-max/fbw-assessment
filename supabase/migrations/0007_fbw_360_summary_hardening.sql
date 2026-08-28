-- 0007_fbw_360_summary_hardening.sql
-- Fixes the identical bug 0006 already fixed in get_session_summary,
-- end_session, and get_team_summary — but in get_360_summary
-- (supabase/migrations/0002_fbw_360.sql, Prompt 4, already shipped/live).
--
-- get_360_summary's ownership check was:
--   if v_leader is null or v_leader <> auth.uid() then raise exception...
-- For an anonymous caller, auth.uid() is NULL. `v_leader <> NULL`
-- evaluates to NULL, and PL/pgSQL's IF treats NULL as not-true, so the
-- exception never fires and the function proceeds. Confirmed live via
-- has_function_privilege('anon', 'get_360_summary(uuid)', 'execute') = true
-- (Postgres's default PUBLIC execute grant was also never revoked, same
-- as the 0006 functions before their fix). Since every /rate/<uuid> link
-- is shared by design with raters, anyone holding a rater-link uuid could
-- call this function directly and read the leader's aggregated 360 scores
-- — bypassing the intended leader-only access.
--
-- Fix is the same two layers 0006 used:
--   a. Add `auth.uid() is null or` to the front of the ownership check —
--      defense in depth, fails closed even if a grant is misconfigured
--      again.
--   b. Explicitly revoke PUBLIC/anon execute, re-grant only to
--      authenticated — closes the actual hole.
--
-- validate_rater_link is intentionally anon-callable (same as
-- validate_code/validate_team_code), only returns {valid}, and is
-- untouched here.

create or replace function get_360_summary(p_link_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leader uuid;
  v_min int;
  v_count int;
  v_scores jsonb;
begin
  select leader_profile_id, min_raters into v_leader, v_min
  from fbw_rater_links where id = p_link_id;

  if auth.uid() is null or v_leader is null or v_leader <> auth.uid() then
    raise exception 'not authorized';
  end if;

  select count(*) into v_count from fbw_rater_responses where rater_link_id = p_link_id;

  if v_count < v_min then
    return jsonb_build_object('count', v_count, 'scores', null);
  end if;

  select jsonb_build_object(
    'F', avg((dimension_scores->>'F')::numeric),
    'B', avg((dimension_scores->>'B')::numeric),
    'W', avg((dimension_scores->>'W')::numeric),
    'C', avg((dimension_scores->>'C')::numeric)
  ) into v_scores
  from fbw_rater_responses where rater_link_id = p_link_id;

  return jsonb_build_object('count', v_count, 'scores', v_scores);
end;
$$;

revoke execute on function get_360_summary(uuid) from public, anon;
grant execute on function get_360_summary(uuid) to authenticated;
