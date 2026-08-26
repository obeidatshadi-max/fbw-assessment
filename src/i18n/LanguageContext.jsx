import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGS, dirFor, t as translate, tf as translatef, L as localize } from './translations.js';

const STORAGE_KEY = 'fbw-lang';

function readStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

const defaultContext = {
  lang: 'en',
  dir: 'ltr',
  setLang: () => {},
  t: (path) => translate('en', path),
  tf: (path, vars) => translatef('en', path, vars),
  L: (value) => localize(value, 'en'),
};

export const LanguageContext = createContext(defaultContext);

export function LanguageProvider({ children, initialLang }) {
  const [lang, setLangState] = useState(() => initialLang || readStoredLang() || 'en');

  const dir = dirFor(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  function setLang(nextLang) {
    if (!LANGS.includes(nextLang)) return;
    setLangState(nextLang);
    try {
      localStorage.setItem(STORAGE_KEY, nextLang);
    } catch {
      // localStorage unavailable — language just won't persist across reloads
    }
  }

  const value = useMemo(() => ({
    lang,
    dir,
    setLang,
    t: (path) => translate(lang, path),
    tf: (path, vars) => translatef(lang, path, vars),
    L: (val) => localize(val, lang),
  }), [lang, dir]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
