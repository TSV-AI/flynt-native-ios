import { BottomSheet, Group, Host, RNHostView } from '@expo/ui/swift-ui';
import {
  environment,
  presentationBackground,
  presentationDetents,
  presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import {
  flyntSheetBackgroundColor,
  flyntSheetDetent,
  type FlyntSheetPresentationOverride,
} from '@/constants/sheet';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import { useModalPresentation } from '@/providers/modal-presentation-provider';

type NativeMaterialSheetProps = {
  children: ReactNode;
  colorScheme: 'light' | 'dark';
  isPresented: boolean;
  onDismiss: () => void;
  presentationOverride?: FlyntSheetPresentationOverride;
};

export function NativeMaterialSheet({ children, colorScheme, isPresented, onDismiss, presentationOverride }: NativeMaterialSheetProps) {
  const { fontScale, width } = useWindowDimensions();
  const reduceTransparency = useReduceTransparency();
  const { setModalPresented } = useModalPresentation();
  const backgroundColor = flyntSheetBackgroundColor(colorScheme, reduceTransparency, presentationOverride);
  const effectiveDetents = fontScale >= 1.35 ? [{ fraction: 0.94 }] : [flyntSheetDetent(presentationOverride)];

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
            presentationBackground(backgroundColor),
            environment('colorScheme', colorScheme),
          ]}
        >
          <RNHostView>
            <View accessibilityViewIsModal style={styles.content}>{children}</View>
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
