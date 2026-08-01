import { BottomSheet, Group, Host, RNHostView } from '@expo/ui/swift-ui';
import {
  environment,
  presentationBackground,
  presentationDetents,
  presentationDragIndicator,
  type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers';
import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

type NativeMaterialSheetProps = {
  children: ReactNode;
  colorScheme: 'light' | 'dark';
  detents: PresentationDetent[];
  isPresented: boolean;
  onDismiss: () => void;
};

export function NativeMaterialSheet({ children, colorScheme, detents, isPresented, onDismiss }: NativeMaterialSheetProps) {
  const { width } = useWindowDimensions();

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
            presentationDetents(detents),
            presentationDragIndicator('visible'),
            presentationBackground(colorScheme === 'dark' ? '#18181ADD' : '#F7F6F2E8'),
            environment('colorScheme', colorScheme),
          ]}
        >
          <RNHostView>
            <View style={styles.content}>{children}</View>
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
