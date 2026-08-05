import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette, radius, spacing } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import {
  boundedComposerHeight,
  estimatedComposerHeight,
  trainerComposerMaximumHeight,
} from '@/lib/composer-layout';
import { useRestTimer } from '@/providers/rest-timer-provider';
import { useTrainerConversation } from '@/providers/trainer-conversation-provider';

function formatTimer(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

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

export function TrainerComposerSurface() {
  const { theme } = useFlyntTheme();
  const { expand, isExpanded, timer } = useRestTimer();
  const { composerHeight, message, send, sending, setComposerHeight, setMessage } = useTrainerConversation();
  const visibleTimer = timer && timer.seconds > 0 && !isExpanded ? timer : null;

  const leadingAccessory = visibleTimer ? (
    <Pressable
      accessibilityHint="Opens the rest timer"
      accessibilityLabel={`${formatTimer(visibleTimer.seconds)} remaining for ${visibleTimer.exercise}`}
      accessibilityRole="button"
      onPress={expand}
      style={({ pressed }) => [styles.timerChip, { backgroundColor: theme.raised }, pressed && styles.pressed]}
    >
      <ComposerSymbol color={theme.ink} name="timer" size={14} />
      <Text style={[styles.timerText, { color: theme.ink }]}>{formatTimer(visibleTimer.seconds)}</Text>
    </Pressable>
  ) : null;

  return (
    <FlyntChatComposerSurface
      accessibilityLabel="Message Trainer"
      composerHeight={composerHeight}
      disabled={sending}
      leadingAccessory={leadingAccessory}
      maximumHeight={trainerComposerMaximumHeight}
      message={message}
      onChangeMessage={setMessage}
      onComposerHeightChange={setComposerHeight}
      onSend={send}
      placeholder="Ask Trainer"
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
          const measuredHeight = boundedComposerHeight(event.nativeEvent.contentSize.height, maximumHeight);
          onComposerHeightChange(Math.max(measuredHeight, estimatedComposerHeight(message, maximumHeight)));
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        returnKeyType="default"
        scrollEnabled={composerHeight >= maximumHeight}
        spellCheck
        style={[styles.input, { color: theme.ink, height: composerHeight }]}
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
  const { mode } = useFlyntTheme();
  const reduceTransparency = useReduceTransparency();
  const composer = <FlyntChatComposerSurface {...props} />;
  const lift = mode === 'light' ? styles.lightToolbarLift : null;

  if (isGlassEffectAPIAvailable() && !reduceTransparency) {
    return (
      <View style={styles.toolbarFrame}>
        <View style={lift}>
          <GlassView colorScheme={mode} glassEffectStyle="regular" isInteractive style={styles.glassHost}>
            {composer}
          </GlassView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.toolbarFrame}>
      <View style={lift}>
        <View style={[styles.glassHost, { backgroundColor: mode === 'dark' ? '#222222' : '#F2F2F1' }]}>
          {composer}
        </View>
      </View>
    </View>
  );
}

export function TrainerChatInputToolbar() {
  const { mode } = useFlyntTheme();
  const reduceTransparency = useReduceTransparency();
  const lift = mode === 'light' ? styles.lightToolbarLift : null;

  if (isGlassEffectAPIAvailable() && !reduceTransparency) {
    return (
      <View style={styles.toolbarFrame}>
        <View style={lift}>
          <GlassView colorScheme={mode} glassEffectStyle="regular" isInteractive style={styles.glassHost}>
            <TrainerComposerSurface />
          </GlassView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.toolbarFrame}>
      <View style={lift}>
        <View style={[styles.glassHost, { backgroundColor: mode === 'dark' ? '#222222' : '#F2F2F1' }]}>
          <TrainerComposerSurface />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accessoryFrame: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xxs, paddingHorizontal: 8 },
  toolbarFrame: { paddingHorizontal: 2, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  lightToolbarLift: {
    borderRadius: 22,
    shadowColor: palette.black,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  glassHost: { borderRadius: 22, overflow: 'hidden' },
  utilityButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  timerChip: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 9 },
  timerText: { fontSize: 13, lineHeight: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
  input: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 21, paddingHorizontal: spacing.xxs, paddingVertical: 11 },
  sendTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  sendVisual: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  pressed: { opacity: 0.72 },
});
