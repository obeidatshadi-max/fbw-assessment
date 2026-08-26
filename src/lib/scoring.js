import { L, t, tf } from '../i18n/translations.js';

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

function orgWord(k, lang) {
  return t(lang, `report.orgWord.${k}`);
}

function buildInsight(dominant, developArea, orgScore, dim, lang) {
  const domOrg = orgScore[dominant];
  const domLabel = L(dim[dominant].label, lang);
  let head, body;
  if (domOrg >= 7) {
    head = t(lang, 'report.insightFitHead');
    body = tf(lang, 'report.insightFitBody', { dom: domLabel });
  } else if (domOrg <= 4) {
    head = t(lang, 'report.insightGapHead');
    body = tf(lang, 'report.insightGapBody', { dom: domLabel });
  } else {
    head = t(lang, 'report.insightPartialHead');
    body = tf(lang, 'report.insightPartialBody', { dom: domLabel });
  }
  const orgTop = rank(orgScore)[0];
  const extra = orgTop === developArea
    ? tf(lang, 'report.insightExtra', { dev: L(dim[developArea].label, lang) })
    : null;
  return { head, body, extra };
}

function buildOrgInsight(orgOrder, lang) {
  const top = orgOrder[0];
  const low = orgOrder[2];
  return {
    top, low,
    topWord: orgWord(top, lang),
    lowWord: orgWord(low, lang),
    note: t(lang, 'report.orgNote'),
  };
}

export function buildReportData(p1Answers, orgAnswers, scenarios, orgItems, dim, lang = 'en') {
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

  const roleNames = [t(lang, 'report.roleFull'), t(lang, 'report.roleBackup'), t(lang, 'report.roleDevelop')];
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
    const level = v >= 7 ? t(lang, 'report.levelHigh') : v >= 5 ? t(lang, 'report.levelMedium') : t(lang, 'report.levelLow');
    return { key: k, value: v, pct: Math.max(6, pct), level };
  });

  return {
    dominant, backup, developArea,
    ind, org, total,
    band, rankLines, orgOrder, orgBars,
    summaryInsight: buildInsight(dominant, developArea, org, dim, lang),
    profiles: {
      full: buildProfile(dim[dominant], 'full'),
      backup: buildProfile(dim[backup], 'backup'),
      develop: buildProfile(dim[developArea], 'develop'),
    },
    orgInsight: buildOrgInsight(orgOrder, lang),
  };
}
