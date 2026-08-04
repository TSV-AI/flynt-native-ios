import type { PresentationDetent } from '@expo/ui/swift-ui/modifiers';

import type { ColorMode } from '@/constants/theme';

export const flyntSheetExpandedDetent = { fraction: 0.98 } satisfies PresentationDetent;

export type FlyntSheetPresentationOverride = {
  backgroundColor?: Partial<Record<ColorMode, string>>;
  detent?: PresentationDetent;
  opaqueBackgroundColor?: Partial<Record<ColorMode, string>>;
};

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
