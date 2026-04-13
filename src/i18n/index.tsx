import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

import en from './locales/en.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import bn from './locales/bn.json';

export type LanguageCode = 'en' | 'zh' | 'hi' | 'es' | 'fr' | 'ar' | 'bn';

export const LANGUAGES: { code: LanguageCode; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'zh', label: 'Chinese (Mandarin)', nativeLabel: '中文' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
];

const BUNDLES: Record<LanguageCode, any> = { en, zh, hi, es, fr, ar, bn };
const SUPPORTED = new Set<LanguageCode>(LANGUAGES.map((l) => l.code));
const STORE_KEY = 'app.language';

function detectSystemLanguage(): LanguageCode {
  try {
    const locales = Localization.getLocales();
    for (const loc of locales) {
      const code = (loc.languageCode || '').toLowerCase() as LanguageCode;
      if (SUPPORTED.has(code)) return code;
    }
  } catch {}
  return 'en';
}

type TFunction = (key: string, fallback?: string) => string;

interface I18nContextValue {
  language: LanguageCode;
  isSystem: boolean;
  setLanguage: (code: LanguageCode | null) => void;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function lookup(bundle: any, key: string): string | undefined {
  const parts = key.split('.');
  let cur = bundle;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const systemLang = useMemo(detectSystemLanguage, []);
  const [override, setOverride] = useState<LanguageCode | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORE_KEY);
        if (stored && SUPPORTED.has(stored as LanguageCode)) {
          setOverride(stored as LanguageCode);
        }
      } catch {}
      setHydrated(true);
    })();
  }, []);

  const language = override ?? systemLang;

  const setLanguage = useCallback((code: LanguageCode | null) => {
    setOverride(code);
    SecureStore.setItemAsync(STORE_KEY, code ?? '').catch(() => {});
  }, []);

  const t = useCallback<TFunction>(
    (key, fallback) => {
      const val = lookup(BUNDLES[language], key) ?? lookup(BUNDLES.en, key);
      return val ?? fallback ?? key;
    },
    [language]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, isSystem: override == null, setLanguage, t }),
    [language, override, setLanguage, t]
  );

  if (!hydrated) return null;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export function useT() {
  return useI18n().t;
}
