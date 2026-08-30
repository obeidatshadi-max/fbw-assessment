# Function · Being · Will (FBW) — Architecture Notes

## What this is
Single-file, mobile-first leadership self-assessment. Vanilla HTML/CSS/JS,
no build step, no backend, no data storage. Brand: "Integral Leadership
Dynamics™ — Function · Being · Will."

## Data model (in `fbw-assessment.html`, top of `<script>`)

- **`SCENARIOS`** — 15 forced-choice situations. Each has `s` (situation
  text) and `opts` — exactly 3 options, one per dimension (`d: "F"|"B"|"W"`),
  display order shuffled per scenario so no dimension is always first/last.
- **`ORG_ITEMS`** — 9 Likert statements about the person's *workplace*
  (not the person), 3 per dimension, answered on a 3-point scale
  (Rarely / Sometimes / Often → 1/2/3).
- **`DIM`** — the three dimension definitions (F/B/W): label, tagline,
  color tokens, and three content arrays used in the report —
  `strength`, `watch` (watch-outs when overused), `develop` (growth
  actions). This is the copy bank for the report.

## State
`state.p1` — array of `{most, least}` index pairs, one per scenario.
`state.p1i` — current scenario index (part 1 is a single-question-at-a-time
wizard, not a form).
`state.org` — array of 1–3 values, one per org item.

## Scoring logic

- **Individual (`scoreIndividual`)**: for each scenario, `most[dim]++` and
  `least[dim]++` where `dim` is the dimension of the chosen option. Result:
  two `{F,B,W}` count objects, each dimension 0–15, `most` and `least` sums
  each equal 15 (one pick per scenario).
- **Ranking (`rank`)**: sorts F/B/W keys by `most` score descending. Ties
  are broken by `least` score — **fewer `least` picks wins the tie**
  (i.e., a dimension you almost never rejected outranks one you rejected
  more, at equal `most` count). This tiebreak only applies to the
  individual ranking, not the org ranking (org has no `least`, so `rank()`
  called without a tiebreak arg for org falls through unresolved on a tie —
  known limitation, not currently exercised by the data).
- Ranked order → `[dominant, backup, growth-edge]`. These three feed the
  three `profileBlock()` sections in the report (`mode: "full" | "backup" |
  "develop"`), each pulling different slices of the `DIM[key]` content
  arrays.
- **Org (`scoreOrg`)**: simple sum per dimension across its 3 items, range
  3–9. Bucketed for display as Low (<5) / Medium (5–6) / High (≥7).
- **Insight copy** (`makeInsight`, `orgParagraph`) is template-generated
  from the ranked dominant/growth-edge dimensions and the org score buckets
  — not free text, so it's fully deterministic from the two score objects.

## Report sections
Summary band + ranked list → Detailed profile (3 `profileBlock`s: full,
backup, develop) → Organization profile (3 bars + insight paragraph) →
fixed disclaimer (explicitly *not* a validated psychometric instrument,
scores are self-relative/ipsative, not comparable across people).

## Flow / screens
`intro → p1 (15 scenarios, one at a time) → p2 (9 org Likert items) →
report`. Single sticky bottom nav (Back/Next), progress bar fills across
all 24 answers combined. Print/PDF via `window.print()` + a `@media print`
stylesheet that hides everything except `#screen-report`.

## Feature feasibility — single file vs. requires backend

| Feature | Single file OK? | Why |
|---|---|---|
| Arabic/French + RTL | **Yes** | Pure i18n/CSS — a translations object + `dir="rtl"` toggle, no server needed. |
| Role-based scenario sets | **Yes** | Just more data in the same JSON shape, selected client-side. |
| Compliance-courage sub-scale | **Yes** | Same forced-choice/scenario pattern, scored and rendered the same way. |
| 30/60/90 dev plan + manager debrief + PDF export | **Yes** | Template text generated from existing scores; PDF via `window.print()`, same as today. |
| **360 (self vs others) feedback** | **No** | Requires a leader's self-results to persist somewhere a *different device/person* (the rater) can reach, plus a shareable link/code, plus aggregation logic and a minimum-rater-count gate before revealing anything. A single HTML file has no way to receive another visitor's answers — there is nothing to write to. |
| **Team/affiliate dashboard** | **No** | Needs many people's results aggregated in one place the manager can query later — same missing-storage problem as above, plus filtering by role/region across records that don't exist yet. |
| **Facilitator/workshop mode** | **No** | Needs a live session concept (a code participants join) and live aggregation across concurrent submitters — real-time multi-client state, which a static file cannot hold or broadcast. |
| **Consent-based longitudinal tracking / talent-review export** | **No** | By definition requires storing a person's results *across sessions/devices* tied to their identity, plus consent state — nothing to attach that to without a backend. |

Rule of thumb: anything that stays on **one device, one sitting** can stay
single-file. The moment a second person or a later date needs to see a
result that isn't theirs in that moment, you need storage.

## Two architecture options (per Prompt 0 — do not build until chosen)

**Option A — stay single-file as long as possible**
- Implement i18n (Prompt 1), role-based scenarios (Prompt 2), compliance
  sub-scale (Prompt 3), and dev-plan/PDF (Prompt 6) all inside
  `fbw-assessment.html`.
- Pros: zero hosting cost/complexity, works offline, easiest to hand to
  IT/compliance as "just a file," matches the existing "nothing is saved"
  privacy promise exactly.
- Cons: file keeps growing (translations × role sets × sub-scale add real
  weight); no path to 360/dashboard/facilitator/talent-review without a
  rewrite later; effort on those four prompts is fully wasted once you
  outgrow single-file.
- Rough effort: Prompts 1–3 + 6 ≈ small, a few sessions each, no new
  infrastructure to learn.

**Option B — scaffold a small app now**
- Suggested stack: static frontend (keep the current HTML/CSS look, or
  port to a light framework) + a small managed backend for
  auth-free short-lived codes and result storage — e.g. Supabase
  (Postgres + row-level security + generated API), which the user already
  has experience with on other MENA pharma tools (Dawwar, Safqa, StyleShift).
- Pros: every prompt (0–8) becomes buildable, including 360, dashboard,
  facilitator mode, and longitudinal/consent tracking; no rewrite later;
  reuses an already-familiar stack/vendor.
- Cons: real hosting + a database to secure and pay for; must handle
  consent/PDPL-style data protection from day one (see Prompt 8); more
  moving parts for a non-developer to maintain; slower to ship the
  first (i18n) feature because setup comes first.
- Rough effort: 1 session of scaffolding (project + schema + auth-free
  session codes) before *any* of Prompts 1–8 begin, then each prompt is
  similar effort to Option A plus the extra step of wiring to storage
  where relevant.

**Recommendation is not made here** — per Prompt 0, wait for your choice
before building anything.

## 360 self-vs-others feedback (Prompt 4)

Storage: shared Supabase project `madarlead-assessment` (id
`kkhkxjvipamajvawxzpc`), used by several of Shadi's other apps — tables are
namespaced `fbw_` (`fbw_profiles`, `fbw_assessments`, `fbw_rater_links`,
`fbw_rater_responses`). Chosen over a dedicated project to avoid a new
$10/mo charge. Migrations: `supabase/migrations/0002_fbw_360.sql` (schema)
and `0003_fbw_360_hardening.sql` (fixes below).

- **Rater flow**: leader generates a link from the report screen
  (`/rate/<uuid>`, the uuid is the token). `src/main.jsx` reads
  `window.location.pathname` directly (no router library) and renders
  `RaterApp` instead of `App` when it matches. Raters answer 12 Likert
  items (`src/data/raterItems.js`, 3 per F/B/W/Compliance, same 1-3 scale
  as `ORG_ITEMS`) completely anonymously — no login, no identity captured.
- **Anonymity is structural, not a UI convention**: `fbw_rater_responses`
  has an INSERT-only RLS policy and *no SELECT policy at all* — nobody,
  including the leader, can read raw rows. The only sanctioned read path is
  the `get_360_summary(link_id)` SECURITY DEFINER function, which checks
  the caller owns the link and returns `scores: null` until at least 3
  responses exist. Link validity for the rater side is checked the same
  way, via `validate_rater_link(link_id)` — **not** a table SELECT grant.
  (0003 replaced an earlier `using (true)` SELECT policy on
  `fbw_rater_links` that let any caller in this shared DB enumerate every
  leader's links — caught in review before ship.)
- **Score comparability**: self scores are ipsative (forced-choice, sum to
  15 across F/B/W); rater scores are Likert sums (3-9 per dimension). Both
  are converted to "% of profile" before comparing — see
  `src/lib/raterScoring.js` and
  `docs/superpowers/specs/2026-08-26-prompt4-360-design.md` for the exact
  math. This is an approximation, documented in the report copy.
- **Known limitation**: no rater identity exists, so nothing stops one
  person submitting more than once. Acceptable for this low-stakes,
  reflective use; would need per-rater one-time tokens to close — revisit
  if this tool is ever used for Prompt 8 (talent review).

## Data-protection checklist (Prompt 8)

Before deploying anything that stores 360/team/longitudinal/talent-review
data to a new country or customer:

- [ ] Verify the **current** data-protection law for that country against an
      **official current source** (e.g. Saudi Arabia's PDPL, UAE's PDPL,
      or the equivalent for wherever the deploying company operates) —
      never treat any specific rule stated in this repo as legal fact.
- [ ] Confirm whether that law requires a **local data-residency**
      arrangement (the shared `madarlead-assessment` Supabase project is
      hosted wherever Supabase's default region for that project is — check
      it, don't assume).
- [ ] Confirm the notice text in `src/lib/consent.js` /
      `src/i18n/translations.js` (`auth.consentNotice` and friends) has
      been reviewed by someone qualified to confirm it meets that law's
      plain-language and specificity requirements — the checked-in copy is
      a first draft, not legal advice.
- [ ] Confirm whether that law grants a right to **erasure/portability**
      that this tool does not yet implement (no "delete my data" flow
      exists as of this sub-project — see the consent-gate spec's "Not
      doing yet" section).
- [ ] If the deploying company has its own DPO/legal/compliance function,
      route this checklist through them rather than relying on this repo's
      notes alone.

This checklist is a reminder to verify, not a substitute for verifying.
