import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

import { deliberateAction, selection } from '@/lib/haptics';

type TrainerConversationValue = {
  choosePrompt: (prompt: string) => void;
  composerHeight: number;
  message: string;
  send: () => void;
  setComposerHeight: (height: number) => void;
  sentMessages: string[];
  setMessage: (message: string) => void;
};

const TrainerConversationContext = createContext<TrainerConversationValue | null>(null);

export function TrainerConversationProvider({ children }: PropsWithChildren) {
  const [composerHeight, setComposerHeight] = useState(44);
  const [message, setMessage] = useState('');
  const [sentMessages, setSentMessages] = useState<string[]>([]);

  const value = useMemo<TrainerConversationValue>(() => ({
    choosePrompt(prompt) {
      void selection();
      setMessage(prompt);
    },
    composerHeight,
    message,
    send() {
      const trimmed = message.trim();
      if (!trimmed) return;
      void deliberateAction();
      setSentMessages((current) => [...current, trimmed]);
      setMessage('');
      setComposerHeight(44);
    },
    setComposerHeight,
    sentMessages,
    setMessage,
  }), [composerHeight, message, sentMessages]);

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
