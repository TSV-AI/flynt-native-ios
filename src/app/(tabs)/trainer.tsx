import { useCallback, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { IMessage, MessageProps } from '@kesha-antonov/react-native-chat';

import { AppScreen, AppScreenHero, appSurfaceStyles, appTopbarHeight } from '@/components/app-surface';
import {
  FlyntAssistantMessage,
  FlyntChatThread,
  FlyntUserMessage,
  flyntAthlete,
  flyntTrainer,
} from '@/components/flynt-chat-thread';
import { TrainerChatInputToolbar } from '@/components/trainer-composer-accessory';
import { appSurfaces, radius, spacing } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { programChangeOperationDescription, programChangeReviews, textFromTrainerMessage } from '@/features/trainer-messages';
import { useTrainerConversation } from '@/providers/trainer-conversation-provider';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

const prompts = [
  ['Equipment swap', 'I don’t have the equipment my program calls for. Help me swap it without changing the intent.'],
  ['Adjust around pain', 'A movement is bothering me. Help me adjust today safely and decide what the plan should avoid.'],
  ['Rework my week', 'My schedule or recovery changed. Rework the week so I can still make progress.'],
] as const;

type TrainerChatMessage = IMessage & {
  kind: 'assistant' | 'proposal' | 'user' | 'welcome';
  proposal?: ReturnType<typeof programChangeReviews>[number];
};

export default function TrainerScreen() {
  const { mode, theme } = useFlyntTheme();
  const { appState } = useLifecycleNavigation();
  const { canRetry, choosePrompt, composerHeight, dismissError, error, respondingToolCallId, respondToChange, retry, sending, sentMessages } = useTrainerConversation();
  const itemBackground = appSurfaces[mode].itemBackground;
  const supportsNativeTabAccessory = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;
  const firstName = appState?.profile.fullName.trim().split(/\s+/)[0] || null;
  const currentDayIndex = Math.min(6, Math.max(0, new Date().getDay() === 0 ? 6 : new Date().getDay() - 1));
  const today = appState?.program?.[currentDayIndex];
  const proposals = useMemo(
    () => programChangeReviews(appState?.conversation?.messages ?? []).slice(-3),
    [appState?.conversation?.messages],
  );
  const fallbackTitle = today
    ? firstName ? `${firstName}, ${today.title} is ready.` : `${today.title} is ready.`
    : firstName ? `${firstName}, your Trainer is ready.` : 'Your Trainer is ready.';
  const fallbackBody = today?.focus || 'Ask about today, your plan, or an adjustment you need.';
  const messages = useMemo<TrainerChatMessage[]>(() => {
    const persisted = (appState?.conversation?.messages ?? [])
      .flatMap((message) => {
        if (message.role !== 'user' && message.role !== 'assistant') return [];
        const text = textFromTrainerMessage(message);
        if (!text) return [];
        return [{
          _id: message.id,
          createdAt: new Date(message.createdAt),
          kind: message.role,
          text,
          user: message.role === 'user' ? flyntAthlete : flyntTrainer,
        } satisfies TrainerChatMessage];
      })
      .slice(-20);
    const lastTimestamp = persisted.length
      ? new Date(persisted[persisted.length - 1].createdAt).getTime()
      : 0;
    const optimistic = sentMessages.map((text, index) => ({
      _id: `optimistic:${index}:${text}`,
      createdAt: lastTimestamp + index + 1,
      kind: 'user' as const,
      text,
      user: flyntAthlete,
    }));
    const proposalMessages = proposals.map((proposal, index) => ({
      _id: `proposal:${proposal.part.toolCallId}`,
      createdAt: lastTimestamp + optimistic.length + index + 1,
      kind: 'proposal' as const,
      proposal,
      text: proposal.change.summary,
      user: flyntTrainer,
    }));
    const conversation = [...persisted, ...proposalMessages, ...optimistic];
    if (conversation.length) return conversation;
    return [{
      _id: 'trainer-welcome',
      createdAt: 0,
      kind: 'welcome',
      text: `**${fallbackTitle}**\n\n${fallbackBody}`,
      user: flyntTrainer,
    }];
  }, [appState?.conversation?.messages, fallbackBody, fallbackTitle, proposals, sentMessages]);

  const renderMessage = useCallback(({ currentMessage }: MessageProps<TrainerChatMessage>) => {
    if (currentMessage.kind === 'welcome') {
      return (
        <View style={styles.welcomeMessage}>
          <FlyntAssistantMessage markdown={currentMessage.text} />
          <View style={styles.prompts}>
            {prompts.map(([label, prompt]) => (
              <Pressable
                accessibilityRole="button"
                key={label}
                onPress={() => choosePrompt(prompt)}
                style={({ pressed }) => [styles.prompt, { borderColor: theme.line, backgroundColor: itemBackground, opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.promptText, { color: theme.ink }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }
    if (currentMessage.kind === 'user') {
      return <FlyntUserMessage text={currentMessage.text} />;
    }
    if (currentMessage.kind === 'proposal' && currentMessage.proposal) {
      const { change, part } = currentMessage.proposal;
      const waiting = part.state === 'approval-requested' && part.approval?.approved === undefined;
      const approved = part.state === 'output-available' || part.approval?.approved === true;
      const declined = part.approval?.approved === false;
      return (
        <View style={[styles.proposal, { backgroundColor: itemBackground, borderColor: theme.line }]}>
          <Text style={[styles.proposalEyebrow, { color: theme.muted }]}>{approved ? 'CHANGE APPROVED' : declined ? 'CHANGE DECLINED' : 'PROPOSED ADJUSTMENT'}</Text>
          <Text style={[appSurfaceStyles.cardTitle, { color: theme.ink }]}>{change.summary}</Text>
          <Text style={[appSurfaceStyles.body, styles.bubbleBody, { color: theme.muted }]}>{change.rationale}</Text>
          {change.operations.map((operation, index) => <Text key={`${operation.type}-${index}`} style={[styles.operation, { color: theme.ink }]}>• {programChangeOperationDescription(operation)}</Text>)}
          {waiting ? <View style={styles.proposalActions}>
            <Pressable accessibilityRole="button" disabled={respondingToolCallId === part.toolCallId} onPress={() => respondToChange(part.toolCallId!, false, change)} style={({ pressed }) => [styles.proposalSecondary, { borderColor: theme.line }, pressed && styles.pressed]}><Text style={[styles.promptText, { color: theme.ink }]}>Keep current plan</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={respondingToolCallId === part.toolCallId} onPress={() => respondToChange(part.toolCallId!, true, change)} style={({ pressed }) => [styles.proposalPrimary, { backgroundColor: theme.primaryFill }, pressed && styles.pressed]}><Text style={[styles.promptText, { color: theme.primaryText }]}>Approve change</Text></Pressable>
          </View> : null}
        </View>
      );
    }
    return <FlyntAssistantMessage markdown={currentMessage.text} />;
  }, [choosePrompt, itemBackground, respondToChange, respondingToolCallId, theme]);

  const renderError = useCallback(() => error ? (
    <View accessibilityRole="alert" style={[styles.errorCard, { borderColor: theme.danger }]}>
      <Text style={[styles.previewNote, { color: theme.danger }]}>{error}</Text>
      <View style={styles.errorActions}>
        <Pressable accessibilityRole="button" onPress={dismissError} style={styles.errorButton}><Text style={[styles.promptText, { color: theme.ink }]}>Dismiss</Text></Pressable>
        {canRetry ? <Pressable accessibilityRole="button" onPress={retry} style={styles.errorButton}><Text style={[styles.promptText, { color: theme.ink }]}>Retry</Text></Pressable> : null}
      </View>
    </View>
  ) : null, [canRetry, dismissError, error, retry, theme]);

  return (
    <View style={styles.flex}>
      <AppScreen contentExtendsUnderTopbar scrollable={false} testID="screen-trainer">
        <FlyntChatThread<TrainerChatMessage>
          extendsUnderStatusBar
          hasExternalComposer={supportsNativeTabAccessory}
          header={<AppScreenHero eyebrow="YOUR COACH" intro="Ask about today, your plan, or an adjustment you need." title="Trainer" />}
          messages={messages}
          renderChatFooter={renderError}
          renderInputToolbar={() => supportsNativeTabAccessory ? null : <TrainerChatInputToolbar />}
          renderMessage={renderMessage}
          scrollRevision={composerHeight}
          sending={sending}
          topInset={appTopbarHeight}
        />
      </AppScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  welcomeMessage: { gap: spacing.lg },
  bubbleBody: { marginTop: spacing.xs },
  prompts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  prompt: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: spacing.md },
  promptText: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  previewNote: { marginTop: spacing.lg, paddingHorizontal: spacing.sm, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  proposal: { marginTop: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: spacing.md },
  proposalEyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.1, marginBottom: spacing.xs },
  operation: { fontSize: 14, lineHeight: 20, textTransform: 'capitalize', marginTop: spacing.xs },
  proposalActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md },
  proposalSecondary: { flex: 1, minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  proposalPrimary: { flex: 1, minHeight: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  pressed: { opacity: 0.7 }, errorCard: { marginTop: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.sm }, errorActions: { flexDirection: 'row', justifyContent: 'flex-end' }, errorButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
});
