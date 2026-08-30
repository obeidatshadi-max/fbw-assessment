# Prompt 8, sub-project 1: Consent + privacy-notice gate

## Context

Prompt 8 in `fbw-claude-code-prompts.md` bundles four pieces: talent-review
export (9-box/IDP), consent-based longitudinal tracking, an explicit consent
+ privacy-notice step, and a CLAUDE.md legal-checklist reminder. This is too
broad for one spec — decomposed into sub-projects:

1. **Consent + privacy-notice gate** (this spec) — foundation the other two depend on.
2. Talent-review export (9-box/IDP structured summary).
3. Longitudinal tracking (consent-gated cross-session identity linking).
4. CLAUDE.md legal checklist — small, rides along with #1.

**Why gate #1 first:** today every signed-in self-assessment already saves
to `fbw_assessments` (tied to `auth.users` via `fbw_profiles`) with **no
consent step or privacy notice at all** — see `0002_fbw_360.sql`. Sub-projects
2 and 3 both need identity-linked storage to already be consent-gated before
they add more identity-linked data on top of it.

## Scope decision (confirmed with user)

- The new consent gate covers the **existing default save**, not just new
  features — closes the current undisclosed-storage gap.
- Consent is **granular, per-purpose**: three separate opt-ins, since
  sharing with a manager is a materially different privacy exposure than
  private storage.
- Consent is asked **in the same panel, before submit** — extends the
  existing `AuthPanel` sign-in/create-account step rather than adding a new
  screen after auth succeeds.

## Data model

New table, namespaced like the rest of the schema (see `CLAUDE.md` → 360
section for the `fbw_` convention and shared-project rationale):

```sql
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
```

`notice_version` is a plain string constant (e.g. `"2026-08-30"`) bumped
whenever the privacy-notice text changes materially — lets returning users
be re-prompted only when the notice actually changed, not on every save.

**Enforcement point:** `authAdapter.saveAssessment()` upserts `fbw_consents`
first, then only proceeds to insert into `fbw_assessments` if
`store_results === true`. This is an app-level gate (mirrors how
`fbw_assessments` RLS already gates by `auth.uid() = profile_id`) — consent
is checked in the same code path that performs the write, not left to the
UI alone.

## UX flow

`AuthPanel.jsx` (`src/components/AuthPanel.jsx`) grows a consent block,
rendered above the existing email/password inputs, only in the initial
(`authState.status` not `signedIn`/`saved`) branch:

- Short, plain-language privacy notice text (EN/AR via `translations.js`,
  matching the existing `t('auth.*')` key pattern). Content itself is a
  first draft for the user to correct — this spec only fixes the mechanism.
- Three checkboxes, default unchecked:
  1. **Store my results so I can see this report again** — required.
  2. **Track my results over time so I can see my own change** — optional.
  3. **Share a summary with my manager/HR for talent review** — optional.
- Sign-in / Create-account buttons keep their existing `disabled` logic
  (email/password/sending checks) and additionally require checkbox 1 —
  same pattern already used for the email/password disabled state.
- On success (`onAuthStateChange` handler in `App.jsx`), the three checkbox
  values pass through to `saveAssessment()` alongside the existing
  `role`/`p1Answers`/etc. payload, which performs the `fbw_consents` upsert
  before the `fbw_assessments` insert described above.

## Returning users / stale consent

No retroactive backfill or retroactive compliance claim for
already-stored past assessments — out of scope here; a future "delete my
data" flow would handle that separately if ever needed.

For a returning signed-in user: before `saveAssessment()` runs, check
whether an `fbw_consents` row exists for `profile_id` and whether its
`notice_version` matches the current constant. If missing or stale, render
the consent block again (same component, same gate) before the save
proceeds. If current, skip straight to saving as today.

## Not doing yet

Checkboxes 2 and 3 are **recorded only** in this sub-project — nothing
reads `longitudinal_tracking` or `share_with_manager` yet. Sub-project 2
(talent export) and sub-project 3 (longitudinal tracking) will each check
their respective flag before doing anything with the data.

## Testing

- `AuthPanel.test.jsx`: checkbox 1 required to enable Sign-in/Create-account
  buttons; checkboxes 2/3 optional and don't block; consent values passed
  through in the callback props.
- `authAdapter` tests: `saveAssessment()` blocks the `fbw_assessments`
  insert when `store_results` is false; upserts `fbw_consents` correctly;
  stale/missing `notice_version` triggers re-consent path.
- Existing i18n test pattern: EN/AR keys resolve for all new consent copy
  (per memory note: verify all `t()` keys resolve, not just the English
  happy path).

## Migration file

New migration: `supabase/migrations/0008_fbw_consents.sql` (schema above),
following the existing hardening-file pattern if a follow-up fix is needed
later (e.g. `0009_fbw_consents_hardening.sql`).
