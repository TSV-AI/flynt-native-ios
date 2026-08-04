import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

import type { ProgramChange } from '@/contracts/app-state';
import { messagesWithToolApproval, requestMessages } from '@/features/trainer-messages';
import { queueProgramChange, sendTrainerMessage } from '@/lib/api-client';
import { deliberateAction, failed, saved, selection } from '@/lib/haptics';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

type TrainerConversationValue = {
  choosePrompt: (prompt: string) => void;
  canRetry: boolean;
  composerHeight: number;
  message: string;
  error: string | null;
  sending: boolean;
  send: () => void;
  dismissError: () => void;
  retry: () => void;
  respondingToolCallId: string | null;
  respondToChange: (toolCallId: string, approved: boolean, change: ProgramChange) => void;
  setComposerHeight: (height: number) => void;
  sentMessages: string[];
  setMessage: (message: string) => void;
};

const TrainerConversationContext = createContext<TrainerConversationValue | null>(null);

export function TrainerConversationProvider({ children }: PropsWithChildren) {
  const { appState, refresh } = useLifecycleNavigation();
  const [composerHeight, setComposerHeight] = useState(44);
  const [message, setMessage] = useState('');
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [respondingToolCallId, setRespondingToolCallId] = useState<string | null>(null);

  const submit = useCallback(async (text: string, addOptimistic: boolean) => {
    if (!appState?.conversation || sending) return;
    if (addOptimistic) setSentMessages((current) => [...current, text]);
    setMessage('');
    setComposerHeight(44);
    setError(null);
    setSending(true);
    setFailedMessage(null);
    try {
      const currentDayIndex = Math.min(6, Math.max(0, new Date().getDay() === 0 ? 6 : new Date().getDay() - 1));
      await sendTrainerMessage({
        conversationId: appState.conversation.id,
        messages: requestMessages(appState.conversation.messages, text),
        selectedDayIndex: currentDayIndex,
      });
      await refresh();
      setSentMessages([]);
      void saved();
    } catch (nextError) {
      setFailedMessage(text);
      setError(nextError instanceof Error ? nextError.message : 'Trainer could not send this message.');
      void failed();
    } finally {
      setSending(false);
    }
  }, [appState, refresh, sending]);

  const value = useMemo<TrainerConversationValue>(() => ({
    canRetry: failedMessage !== null,
    choosePrompt(prompt) {
      void selection();
      setMessage(prompt);
    },
    composerHeight,
    dismissError() {
      setError(null);
    },
    error,
    message,
    async send() {
      const trimmed = message.trim();
      if (!trimmed || sending) return;
      void deliberateAction();
      if (!appState?.conversation) {
        setError('Trainer conversation is unavailable. Refresh FLYNT.');
        return;
      }
      await submit(trimmed, true);
    },
    retry() {
      if (failedMessage) void submit(failedMessage, false);
    },
    respondingToolCallId,
    async respondToChange(toolCallId, approved, change) {
      if (!appState?.conversation || respondingToolCallId) return;
      setRespondingToolCallId(toolCallId);
      setError(null);
      void deliberateAction();
      try {
        const currentDayIndex = Math.min(6, Math.max(0, new Date().getDay() === 0 ? 6 : new Date().getDay() - 1));
        await sendTrainerMessage({
          conversationId: appState.conversation.id,
          messages: messagesWithToolApproval(
            appState.conversation.messages,
            toolCallId,
            approved,
            approved ? 'The athlete approved this program change.' : 'The athlete declined this program change.',
          ),
          selectedDayIndex: currentDayIndex,
        });
        if (approved) await queueProgramChange(change, toolCallId);
        await refresh();
        void saved();
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'The program change could not be updated.');
        void failed();
      } finally {
        setRespondingToolCallId(null);
      }
    },
    sending,
    setComposerHeight,
    sentMessages,
    setMessage,
  }), [appState, composerHeight, error, failedMessage, message, refresh, respondingToolCallId, sending, sentMessages, submit]);

  return (
    <TrainerConversationContext.Provider value={value}>
      {children}
    </TrainerConversationContext.Provider>
  );
}

export function useTrainerConversation() {
  const value = useContext(TrainerConversationContext);
  if (!value) throw new Error('useTrainerConversation must be used within TrainerConversationProvider');
  return value;
}
