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

## Data-protection checklist (placeholder, expand at Prompt 8)
Before deploying anything that stores 360/team/longitudinal data:
verify **current** data-protection requirements per country of use
(e.g. Saudi PDPL and equivalents elsewhere) against **official current
sources** at build time — do not treat any specific rule stated in this
repo as legal fact; it must be confirmed, not assumed.
