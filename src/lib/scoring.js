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
