import { Host, Image as SwiftImage, useNativeState } from '@expo/ui/swift-ui';
import { symbolEffect } from '@expo/ui/swift-ui/modifiers';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

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

function DrawnCheckmark({ color }: { color: string }) {
  const trigger = useNativeState(0);

  useEffect(() => {
    trigger.set(1);
  }, [trigger]);

  return (
    <Host matchContents pointerEvents="none" style={styles.successSymbol}>
      <SwiftImage
        color={color}
        modifiers={[
          symbolEffect(
            { effect: 'drawOn', scope: 'wholeSymbol' },
            { options: { repeat: 'nonRepeating' }, value: trigger },
          ),
        ]}
        size={17}
        systemName="checkmark"
      />
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

export function GlassTextButton({
  accessibilityLabel,
  color,
  colorScheme,
  disabled = false,
  label,
  onPress,
  state = 'idle',
}: {
  accessibilityLabel: string;
  color: string;
  colorScheme: 'light' | 'dark';
  disabled?: boolean;
  label: string;
  onPress: () => void;
  state?: 'idle' | 'loading' | 'success';
}) {
  const reduceTransparency = useReduceTransparency();
  const reduceMotion = useReducedMotion();
  const content = state === 'loading'
    ? <ActivityIndicator color={color} size="small" />
    : state === 'success'
      ? reduceMotion
        ? <NativeSymbol color={color} name="checkmark" size={17} />
        : <DrawnCheckmark color={color} />
      : <Text style={[styles.textLabel, { color }]}>{label}</Text>;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: state === 'loading', disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.textButtonHost, disabled && state === 'idle' && styles.disabled, pressed && styles.pressed]}
    >
      {isGlassEffectAPIAvailable() && !reduceTransparency ? (
        <GlassView colorScheme={colorScheme} glassEffectStyle="regular" isInteractive style={styles.textGlass}>
          {content}
        </GlassView>
      ) : (
        <View style={[styles.textGlass, { backgroundColor: colorScheme === 'dark' ? '#2A2A29' : '#E9E8E3' }]}>
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
  disabled: { opacity: 0.5 },
  textButtonHost: { minWidth: 72, height: 44, borderRadius: 22 },
  textGlass: { minWidth: 72, height: 44, borderRadius: 22, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  textLabel: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  successSymbol: { width: 17, height: 17 },
});
