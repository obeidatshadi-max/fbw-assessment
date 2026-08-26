import { describe, it, expect } from 'vitest';
import { L, t, tf, interpolate, dirFor, LANGS, UI } from './translations.js';
import { SCENARIOS } from '../data/scenarios.js';
import { ORG_ITEMS } from '../data/orgItems.js';
import { COMPLIANCE_ITEMS } from '../data/complianceItems.js';
import { DEV_PLAN } from '../data/devPlan.js';
import { MANAGER_DEBRIEF_QUESTIONS } from '../data/managerDebrief.js';
import { DIM } from '../data/dimensions.js';

describe('L', () => {
  it('returns a plain string unchanged regardless of lang', () => {
    expect(L('hello', 'ar')).toBe('hello');
  });

  it('picks the requested language from a translation object', () => {
    expect(L({ en: 'Hello', ar: 'مرحبا', fr: 'Bonjour' }, 'ar')).toBe('مرحبا');
  });

  it('falls back to english when the language is missing', () => {
    expect(L({ en: 'Hello' }, 'fr')).toBe('Hello');
  });
});

describe('t / tf', () => {
  it('resolves a dot-path key per language', () => {
    expect(t('en', 'nav.back')).toBe('Back');
    expect(t('ar', 'nav.back')).toBe('رجوع');
  });

  it('falls back to english for an unknown language', () => {
    expect(t('xx', 'nav.back')).toBe('Back');
  });

  it('interpolates {placeholders}', () => {
    expect(tf('en', 'header.stepP1', { n: 3, total: 15 })).toBe('Situation 3 of 15');
  });
});

describe('interpolate', () => {
  it('replaces {placeholders} with given vars', () => {
    expect(interpolate('Hello {name}, you are {age}.', { name: 'Sam', age: 30 })).toBe('Hello Sam, you are 30.');
  });

  it('leaves a placeholder untouched if its var is missing', () => {
    expect(interpolate('Hello {name}.', {})).toBe('Hello {name}.');
  });
});

describe('dirFor', () => {
  it('is rtl only for arabic', () => {
    expect(dirFor('ar')).toBe('rtl');
    expect(dirFor('en')).toBe('ltr');
    expect(dirFor('fr')).toBe('ltr');
  });
});

describe('translation completeness', () => {
  it('every UI key present in english exists in arabic and french', () => {
    const missing = [];
    function walk(enNode, path) {
      if (enNode == null || typeof enNode !== 'object') return;
      for (const key of Object.keys(enNode)) {
        const nextPath = path ? `${path}.${key}` : key;
        const enVal = enNode[key];
        if (typeof enVal === 'object') {
          walk(enVal, nextPath);
        } else {
          for (const lang of LANGS) {
            if (lang === 'en') continue;
            const val = nextPath.split('.').reduce((o, k) => (o == null ? undefined : o[k]), UI[lang]);
            if (val === undefined) missing.push(`${lang}:${nextPath}`);
          }
        }
      }
    }
    walk(UI.en, '');
    expect(missing).toEqual([]);
  });

  it('every scenario and option has en/ar/fr text', () => {
    SCENARIOS.forEach((sc, i) => {
      LANGS.forEach(lang => expect(L(sc.s, lang), `scenario ${i} s.${lang}`).toBeTruthy());
      sc.opts.forEach((o, j) => {
        LANGS.forEach(lang => expect(L(o.t, lang), `scenario ${i} opt ${j} t.${lang}`).toBeTruthy());
      });
    });
  });

  it('every org item has en/ar/fr text', () => {
    ORG_ITEMS.forEach((it, i) => {
      LANGS.forEach(lang => expect(L(it.t, lang), `org item ${i} t.${lang}`).toBeTruthy());
    });
  });

  it('every compliance-courage item has en/ar/fr text', () => {
    COMPLIANCE_ITEMS.forEach((it, i) => {
      LANGS.forEach(lang => expect(L(it.t, lang), `compliance item ${i} t.${lang}`).toBeTruthy());
    });
  });

  it('every dev-plan action has en/ar/fr text', () => {
    ['F', 'B', 'W'].forEach(k => {
      ['day30', 'day60', 'day90'].forEach(phase => {
        DEV_PLAN[k][phase].forEach((action, i) => {
          LANGS.forEach(lang => expect(L(action, lang), `${k}.${phase}[${i}].${lang}`).toBeTruthy());
        });
      });
    });
  });

  it('every manager debrief question has en/ar/fr text', () => {
    MANAGER_DEBRIEF_QUESTIONS.forEach((q, i) => {
      LANGS.forEach(lang => expect(L(q, lang), `debrief question ${i}.${lang}`).toBeTruthy());
    });
  });

  it('every dimension has en/ar/fr label, tag, and content arrays', () => {
    ['F', 'B', 'W'].forEach(key => {
      const d = DIM[key];
      LANGS.forEach(lang => {
        expect(L(d.label, lang), `${key} label.${lang}`).toBeTruthy();
        expect(L(d.tag, lang), `${key} tag.${lang}`).toBeTruthy();
        ['strength', 'watch', 'develop'].forEach(field => {
          d[field].forEach((entry, i) => {
            expect(L(entry, lang), `${key} ${field}[${i}].${lang}`).toBeTruthy();
          });
        });
      });
    });
  });
});
