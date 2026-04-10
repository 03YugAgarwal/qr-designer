import '@/global.css';
import { Platform } from 'react-native';

// Indigo Prism Design System
export const DS = {
  // Surface hierarchy
  surface: '#121416',
  surfaceDim: '#121416',
  surfaceBright: '#37393b',
  surfaceContainerLowest: '#0c0e10',
  surfaceContainerLow: '#1a1c1e',
  surfaceContainer: '#1e2022',
  surfaceContainerHigh: '#282a2c',
  surfaceContainerHighest: '#333537',
  surfaceVariant: '#333537',

  // Primary
  primary: '#bbc3ff',
  primaryContainer: '#2243ea',
  onPrimary: '#001d93',
  onPrimaryContainer: '#cacfff',
  primaryFixed: '#dee0ff',
  primaryFixedDim: '#bbc3ff',

  // Secondary
  secondary: '#bdf4ff',
  secondaryContainer: '#00e3fd',
  secondaryFixedDim: '#00daf3',
  onSecondary: '#00363d',
  onSecondaryContainer: '#00616d',

  // Tertiary
  tertiary: '#cdbdff',
  tertiaryContainer: '#642de6',
  onTertiary: '#370096',

  // Error
  error: '#ffb4ab',
  errorContainer: '#93000a',

  // On-surface
  onSurface: '#e2e2e5',
  onSurfaceVariant: '#c5c5d4',
  onBackground: '#e2e2e5',
  background: '#121416',

  // Outline
  outline: '#8f909e',
  outlineVariant: '#454652',

  // Inverse
  inverseSurface: '#e2e2e5',
  inverseOnSurface: '#2f3133',
  inversePrimary: '#2848ee',
} as const;

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
