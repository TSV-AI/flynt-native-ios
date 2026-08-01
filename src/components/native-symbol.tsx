import { Host, Image as SwiftImage } from '@expo/ui/swift-ui';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useReduceTransparency } from '@/hooks/use-reduce-transparency';

type SFSymbol = NonNullable<ComponentProps<typeof SwiftImage>['systemName']>;

type NativeSymbolProps = {
  color: string;
  name: SFSymbol;
  size?: number;
};

export function NativeSymbol({ color, name, size = 18 }: NativeSymbolProps) {
  return (
    <Host matchContents pointerEvents="none" style={{ width: size, height: size }}>
      <SwiftImage color={color} size={size} systemName={name} />
    </Host>
  );
}

export function GlassSymbolButton({
  accessibilityLabel,
  color,
  colorScheme,
  name,
  onPress,
}: NativeSymbolProps & {
  accessibilityLabel: string;
  colorScheme: 'light' | 'dark';
  onPress: () => void;
}) {
  const reduceTransparency = useReduceTransparency();
  const content = <NativeSymbol color={color} name={name} size={17} />;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.buttonHost, pressed && styles.pressed]}
    >
      {isGlassEffectAPIAvailable() && !reduceTransparency ? (
        <GlassView colorScheme={colorScheme} glassEffectStyle="regular" isInteractive style={styles.glass}>
          {content}
        </GlassView>
      ) : (
        <View style={[styles.glass, { backgroundColor: colorScheme === 'dark' ? '#2A2A29' : '#E9E8E3' }]}>
          {content}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonHost: { width: 44, height: 44, borderRadius: 22 },
  glass: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72 },
});
