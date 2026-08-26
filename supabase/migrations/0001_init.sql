-- profiles: one row per signed-in leader (auth.users is the source of identity)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- assessments: one row per completed reflection a leader chose to save
create table assessments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  scenario_answers jsonb not null,
  org_answers jsonb not null,
  scores jsonb not null
);

alter table assessments enable row level security;

create policy "read own" on assessments
  for select using (auth.uid() = profile_id);

create policy "insert own" on assessments
  for insert with check (auth.uid() = profile_id);
