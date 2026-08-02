import { BottomSheet, Group, Host, RNHostView } from '@expo/ui/swift-ui';
import {
  environment,
  presentationBackground,
  presentationBackgroundMaterial,
  presentationDetents,
  presentationDragIndicator,
  type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import { useModalPresentation } from '@/providers/modal-presentation-provider';

type NativeMaterialSheetProps = {
  children: ReactNode;
  colorScheme: 'light' | 'dark';
  detents: PresentationDetent[];
  isPresented: boolean;
  materialOverlayColor?: string;
  onDismiss: () => void;
};

export function NativeMaterialSheet({ children, colorScheme, detents, isPresented, materialOverlayColor, onDismiss }: NativeMaterialSheetProps) {
  const { fontScale, width } = useWindowDimensions();
  const reduceTransparency = useReduceTransparency();
  const { setModalPresented } = useModalPresentation();
  const backgroundColor = colorScheme === 'dark'
    ? reduceTransparency ? '#18181A' : '#18181ADD'
    : reduceTransparency ? '#F7F6F2' : '#F7F6F2E8';
  const effectiveDetents = fontScale >= 1.35 ? [{ fraction: 0.94 } satisfies PresentationDetent] : detents;
  const effectiveOverlayColor = materialOverlayColor
    ? reduceTransparency ? colorScheme === 'dark' ? '#171717' : '#F7F6F2' : materialOverlayColor
    : undefined;

  useEffect(() => {
    if (!isPresented) return;
    setModalPresented(true);
    return () => setModalPresented(false);
  }, [isPresented, setModalPresented]);

  return (
    <Host colorScheme={colorScheme} pointerEvents="none" style={[styles.host, { width }]}>
      <BottomSheet
        isPresented={isPresented}
        modifiers={[environment('colorScheme', colorScheme)]}
        onIsPresentedChange={(presented) => {
          if (!presented) onDismiss();
        }}
      >
        <Group
          modifiers={[
            presentationDetents(effectiveDetents),
            presentationDragIndicator('visible'),
            materialOverlayColor ? presentationBackgroundMaterial('regular') : presentationBackground(backgroundColor),
            environment('colorScheme', colorScheme),
          ]}
        >
          <RNHostView>
            <View accessibilityViewIsModal style={[styles.content, effectiveOverlayColor && { backgroundColor: effectiveOverlayColor }]}>{children}</View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute' },
  content: { flex: 1 },
});
