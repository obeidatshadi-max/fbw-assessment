# Claude Code Prompt Playbook
## Extending the Function · Being · Will leadership tool for the pharma / MENA market

**How to use this**
- Run the prompts **in order**. Each one builds on the last.
- Paste **one prompt per session/commit**. Don't ask for everything at once — agentic tools do better with focused scope.
- After each build, ask Claude Code to **test in a 375px-wide mobile view** and show you a screenshot before you accept.
- Start by putting the existing `fbw-assessment.html` file in a folder and opening Claude Code there.

**One important decision first (Prompt 0 handles it):**
The current tool is a single-file claude.ai *artifact* with **no saved data** ("nothing is saved"). Features like 360 feedback, team dashboards, and progress-over-time **need real storage** (a small backend or database). That moves the project from a pure artifact into a proper web app. Prompt 0 makes Claude Code lay out that choice clearly before you spend effort.

---

## Prompt 0 — Orient the tool and choose the architecture

```
Read the file fbw-assessment.html in full. It is a single-file, mobile-first
leadership self-assessment (Function / Being / Will) using vanilla JS,
forced-choice scoring, and no data storage.

Before writing any code, do three things:
1. Write a short CLAUDE.md that documents the current architecture: the data
   model (scenarios, org items, DIM info), the scoring logic (most = +count,
   least = tiebreaker), and the report sections.
2. I want to add, over time: Arabic/French support, role-based scenarios,
   a compliance-courage sub-scale, 360 (self vs others) feedback, a team
   dashboard, a development plan, facilitator mode, and PDF export.
   Tell me honestly which of these can stay in a single HTML file and which
   REQUIRE a backend or database, and why.
3. Propose TWO architecture options: (A) keep it lightweight/single-file for
   as long as possible, (B) scaffold a small app now (suggest a simple,
   well-supported stack). For each: pros, cons, and rough effort. Do not
   build yet — wait for my choice.
```

---

## Prompt 1 — Arabic + French, with proper RTL (high priority for this market)

```
Refactor fbw-assessment.html so ALL user-facing text lives in one translations
object keyed by language (en, ar, fr) — nothing hard-coded in the HTML/JS.

Then:
- Add a language switcher in the top bar.
- When Arabic is selected, switch the whole page to dir="rtl" and mirror the
  layout (nav buttons, progress bar, profile left-borders, bars).
- Use a clean Arabic web font with a safe system fallback; keep the design
  identity intact.
- Keep the English simple; write natural Arabic (not literal translation) and
  natural French. Flag any string where you are unsure of the best wording so
  I can review it, rather than guessing.

Acceptance: I can complete the full flow end-to-end in each language, and the
report reads correctly in RTL Arabic on a phone.
```

---

## Prompt 2 — Role-based scenario sets + a format a company can extend

```
Right now there is one generic set of 15 situations. Make the scenarios
data-driven by role.

- Add a role selector on the intro screen: Medical Rep, First-line Manager,
  Product Manager, Medical/MSL, Market Access, Country Manager.
- Move scenarios into a clearly documented JSON structure so a non-developer
  could add or edit a set. Each scenario keeps exactly one Function, one Being,
  and one Will option; the schema must enforce/verify that balance.
- Draft first-pass scenarios for First-line Manager and Product Manager that
  reflect real pharma commercial situations (targets, coverage, KOL work,
  cross-functional pressure). Mark these clearly as DRAFT for my review — I am
  the domain expert and will rewrite them.
- Keep the scoring and report logic working unchanged regardless of which set
  is loaded.
```

---

## Prompt 3 — Add a pharma compliance & ethics "courage" sub-scale

```
Within the Will dimension, add a small dedicated sub-scale for COMPLIANCE
COURAGE, because in pharma this is the courage that matters most.

- Add 3–4 forced-choice or scenario items covering: speaking up about a
  questionable HCP interaction, reporting an adverse event even when
  inconvenient, and escalating a distributor or colleague cutting corners to
  hit a number.
- Score it separately and show it as its own line inside the Will section of
  the report, with plain-language interpretation (this is a strength to protect,
  or an area to build).
- Do NOT frame it as pass/fail or as a compliance audit. Keep the reflective,
  developmental tone. Add a short note that it is self-reflection, not a
  compliance assessment.
```

---

## Prompt 4 — 360 / self-vs-others module (the big value unlock)

```
Add a 180/360 layer so a leader can compare their self-view with how others
see them.

- A leader completes the self-assessment, then generates a short shareable
  link or code for raters (e.g. direct reports, their own manager, peers).
- Raters answer a parallel version of the items ABOUT that leader, anonymously.
- The report gains a "Self vs Others" view: for each of Function, Being, Will
  (and compliance courage), show the leader's self score next to the averaged
  rater score, and clearly highlight the GAPS (blind spots where others rate
  lower, and hidden strengths where others rate higher).
- Protect rater anonymity: do not show individual rater answers, and only
  reveal aggregated results once a minimum number of raters (say 3) respond.

This requires stored data — implement the storage approach we agreed in
Prompt 0. Keep the individual self-only flow fully working for people who
don't use 360.
```

---

## Prompt 5 — Team / affiliate dashboard for line managers

```
Build a manager dashboard that aggregates results across a team.

- Show the Function/Being/Will distribution of a whole group in one view.
- Filter by role and by region/country.
- Flag imbalance automatically, e.g. "This district is heavily Function with
  low Will — high execution, low resilience under pressure."
- Never expose one person's individual report from the aggregate view without
  their consent; the dashboard is about the group pattern, not surveillance.

Keep it mobile-friendly — managers here work from phones, not desks.
```

---

## Prompt 6 — Turn the report into a development journey (+ PDF export)

```
The report currently gives tips but no follow-through. Add a development layer.

- Generate a personalized 30/60/90-day plan based on the person's growth-edge
  dimension, using concrete, simple actions.
- Add a one-page "Manager debrief guide": 5–6 questions a line manager can use
  to discuss the results with the person.
- Add a clean "Save / print to PDF" export of the full report + plan that looks
  professional (keep it working offline; do not rely on a paid service).
- Keep the language simple for non-native English readers.
```

---

## Prompt 7 — Facilitator / workshop mode

```
Add a facilitator mode for running this live in a leadership workshop.

- A facilitator starts a session; participants join with a code.
- Show live/aggregated group results (the Function/Being/Will spread of the
  room) without exposing individuals.
- Provide 4–5 printable discussion cards tied to the group pattern that appears.

This is how the tool spreads inside a company, so make the facilitator flow
simple and reliable on a big screen as well as on phones.
```

---

## Prompt 8 — Talent-review fit, consent & data protection

```
Make the tool usable inside talent processes, carefully.

- Add an export that can feed a 9-box talent grid and an individual development
  plan (IDP): a clean, structured summary, not the raw answers.
- Support consent-based longitudinal tracking so a person can see their own
  change over 6–12 months.
- Add an explicit consent step and a short, plain-language privacy notice
  before any result is stored.
- In CLAUDE.md, add a checklist reminding me to verify the CURRENT data-
  protection requirements per country before deploying (for example Saudi
  Arabia's PDPL and equivalents elsewhere). Do not assert specific legal rules
  as fact — flag them as things I must confirm with the current official
  sources.
```

---

## Working tips for Claude Code

- Keep the `CLAUDE.md` from Prompt 0 updated — it's the shared memory between sessions.
- Ask it to **commit after each accepted feature** so you can roll back.
- Tell it plainly: *"prefer simple, well-maintained solutions over clever ones,"* and *"if you are unsure whether a library or API exists, check the docs — don't invent it."*
- After each build: *"test the full flow on a 375px mobile viewport and show me a screenshot before we continue."*
- You are the domain owner. Any pharma scenario or Arabic wording it drafts is a **first draft for you to correct**, not a finished answer.

---

*A note on scope, honestly:* Prompts 1–3 and 6 can plausibly stay lightweight.
Prompts 4, 5, 7, and 8 need stored data and real accounts, so they are a bigger
step — treat them as a v2 with proper hosting. And the validity question I raised
(does F-B-W predict retention/engagement/attainment?) is a **research study**, not
a coding task — a prompt can't establish it.
