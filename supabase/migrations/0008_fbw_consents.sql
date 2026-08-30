-- 0008_fbw_consents.sql
-- Prompt 8 sub-project 1: explicit consent + privacy-notice gate.
--
-- Closes a real gap: every signed-in self-assessment has been saving to
-- fbw_assessments (see 0002_fbw_360.sql) with no consent step or privacy
-- notice at all. From here on, authAdapter.saveAssessment() (Task 3)
-- checks this table before writing any result.
--
-- Three independent purposes, not one blanket flag:
--   store_results        — required to save anything at all.
--   longitudinal_tracking — optional; read by a future sub-project that
--                           lets a person see their own change over time.
--   share_with_manager    — optional; read by a future talent-review
--                           export sub-project.
--
-- notice_version lets a returning user be re-prompted only when the
-- notice text actually changes, not on every save (see src/lib/consent.js).

create table fbw_consents (
  profile_id uuid primary key references fbw_profiles(id) on delete cascade,
  store_results boolean not null default false,
  longitudinal_tracking boolean not null default false,
  share_with_manager boolean not null default false,
  notice_version text not null,
  consented_at timestamptz not null default now()
);

alter table fbw_consents enable row level security;

create policy "read own consent" on fbw_consents
  for select using (auth.uid() = profile_id);

create policy "insert own consent" on fbw_consents
  for insert with check (auth.uid() = profile_id);

create policy "update own consent" on fbw_consents
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
