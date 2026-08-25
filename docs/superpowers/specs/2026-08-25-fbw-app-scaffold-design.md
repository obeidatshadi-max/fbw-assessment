# FBW App Scaffold — Design

## Context

`fbw-assessment.html` is a single-file, no-storage leadership self-reflection
tool (Function/Being/Will). The playbook in `fbw-claude-code-prompts.md`
(Prompt 0) asks for a choice between staying single-file or scaffolding a
real app, because several planned features (360 feedback, team dashboard,
facilitator mode, longitudinal/talent-review tracking — Prompts 4, 5, 7, 8)
require data to persist across people and sessions, which a static HTML
file cannot do.

Decision made (Prompt 0, recorded in `CLAUDE.md`): **Option B — scaffold a
small app now**, using Supabase + Netlify, matching the stack already used
across the user's other MENA pharma tools (Dawwar, Safqa, StyleShift,
SPS Style).

This spec covers **only the scaffold** — the infrastructure and skeleton
that Prompts 1–8 will be built into, one prompt/session at a time per the
playbook's own instruction. It does not implement any of Prompts 1–8's
features themselves (no i18n, no role-based scenarios, no 360, etc.).

## Goals

- Stand up a working React/Vite/Supabase/Netlify app that reproduces the
  current single-file tool's flow and visual design exactly, with zero
  regression in behavior.
- Add optional persistence: a signed-in leader's completed report is saved;
  an anonymous visitor gets exactly today's experience.
- Leave a schema and file structure that Prompts 1–8 can extend without
  rework (i18n later touches copy, not structure; 360 later adds tables,
  not a rewrite of these two).

## Non-goals (explicitly deferred to their own future prompts)

- Arabic/French/i18n (Prompt 1)
- Role-based scenario sets (Prompt 2)
- Compliance-courage sub-scale (Prompt 3)
- 360 feedback, rater links/codes (Prompt 4)
- Team/affiliate dashboard (Prompt 5)
- Dev plan / manager debrief / PDF export (Prompt 6)
- Facilitator mode (Prompt 7)
- Talent-review export, consent, longitudinal tracking (Prompt 8)

## Architecture

- **Repo layout**: root-level Vite + React app at
  `Desktop/AI APP 2026/pharma/fbw-assessment/` (matches Dawwar's layout —
  one app, not the multi-app `team/`-nested pattern used by SPS Style).
- **Styling**: keep the existing hand-written CSS (custom properties,
  Fraunces + IBM Plex Sans, the `--fn`/`--be`/`--wl` color tokens) ported
  as-is into component styles or a single global stylesheet. No Tailwind —
  the current design is already the deliberate house look for this tool and
  Prompt 1 explicitly requires preserving it.
- **Backend**: Supabase (Postgres + RLS + built-in magic-link auth), same
  vendor as the user's other apps.
- **Hosting**: Netlify, deployed via Netlify CLI (no GitHub remote
  required, matching Dawwar/Safqa/SPS Style's local-git + `netlify deploy`
  pattern).

## Data model

Two tables only, scoped to what this scaffold and Prompts 1–3/6 need. No
360/rater/team/session tables yet — those arrive with Prompts 4/5/7 and get
their own migration at that time.

```sql
-- profiles: one row per signed-in leader (Supabase auth.users is the
-- source of identity; this holds app-specific fields)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- assessments: one row per completed reflection
create table assessments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade, -- null = anonymous, never saved server-side unless claimed
  completed_at timestamptz not null default now(),
  scenario_answers jsonb not null,   -- [{most:int|null, least:int|null}, ...] len 15
  org_answers jsonb not null,        -- [1|2|3, ...] len 9
  scores jsonb not null              -- {most:{F,B,W}, least:{F,B,W}, org:{F,B,W}} - precomputed for fast read
);
alter table assessments enable row level security;
create policy "read own" on assessments for select using (auth.uid() = profile_id);
create policy "insert own" on assessments for insert with check (auth.uid() = profile_id);
```

Anonymous completions never touch this table — nothing is written unless
the visitor explicitly signs in from the report screen (see Auth flow).

## Auth flow

Matches today's zero-friction promise:

1. Visitor opens the app, completes the assessment same as today —
   `intro → scenarios → org questions → report`, entirely client-side,
   nothing sent to Supabase yet.
2. On the report screen, a small "Sign in to save this report" affordance
   appears (email magic-link via Supabase Auth).
3. On sign-in success (magic-link redirect back into the app), the
   in-memory result for that session is written to `assessments` under the
   now-known `profile_id`, and the report screen shows a "saved" state.
4. If the visitor never signs in, nothing is persisted — identical to
   today's "nothing is saved or sent anywhere" copy, which stays accurate
   and does not need to change for this scaffold.

No page requires auth to be reached. Auth-gating a page is not part of this
scaffold.

## Components / pages

Ported 1:1 from the current single-file screens, same visual states:

- `IntroScreen` — hero + three-dimension explainer + start button
- `ScenarioScreen` — one-question-at-a-time wizard, same chip
  most/least interaction
- `OrgScreen` — 9-item Likert list
- `ReportScreen` — summary band, ranked list, three profile blocks, org
  bars, disclaimer, save-to-account affordance, print button
- `AuthPanel` — small embedded magic-link form used only from
  `ReportScreen`
- Shared: `Navbar` (back/next), `ProgressBar`, `TopBar`

Scoring/report-building logic (`scoreIndividual`, `scoreOrg`, `rank`,
`buildReport`'s data-shaping half) moves into a plain module
(`src/lib/scoring.js`) with no DOM dependency, so it can be unit-tested and
reused unchanged by later prompts (360 scoring in Prompt 4 will call the
same `scoreIndividual`/`rank` on rater data).

## Testing

- Unit tests (Vitest, matching Dawwar's setup) for `src/lib/scoring.js`:
  port the existing scoring logic exactly and verify against a few
  hand-computed scenario/org answer sets, including the tie-break rule.
- Manual pass: full flow at 375px mobile viewport (per the playbook's own
  "test on 375px, screenshot before accepting" instruction), both the
  anonymous path and the sign-in-and-save path.
- No test coverage added for Prompts 1–8 features — out of scope here.

## Migration of existing content

`SCENARIOS`, `ORG_ITEMS`, and `DIM` data arrays move verbatim into
`src/data/scenarios.js`, `src/data/orgItems.js`, `src/data/dimensions.js` —
unchanged content, just relocated so Prompt 1 (i18n) and Prompt 2
(role-based sets) have a clear, single place to extend from.

## Risks / open questions

- Supabase project: assumed a new project is created for this app (not
  reusing another app's project) — standard practice for the user's other
  tools, each with its own project. Confirm project name during
  implementation.
- Netlify site name: not yet decided (e.g. `fbw-assessment.netlify.app`) —
  pick during deploy step, not a blocker for local scaffold work.
