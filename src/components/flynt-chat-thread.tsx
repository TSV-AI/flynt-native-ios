import { useCallback, useEffect, useRef, type PropsWithChildren, type ReactElement, type ReactNode } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  Chat,
  type IMessage,
  type MessageProps,
} from '@kesha-antonov/react-native-chat';
import type { AnimatedList } from '@kesha-antonov/react-native-chat/lib/MessagesContainer/types';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { appSurfaceStyles } from '@/components/app-surface';
import { TrainerMarkdownMessage } from '@/components/trainer-markdown-message';
import { appSurfaces, radius, spacing } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';

export const flyntAthlete = { _id: 'athlete' } as const;
export const flyntTrainer = { _id: 'trainer' } as const;

export function FlyntChatComposerOverlay({ children }: PropsWithChildren) {
  const { mode } = useFlyntTheme();
  const reduceTransparency = useReduceTransparency();

  return (
    <SafeAreaView edges={['bottom']} style={styles.composerOverlay}>
      <View pointerEvents="none" style={[styles.composerScrim, { top: spacing.xs }]}>
        {!reduceTransparency ? (
          <MaskedView
            maskElement={(
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    experimental_backgroundImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.72) 72%, black 100%)',
                  },
                ]}
              />
            )}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          >
            <BlurView
              intensity={50}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              tint={mode === 'dark' ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
            />
          </MaskedView>
        ) : null}
        <View style={[
          StyleSheet.absoluteFill,
          {
            experimental_backgroundImage: `linear-gradient(180deg, ${appSurfaces[mode].composerEdgeTransparent} 0%, ${appSurfaces[mode].composerEdgeScrim} 72%, ${appSurfaces[mode].primaryBackground} 100%)`,
          },
        ]} />
      </View>
      {children}
    </SafeAreaView>
  );
}

type FlyntChatThreadProps<TMessage extends IMessage> = {
  composerClearance?: number;
  hasExternalComposer?: boolean;
  header?: ReactElement;
  messages: TMessage[];
  renderChatFooter?: () => ReactNode;
  renderInputToolbar?: () => ReactNode;
  renderMessage: (props: MessageProps<TMessage>) => ReactElement;
  scrollRevision?: number | string;
  sending: boolean;
  thinkingLabel?: string;
  extendsUnderStatusBar?: boolean;
  topInset?: number;
};

export function FlyntChatThread<TMessage extends IMessage>({
  composerClearance = spacing.hero + spacing.xxl,
  hasExternalComposer = false,
  header,
  messages,
  renderChatFooter,
  renderInputToolbar,
  renderMessage,
  scrollRevision,
  sending,
  thinkingLabel = 'FLYNT is thinking',
  extendsUnderStatusBar = false,
  topInset = 0,
}: FlyntChatThreadProps<TMessage>) {
  const { mode, theme } = useFlyntTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const messagesContainerRef = useRef<AnimatedList<TMessage>>(null!);
  const latestMessageId = messages.length ? String(messages[messages.length - 1]._id) : '';

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesContainerRef.current?.scrollToEnd({ animated: !reduceMotion });
      requestAnimationFrame(() => {
        messagesContainerRef.current?.scrollToEnd({ animated: !reduceMotion });
      });
    });
  }, [reduceMotion]);

  useEffect(() => {
    scrollToBottom();
  }, [latestMessageId, scrollRevision, scrollToBottom, sending]);

  const renderThinking = useCallback(() => sending ? (
    <View
      accessible
      accessibilityLabel={thinkingLabel}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={styles.thinkingRow}
    >
      {reduceMotion
        ? <View style={[styles.staticThinkingDot, { backgroundColor: theme.muted }]} />
        : <ActivityIndicator color={theme.muted} size="small" />}
      <Text accessible={false} style={[styles.thinkingText, { color: theme.muted }]}>{thinkingLabel}</Text>
    </View>
  ) : null, [reduceMotion, sending, theme.muted, thinkingLabel]);

  const renderComposer = useCallback(() => {
    const composer = renderInputToolbar?.();
    if (!composer || hasExternalComposer) return composer;
    return (
      <FlyntChatComposerOverlay>
        {composer}
      </FlyntChatComposerOverlay>
    );
  }, [hasExternalComposer, renderInputToolbar]);

  const listEndClearance = hasExternalComposer
    ? spacing.hero
    : (typeof scrollRevision === 'number' ? scrollRevision : 44) + composerClearance;
  const listTopInset = topInset + (extendsUnderStatusBar ? insets.top : 0);

  return (
    <Chat<TMessage>
      colorScheme={mode}
      isDayAnimationEnabled={false}
      isInverted={false}
      isScrollToBottomEnabled
      isTyping={sending}
      keyboardAvoidingViewProps={{ keyboardVerticalOffset: 0 }}
      listProps={{
        showsVerticalScrollIndicator: false,
        ListHeaderComponent: <View style={{ paddingTop: listTopInset }}>{header}</View>,
        ListFooterComponent: (
          <View>
            {renderThinking()}
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: listEndClearance }} />
          </View>
        ),
        contentContainerStyle: styles.conversationContent,
        onContentSizeChange: scrollToBottom,
      }}
      messages={messages}
      messagesContainerRef={messagesContainerRef}
      messagesContainerStyle={styles.messagesContainer}
      onSend={() => undefined}
      renderChatFooter={renderChatFooter}
      renderDay={() => null}
      renderInputToolbar={renderComposer}
      renderMessage={renderMessage}
      user={flyntAthlete}
    />
  );
}

export function FlyntAssistantMessage({ markdown }: { markdown: string }) {
  return <TrainerMarkdownMessage containerStyle={styles.assistantMessage} markdown={markdown} />;
}

export function FlyntUserMessage({ text }: { text: string }) {
  const { mode, theme } = useFlyntTheme();
  const backgroundColor = mode === 'dark' ? appSurfaces.dark.itemBackground : theme.primaryFill;
  const color = mode === 'dark' ? theme.ink : theme.primaryText;
  return (
    <View style={[styles.userBubble, { backgroundColor }]}>
      <Text selectable style={[appSurfaceStyles.body, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  messagesContainer: { flex: 1, marginHorizontal: 12, zIndex: 0 },
  conversationContent: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: 4,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  composerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2147483647,
    elevation: 2147483647,
    paddingHorizontal: spacing.sm,
  },
  composerScrim: {
    position: 'absolute',
    right: -spacing.sm,
    bottom: 0,
    left: -spacing.sm,
  },
  assistantMessage: { width: '100%' },
  userBubble: {
    maxWidth: '88%',
    alignSelf: 'flex-end',
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  thinkingRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  staticThinkingDot: { width: 7, height: 7, borderRadius: 4 },
  thinkingText: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
});
