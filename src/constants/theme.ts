import '@/global.css';
import { Platform } from 'react-native';

// Indigo Prism Design System — DARK
export interface DSPalette {
  surface: string; surfaceDim: string; surfaceBright: string;
  surfaceContainerLowest: string; surfaceContainerLow: string; surfaceContainer: string;
  surfaceContainerHigh: string; surfaceContainerHighest: string; surfaceVariant: string;
  primary: string; primaryContainer: string; onPrimary: string; onPrimaryContainer: string;
  primaryFixed: string; primaryFixedDim: string;
  secondary: string; secondaryContainer: string; secondaryFixedDim: string;
  onSecondary: string; onSecondaryContainer: string;
  tertiary: string; tertiaryContainer: string; onTertiary: string;
  error: string; errorContainer: string;
  onSurface: string; onSurfaceVariant: string; onBackground: string; background: string;
  outline: string; outlineVariant: string;
  inverseSurface: string; inverseOnSurface: string; inversePrimary: string;
}

export const DS_DARK: DSPalette = {
  surface: '#121416',
  surfaceDim: '#121416',
  surfaceBright: '#37393b',
  surfaceContainerLowest: '#0c0e10',
  surfaceContainerLow: '#1a1c1e',
  surfaceContainer: '#1e2022',
  surfaceContainerHigh: '#282a2c',
  surfaceContainerHighest: '#333537',
  surfaceVariant: '#333537',

  primary: '#bbc3ff',
  primaryContainer: '#2243ea',
  onPrimary: '#001d93',
  onPrimaryContainer: '#cacfff',
  primaryFixed: '#dee0ff',
  primaryFixedDim: '#bbc3ff',

  secondary: '#bdf4ff',
  secondaryContainer: '#00e3fd',
  secondaryFixedDim: '#00daf3',
  onSecondary: '#00363d',
  onSecondaryContainer: '#00616d',

  tertiary: '#cdbdff',
  tertiaryContainer: '#642de6',
  onTertiary: '#370096',

  error: '#ffb4ab',
  errorContainer: '#93000a',

  onSurface: '#e2e2e5',
  onSurfaceVariant: '#c5c5d4',
  onBackground: '#e2e2e5',
  background: '#121416',

  outline: '#8f909e',
  outlineVariant: '#454652',

  inverseSurface: '#e2e2e5',
  inverseOnSurface: '#2f3133',
  inversePrimary: '#2848ee',
};

// Indigo Prism Design System — LIGHT
export const DS_LIGHT: DSPalette = {
  surface: '#fbf8fd',
  surfaceDim: '#dbd9dc',
  surfaceBright: '#fbf8fd',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f2f7',
  surfaceContainer: '#efedf1',
  surfaceContainerHigh: '#e9e7eb',
  surfaceContainerHighest: '#e3e1e5',
  surfaceVariant: '#e3e1ec',

  primary: '#2848ee',
  primaryContainer: '#dee0ff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#00115a',
  primaryFixed: '#dee0ff',
  primaryFixedDim: '#bbc3ff',

  secondary: '#006874',
  secondaryContainer: '#9eeffd',
  secondaryFixedDim: '#00daf3',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#001f24',

  tertiary: '#5b36d6',
  tertiaryContainer: '#e7deff',
  onTertiary: '#ffffff',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',

  onSurface: '#1c1b1f',
  onSurfaceVariant: '#46464f',
  onBackground: '#1c1b1f',
  background: '#fbf8fd',

  outline: '#777680',
  outlineVariant: '#c7c5d0',

  inverseSurface: '#313033',
  inverseOnSurface: '#f3eff4',
  inversePrimary: '#bbc3ff',
} as const;

// Backward-compatible static export. Existing screens' StyleSheet.create() uses
// this at module load time, so the app defaults to dark. New code that needs
// reactive theming should import `useDS` from '@/theme/theme-provider'.
export const DS = DS_DARK;

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
