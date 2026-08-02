import { Platform } from 'react-native';

export const palette = {
  black: '#0B0B0B',
  graphite: '#151515',
  warmWhite: '#F7F6F2',
  warmCard: '#E9E8E3',
  warmLine: '#D8D6CF',
  warmMuted: '#686761',
  darkCanvas: '#1E1E1D',
  darkCard: '#171716',
  darkRaised: '#242423',
  darkLine: '#353532',
  darkMuted: '#AAA89F',
  white: '#FFFFFF',
  danger: '#B43B32',
  todayCanvas: '#F2F2F1',
  todayCard: '#FAFAFA',
  darkControlActive: '#636366',
} as const;

export const colors = {
  light: {
    canvas: palette.warmWhite,
    sheet: palette.warmWhite,
    card: palette.warmCard,
    raised: palette.white,
    ink: palette.black,
    muted: palette.warmMuted,
    line: palette.warmLine,
    primaryFill: palette.black,
    primaryText: palette.warmWhite,
    controlActive: palette.black,
    restTimerProgressFill: 'rgba(11,11,11,0.86)',
    danger: palette.danger,
  },
  dark: {
    canvas: palette.darkCanvas,
    sheet: palette.darkCanvas,
    card: palette.darkCard,
    raised: palette.darkRaised,
    ink: palette.warmWhite,
    muted: palette.darkMuted,
    line: palette.darkLine,
    primaryFill: palette.warmWhite,
    primaryText: palette.black,
    controlActive: palette.darkControlActive,
    restTimerProgressFill: 'rgba(247,246,242,0.88)',
    danger: '#E06A61',
  },
} as const;

export const appSurfaces = {
  light: {
    primaryBackground: palette.warmWhite,
    itemBackground: palette.todayCanvas,
  },
  dark: {
    primaryBackground: '#111111',
    itemBackground: '#222222',
  },
} as const;

export type ColorMode = keyof typeof colors;
export type Theme = (typeof colors)[ColorMode];

export const fonts = Platform.select({
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
    sans: 'system-ui',
    serif: 'Georgia',
    rounded: 'system-ui',
    mono: 'monospace',
  },
});

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  hero: 72,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 48, lineHeight: 50, fontWeight: '600' as const, letterSpacing: -2.2 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: '600' as const, letterSpacing: -1 },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400' as const },
  button: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  label: { fontSize: 13, lineHeight: 17, fontWeight: '600' as const, letterSpacing: 0.8 },
} as const;

export function themeFor(mode: ColorMode): Theme {
  return colors[mode];
}
