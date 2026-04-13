import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { DS_DARK, DS_LIGHT, type DSPalette } from '@/constants/theme';

export type { DSPalette } from '@/constants/theme';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';

const STORE_KEY = 'app.themeMode';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedMode;
  setMode: (m: ThemeMode) => void;
  ds: DSPalette;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName | null | undefined>(
    Appearance.getColorScheme()
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    SecureStore.setItemAsync(STORE_KEY, m).catch(() => {});
  }, []);

  const resolved: ResolvedMode = mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;
  const ds = resolved === 'light' ? DS_LIGHT : DS_DARK;

  const value = useMemo<ThemeContextValue>(() => ({ mode, resolved, setMode, ds }), [mode, resolved, setMode, ds]);

  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return ctx;
}

export function useDS(): DSPalette {
  return useAppTheme().ds;
}
