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
