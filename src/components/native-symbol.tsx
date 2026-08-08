import { Host, Image as SwiftImage, useNativeState } from '@expo/ui/swift-ui';
import { font, symbolEffect } from '@expo/ui/swift-ui/modifiers';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import { palette } from '@/constants/theme';

type SFSymbol = NonNullable<ComponentProps<typeof SwiftImage>['systemName']>;

type NativeSymbolProps = {
  color: string;
  name: SFSymbol;
  size?: number;
  weight?: 'medium' | 'semibold' | 'bold';
};

export function NativeSymbol({ color, name, size = 18, weight }: NativeSymbolProps) {
  return (
    <Host matchContents pointerEvents="none" style={{ width: size, height: size }}>
      <SwiftImage color={color} modifiers={weight ? [font({ size, weight })] : undefined} size={size} systemName={name} />
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
  prominence = 'regular',
  state = 'idle',
}: {
  accessibilityLabel: string;
  color: string;
  colorScheme: 'light' | 'dark';
  disabled?: boolean;
  label: string;
  onPress: () => void;
  prominence?: 'regular' | 'prominent';
  state?: 'idle' | 'loading' | 'success';
}) {
  const reduceTransparency = useReduceTransparency();
  const reduceMotion = useReducedMotion();
  const prominent = prominence === 'prominent';
  const contentColor = prominent
    ? colorScheme === 'light' ? palette.warmWhite : palette.black
    : color;
  const content = state === 'loading'
    ? <ActivityIndicator color={contentColor} size="small" />
    : state === 'success'
      ? reduceMotion
        ? <NativeSymbol color={contentColor} name="checkmark" size={17} />
        : <DrawnCheckmark color={contentColor} />
      : <Text style={[styles.textLabel, { color: contentColor }]}>{label}</Text>;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: state === 'loading', disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.textButtonHost, prominent && styles.prominentTextButtonHost, disabled && state === 'idle' && styles.disabled, pressed && styles.pressed]}
    >
      {isGlassEffectAPIAvailable() && !reduceTransparency ? (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="regular"
          isInteractive
          style={[styles.textGlass, prominent && styles.prominentTextGlass]}
          tintColor={prominent ? color : undefined}
        >
          {content}
        </GlassView>
      ) : (
        <View style={[
          styles.textGlass,
          prominent && styles.prominentTextGlass,
          { backgroundColor: prominent ? color : colorScheme === 'dark' ? '#2A2A29' : '#E9E8E3' },
        ]}>
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
  prominentTextButtonHost: { alignSelf: 'stretch', height: 52, borderRadius: 26 },
  prominentTextGlass: { width: '100%', height: 52, borderRadius: 26 },
  textLabel: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  successSymbol: { width: 17, height: 17 },
});
