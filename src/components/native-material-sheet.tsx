import { BottomSheet, Group, Host, RNHostView, ScrollView as NativeScrollView } from '@expo/ui/swift-ui';
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
  nativeScroll?: boolean;
  onDismiss: () => void;
  presentationOverride?: FlyntSheetPresentationOverride;
};

export function NativeMaterialSheet({ children, colorScheme, isPresented, nativeScroll = false, onDismiss, presentationOverride }: NativeMaterialSheetProps) {
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
          {nativeScroll ? (
            <NativeScrollView axes="vertical" showsIndicators={false}>
              <RNHostView matchContents>
                <View accessibilityViewIsModal style={styles.scrollContent}>{children}</View>
              </RNHostView>
            </NativeScrollView>
          ) : (
            <RNHostView>
              <View accessibilityViewIsModal style={styles.content}>{children}</View>
            </RNHostView>
          )}
        </Group>
      </BottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute' },
  content: { flex: 1 },
  scrollContent: { width: '100%' },
});
