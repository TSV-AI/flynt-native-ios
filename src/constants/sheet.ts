import type { PresentationDetent } from '@expo/ui/swift-ui/modifiers';

import type { ColorMode } from '@/constants/theme';

export const flyntSheetExpandedDetent = { fraction: 0.98 } satisfies PresentationDetent;

export const flyntInvertedSheetColors = {
  backgroundColor: {
    dark: '#18181ADD',
    light: '#F7F6F2E8',
  },
  opaqueBackgroundColor: {
    dark: '#18181A',
    light: '#F7F6F2',
  },
} satisfies Pick<FlyntSheetPresentationOverride, 'backgroundColor' | 'opaqueBackgroundColor'>;

export type FlyntSheetPresentationOverride = {
  backgroundColor?: Partial<Record<ColorMode, string>>;
  detent?: PresentationDetent;
  opaqueBackgroundColor?: Partial<Record<ColorMode, string>>;
};

export function flyntInvertedSheetPresentation(detent: PresentationDetent) {
  return {
    ...flyntInvertedSheetColors,
    detent,
  } satisfies FlyntSheetPresentationOverride;
}

export function flyntSheetBackgroundColor(
  mode: ColorMode,
  opaque = false,
  override?: FlyntSheetPresentationOverride,
) {
  const overrideColor = opaque
    ? override?.opaqueBackgroundColor?.[mode]
    : override?.backgroundColor?.[mode];
  if (overrideColor) return overrideColor;
  if (mode === 'dark') return opaque ? '#18181A' : '#18181ADD';
  return opaque ? '#F7F6F2' : '#F7F6F2E8';
}

export function flyntSheetDetent(override?: FlyntSheetPresentationOverride) {
  return override?.detent ?? flyntSheetExpandedDetent;
}
