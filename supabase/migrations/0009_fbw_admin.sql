-- 0009_fbw_admin.sql
-- Owner-only standalone activity dashboard at /admin. See
-- docs/superpowers/specs/2026-09-10-admin-dashboard-design.md.

alter table fbw_profiles add column if not exists is_admin boolean not null default false;

-- The pre-existing insert policy from 0002 (`auth.uid() = id`) constrains
-- which row a caller may insert but not which columns, and the app already
-- does `supabase.from('fbw_profiles').upsert({id: userId}, {ignoreDuplicates:
-- true})` client-side (see src/lib/authAdapter.js). Without this, any
-- signed-up user could INSERT their own row with `is_admin: true` directly
-- via the REST API, self-granting admin. Replacing it with a check that also
-- requires `is_admin is false` still allows the existing client upsert
-- (is_admin defaults to false) but blocks a client from ever setting it true.
drop policy "insert own profile" on fbw_profiles;
create policy "insert own profile" on fbw_profiles
  for insert with check (auth.uid() = id and is_admin is false);

create or replace function fbw_get_admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

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

revoke execute on function fbw_get_admin_stats() from public;
revoke execute on function fbw_get_admin_stats() from anon;
grant execute on function fbw_get_admin_stats() to authenticated;
