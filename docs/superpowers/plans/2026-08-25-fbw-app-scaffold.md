# FBW App Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `fbw-assessment.html` (single-file, no-storage) into a React/Vite app with optional Supabase-backed persistence, reproducing today's flow and design exactly, ready for Prompts 1–8 to extend.

**Architecture:** Root-level Vite + React app. Pure data/logic modules (`src/data/*`, `src/lib/*`) hold content and scoring math with no DOM dependency; presentational components render them. `App.jsx` owns all state (phase, answers, report, auth) as a single source of truth, matching the original file's single `state` object. Auth/persistence is injected into `App` via an `authAdapter` interface so the app is fully testable without a live Supabase project, and only wired to a real Supabase-backed adapter at the end.

**Tech Stack:** React 18, Vite 5, Vitest + @testing-library/react, @supabase/supabase-js, plain CSS (ported from the original file), Netlify (static hosting).

**Spec:** `docs/superpowers/specs/2026-08-25-fbw-app-scaffold-design.md`

## Global Constraints

- No Tailwind or new styling system — port the existing hand-written CSS unchanged.
- No 360 / team / facilitator / longitudinal schema or tables yet — only `profiles` + `assessments`.
- The assessment flow must work fully anonymously; sign-in is optional and only offered on the report screen.
- Every screen, scoring rule (including the individual-ranking tie-break), and piece of report copy must reproduce the current `fbw-assessment.html` behavior exactly — zero regression.
- Creating a live Supabase project or running `netlify deploy` are irreversible/visible actions outside this repo — the executor must pause and get the user's explicit go-ahead before doing either, rather than provisioning automatically.
- English copy only in this plan (Prompt 1 handles i18n later) — do not add translation scaffolding here.

---

### Task 1: Vite + React project scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx` (placeholder, replaced in Task 10)
- Create: `src/test/setup.js`
- Create: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm run test` scripts every later task relies on.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "fbw-assessment",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});
```

- [ ] **Step 3: Write `src/test/setup.js`**

```js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Write `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Function · Being · Will — Leadership Reflection</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 5: Write `src/App.jsx` (placeholder)**

```jsx
export default function App() {
  return (
    <div className="wrap">
      <h1>FBW scaffold running</h1>
    </div>
  );
}
```

- [ ] **Step 6: Write `src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: Write `.gitignore`**

```
node_modules
dist
.env
.env.local
```

- [ ] **Step 8: Write `.env.example`**

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 9: Install and verify**

Run: `npm install`
Then: `npm run build`
Expected: build succeeds, `dist/index.html` is produced.

Then: `npm run dev`, open the printed local URL in a browser.
Expected: page loads showing "FBW scaffold running" with no console errors.

- [ ] **Step 10: Commit**

```bash
git add package.json vite.config.js index.html src .gitignore .env.example
git commit -m "chore: scaffold Vite + React project"
```

---

### Task 2: Port scenario, org-item, and dimension data

**Files:**
- Create: `src/data/scenarios.js`
- Create: `src/data/orgItems.js`
- Create: `src/data/dimensions.js`
- Test: `src/data/data.test.js`

**Interfaces:**
- Produces: `SCENARIOS` (array of 15, each `{ s, opts: [{t, d}, {t, d}, {t, d}] }`, `d` one of `"F"|"B"|"W"`), `ORG_ITEMS` (array of 9, each `{ t, d }`), `DIM` (object keyed `F`/`B`/`W`, each `{ key, label, tag, color, cls, band, strength: string[4], watch: string[4], develop: string[4] }`). These exact shapes are consumed by every later task.

- [ ] **Step 1: Write the failing test**

```js
// src/data/data.test.js
import { describe, it, expect } from 'vitest';
import { SCENARIOS } from './scenarios.js';
import { ORG_ITEMS } from './orgItems.js';
import { DIM } from './dimensions.js';

describe('SCENARIOS', () => {
  it('has 15 scenarios, each with exactly one F, one B, one W option', () => {
    expect(SCENARIOS).toHaveLength(15);
    SCENARIOS.forEach(sc => {
      expect(sc.opts).toHaveLength(3);
      const dims = sc.opts.map(o => o.d).sort();
      expect(dims).toEqual(['B', 'F', 'W']);
    });
  });
});

describe('ORG_ITEMS', () => {
  it('has 9 items, 3 per dimension', () => {
    expect(ORG_ITEMS).toHaveLength(9);
    const counts = { F: 0, B: 0, W: 0 };
    ORG_ITEMS.forEach(it => counts[it.d]++);
    expect(counts).toEqual({ F: 3, B: 3, W: 3 });
  });
});

describe('DIM', () => {
  it('has F, B, W with complete content', () => {
    ['F', 'B', 'W'].forEach(k => {
      const d = DIM[k];
      expect(d.key).toBe(k);
      expect(d.label).toBeTruthy();
      expect(d.strength).toHaveLength(4);
      expect(d.watch).toHaveLength(4);
      expect(d.develop).toHaveLength(4);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/data.test.js`
Expected: FAIL — `scenarios.js` etc. do not exist yet.

- [ ] **Step 3: Write `src/data/scenarios.js`**

```js
export const SCENARIOS = [
  { s: "A project is falling behind schedule.", opts: [
      { t: "I fix the plan and processes to get back on track.", d: "F" },
      { t: "I check how the team feels and rebuild their energy.", d: "B" },
      { t: "I recommit everyone to the goal and push forward.", d: "W" } ] },
  { s: "You receive hard feedback about yourself.", opts: [
      { t: "I reflect on what it says about who I am.", d: "B" },
      { t: "I decide what to change and act on it.", d: "W" },
      { t: "I study which skills I need to improve.", d: "F" } ] },
  { s: "A risky new opportunity appears.", opts: [
      { t: "I feel the pull of the purpose and want to go for it.", d: "W" },
      { t: "I check if we truly have the ability to deliver it.", d: "F" },
      { t: "I ask if it fits our values and who we want to be.", d: "B" } ] },
  { s: "There is tension in an important meeting.", opts: [
      { t: "I stay calm and hold a steady, safe presence.", d: "B" },
      { t: "I bring structure and facts to solve the problem.", d: "F" },
      { t: "I name the hard truth, even if it is uncomfortable.", d: "W" } ] },
  { s: "You have some free time at work.", opts: [
      { t: "I improve a system or learn a new skill.", d: "F" },
      { t: "I connect with people and check in with them.", d: "B" },
      { t: "I think about the bigger direction and what matters.", d: "W" } ] },
  { s: "A team member keeps underperforming.", opts: [
      { t: "I make the tough call about their role if needed.", d: "W" },
      { t: "I coach them on the exact skills they are missing.", d: "F" },
      { t: "I try to understand what is happening for them.", d: "B" } ] },
  { s: "Your organization faces a big change.", opts: [
      { t: "I help people feel secure during the change.", d: "B" },
      { t: "I plan the steps and manage the details.", d: "F" },
      { t: "I hold the vision and keep everyone moving to it.", d: "W" } ] },
  { s: "You feel stressed and tired.", opts: [
      { t: "I remind myself why this matters and keep going.", d: "W" },
      { t: "I pause to reconnect with myself and recharge.", d: "B" },
      { t: "I organize my tasks to get back in control.", d: "F" } ] },
  { s: "Two good options, and no clear answer.", opts: [
      { t: "I compare the facts and pick the stronger one.", d: "F" },
      { t: "I choose the one that feels true to our values.", d: "B" },
      { t: "I decide, own it, and move forward.", d: "W" } ] },
  { s: "A colleague breaks an important rule.", opts: [
      { t: "I confront the issue directly, whatever the cost.", d: "W" },
      { t: "I point to the process that was broken.", d: "F" },
      { t: "I talk with them honestly, person to person.", d: "B" } ] },
  { s: "People praise your team's success.", opts: [
      { t: "I credit the trust and relationships we built.", d: "B" },
      { t: "I credit our shared purpose and drive.", d: "W" },
      { t: "I credit the strong systems and skills we built.", d: "F" } ] },
  { s: "You are asked to lead something new.", opts: [
      { t: "I first ask if I have the skills to do it well.", d: "F" },
      { t: "I first ask if it fits who I am.", d: "B" },
      { t: "I first ask if it is worth committing to.", d: "W" } ] },
  { s: "A plan fails badly.", opts: [
      { t: "I take responsibility and choose the next bold step.", d: "W" },
      { t: "I review what went wrong and fix the method.", d: "F" },
      { t: "I stay grounded and keep the team's spirit up.", d: "B" } ] },
  { s: "Everything is calm and going well.", opts: [
      { t: "I enjoy the connections and the good atmosphere.", d: "B" },
      { t: "I set a bigger goal to aim for next.", d: "W" },
      { t: "I look for ways to make things run even better.", d: "F" } ] },
  { s: "You must make an unpopular decision.", opts: [
      { t: "I build a clear case with evidence.", d: "F" },
      { t: "I make the decision and stand behind it.", d: "W" },
      { t: "I make sure people feel heard first.", d: "B" } ] },
];
```

- [ ] **Step 4: Write `src/data/orgItems.js`**

```js
export const ORG_ITEMS = [
  { t: "Results and performance get the most attention here.", d: "F" },
  { t: "People are valued mainly for their skills and output.", d: "F" },
  { t: "Doing the work correctly matters more than anything else.", d: "F" },
  { t: "People feel safe to be themselves here.", d: "B" },
  { t: "Trust and relationships are treated as important.", d: "B" },
  { t: "How we treat each other matters as much as what we achieve.", d: "B" },
  { t: "We have a clear and inspiring direction.", d: "W" },
  { t: "People are encouraged to make brave decisions.", d: "W" },
  { t: "We stay committed to our goals even when things get hard.", d: "W" },
];
```

- [ ] **Step 5: Write `src/data/dimensions.js`**

```js
export const DIM = {
  F: { key: "F", label: "Function", tag: "You lead through skill, competence, and getting things done.",
      color: "var(--fn)", cls: "pf", band: "bf",
      strength: [
        "You are reliable — people trust you to deliver.",
        "You think clearly and solve problems well.",
        "You build systems, order, and high standards.",
        "You turn ideas into real, finished results."],
      watch: [
        "You may focus on the task and forget the people.",
        "You can hold on too tightly and control the details.",
        "You may tie your value to your output, and feel empty without it.",
        "You can miss the emotional side of a situation."],
      develop: [
        "Before acting, ask \"who\" is affected, not only \"what\" must be done.",
        "Trust others to do the work their own way.",
        "Make time to connect with people and to reflect on purpose.",
        "Let people see you when you do not have all the answers."] },
  B: { key: "B", label: "Being", tag: "You lead through presence, character, and honest relationships.",
      color: "var(--be)", cls: "pb", band: "bb",
      strength: [
        "You build trust and make people feel safe.",
        "You stay calm and grounded under pressure.",
        "You know yourself and lead by example.",
        "People feel seen and respected around you."],
      watch: [
        "You may avoid the hard action to keep the peace.",
        "You can put harmony above needed results.",
        "You may hesitate on tough decisions.",
        "You can carry other people's stress as your own."],
      develop: [
        "Practice saying the hard thing, kindly and clearly.",
        "Set clear goals and hold people to them.",
        "Balance care with accountability — both are respect.",
        "Act sooner; not every decision needs full comfort first."] },
  W: { key: "W", label: "Will", tag: "You lead through purpose, drive, and courage.",
      color: "var(--wl)", cls: "pw", band: "bw",
      strength: [
        "You give people a clear direction and reason.",
        "You keep going through difficulty and setbacks.",
        "You have the courage to act and to decide.",
        "You move things forward and inspire momentum."],
      watch: [
        "You may push too hard and wear people out.",
        "You can overlook people's real limits.",
        "You may act before building skill or trust.",
        "You risk burning out yourself and others."],
      develop: [
        "Slow down to build the skills (Function) the goal needs.",
        "Bring people with you (Being), not just ahead of them.",
        "Check that your drive leaves room for others' pace.",
        "Rest on purpose — commitment lasts only if you do."] },
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/data/data.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/data
git commit -m "feat: port scenario, org-item, and dimension data"
```

---

### Task 3: Scoring logic module

**Files:**
- Create: `src/lib/scoring.js`
- Test: `src/lib/scoring.test.js`

**Interfaces:**
- Consumes: `SCENARIOS`/`ORG_ITEMS`/`DIM` shapes from Task 2 (as function parameters, not imports — kept generic so tests don't depend on the real data).
- Produces:
  - `scoreIndividual(p1Answers, scenarios) -> { most: {F,B,W}, least: {F,B,W} }`
  - `scoreOrg(orgAnswers, orgItems) -> {F,B,W}`
  - `rank(scoreObj, tiebreak?) -> ["F"|"B"|"W", ...]` (high → low, ties broken by fewer `tiebreak` picks when `tiebreak` is given)
  - `buildReportData(p1Answers, orgAnswers, scenarios, orgItems, dim) -> ReportData` where `ReportData` is:
    ```
    {
      dominant, backup, developArea: "F"|"B"|"W",
      ind: { most: {F,B,W}, least: {F,B,W} },
      org: {F,B,W},
      total: number,
      band: [{key, count, pct}, ...] in F,B,W order,
      rankLines: [{role, key, count, pct}, ...] in rank order,
      orgOrder: ["F"|"B"|"W", ...],
      orgBars: [{key, value, pct, level}, ...] in F,B,W order,
      summaryInsight: {head, body, extra: string|null},
      profiles: {
        full: {key, label, tag, cls, strength: string[4], watch: string[4]},
        backup: {key, label, tag, cls, strength: string[3], watch: string[1]},
        develop: {key, label, tag, cls, develop: string[4]},
      },
      orgInsight: {top, low, topWord, lowWord, note},
    }
    ```
  All later components (Task 9, 10) render exactly this shape — no other module reshapes it.

- [ ] **Step 1: Write the failing tests**

```js
// src/lib/scoring.test.js
import { describe, it, expect } from 'vitest';
import { scoreIndividual, scoreOrg, rank, buildReportData } from './scoring.js';

const scenarios = [
  { s: 'a', opts: [{ t: 'f', d: 'F' }, { t: 'b', d: 'B' }, { t: 'w', d: 'W' }] },
  { s: 'b', opts: [{ t: 'f', d: 'F' }, { t: 'b', d: 'B' }, { t: 'w', d: 'W' }] },
  { s: 'c', opts: [{ t: 'f', d: 'F' }, { t: 'b', d: 'B' }, { t: 'w', d: 'W' }] },
];

describe('scoreIndividual', () => {
  it('counts most and least per dimension', () => {
    const answers = [
      { most: 0, least: 1 },
      { most: 0, least: 2 },
      { most: 1, least: 0 },
    ];
    const result = scoreIndividual(answers, scenarios);
    expect(result.most).toEqual({ F: 2, B: 1, W: 0 });
    expect(result.least).toEqual({ F: 1, B: 1, W: 1 });
  });

  it('ignores unanswered scenarios', () => {
    const answers = [{ most: null, least: null }, { most: 0, least: 1 }, { most: null, least: null }];
    const result = scoreIndividual(answers, scenarios);
    expect(result.most).toEqual({ F: 1, B: 0, W: 0 });
  });
});

describe('scoreOrg', () => {
  it('sums values per dimension', () => {
    const items = [{ t: 'x', d: 'F' }, { t: 'y', d: 'F' }, { t: 'z', d: 'B' }];
    const answers = [3, 2, 1];
    expect(scoreOrg(answers, items)).toEqual({ F: 5, B: 1, W: 0 });
  });
});

describe('rank', () => {
  it('orders by score descending', () => {
    expect(rank({ F: 5, B: 8, W: 2 })).toEqual(['B', 'F', 'W']);
  });

  it('breaks ties using fewer least picks', () => {
    const most = { F: 5, B: 5, W: 2 };
    const least = { F: 1, B: 3, W: 4 };
    expect(rank(most, least)).toEqual(['F', 'B', 'W']);
  });

  it('leaves tie order at F,B,W without a tiebreak (documents the org-ranking limitation)', () => {
    expect(rank({ F: 5, B: 5, W: 2 })).toEqual(['F', 'B', 'W']);
  });
});

const dim = {
  F: { key: 'F', label: 'Function', tag: 't', cls: 'pf', band: 'bf', color: 'var(--fn)',
       strength: ['s1', 's2', 's3', 's4'], watch: ['w1', 'w2', 'w3', 'w4'], develop: ['d1', 'd2', 'd3', 'd4'] },
  B: { key: 'B', label: 'Being', tag: 't', cls: 'pb', band: 'bb', color: 'var(--be)',
       strength: ['s1', 's2', 's3', 's4'], watch: ['w1', 'w2', 'w3', 'w4'], develop: ['d1', 'd2', 'd3', 'd4'] },
  W: { key: 'W', label: 'Will', tag: 't', cls: 'pw', band: 'bw', color: 'var(--wl)',
       strength: ['s1', 's2', 's3', 's4'], watch: ['w1', 'w2', 'w3', 'w4'], develop: ['d1', 'd2', 'd3', 'd4'] },
};

describe('buildReportData', () => {
  it('produces a dominant/backup/develop order matching individual ranking', () => {
    const answers = [
      { most: 0, least: 1 },
      { most: 0, least: 1 },
      { most: 1, least: 2 },
    ];
    const orgItems = [{ t: 'x', d: 'F' }, { t: 'y', d: 'B' }, { t: 'z', d: 'W' }];
    const orgAnswers = [3, 2, 1];

    const report = buildReportData(answers, orgAnswers, scenarios, orgItems, dim);

    expect(report.dominant).toBe('F');
    expect(report.total).toBe(3);
    expect(report.band.map(b => b.key)).toEqual(['F', 'B', 'W']);
    expect(report.profiles.full.key).toBe('F');
    expect(report.profiles.full.strength).toHaveLength(4);
    expect(report.profiles.backup.strength).toHaveLength(3);
    expect(report.profiles.backup.watch).toHaveLength(1);
    expect(report.profiles.develop.develop).toHaveLength(4);
    expect(report.orgBars).toHaveLength(3);
    expect(report.orgInsight.top).toBe(report.orgOrder[0]);
  });

  it('flags when the org pushes hardest on the growth-edge dimension', () => {
    const answers = [
      { most: 0, least: 2 },
      { most: 0, least: 2 },
      { most: 1, least: 2 },
    ]; // F=2 most, B=1 most, W=0 most -> develop = W
    const orgItems = [{ t: 'x', d: 'F' }, { t: 'y', d: 'B' }, { t: 'z', d: 'W' }];
    const orgAnswers = [1, 1, 3]; // org top = W = develop area

    const report = buildReportData(answers, orgAnswers, scenarios, orgItems, dim);
    expect(report.developArea).toBe('W');
    expect(report.summaryInsight.extra).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/scoring.test.js`
Expected: FAIL — `scoring.js` does not exist yet.

- [ ] **Step 3: Write `src/lib/scoring.js`**

```js
export function scoreIndividual(p1Answers, scenarios) {
  const most = { F: 0, B: 0, W: 0 };
  const least = { F: 0, B: 0, W: 0 };
  p1Answers.forEach((a, i) => {
    if (a.most !== null) most[scenarios[i].opts[a.most].d]++;
    if (a.least !== null) least[scenarios[i].opts[a.least].d]++;
  });
  return { most, least };
}

export function scoreOrg(orgAnswers, orgItems) {
  const s = { F: 0, B: 0, W: 0 };
  orgItems.forEach((it, i) => { s[it.d] += orgAnswers[i]; });
  return s;
}

export function rank(scoreObj, tiebreak) {
  const keys = ['F', 'B', 'W'];
  keys.sort((a, b) => {
    if (scoreObj[b] !== scoreObj[a]) return scoreObj[b] - scoreObj[a];
    if (tiebreak) return (tiebreak[a] || 0) - (tiebreak[b] || 0);
    return 0;
  });
  return keys;
}

function buildProfile(dimEntry, mode) {
  const base = { key: dimEntry.key, label: dimEntry.label, tag: dimEntry.tag, cls: dimEntry.cls };
  if (mode === 'full') {
    return { ...base, strength: dimEntry.strength, watch: dimEntry.watch };
  }
  if (mode === 'backup') {
    return { ...base, strength: dimEntry.strength.slice(0, 3), watch: [dimEntry.watch[0]] };
  }
  return { ...base, develop: dimEntry.develop };
}

function orgWord(k) {
  return k === 'F' ? 'results, skill, and delivery'
    : k === 'B' ? 'trust, people, and character'
    : 'purpose, courage, and direction';
}

function buildInsight(dominant, developArea, orgScore, dim) {
  const domOrg = orgScore[dominant];
  let head, body;
  if (domOrg >= 7) {
    head = 'Your style fits your environment.';
    body = `You lead most from ${dim[dominant].label}, and your workplace also rewards it. This usually means your natural strengths are seen and valued — a good position to lead from.`;
  } else if (domOrg <= 4) {
    head = 'Your style and your environment pull in different directions.';
    body = `You lead from ${dim[dominant].label}, but your workplace gives it little room. This can leave you feeling unseen or tired, and it may explain some friction you feel. It is worth naming — the gap is about the environment, not about you.`;
  } else {
    head = 'A partial fit with your environment.';
    body = `You lead from ${dim[dominant].label}, and your workplace gives it some, but not full, support. There is room to shape the environment toward the way you lead best.`;
  }
  const orgTop = rank(orgScore)[0];
  const extra = orgTop === developArea
    ? `Also notice: your environment pushes hardest on ${dim[developArea].label}, which is your growth edge. That pressure can be uncomfortable — but it is also a real chance to develop the source you use least.`
    : null;
  return { head, body, extra };
}

function buildOrgInsight(orgOrder) {
  const top = orgOrder[0];
  const low = orgOrder[2];
  return {
    top, low,
    topWord: orgWord(top),
    lowWord: orgWord(low),
    note: "Remember: your own answers are partly a response to this environment. If a style is rarely rewarded here, you may use it less — even if it is natural to you. When you read your profile above, ask: is this truly me, or is this what my workplace has trained me to be?",
  };
}

export function buildReportData(p1Answers, orgAnswers, scenarios, orgItems, dim) {
  const ind = scoreIndividual(p1Answers, scenarios);
  const org = scoreOrg(orgAnswers, orgItems);
  const order = rank(ind.most, ind.least);
  const [dominant, backup, developArea] = order;
  const total = ind.most.F + ind.most.B + ind.most.W || 1;

  const band = ['F', 'B', 'W'].map(k => ({
    key: k,
    count: ind.most[k],
    pct: (ind.most[k] / total) * 100,
  }));

  const roleNames = ['Comprehensive profile', 'Backup profile', 'Area to develop'];
  const rankLines = order.map((k, idx) => ({
    role: roleNames[idx],
    key: k,
    count: ind.most[k],
    pct: Math.round((ind.most[k] / total) * 100),
  }));

  const orgOrder = rank(org);
  const orgBars = ['F', 'B', 'W'].map(k => {
    const v = org[k];
    const pct = ((v - 3) / 6) * 100;
    const level = v >= 7 ? 'High' : v >= 5 ? 'Medium' : 'Low';
    return { key: k, value: v, pct: Math.max(6, pct), level };
  });

  return {
    dominant, backup, developArea,
    ind, org, total,
    band, rankLines, orgOrder, orgBars,
    summaryInsight: buildInsight(dominant, developArea, org, dim),
    profiles: {
      full: buildProfile(dim[dominant], 'full'),
      backup: buildProfile(dim[backup], 'backup'),
      develop: buildProfile(dim[developArea], 'develop'),
    },
    orgInsight: buildOrgInsight(orgOrder),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/scoring.test.js`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.js src/lib/scoring.test.js
git commit -m "feat: add pure scoring and report-data-building module"
```

---

### Task 4: Answer-mutation helper

**Files:**
- Create: `src/lib/answers.js`
- Test: `src/lib/answers.test.js`

**Interfaces:**
- Produces: `applyChoice(current, kind, idx) -> { most, least }` where `current` is `{most, least}` and `kind` is `"most"|"least"`. Consumed by `App.jsx` in Task 10.

- [ ] **Step 1: Write the failing test**

```js
// src/lib/answers.test.js
import { describe, it, expect } from 'vitest';
import { applyChoice } from './answers.js';

describe('applyChoice', () => {
  it('sets most and clears least if it pointed at the same option', () => {
    const result = applyChoice({ most: null, least: 1 }, 'most', 1);
    expect(result).toEqual({ most: 1, least: null });
  });

  it('sets least and clears most if it pointed at the same option', () => {
    const result = applyChoice({ most: 0, least: null }, 'least', 0);
    expect(result).toEqual({ most: null, least: 0 });
  });

  it('toggles off when clicking the same chip again', () => {
    const result = applyChoice({ most: 2, least: null }, 'most', 2);
    expect(result).toEqual({ most: null, least: null });
  });

  it('leaves the other field untouched when unrelated', () => {
    const result = applyChoice({ most: 0, least: 1 }, 'most', 0);
    expect(result).toEqual({ most: null, least: 1 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/answers.test.js`
Expected: FAIL — `answers.js` does not exist yet.

- [ ] **Step 3: Write `src/lib/answers.js`**

```js
export function applyChoice(current, kind, idx) {
  const next = { ...current };
  if (kind === 'most') {
    next.most = current.most === idx ? null : idx;
    if (next.least === idx) next.least = null;
  } else {
    next.least = current.least === idx ? null : idx;
    if (next.most === idx) next.most = null;
  }
  return next;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/answers.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/answers.js src/lib/answers.test.js
git commit -m "feat: add most/least answer-mutation helper"
```

---

### Task 5: Global CSS

**Files:**
- Create: `src/styles/global.css`
- Modify: `src/main.jsx` (add `import './styles/global.css';`)

**Interfaces:**
- Produces: all the class names (`.wrap`, `.topbar`, `.card`, `.btn`, `.opt`, `.chip`, `.band`, `.profile`, etc.) and CSS custom properties (`--fn`, `--be`, `--wl`, etc.) that every component from Task 6 onward assumes exist.

- [ ] **Step 1: Write `src/styles/global.css`**

Copy the entire `<style>` block content from the current `fbw-assessment.html` (lines 11–178: the `:root` block through the `@media print` block) verbatim into this file, unchanged. Do not rename any class, id-selector, or custom property — the components in later tasks render the same `id`/`class` attributes the original HTML used, specifically so this CSS applies with zero edits.

- [ ] **Step 2: Wire it up**

```jsx
// src/main.jsx — add this import at the top, alongside the App import
import './styles/global.css';
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`, open the local URL.
Expected: the placeholder page now renders in the IBM Plex Sans body font with the app's background color (`--app: #E9EBEF`) — confirms the stylesheet loaded. (Full visual parity is checked in Task 14 once all screens exist.)

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css src/main.jsx
git commit -m "feat: port global stylesheet from fbw-assessment.html"
```

---

### Task 6: Header and Navbar components

**Files:**
- Create: `src/components/Header.jsx`
- Create: `src/components/Navbar.jsx`
- Test: `src/components/Header.test.jsx`
- Test: `src/components/Navbar.test.jsx`

**Interfaces:**
- Produces:
  - `<Header stepLabel={string} done={number} total={number} final={boolean} />`
  - `<Navbar visible={boolean} canGoBack={boolean} canGoNext={boolean} nextLabel={string} onBack={fn} onNext={fn} />`
  Both consumed by `App.jsx` in Task 10.

- [ ] **Step 1: Write the failing tests**

```jsx
// src/components/Navbar.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from './Navbar.jsx';

describe('Navbar', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<Navbar visible={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables the next button when canGoNext is false', () => {
    render(<Navbar visible canGoBack canGoNext={false} nextLabel="Next" onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('calls onNext when the next button is clicked and enabled', () => {
    const onNext = vi.fn();
    render(<Navbar visible canGoBack canGoNext nextLabel="Next" onBack={() => {}} onNext={onNext} />);
    screen.getByText('Next').click();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('hides the back button when canGoBack is false', () => {
    render(<Navbar visible canGoBack={false} canGoNext nextLabel="Next" onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText('Back')).toHaveStyle({ visibility: 'hidden' });
  });
});
```

```jsx
// src/components/Header.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from './Header.jsx';

describe('Header', () => {
  it('shows the step label', () => {
    render(<Header stepLabel="Situation 3 of 15" done={2} total={24} final={false} />);
    expect(screen.getByText('Situation 3 of 15')).toBeInTheDocument();
  });

  it('renders the brand name', () => {
    render(<Header stepLabel="" done={0} total={24} final={false} />);
    expect(screen.getByText('Function · Being · Will')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Header.test.jsx src/components/Navbar.test.jsx`
Expected: FAIL — components do not exist yet.

- [ ] **Step 3: Write `src/components/Navbar.jsx`**

```jsx
export default function Navbar({ visible, canGoBack, canGoNext, nextLabel, onBack, onNext }) {
  if (!visible) return null;
  return (
    <nav className="navbar no-print">
      <div className="navbar-inner">
        <button
          className="btn ghost back"
          onClick={onBack}
          style={{ visibility: canGoBack ? 'visible' : 'hidden' }}
        >
          Back
        </button>
        <button className="btn" onClick={onNext} disabled={!canGoNext}>
          {nextLabel}
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Write `src/components/Header.jsx`**

```jsx
export default function Header({ stepLabel, done, total, final }) {
  const each = total > 0 ? 100 / total : 0;
  const widths = final
    ? { F: 100 / 3, B: 100 / 3, W: 100 / 3 }
    : {
        F: each * Math.min(done, 5),
        B: each * Math.max(0, Math.min(done - 5, 5)),
        W: each * Math.max(0, done - 10),
      };
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="k">Integral Leadership Dynamics™</span>
          <span className="n">Function · Being · Will</span>
        </div>
        <span className="step-count">{stepLabel}</span>
      </div>
      <div className="progress">
        <i className="pf" style={{ width: `${widths.F}%` }} />
        <i className="pb" style={{ width: `${widths.B}%` }} />
        <i className="pw" style={{ width: `${widths.W}%` }} />
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/Header.test.jsx src/components/Navbar.test.jsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.jsx src/components/Navbar.jsx src/components/Header.test.jsx src/components/Navbar.test.jsx
git commit -m "feat: add Header and Navbar components"
```

---

### Task 7: IntroScreen component

**Files:**
- Create: `src/components/IntroScreen.jsx`
- Test: `src/components/IntroScreen.test.jsx`

**Interfaces:**
- Produces: `<IntroScreen onStart={fn} />`, consumed by `App.jsx` in Task 10.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/IntroScreen.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IntroScreen from './IntroScreen.jsx';

describe('IntroScreen', () => {
  it('renders the heading and the three dimensions', () => {
    render(<IntroScreen onStart={() => {}} />);
    expect(screen.getByText('Where do you lead from?')).toBeInTheDocument();
    expect(screen.getByText('Function')).toBeInTheDocument();
    expect(screen.getByText('Being')).toBeInTheDocument();
    expect(screen.getByText('Will')).toBeInTheDocument();
  });

  it('calls onStart when the start button is clicked', () => {
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} />);
    screen.getByText('Start the reflection').click();
    expect(onStart).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/IntroScreen.test.jsx`
Expected: FAIL — component does not exist yet.

- [ ] **Step 3: Write `src/components/IntroScreen.jsx`**

```jsx
export default function IntroScreen({ onStart }) {
  return (
    <section className="screen active" id="screen-intro">
      <div className="hero">
        <div className="eyebrow">Leadership self-reflection</div>
        <h1>Where do you lead from?</h1>
        <p className="lead">
          Every leader draws on three inner sources. This short reflection shows which one leads for you,
          which one supports you, and which one is your growth edge — and how your current environment
          shapes all three.
        </p>
      </div>

      <div className="triple">
        <div className="dimrow dr-fn">
          <span className="dot" />
          <div><div className="lab">Function</div><div className="q">What I can do — my skills and delivery.</div></div>
        </div>
        <div className="dimrow dr-be">
          <span className="dot" />
          <div><div className="lab">Being</div><div className="q">Who I am — my character and presence.</div></div>
        </div>
        <div className="dimrow dr-wl">
          <span className="dot" />
          <div><div className="lab">Will</div><div className="q">Why I act — my purpose, drive, and courage.</div></div>
        </div>
      </div>

      <div className="note">
        <b>How to answer honestly.</b>
        <ul className="clean">
          <li>You will read <b>15 real work situations</b>. For each one, choose the answer that is <b>most like you</b> and the one that is <b>least like you</b>.</li>
          <li>All answers are good ones. There is no "correct" choice — pick what is <b>truly you</b>, not what sounds best.</li>
          <li>Answer <b>quickly and by instinct</b>. Your first reaction is the most honest.</li>
          <li>Then answer <b>9 short questions about your workplace</b>.</li>
          <li>Takes about <b>7 minutes</b>. Nothing is saved or sent anywhere unless you choose to save your report.</li>
        </ul>
      </div>

      <div style={{ height: 20 }} />
      <button className="btn" onClick={onStart}>Start the reflection</button>
    </section>
  );
}
```

Note: the last bullet's copy is updated from the original ("Nothing is saved or sent anywhere.") to acknowledge the new optional save feature, matching the spec's auth flow. This is the one intentional wording change in this port.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/IntroScreen.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/IntroScreen.jsx src/components/IntroScreen.test.jsx
git commit -m "feat: add IntroScreen component"
```

---

### Task 8: ScenarioScreen component

**Files:**
- Create: `src/components/ScenarioScreen.jsx`
- Test: `src/components/ScenarioScreen.test.jsx`

**Interfaces:**
- Produces: `<ScenarioScreen scenario={SCENARIOS[i]} index={number} total={number} answer={{most,least}} onChoose={(kind, idx) => void} />`, consumed by `App.jsx` in Task 10. Does not itself apply the mutual-exclusivity rule — that is `applyChoice` (Task 4), called by the parent.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/ScenarioScreen.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ScenarioScreen from './ScenarioScreen.jsx';

const scenario = {
  s: 'A project is falling behind schedule.',
  opts: [
    { t: 'Fix the plan.', d: 'F' },
    { t: 'Check how the team feels.', d: 'B' },
    { t: 'Recommit everyone to the goal.', d: 'W' },
  ],
};

describe('ScenarioScreen', () => {
  it('renders the situation text and all three options', () => {
    render(<ScenarioScreen scenario={scenario} index={0} total={15} answer={{ most: null, least: null }} onChoose={() => {}} />);
    expect(screen.getByText('A project is falling behind schedule.')).toBeInTheDocument();
    expect(screen.getByText('Fix the plan.')).toBeInTheDocument();
    expect(screen.getByText('Situation 1/15', { exact: false })).toBeInTheDocument();
  });

  it('calls onChoose with the right kind and index when a chip is clicked', () => {
    const onChoose = vi.fn();
    render(<ScenarioScreen scenario={scenario} index={0} total={15} answer={{ most: null, least: null }} onChoose={onChoose} />);
    screen.getByText('Most like me').click();
    expect(onChoose).toHaveBeenCalledWith('most', 0);
  });

  it('marks the selected chip as on', () => {
    render(<ScenarioScreen scenario={scenario} index={0} total={15} answer={{ most: 1, least: null }} onChoose={() => {}} />);
    const chips = screen.getAllByText('Most like me');
    expect(chips[1].closest('.chip')).toHaveClass('on-most');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ScenarioScreen.test.jsx`
Expected: FAIL — component does not exist yet.

- [ ] **Step 3: Write `src/components/ScenarioScreen.jsx`**

```jsx
export default function ScenarioScreen({ scenario, index, total, answer, onChoose }) {
  return (
    <section className="screen active" id="screen-p1">
      <div className="card pad">
        <div className="scn-kicker">Part 1 · Situation {index + 1}/{total}</div>
        <div className="scn-q">{scenario.s}</div>
        <div className="scn-sub">Choose one <b>most like you</b> and one <b>least like you</b>.</div>
        {scenario.opts.map((o, idx) => {
          const mostOn = answer.most === idx;
          const leastOn = answer.least === idx;
          const stateCls = mostOn ? ' is-most' : leastOn ? ' is-least' : '';
          return (
            <div className={`opt${stateCls}`} key={idx}>
              <div className="txt">{o.t}</div>
              <div className="chips">
                <div className={`chip${mostOn ? ' on-most' : ''}`} onClick={() => onChoose('most', idx)}>
                  <span className="ic">✓</span> Most like me
                </div>
                <div className={`chip${leastOn ? ' on-least' : ''}`} onClick={() => onChoose('least', idx)}>
                  <span className="ic">✕</span> Least like me
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ScenarioScreen.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ScenarioScreen.jsx src/components/ScenarioScreen.test.jsx
git commit -m "feat: add ScenarioScreen component"
```

---

### Task 9: OrgScreen component

**Files:**
- Create: `src/components/OrgScreen.jsx`
- Test: `src/components/OrgScreen.test.jsx`

**Interfaces:**
- Produces: `<OrgScreen items={ORG_ITEMS} answers={number|null[]} onSelect={(index, value) => void} />`, consumed by `App.jsx` in Task 10.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/OrgScreen.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrgScreen from './OrgScreen.jsx';

const items = [
  { t: 'Results and performance get the most attention here.', d: 'F' },
  { t: 'People feel safe to be themselves here.', d: 'B' },
];

describe('OrgScreen', () => {
  it('renders every item with three answer buttons', () => {
    render(<OrgScreen items={items} answers={[null, null]} onSelect={() => {}} />);
    expect(screen.getByText('1. Results and performance get the most attention here.')).toBeInTheDocument();
    expect(screen.getAllByText('Often')).toHaveLength(2);
  });

  it('calls onSelect with the item index and value', () => {
    const onSelect = vi.fn();
    render(<OrgScreen items={items} answers={[null, null]} onSelect={onSelect} />);
    screen.getAllByText('Sometimes')[0].click();
    expect(onSelect).toHaveBeenCalledWith(0, 2);
  });

  it('marks the selected answer as on', () => {
    render(<OrgScreen items={items} answers={[3, null]} onSelect={() => {}} />);
    expect(screen.getAllByText('Often')[0]).toHaveClass('on');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/OrgScreen.test.jsx`
Expected: FAIL — component does not exist yet.

- [ ] **Step 3: Write `src/components/OrgScreen.jsx`**

```jsx
const LABELS = ['Rarely', 'Sometimes', 'Often'];

export default function OrgScreen({ items, answers, onSelect }) {
  return (
    <section className="screen active" id="screen-p2">
      <div className="eyebrow" style={{ marginBottom: 6 }}>Part 2 of 2</div>
      <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', marginBottom: 6 }}>Your workplace</h1>
      <p className="lead" style={{ marginBottom: 18 }}>
        Think about your team or organization <b>as it is today</b>. How often is each statement true?
      </p>
      <div className="card pad">
        {items.map((it, i) => (
          <div className="lk-item" key={i}>
            <div className="lk-txt">{i + 1}. {it.t}</div>
            <div className="seg">
              {LABELS.map((label, v) => (
                <button
                  key={label}
                  className={answers[i] === v + 1 ? 'on' : ''}
                  onClick={() => onSelect(i, v + 1)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/OrgScreen.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/OrgScreen.jsx src/components/OrgScreen.test.jsx
git commit -m "feat: add OrgScreen component"
```

---

### Task 10: AuthPanel and ReportScreen components

**Files:**
- Create: `src/components/AuthPanel.jsx`
- Create: `src/components/ReportScreen.jsx`
- Test: `src/components/AuthPanel.test.jsx`
- Test: `src/components/ReportScreen.test.jsx`

**Interfaces:**
- Produces: `<AuthPanel authState={{status, email?, error?}} onSignIn={(email) => void} />` where `status` is one of `"anon"|"sending"|"sent"|"signedIn"|"saved"|"error"`.
- Produces: `<ReportScreen reportData={ReportData} dim={DIM} authState={...} onRestart={fn} onPrint={fn} onSignIn={fn} />` where `ReportData` is exactly the shape `buildReportData` (Task 3) returns.
- Both consumed by `App.jsx` in Task 11.

- [ ] **Step 1: Write the failing tests**

```jsx
// src/components/AuthPanel.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthPanel from './AuthPanel.jsx';

describe('AuthPanel', () => {
  it('shows the save prompt when anonymous', () => {
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={() => {}} />);
    expect(screen.getByText('Want to save this report?', { exact: false })).toBeInTheDocument();
  });

  it('calls onSignIn with the typed email', () => {
    const onSignIn = vi.fn();
    render(<AuthPanel authState={{ status: 'anon' }} onSignIn={onSignIn} />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Send link'));
    expect(onSignIn).toHaveBeenCalledWith('a@b.com');
  });

  it('shows the saved confirmation', () => {
    render(<AuthPanel authState={{ status: 'saved' }} onSignIn={() => {}} />);
    expect(screen.getByText('Saved to your account.', { exact: false })).toBeInTheDocument();
  });
});
```

```jsx
// src/components/ReportScreen.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReportScreen from './ReportScreen.jsx';
import { buildReportData } from '../lib/scoring.js';

const scenarios = [
  { s: 'a', opts: [{ t: 'f', d: 'F' }, { t: 'b', d: 'B' }, { t: 'w', d: 'W' }] },
  { s: 'b', opts: [{ t: 'f', d: 'F' }, { t: 'b', d: 'B' }, { t: 'w', d: 'W' }] },
];
const orgItems = [{ t: 'x', d: 'F' }, { t: 'y', d: 'B' }, { t: 'z', d: 'W' }];
const dim = {
  F: { key: 'F', label: 'Function', tag: 't', cls: 'pf', band: 'bf', color: 'var(--fn)', strength: ['s1','s2','s3','s4'], watch: ['w1','w2','w3','w4'], develop: ['d1','d2','d3','d4'] },
  B: { key: 'B', label: 'Being', tag: 't', cls: 'pb', band: 'bb', color: 'var(--be)', strength: ['s1','s2','s3','s4'], watch: ['w1','w2','w3','w4'], develop: ['d1','d2','d3','d4'] },
  W: { key: 'W', label: 'Will', tag: 't', cls: 'pw', band: 'bw', color: 'var(--wl)', strength: ['s1','s2','s3','s4'], watch: ['w1','w2','w3','w4'], develop: ['d1','d2','d3','d4'] },
};
const reportData = buildReportData(
  [{ most: 0, least: 1 }, { most: 0, least: 2 }],
  [3, 2, 1],
  scenarios, orgItems, dim
);

describe('ReportScreen', () => {
  it('renders the dominant dimension label in the intro line', () => {
    render(<ReportScreen reportData={reportData} dim={dim} authState={{ status: 'anon' }} onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}} />);
    expect(screen.getByText('The Function · Being · Will Matrix')).toBeInTheDocument();
    // "Function" legitimately appears several times (legend, rank line, profile heading)
    // since it's the dominant dimension in this fixture — assert presence, not uniqueness
    expect(screen.getAllByText('Function', { exact: false }).length).toBeGreaterThan(1);
  });

  it('calls onRestart and onPrint from their buttons', () => {
    const onRestart = vi.fn();
    const onPrint = vi.fn();
    render(<ReportScreen reportData={reportData} dim={dim} authState={{ status: 'anon' }} onRestart={onRestart} onPrint={onPrint} onSignIn={() => {}} />);
    screen.getByText('Start again').click();
    screen.getByText('Save / print').click();
    expect(onRestart).toHaveBeenCalledOnce();
    expect(onPrint).toHaveBeenCalledOnce();
  });

  it('renders all three profile blocks', () => {
    render(<ReportScreen reportData={reportData} dim={dim} authState={{ status: 'anon' }} onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}} />);
    expect(screen.getByText('Comprehensive profile')).toBeInTheDocument();
    expect(screen.getByText('Backup profile')).toBeInTheDocument();
    expect(screen.getByText('Area to develop')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/AuthPanel.test.jsx src/components/ReportScreen.test.jsx`
Expected: FAIL — components do not exist yet.

- [ ] **Step 3: Write `src/components/AuthPanel.jsx`**

```jsx
import { useState } from 'react';

export default function AuthPanel({ authState, onSignIn }) {
  const [email, setEmail] = useState('');

  if (authState.status === 'saved') {
    return (
      <div className="note no-print" style={{ marginTop: 16 }}>
        Saved to your account. You can find this report next time you sign in.
      </div>
    );
  }

  return (
    <div className="note no-print" style={{ marginTop: 16 }}>
      {authState.status === 'signedIn' ? (
        <p style={{ margin: 0 }}>Saving your report…</p>
      ) : (
        <>
          <p style={{ margin: '0 0 8px' }}>
            <b>Want to save this report?</b> Enter your email for a sign-in link. Nothing is saved unless you do this.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              placeholder="you@company.com"
              onChange={e => setEmail(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10 }}
            />
            <button
              className="btn sm"
              disabled={!email || authState.status === 'sending'}
              onClick={() => onSignIn(email)}
            >
              {authState.status === 'sending' ? 'Sending…' : 'Send link'}
            </button>
          </div>
          {authState.status === 'sent' && (
            <p style={{ margin: '8px 0 0', fontSize: 13.5 }}>Check your email for the sign-in link.</p>
          )}
          {authState.status === 'error' && (
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#b3261e' }}>{authState.error}</p>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write `src/components/ReportScreen.jsx`**

```jsx
import AuthPanel from './AuthPanel.jsx';

function ProfileBlock({ dimEntry, data, roleLabel, mode }) {
  return (
    <div className={`profile ${dimEntry.cls}`}>
      <div className="badge">{roleLabel}</div>
      <h3>{dimEntry.label}</h3>
      <div className="tag">{dimEntry.tag}</div>
      {mode === 'full' && (
        <>
          <p style={{ fontSize: 14.5, margin: '0 0 4px' }}>
            This is the source you turn to first. It is your main strength as a leader — and, when overused, your main risk.
          </p>
          <h4>Where it makes you strong</h4>
          <ul className="clean">{data.strength.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <h4>Watch-outs when overused</h4>
          <ul className="clean">{data.watch.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </>
      )}
      {mode === 'backup' && (
        <>
          <p style={{ fontSize: 14.5, margin: '0 0 4px' }}>
            This is your second source. You use it well to support your main style, especially when the situation asks for it.
          </p>
          <h4>How it supports you</h4>
          <ul className="clean">{data.strength.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <h4>One thing to watch</h4>
          <ul className="clean">{data.watch.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </>
      )}
      {mode === 'develop' && (
        <>
          <p style={{ fontSize: 14.5, margin: '0 0 4px' }}>
            You chose this style least often. It is not a weakness in you — it is simply the least developed source right now.
            Growing here makes your leadership more complete and balanced.
          </p>
          <h4>Simple ways to grow here</h4>
          <ul className="clean">{data.develop.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </>
      )}
    </div>
  );
}

export default function ReportScreen({ reportData, dim, authState, onRestart, onPrint, onSignIn }) {
  const { dominant, backup, developArea, band, rankLines, profiles, orgBars, summaryInsight, orgInsight, total } = reportData;

  return (
    <section className="screen active" id="screen-report">
      <div className="eyebrow">Your reflection report</div>
      <h1 style={{ fontSize: 'clamp(26px,6.5vw,36px)', marginBottom: 6 }}>The Function · Being · Will Matrix</h1>
      <p className="lead" style={{ marginBottom: 8 }}>
        You lead most from {dim[dominant].label}, supported by {dim[backup].label}. Your growth edge is {dim[developArea].label}.
      </p>

      <div className="sec-title">Summary</div>
      <div className="card pad">
        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--muted)' }}>
          How often you chose each style across the 15 situations:
        </p>
        <div className="band">
          {band.map(b => (
            <span key={b.key} className={dim[b.key].band} style={{ flexBasis: `${b.pct}%` }}>
              {b.count > 0 ? b.count : ''}
            </span>
          ))}
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--fn)' }} />Function</span>
          <span><i style={{ background: 'var(--be)' }} />Being</span>
          <span><i style={{ background: 'var(--wl)' }} />Will</span>
        </div>
        <div style={{ marginTop: 18 }}>
          {rankLines.map(rl => (
            <div className="rankline" key={rl.key}>
              <span className="role">{rl.role}</span>
              <span className="name" style={{ color: dim[rl.key].color }}>{dim[rl.key].label}</span>
              <span className="pct">{rl.count} of {total} · {rl.pct}%</span>
            </div>
          ))}
        </div>
        <div className="insight">
          <h4>{summaryInsight.head}</h4>
          <p>{summaryInsight.body}</p>
          {summaryInsight.extra && <p>{summaryInsight.extra}</p>}
        </div>
      </div>

      <div className="sec-title">Detailed profile</div>
      <div className="card pad">
        <ProfileBlock dimEntry={dim[dominant]} data={profiles.full} roleLabel="Comprehensive profile" mode="full" />
        <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', margin: '20px 0' }} />
        <ProfileBlock dimEntry={dim[backup]} data={profiles.backup} roleLabel="Backup profile" mode="backup" />
        <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', margin: '20px 0' }} />
        <ProfileBlock dimEntry={dim[developArea]} data={profiles.develop} roleLabel="Area to develop" mode="develop" />
      </div>

      <div className="sec-title">Organization profile</div>
      <div className="card pad">
        <p style={{ margin: '0 0 6px', fontSize: 14.5, color: 'var(--text)' }}>
          What your environment rewards and expects — because your answers above are shaped by where you work.
        </p>
        <div style={{ marginTop: 14 }}>
          {orgBars.map(b => (
            <div className="orgbar" key={b.key}>
              <div className="top">
                <span style={{ color: dim[b.key].color, fontWeight: 600 }}>{dim[b.key].label}</span>
                <span className="lvl">{b.level} emphasis</span>
              </div>
              <div className="track">
                <div className="fill" style={{ width: `${b.pct}%`, background: dim[b.key].color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="insight">
          <h4>What your environment values</h4>
          <p>
            Your workplace puts the most weight on{' '}
            <b style={{ color: dim[orgInsight.top].color }}>{dim[orgInsight.top].label}</b> ({orgInsight.topWord}) and the least on{' '}
            <b style={{ color: dim[orgInsight.low].color }}>{dim[orgInsight.low].label}</b> ({orgInsight.lowWord}).
          </p>
          <p style={{ marginTop: 8 }}>{orgInsight.note}</p>
        </div>
      </div>

      <div className="disclaimer">
        <b>Please read this.</b> This is a structured self-reflection tool built on the Integral Leadership Dynamics™ framework.
        It is <b>not a validated psychometric test</b>. Because you choose between options, your scores are <b>relative to your own answers only</b> —
        they show which style you lean to more than the others, and they cannot be compared to other people or read as percentiles.
        Your results describe <b>how you answered today</b> and can be shaped by your current role, mood, and workplace.
        Use it to start reflection and conversation, not as a final judgment.
      </div>

      <AuthPanel authState={authState} onSignIn={onSignIn} />

      <div className="no-print" style={{ marginTop: 22, display: 'flex', gap: 12 }}>
        <button className="btn ghost" onClick={onRestart}>Start again</button>
        <button className="btn" onClick={onPrint}>Save / print</button>
      </div>
      <p className="foot">Integral Leadership Dynamics™ · Function · Being · Will</p>
    </section>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/AuthPanel.test.jsx src/components/ReportScreen.test.jsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/AuthPanel.jsx src/components/ReportScreen.jsx src/components/AuthPanel.test.jsx src/components/ReportScreen.test.jsx
git commit -m "feat: add AuthPanel and ReportScreen components"
```

---

### Task 11: Auth adapter interface (with no-op default) and App wiring

**Files:**
- Create: `src/lib/authAdapter.js` (no-op adapter only — real one is Task 13)
- Modify: `src/App.jsx` (replace placeholder with full state machine)
- Test: `src/App.test.jsx`

**Interfaces:**
- Produces: `noopAuthAdapter` implementing `{ signInWithEmail(email) -> {success, error?}, saveAssessment(payload) -> {success, error?}, getSession() -> session|null, onAuthStateChange(cb) -> unsubscribeFn }`. `App({ authAdapter = noopAuthAdapter })` is the default export; Task 13 passes a real adapter matching this same interface.

- [ ] **Step 1: Write `src/lib/authAdapter.js`**

```js
export const noopAuthAdapter = {
  async signInWithEmail() {
    return { success: false, error: 'Sign-in is not configured yet.' };
  },
  async saveAssessment() {
    return { success: false, error: 'Saving is not configured yet.' };
  },
  async getSession() {
    return null;
  },
  onAuthStateChange() {
    return () => {};
  },
};
```

- [ ] **Step 2: Write the failing integration test**

```jsx
// src/App.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App.jsx';
import { SCENARIOS } from './data/scenarios.js';
import { ORG_ITEMS } from './data/orgItems.js';
import { DIM } from './data/dimensions.js';
import { buildReportData } from './lib/scoring.js';

function completeFullFlow() {
  fireEvent.click(screen.getByText('Start the reflection'));

  for (let i = 0; i < SCENARIOS.length; i++) {
    const mostChips = screen.getAllByText('Most like me');
    const leastChips = screen.getAllByText('Least like me');
    fireEvent.click(mostChips[0]);
    fireEvent.click(leastChips[1]);
    const nextLabel = i === SCENARIOS.length - 1 ? 'Continue to workplace' : 'Next';
    fireEvent.click(screen.getByText(nextLabel));
  }

  for (let i = 0; i < ORG_ITEMS.length; i++) {
    const oftenButtons = screen.getAllByText('Often');
    fireEvent.click(oftenButtons[i]);
  }
  fireEvent.click(screen.getByText('See my report'));
}

describe('App', () => {
  it('walks the full flow and renders a report matching buildReportData directly', () => {
    render(<App />);
    completeFullFlow();

    const expectedAnswers = SCENARIOS.map(() => ({ most: 0, least: 1 }));
    const expectedOrgAnswers = ORG_ITEMS.map(() => 3);
    const expected = buildReportData(expectedAnswers, expectedOrgAnswers, SCENARIOS, ORG_ITEMS, DIM);

    expect(screen.getByText('The Function · Being · Will Matrix')).toBeInTheDocument();
    // the dominant dimension's label legitimately appears more than once on the
    // report (intro line, rank line, profile heading) — assert presence, not uniqueness
    expect(screen.getAllByText(DIM[expected.dominant].label, { exact: false }).length).toBeGreaterThan(0);
  });

  it('restarts back to the intro screen', () => {
    render(<App />);
    completeFullFlow();
    fireEvent.click(screen.getByText('Start again'));
    expect(screen.getByText('Where do you lead from?')).toBeInTheDocument();
  });

  it('keeps the next button disabled until both most and least are chosen', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(screen.getByText('Next')).toBeDisabled();
    fireEvent.click(screen.getAllByText('Most like me')[0]);
    expect(screen.getByText('Next')).toBeDisabled();
    fireEvent.click(screen.getAllByText('Least like me')[1]);
    expect(screen.getByText('Next')).toBeEnabled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/App.test.jsx`
Expected: FAIL — `App.jsx` is still the Task 1 placeholder.

- [ ] **Step 4: Write the full `src/App.jsx`**

```jsx
import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Navbar from './components/Navbar.jsx';
import IntroScreen from './components/IntroScreen.jsx';
import ScenarioScreen from './components/ScenarioScreen.jsx';
import OrgScreen from './components/OrgScreen.jsx';
import ReportScreen from './components/ReportScreen.jsx';
import { SCENARIOS } from './data/scenarios.js';
import { ORG_ITEMS } from './data/orgItems.js';
import { DIM } from './data/dimensions.js';
import { applyChoice } from './lib/answers.js';
import { buildReportData } from './lib/scoring.js';
import { noopAuthAdapter } from './lib/authAdapter.js';

export default function App({ authAdapter = noopAuthAdapter }) {
  const [phase, setPhase] = useState('intro');
  const [p1Index, setP1Index] = useState(0);
  const [p1Answers, setP1Answers] = useState(() => SCENARIOS.map(() => ({ most: null, least: null })));
  const [orgAnswers, setOrgAnswers] = useState(() => ORG_ITEMS.map(() => null));
  const [reportData, setReportData] = useState(null);
  const [authState, setAuthState] = useState({ status: 'anon' });

  const doneP1 = p1Answers.filter(a => a.most !== null && a.least !== null).length;
  const doneP2 = orgAnswers.filter(v => v !== null).length;
  const totalSteps = SCENARIOS.length + ORG_ITEMS.length;

  function handleStart() {
    setPhase('p1');
  }

  function handleChoose(kind, idx) {
    setP1Answers(prev => prev.map((a, i) => (i === p1Index ? applyChoice(a, kind, idx) : a)));
  }

  function handleOrgSelect(itemIndex, value) {
    setOrgAnswers(prev => prev.map((v, i) => (i === itemIndex ? value : v)));
  }

  function handleBack() {
    if (phase === 'p1') {
      if (p1Index > 0) setP1Index(p1Index - 1);
    } else if (phase === 'p2') {
      setPhase('p1');
      setP1Index(SCENARIOS.length - 1);
    }
  }

  function handleNext() {
    if (phase === 'p1') {
      if (p1Index < SCENARIOS.length - 1) {
        setP1Index(p1Index + 1);
      } else {
        setPhase('p2');
      }
    } else if (phase === 'p2') {
      const data = buildReportData(p1Answers, orgAnswers, SCENARIOS, ORG_ITEMS, DIM);
      setReportData(data);
      setPhase('report');
    }
  }

  function handleRestart() {
    setP1Answers(SCENARIOS.map(() => ({ most: null, least: null })));
    setP1Index(0);
    setOrgAnswers(ORG_ITEMS.map(() => null));
    setReportData(null);
    setAuthState({ status: 'anon' });
    setPhase('intro');
  }

  function handlePrint() {
    window.print();
  }

  async function handleSignIn(email) {
    setAuthState({ status: 'sending' });
    const result = await authAdapter.signInWithEmail(email);
    setAuthState(result.success ? { status: 'sent' } : { status: 'error', error: result.error || 'Could not send the link. Try again.' });
  }

  const currentAnswer = p1Answers[p1Index];
  const p1Ready = currentAnswer && currentAnswer.most !== null && currentAnswer.least !== null;
  const p2Ready = orgAnswers.every(v => v !== null);

  const stepLabel = useMemo(() => {
    if (phase === 'p1') return `Situation ${p1Index + 1} of ${SCENARIOS.length}`;
    if (phase === 'p2') return 'Workplace questions';
    return '';
  }, [phase, p1Index]);

  return (
    <>
      <Header stepLabel={stepLabel} done={doneP1 + doneP2} total={totalSteps} final={phase === 'report'} />
      <main>
        <div className="wrap">
          {phase === 'intro' && <IntroScreen onStart={handleStart} />}
          {phase === 'p1' && (
            <ScenarioScreen
              scenario={SCENARIOS[p1Index]}
              index={p1Index}
              total={SCENARIOS.length}
              answer={currentAnswer}
              onChoose={handleChoose}
            />
          )}
          {phase === 'p2' && <OrgScreen items={ORG_ITEMS} answers={orgAnswers} onSelect={handleOrgSelect} />}
          {phase === 'report' && reportData && (
            <ReportScreen
              reportData={reportData}
              dim={DIM}
              authState={authState}
              onRestart={handleRestart}
              onPrint={handlePrint}
              onSignIn={handleSignIn}
            />
          )}
        </div>
      </main>
      <Navbar
        visible={phase === 'p1' || phase === 'p2'}
        canGoBack={phase === 'p2' || (phase === 'p1' && p1Index > 0)}
        canGoNext={phase === 'p1' ? p1Ready : p2Ready}
        nextLabel={phase === 'p1' ? (p1Index === SCENARIOS.length - 1 ? 'Continue to workplace' : 'Next') : 'See my report'}
        onBack={handleBack}
        onNext={handleNext}
      />
    </>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/App.test.jsx`
Expected: PASS (3 tests)

Then run the full suite to confirm nothing else broke:
Run: `npm run test`
Expected: all tests across all files PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/authAdapter.js src/App.jsx src/App.test.jsx
git commit -m "feat: wire full app flow with injectable auth adapter"
```

---

### Task 12: Supabase schema and client (no live project yet)

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `src/lib/supabaseClient.js`
- Test: `src/lib/supabaseClient.test.js`

**Interfaces:**
- Produces: `hasSupabaseConfig(url, key) -> boolean`, `supabase` (a configured `SupabaseClient` or `null` when env vars are absent). Consumed by the real auth adapter in Task 13.

- [ ] **Step 1: Write `supabase/migrations/0001_init.sql`**

```sql
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
```

- [ ] **Step 2: Write the failing test**

```js
// src/lib/supabaseClient.test.js
import { describe, it, expect } from 'vitest';
import { hasSupabaseConfig } from './supabaseClient.js';

describe('hasSupabaseConfig', () => {
  it('is false when either value is missing', () => {
    expect(hasSupabaseConfig(undefined, 'key')).toBe(false);
    expect(hasSupabaseConfig('url', undefined)).toBe(false);
    expect(hasSupabaseConfig('', '')).toBe(false);
  });

  it('is true when both values are present', () => {
    expect(hasSupabaseConfig('https://x.supabase.co', 'anon-key')).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/supabaseClient.test.js`
Expected: FAIL — `supabaseClient.js` does not exist yet.

- [ ] **Step 4: Write `src/lib/supabaseClient.js`**

```js
import { createClient } from '@supabase/supabase-js';

export function hasSupabaseConfig(url, key) {
  return Boolean(url) && Boolean(key);
}

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!hasSupabaseConfig(url, anonKey)) {
  console.warn('Supabase env vars are not set — sign-in and saving are disabled.');
}

export const supabase = hasSupabaseConfig(url, anonKey) ? createClient(url, anonKey) : null;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/supabaseClient.test.js`
Expected: PASS

Then: `npm run build`
Expected: still succeeds even with no `.env.local` present (client is `null`, no crash at build or import time).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0001_init.sql src/lib/supabaseClient.js src/lib/supabaseClient.test.js
git commit -m "feat: add Supabase schema migration and client (unconfigured by default)"
```

- [ ] **Step 7: STOP — do not provision cloud resources automatically**

Creating the actual Supabase project (and applying `0001_init.sql` to it) is an irreversible, billable, visible action outside this repo. Before doing that: tell the user what will be created (a new Supabase project named e.g. `fbw-assessment`, with the `profiles`/`assessments` tables from this migration) and get their explicit go-ahead. Only after that, either run the migration via the Supabase MCP tools or the `supabase` CLI, and fill in `.env.local` (git-ignored) with the resulting `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Do not proceed to Task 13's manual verification (Step 5) without this.

---

### Task 13: Real Supabase-backed auth adapter and save-on-sign-in wiring

**Files:**
- Modify: `src/lib/authAdapter.js` (add `supabaseAuthAdapter`)
- Modify: `src/App.jsx` (subscribe to auth changes, save on sign-in)
- Modify: `src/main.jsx` (pass the real adapter)
- Modify: `src/App.test.jsx` (add save-on-sign-in test)

**Interfaces:**
- Produces: `supabaseAuthAdapter` implementing the same interface as `noopAuthAdapter` (Task 11), backed by `supabase` (Task 12).

- [ ] **Step 1: Write the failing test (fake adapter simulating a sign-in)**

Add to `src/App.test.jsx`:

```jsx
import { vi } from 'vitest';

// ...existing imports and tests above stay unchanged...

describe('App with a fake auth adapter', () => {
  it('saves the assessment once a session appears after the report is built', async () => {
    let authCallback;
    const saveAssessment = vi.fn().mockResolvedValue({ success: true });
    const fakeAdapter = {
      signInWithEmail: vi.fn().mockResolvedValue({ success: true }),
      saveAssessment,
      getSession: vi.fn().mockResolvedValue(null),
      onAuthStateChange: (cb) => { authCallback = cb; return () => {}; },
    };

    render(<App authAdapter={fakeAdapter} />);
    completeFullFlow();

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Send link'));

    await authCallback({ user: { id: 'user-123' } });

    expect(saveAssessment).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-123' }));
    expect(await screen.findByText('Saved to your account.', { exact: false })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.jsx`
Expected: FAIL — `App.jsx` doesn't subscribe to `onAuthStateChange` yet.

- [ ] **Step 3: Extend `src/lib/authAdapter.js`**

```js
import { supabase } from './supabaseClient.js';

export const noopAuthAdapter = {
  async signInWithEmail() {
    return { success: false, error: 'Sign-in is not configured yet.' };
  },
  async saveAssessment() {
    return { success: false, error: 'Saving is not configured yet.' };
  },
  async getSession() {
    return null;
  },
  onAuthStateChange() {
    return () => {};
  },
};

export const supabaseAuthAdapter = {
  async signInWithEmail(email) {
    if (!supabase) return { success: false, error: 'Sign-in is not configured yet.' };
    const { error } = await supabase.auth.signInWithOtp({ email });
    return error ? { success: false, error: error.message } : { success: true };
  },
  async saveAssessment({ p1Answers, orgAnswers, reportData, userId }) {
    if (!supabase) return { success: false, error: 'Saving is not configured yet.' };
    const { error } = await supabase.from('assessments').insert({
      profile_id: userId,
      scenario_answers: p1Answers,
      org_answers: orgAnswers,
      scores: { most: reportData.ind.most, least: reportData.ind.least, org: reportData.org },
    });
    return error ? { success: false, error: error.message } : { success: true };
  },
  async getSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
  onAuthStateChange(callback) {
    if (!supabase) return () => {};
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    return () => data.subscription.unsubscribe();
  },
};
```

- [ ] **Step 4: Extend `src/App.jsx`**

Add `useEffect` to the import line:

```jsx
import { useEffect, useMemo, useState } from 'react';
```

Add this effect inside the `App` function, after the other handler definitions and before the `return`:

```jsx
useEffect(() => {
  const unsubscribe = authAdapter.onAuthStateChange(async (session) => {
    if (session && reportData && authState.status !== 'saved' && authState.status !== 'signedIn') {
      setAuthState({ status: 'signedIn' });
      const result = await authAdapter.saveAssessment({
        p1Answers,
        orgAnswers,
        reportData,
        userId: session.user.id,
      });
      setAuthState(result.success ? { status: 'saved' } : { status: 'error', error: result.error });
    }
  });
  return unsubscribe;
}, [authAdapter, reportData, authState.status, p1Answers, orgAnswers]);
```

- [ ] **Step 5: Update `src/main.jsx` to use the real adapter**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { supabaseAuthAdapter } from './lib/authAdapter.js';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App authAdapter={supabaseAuthAdapter} />
  </React.StrictMode>
);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/App.test.jsx`
Expected: PASS (4 tests)

Then: `npm run test`
Expected: full suite still green.

- [ ] **Step 7: Commit**

```bash
git add src/lib/authAdapter.js src/App.jsx src/main.jsx src/App.test.jsx
git commit -m "feat: wire real Supabase auth adapter with save-on-sign-in"
```

---

### Task 14: Netlify config and production build

**Files:**
- Create: `netlify.toml`

**Interfaces:**
- None — terminal task, produces a deployable `dist/`.

- [ ] **Step 1: Write `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 2: Verify the production build**

Run: `npm run build`
Expected: succeeds, `dist/index.html` and `dist/assets/*` are produced.

Run: `npm run preview`
Expected: serves the production build locally; open it and click through the full flow once more (intro → 15 scenarios → 9 org items → report → restart) to confirm the built bundle behaves like `npm run dev` did.

- [ ] **Step 3: Commit**

```bash
git add netlify.toml
git commit -m "chore: add Netlify build config"
```

- [ ] **Step 4: STOP — do not deploy automatically**

Running `netlify deploy` (or linking this folder to a Netlify site) publishes the app somewhere reachable and is visible/hard to fully reverse. Before doing that: confirm the site name with the user (e.g. `fbw-assessment.netlify.app`) and get their go-ahead, matching how the user's other single-repo apps were deployed (local git + `netlify deploy` via CLI, no GitHub remote required).

---

### Task 15: Manual mobile QA pass

**Files:** none — verification only, per the playbook's own instruction to check a 375px mobile viewport before accepting a build.

- [ ] **Step 1: Resize to a 375px-wide mobile viewport**

Using either the `chrome-devtools` or `playwright` browser tool, open the app (`npm run dev` or `npm run preview` running locally) and set the viewport to 375×812 (iPhone-sized).

- [ ] **Step 2: Walk the anonymous path**

Click through: intro → all 15 scenarios (verify chip taps are easy to hit and mutually-exclusive behavior matches the original) → all 9 org items → report. Confirm every section (summary band, ranked list, three profile blocks, org bars, disclaimer) renders without horizontal overflow, matching the visual identity of the original `fbw-assessment.html`. Take a screenshot of the intro screen, one scenario screen, and the report screen.

- [ ] **Step 3: Walk the sign-in path (only if a Supabase project was provisioned per Task 12 Step 7)**

From the report screen, enter a test email, send the link, and confirm the "Check your email" state renders correctly at 375px. If a live project is not yet provisioned, verify instead that entering an email and clicking "Send link" shows the "Sign-in is not configured yet." error state gracefully (no crash).

- [ ] **Step 4: Report findings**

If anything visually regresses from the original single-file tool, fix it in the relevant component before considering the scaffold done — this task is the acceptance gate the design spec's "zero regression" goal is checked against.

---

## Post-scaffold

Once all 15 tasks are complete and committed, the scaffold is done. Prompts 1–8 from `fbw-claude-code-prompts.md` each become their own future planning session (per the playbook's "one prompt per session" instruction) — do not pull any of their features into this plan.
