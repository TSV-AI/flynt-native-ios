import { Button, Host, Image as SwiftImage } from '@expo/ui/swift-ui';
import { buttonBorderShape, buttonStyle, controlSize, frame } from '@expo/ui/swift-ui/modifiers';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

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
  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="button" style={styles.buttonHost}>
      <Host colorScheme={colorScheme} style={styles.buttonHost}>
        <Button
          modifiers={[
            controlSize('large'),
            buttonBorderShape('circle'),
            frame({ width: 44, height: 44 }),
            buttonStyle('glass'),
          ]}
          onPress={onPress}
        >
          <SwiftImage color={color} size={17} systemName={name} />
        </Button>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonHost: { width: 44, height: 44 },
});
