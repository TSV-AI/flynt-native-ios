import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import { useRestTimer } from '@/providers/rest-timer-provider';
import { useTrainerConversation } from '@/providers/trainer-conversation-provider';

function formatTimer(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function estimatedComposerHeight(message: string) {
  const estimatedLines = Math.max(1, Math.min(4, Math.ceil(message.length / 24)));
  return Math.min(92, 44 + (estimatedLines - 1) * 21);
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
  const { composerHeight, message, send, setComposerHeight, setMessage } = useTrainerConversation();
  const canSend = message.trim().length > 0;
  const visibleTimer = timer && timer.seconds > 0 && !isExpanded ? timer : null;

  return (
    <View style={[styles.accessoryFrame, { height: composerHeight }]}>
      {visibleTimer ? (
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
      ) : null}
      <TextInput
        accessibilityLabel="Message Trainer"
        autoCapitalize="sentences"
        autoCorrect
        keyboardType="default"
        multiline
        onChangeText={(nextMessage) => {
          setMessage(nextMessage);
          setComposerHeight(estimatedComposerHeight(nextMessage));
        }}
        onContentSizeChange={(event) => {
          const nextHeight = Math.max(44, Math.min(92, Math.ceil(event.nativeEvent.contentSize.height)));
          setComposerHeight(nextHeight);
        }}
        onSubmitEditing={send}
        placeholder="Ask Trainer"
        placeholderTextColor={theme.muted}
        returnKeyType="send"
        scrollEnabled={composerHeight >= 92}
        spellCheck
        style={[styles.input, { color: theme.ink, height: composerHeight }]}
        submitBehavior="submit"
        value={message}
      />
      <Pressable
        accessibilityLabel="Send message"
        accessibilityRole="button"
        disabled={!canSend}
        onPress={send}
        style={styles.sendTarget}
      >
        <View style={[styles.sendVisual, { backgroundColor: theme.primaryFill, opacity: canSend ? 1 : 0.32 }]}>
          <ComposerSymbol color={theme.primaryText} name="arrow.up" size={16} />
        </View>
      </Pressable>
    </View>
  );
}

export function TrainerChatInputToolbar() {
  const { mode } = useFlyntTheme();
  const reduceTransparency = useReduceTransparency();

  if (isGlassEffectAPIAvailable() && !reduceTransparency) {
    return (
      <View style={styles.toolbarFrame}>
        <GlassView colorScheme={mode} glassEffectStyle="regular" isInteractive style={styles.glassHost}>
          <TrainerComposerSurface />
        </GlassView>
      </View>
    );
  }

  return (
    <View style={styles.toolbarFrame}>
      <View style={[styles.glassHost, { backgroundColor: mode === 'dark' ? '#222222' : '#F2F2F1' }]}>
        <TrainerComposerSurface />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accessoryFrame: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xxs, paddingHorizontal: 8 },
  toolbarFrame: { paddingHorizontal: 2, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  glassHost: { borderRadius: 22, overflow: 'hidden' },
  utilityButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  timerChip: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 9 },
  timerText: { fontSize: 13, lineHeight: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
  input: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 21, paddingHorizontal: spacing.xxs, paddingVertical: 11 },
  sendTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  sendVisual: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  pressed: { opacity: 0.72 },
});
