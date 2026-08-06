import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { palette, radius, spacing } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import {
  boundedComposerHeight,
  composerMinimumHeight,
  estimatedComposerHeight,
} from '@/lib/composer-layout';

function ComposerSymbol({ color, name, size }: { color: string; name: SFSymbol; size: number }) {
  return (
    <SymbolView
      name={name}
      resizeMode="scaleAspectFit"
      size={size}
      style={{ width: size, height: size }}
      tintColor={color}
      type="monochrome"
      weight="regular"
    />
  );
}

export function FlyntChatComposerSurface({
  accessibilityLabel,
  composerHeight,
  disabled = false,
  leadingAccessory,
  maximumHeight,
  message,
  onChangeMessage,
  onComposerHeightChange,
  onSend,
  placeholder,
}: {
  accessibilityLabel: string;
  composerHeight: number;
  disabled?: boolean;
  leadingAccessory?: ReactNode;
  maximumHeight: number;
  message: string;
  onChangeMessage: (message: string) => void;
  onComposerHeightChange: (height: number) => void;
  onSend: () => void;
  placeholder: string;
}) {
  const { theme } = useFlyntTheme();
  const canSend = message.trim().length > 0 && !disabled;

  return (
    <View style={[styles.accessoryFrame, { height: composerHeight }]}>
      {leadingAccessory}
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="sentences"
        autoCorrect
        keyboardType="default"
        multiline
        onChangeText={(nextMessage) => {
          onChangeMessage(nextMessage);
          onComposerHeightChange(estimatedComposerHeight(nextMessage, maximumHeight));
        }}
        onContentSizeChange={(event) => {
          if (!message.trim()) {
            onComposerHeightChange(composerMinimumHeight);
            return;
          }
          const measuredHeight = boundedComposerHeight(event.nativeEvent.contentSize.height, maximumHeight);
          onComposerHeightChange(Math.max(measuredHeight, estimatedComposerHeight(message, maximumHeight)));
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        returnKeyType="default"
        scrollEnabled={composerHeight >= maximumHeight}
        spellCheck
        style={[
          styles.input,
          { color: theme.ink, height: composerHeight },
        ]}
        submitBehavior="newline"
        value={message}
      />
      <Pressable
        accessibilityLabel="Send message"
        accessibilityRole="button"
        disabled={!canSend}
        onPress={onSend}
        style={styles.sendTarget}
      >
        <View style={[styles.sendVisual, { backgroundColor: theme.primaryFill, opacity: canSend ? 1 : 0.32 }]}>
          <ComposerSymbol color={theme.primaryText} name="arrow.up" size={16} />
        </View>
      </Pressable>
    </View>
  );
}

export function FlyntChatInputToolbar(props: Parameters<typeof FlyntChatComposerSurface>[0]) {
  const { mode, theme } = useFlyntTheme();
  const reduceTransparency = useReduceTransparency();
  const composer = <FlyntChatComposerSurface {...props} />;
  const lift = mode === 'light' ? styles.lightToolbarLift : null;

  if (isGlassEffectAPIAvailable() && !reduceTransparency) {
    return (
      <View style={styles.toolbarFrame}>
        <View style={lift}>
          <GlassView colorScheme={mode} glassEffectStyle="regular" isInteractive style={[styles.glassHost, { borderColor: theme.line }]}>
            {composer}
          </GlassView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.toolbarFrame}>
      <View style={lift}>
        <View style={[styles.glassHost, { backgroundColor: mode === 'dark' ? '#222222' : '#F2F2F1', borderColor: theme.line }]}>
          {composer}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accessoryFrame: { position: 'relative', flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xxs, paddingLeft: 8, paddingRight: 52 },
  toolbarFrame: { paddingHorizontal: 2, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  lightToolbarLift: {
    borderRadius: 22,
    shadowColor: palette.black,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  glassHost: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  input: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, fontSize: 16, lineHeight: 21, paddingHorizontal: spacing.xxs, paddingVertical: 11 },
  sendTarget: { position: 'absolute', right: 8, bottom: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  sendVisual: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  pressed: { opacity: 0.72 },
});
