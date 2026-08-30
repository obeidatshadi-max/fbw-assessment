import { describe, it, expect } from 'vitest';
import { SCENARIO_SETS, DRAFT_ROLE_IDS, getScenariosForRole, isDraftRole, assertBalancedScenarios } from './scenarioSets.js';
import { ROLES, DEFAULT_ROLE } from './roles.js';
import { L, LANGS } from '../i18n/translations.js';

describe('SCENARIO_SETS', () => {
  it('every set has 15 scenarios, each with exactly one F, one B, one W option', () => {
    Object.entries(SCENARIO_SETS).forEach(([roleId, scenarios]) => {
      expect(() => assertBalancedScenarios(scenarios, roleId)).not.toThrow();
    });
  });

  it('every scenario and option in every set has en/ar text', () => {
    Object.entries(SCENARIO_SETS).forEach(([roleId, scenarios]) => {
      scenarios.forEach((sc, i) => {
        LANGS.forEach(lang => expect(L(sc.s, lang), `${roleId} scenario ${i} s.${lang}`).toBeTruthy());
        sc.opts.forEach((o, j) => {
          LANGS.forEach(lang => expect(L(o.t, lang), `${roleId} scenario ${i} opt ${j} t.${lang}`).toBeTruthy());
        });
      });
    });
  });

  it('rejects a set with an unbalanced scenario', () => {
    const bad = [{ s: { en: 'x', ar: 'x' }, opts: [
      { t: { en: 'a', ar: 'a' }, d: 'F' },
      { t: { en: 'b', ar: 'b' }, d: 'F' },
      { t: { en: 'c', ar: 'c' }, d: 'W' },
    ] }];
    expect(() => assertBalancedScenarios(bad.concat(Array(14).fill(bad[0])), 'bad set')).toThrow(/one F, one B, one W/);
  });
});

describe('ROLES', () => {
  it('has a unique id and a full label for every role, including DEFAULT_ROLE', () => {
    const ids = ROLES.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_ROLE);
    ROLES.forEach(r => {
      LANGS.forEach(lang => expect(L(r.label, lang), `${r.id} label.${lang}`).toBeTruthy());
    });
  });
});

describe('getScenariosForRole', () => {
  it('returns the drafted set for a role that has one', () => {
    expect(getScenariosForRole('marketing')).toBe(SCENARIO_SETS.marketing);
  });

  it('falls back to the general set for an unknown role id', () => {
    expect(getScenariosForRole('not_a_real_role')).toBe(SCENARIO_SETS.general);
  });
});

describe('isDraftRole', () => {
  it('flags exactly the roles with a first-pass drafted set', () => {
    ROLES.forEach(r => {
      expect(isDraftRole(r.id)).toBe(DRAFT_ROLE_IDS.includes(r.id));
    });
  });
});
