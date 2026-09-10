# Admin dashboard — standalone activity-monitoring link

## Goal

A single URL (`/admin`) only you can use, showing site-wide completion
stats (signups, assessments, role breakdown, team/session/360 usage) so
you can monitor real activity without logging into any user's account.
Not a manager feature — managers already have `/manager` for their own
team's aggregate. This is the owner-level view across everyone.

## Decisions made during brainstorming

- **Scope: completion stats only.** No individual response data, no
  emails. Matches `fbw_profiles`' existing no-PII design (see CLAUDE.md).
- **Backend: Supabase**, reusing the shared `madarlead-assessment`
  project — no new service, same pattern as every other module in this
  app.
- **Access control: a boolean flag, not a hardcoded email.** Add
  `is_admin` to `fbw_profiles` rather than checking `auth.email() = '...'`
  in SQL, so no personal email is committed to a public-ish repo/migration.
  You flip your own row to `true` once, manually, after this migration
  ships.
- **No nav link.** The route exists but nothing in the app links to it —
  bookmark the URL. Sign-in reuses the existing shared Supabase auth
  (any account can attempt sign-in; the RPC is the actual gate). A
  non-admin account gets a plain "not authorized" screen, not an error
  that reveals this is an admin panel.
- **No new auth flow.** `/admin` only offers sign-in (no "create account"
  option, unlike `/manager`) — you already have an account from using the
  app.

## Data model

New migration `supabase/migrations/0009_fbw_admin.sql`:

```sql
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
      select jsonb_object_agg(coalesce(role, 'unspecified'), n)
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
```

- No SELECT policy is added anywhere for admin access — `get_admin_stats`
  is the only read path, same structural pattern as `get_team_summary` /
  `get_360_summary`. It returns aggregate counts only, never raw rows.
- After this migration is applied, run once in the Supabase SQL editor:
  ```sql
  update fbw_profiles set is_admin = true where id = auth.uid();
  ```
  (run this while signed in as yourself in the SQL editor's own session,
  or substitute the id from `select id from auth.users where email = '<your email>'`).

## UI / flow

- **Routing**: `main.jsx` gains `isAdminRoute = pathname === '/admin'`,
  rendering `AdminApp.jsx` — same pattern as the existing `/manager` match.
- **AdminApp.jsx**: states `anon → sending → signedIn`. On sign-in,
  calls `authAdapter.getAdminStats()`. If the RPC throws (non-admin
  account), render a plain "not authorized" message — same visual weight
  as any other error, no indication this route does anything special.
- **AdminScreen.jsx**: stat tiles (total leaders, total assessments,
  7d/30d counts), role-breakdown list, teams/sessions/360-link/360-response
  counts, a simple list or sparkline of the 14-day daily-completions
  series, manual refresh button (no auto-poll — this isn't a live session
  view). Reuses existing `.wrap` / `.btn` classes from `global.css`, no
  new styling system.

## Auth adapter changes

`src/lib/authAdapter.js` (both `noopAuthAdapter` and `supabaseAuthAdapter`)
gains:

- `getAdminStats()` → RPC `get_admin_stats`, returns
  `{success, stats}` on success or `{success: false, error}` if the RPC
  raises (not authorized, or Supabase not configured).

## Testing

- `AdminApp.test.jsx`, mirroring `ManagerApp.test.jsx`'s fake-adapter
  pattern: covers signed-out sign-in form, sending state, authorized
  stats render, and the not-authorized error state.
- No SQL test — consistent with the rest of this repo's migrations
  (manually verified via Supabase SQL editor / MCP after applying).
- Manual 375px mobile check on the new screen before calling this done,
  per the playbook's standing instruction.

## Out of scope for this pass

- Any UI entry point/nav link to `/admin` (URL-only by design).
- Per-user or per-team drill-down from the admin view (aggregate only).
- Any email/PII surfacing.
- Historical trend beyond 14 days, CSV export, or charting library.
