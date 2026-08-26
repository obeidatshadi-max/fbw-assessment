-- Replaces the never-applied 0001_init.sql: namespaced fbw_ tables in the
-- shared madarlead-assessment project, catching up role/compliance_answers
-- columns from Prompts 2/3, plus the 360 rater-link/response tables.

create table fbw_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table fbw_profiles enable row level security;

create policy "read own profile" on fbw_profiles
  for select using (auth.uid() = id);

create policy "insert own profile" on fbw_profiles
  for insert with check (auth.uid() = id);

create table fbw_assessments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references fbw_profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  role text,
  scenario_answers jsonb not null,
  org_answers jsonb not null,
  compliance_answers jsonb,
  scores jsonb not null
);

alter table fbw_assessments enable row level security;

create policy "read own" on fbw_assessments
  for select using (auth.uid() = profile_id);

create policy "insert own" on fbw_assessments
  for insert with check (auth.uid() = profile_id);

-- fbw_rater_links: id is the shareable token (unguessable uuid).
create table fbw_rater_links (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references fbw_assessments(id) on delete cascade,
  leader_profile_id uuid references fbw_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  min_raters int not null default 3,
  closed_at timestamptz
);

alter table fbw_rater_links enable row level security;

create policy "leader manages own links" on fbw_rater_links
  for all using (auth.uid() = leader_profile_id) with check (auth.uid() = leader_profile_id);

-- No PII on this table (leader_profile_id is a bare uuid) — safe to let
-- anyone with the link id read whether it's open, to render the rater form.
create policy "anyone can read a link to validate it" on fbw_rater_links
  for select to anon, authenticated using (true);

-- fbw_rater_responses: insert-only for anon/authenticated, gated to an open
-- link. No select policy at all, for anyone, including the leader — the
-- only sanctioned read path is the get_360_summary() function below.
create table fbw_rater_responses (
  id uuid primary key default gen_random_uuid(),
  rater_link_id uuid references fbw_rater_links(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  dimension_scores jsonb not null
);

alter table fbw_rater_responses enable row level security;

create policy "anyone can submit to an open link" on fbw_rater_responses
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from fbw_rater_links l
      where l.id = rater_link_id and l.closed_at is null
    )
  );

-- security definer: the only way to read aggregated rater data. Enforces
-- the minimum-rater anonymity gate server-side, not just in the client.
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

  if v_leader is null or v_leader <> auth.uid() then
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

grant execute on function get_360_summary(uuid) to authenticated;
