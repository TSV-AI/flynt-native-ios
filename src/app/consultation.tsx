import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Host as SwiftUIHost, Picker as SwiftUIPicker, Text as SwiftUIText } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import type { IMessage, MessageProps } from '@kesha-antonov/react-native-chat';
import { z } from 'zod';

import { AppScreen, AppScreenHero, appTopbarHeight } from '@/components/app-surface';
import {
  FlyntAssistantMessage,
  FlyntChatThread,
  FlyntUserMessage,
  flyntAthlete,
  flyntTrainer,
} from '@/components/flynt-chat-thread';
import { FlyntSheet } from '@/components/flynt-sheet';
import { GlassSymbolButton, NativeSymbol } from '@/components/native-symbol';
import { FlyntChatInputToolbar } from '@/components/trainer-composer-accessory';
import type { FlyntSheetPresentationOverride } from '@/constants/sheet';
import { appSurfaces, radius, spacing, type } from '@/constants/theme';
import { consultationBasicsSchema, type ConsultationBasics } from '@/contracts/app-state';
import { consultationIsReadyForReview, consultationReview, messagesWithToolApproval, requestMessages, textFromTrainerMessage, type TrainerMessage } from '@/features/trainer-messages';
import { consultationPromptForTurn, type ConsultationPrompt } from '@/features/consultation-prompts';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { acceptTerms, confirmConsultation, sendTrainerMessage } from '@/lib/api-client';
import { deliberateAction, failed, saved, selection } from '@/lib/haptics';
import {
  composerMinimumHeight,
  consultationComposerMaximumHeight,
} from '@/lib/composer-layout';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

const legalVersion = '2026-07-27';
const experienceOptions = [
  ['new', 'I’m new to this', 'Keep the language simple and show me what good training looks like'],
  ['some', 'I’ve trained a bit', 'I know some basics but I’m still building consistency'],
  ['experienced', 'I train regularly', 'You can use training terms and talk programming with me'],
] as const;
const intentOptions = [
  ['coached', 'Build my plan', 'Have FLYNT create the structure and guide the progression'],
  ['self_directed', 'Bring my own workouts', 'Add what I already do and use FLYNT to track it'],
  ['hybrid', 'Mix both', 'Start with FLYNT’s plan, then adjust or add my own work'],
] as const;

type SetupDraft = {
  age: string;
  experience: ConsultationBasics['experience'] | '';
  height: string;
  name: string;
  step: number;
  trainingIntent: ConsultationBasics['trainingIntent'] | '';
  weight: string;
};

type MetricPicker = 'age' | 'height' | 'weight';

const ageOptions = Array.from({ length: 108 }, (_, index) => index + 13);
const feetOptions = Array.from({ length: 7 }, (_, index) => index + 3);
const standardInchOptions = Array.from({ length: 12 }, (_, index) => index);
const weightOptions = Array.from({ length: 951 }, (_, index) => index + 50);
const metricPickerPresentation = { detent: 'medium' } satisfies FlyntSheetPresentationOverride;

type ConsultationChatMessage = IMessage & {
  kind: 'assistant' | 'prompt' | 'review' | 'user';
  prompt?: ConsultationPrompt;
  review?: NonNullable<ReturnType<typeof consultationReview>>;
};

const setupDraftSchema = z.object({
  age: z.string(),
  experience: z.enum(['new', 'some', 'experienced']).or(z.literal('')),
  height: z.string(),
  name: z.string(),
  step: z.number().int().min(0).max(3),
  trainingIntent: z.enum(['coached', 'self_directed', 'hybrid']).or(z.literal('')),
  weight: z.string(),
});

function startingDraft(fullName: string, age: number | null, height: number | null, weight: number | null): SetupDraft {
  return {
    age: String(age ?? 30), experience: '', height: String(height ?? 68), name: fullName,
    step: 0, trainingIntent: '', weight: String(weight ?? 175),
  };
}

function boundedInteger(value: string, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(value, 10);
  return Math.min(maximum, Math.max(minimum, Number.isFinite(parsed) ? parsed : fallback));
}

function heightParts(value: string) {
  const totalInches = boundedInteger(value, 68, 36, 108);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

function formatHeight(value: string) {
  const { feet, inches } = heightParts(value);
  return `${feet} ft ${inches} in`;
}

export default function ConsultationScreen() {
  const { mode, theme } = useFlyntTheme();
  const { appState, refresh, signOut } = useLifecycleNavigation();
  const conversation = appState?.conversation?.kind === 'consultation' ? appState.conversation : null;
  const initial = useMemo(() => startingDraft(
    appState?.profile.fullName ?? '',
    appState?.profile.age ?? null,
    appState?.profile.heightInches ?? null,
    appState?.profile.currentWeightLb ?? null,
  ), [appState?.profile.age, appState?.profile.currentWeightLb, appState?.profile.fullName, appState?.profile.heightInches]);
  const [draft, setDraft] = useState<SetupDraft>(initial);
  const [basics, setBasics] = useState<ConsultationBasics | null>(null);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [composerHeight, setComposerHeight] = useState(composerMinimumHeight);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalView, setLegalView] = useState<'terms' | 'privacy' | null>(null);
  const [previewMessages, setPreviewMessages] = useState<TrainerMessage[]>([]);
  const isConsultationPreview = __DEV__ && (
    process.env.EXPO_PUBLIC_FLYNT_PREVIEW === 'consultation_required'
    || process.env.EXPO_PUBLIC_FLYNT_PREVIEW === 'consultation_in_progress'
  );
  const messages = useMemo(
    () => isConsultationPreview ? previewMessages : conversation?.messages ?? [],
    [conversation?.messages, isConsultationPreview, previewMessages],
  );
  const review = useMemo(() => consultationReview(messages), [messages]);
  const userTurns = messages.filter((item) => item.role === 'user' && textFromTrainerMessage(item).length >= 20).length;
  const readyForReview = useMemo(() => consultationIsReadyForReview(messages), [messages]);
  const prompt = consultationPromptForTurn(
    userTurns,
    basics?.name.split(/\s+/)[0] ?? draft.name.split(/\s+/)[0],
    basics?.trainingIntent ?? (draft.trainingIntent || 'coached'),
  );
  const storageKey = `flynt.consultation.${conversation?.id ?? 'pending'}`;
  const draftStorageKey = `${storageKey}.draft`;
  const loaded = loadedStorageKey === storageKey;

  useEffect(() => {
    let active = true;
    void Promise.all([
      SecureStore.getItemAsync(storageKey),
      SecureStore.getItemAsync(draftStorageKey),
    ]).then(([storedBasics, storedDraft]) => {
      if (!active) return;
      if (storedBasics) {
        const parsed = consultationBasicsSchema.safeParse(JSON.parse(storedBasics));
        if (parsed.success) {
          setBasics(parsed.data);
          setDraft((current) => ({ ...current, ...parsed.data, age: String(parsed.data.age), height: String(parsed.data.height), weight: String(parsed.data.weight), step: 3 }));
        }
      } else if (storedDraft) {
        const parsed = setupDraftSchema.safeParse(JSON.parse(storedDraft));
        if (parsed.success) setDraft(parsed.data);
      }
      setLoadedStorageKey(storageKey);
    }).catch(() => {
      if (!active) return;
      setBasics(null);
      setDraft(initial);
      setLoadedStorageKey(storageKey);
    });
    return () => { active = false; };
  }, [draftStorageKey, initial, storageKey]);

  useEffect(() => {
    if (!loaded || basics) return;
    void SecureStore.setItemAsync(draftStorageKey, JSON.stringify(draft), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }).catch(() => setError('FLYNT could not save your onboarding progress on this device.'));
  }, [basics, draft, draftStorageKey, loaded]);

  function update(patch: Partial<SetupDraft>) { setDraft((current) => ({ ...current, ...patch })); }

  async function finishSetup() {
    const parsed = consultationBasicsSchema.safeParse({
      name: draft.name, age: Number(draft.age), height: Number(draft.height), weight: Number(draft.weight),
      experience: draft.experience, trainingIntent: draft.trainingIntent,
    });
    if (!parsed.success) {
      setError('Check your name, age, height, and weight before continuing.');
      await failed();
      return;
    }
    setBasics(parsed.data);
    setError(null);
    await SecureStore.setItemAsync(storageKey, JSON.stringify(parsed.data), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    await SecureStore.deleteItemAsync(draftStorageKey);
    await saved();
  }

  const sendText = useCallback(async (text = message) => {
    const trimmed = text.trim();
    if (!trimmed || !basics || !conversation || sending) return;
    setPendingText(trimmed);
    setMessage('');
    setComposerHeight(composerMinimumHeight);
    setSending(true);
    setError(null);
    await deliberateAction();
    if (isConsultationPreview) {
      setPreviewMessages((current) => [...current, {
        id: `preview:${Date.now()}`,
        role: 'user',
        parts: [{ type: 'text', text: trimmed }],
        sequenceNumber: current.length,
        createdAt: new Date().toISOString(),
      }]);
      setPendingText(null);
      setSending(false);
      await saved();
      return;
    }
    try {
      await sendTrainerMessage({ consultationBasics: basics, conversationId: conversation.id, messages: requestMessages(messages, trimmed), selectedDayIndex: 0 });
      await refresh();
      setPendingText(null);
      await saved();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'FLYNT could not finish that response.');
      await failed();
    } finally {
      setSending(false);
    }
  }, [basics, conversation, isConsultationPreview, message, messages, refresh, sending]);

  const declineReview = useCallback(async () => {
    if (!review?.part.toolCallId || !basics || !conversation) return;
    setSending(true);
    setError(null);
    try {
      await sendTrainerMessage({
        consultationBasics: basics, conversationId: conversation.id, selectedDayIndex: 0,
        messages: messagesWithToolApproval(messages, review.part.toolCallId, false, 'The athlete wants to correct or add consultation details.'),
      });
      await refresh();
      setMessage('I want to change: ');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'The consultation could not be updated.');
      await failed();
    } finally { setSending(false); }
  }, [basics, conversation, messages, refresh, review]);

  const buildProgram = useCallback(async () => {
    if (!review?.part.toolCallId || !basics || !conversation || !termsAccepted || sending) return;
    setSending(true);
    setError(null);
    await deliberateAction();
    try {
      if (review.part.state === 'approval-requested') {
        await sendTrainerMessage({
          consultationBasics: basics, conversationId: conversation.id, selectedDayIndex: 0,
          messages: messagesWithToolApproval(messages, review.part.toolCallId, true, 'The athlete confirmed the consultation profile.'),
        });
      }
      await acceptTerms(legalVersion);
      await confirmConsultation({
        ...review.consultation,
        trainingIntent: basics.trainingIntent,
      }, conversation.id);
      await SecureStore.deleteItemAsync(storageKey);
      await SecureStore.deleteItemAsync(draftStorageKey);
      await refresh();
      await saved();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Your program could not be started.');
      await failed();
    } finally { setSending(false); }
  }, [basics, conversation, draftStorageKey, messages, refresh, review, sending, storageKey, termsAccepted]);

  const chatMessages = useMemo<ConsultationChatMessage[]>(() => {
    const persisted = messages.flatMap((item) => {
      const text = textFromTrainerMessage(item);
      if (!text || (item.role !== 'user' && item.role !== 'assistant')) return [];
      return [{
        _id: item.id,
        createdAt: new Date(item.createdAt),
        kind: item.role,
        text,
        user: item.role === 'user' ? flyntAthlete : flyntTrainer,
      } satisfies ConsultationChatMessage];
    });
    const conversationMessages: ConsultationChatMessage[] = persisted.length ? [...persisted] : [{
      _id: 'consultation-welcome',
      createdAt: new Date(0),
      kind: 'assistant' as const,
      text: 'I’ll ask one question at a time. Tap a typical response to send it right away, or write or dictate anything that fits you better.',
      user: flyntTrainer,
    }];
    const lastTimestamp = conversationMessages.length
      ? new Date(conversationMessages[conversationMessages.length - 1].createdAt).getTime()
      : 0;

    if (pendingText) {
      conversationMessages.push({
        _id: `consultation-pending:${pendingText}`,
        createdAt: lastTimestamp + 1,
        kind: 'user',
        text: pendingText,
        user: flyntAthlete,
      });
    }

    if (review) {
      conversationMessages.push({
        _id: `consultation-review:${review.part.toolCallId ?? 'pending'}`,
        createdAt: lastTimestamp + 2,
        kind: 'review',
        review,
        text: review.consultation.summary,
        user: flyntTrainer,
      });
    } else if (!sending && (userTurns <= 5 || readyForReview)) {
      conversationMessages.push({
        _id: `consultation-prompt:${userTurns}`,
        createdAt: lastTimestamp + 2,
        kind: 'prompt',
        prompt,
        text: prompt.title,
        user: flyntTrainer,
      });
    }

    return conversationMessages;
  }, [messages, pendingText, prompt, readyForReview, review, sending, userTurns]);

  const renderMessage = useCallback(({ currentMessage }: MessageProps<ConsultationChatMessage>) => {
    if (currentMessage.kind === 'user') return <FlyntUserMessage text={currentMessage.text} />;
    if (currentMessage.kind === 'review' && currentMessage.review) {
      return (
        <ReviewCard
          accepted={termsAccepted}
          onAccepted={() => setTermsAccepted((value) => !value)}
          onBuild={() => void buildProgram()}
          onDecline={() => void declineReview()}
          onLegal={setLegalView}
          review={currentMessage.review.consultation}
          sending={sending}
          theme={theme}
        />
      );
    }
    if (currentMessage.kind === 'prompt' && currentMessage.prompt) {
      return (
        <ConsultationPromptCard
          disabled={sending}
          onSelect={(value) => void sendText(value)}
          prompt={currentMessage.prompt}
          theme={theme}
        />
      );
    }
    return <FlyntAssistantMessage markdown={currentMessage.text} />;
  }, [buildProgram, declineReview, sendText, sending, termsAccepted, theme]);

  const renderError = useCallback(() => error ? (
    <View accessibilityRole="alert" style={[styles.errorCard, { borderColor: theme.danger }]}>
      <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      <View style={styles.errorActions}>
        <Pressable accessibilityRole="button" onPress={() => setError(null)} style={styles.textButton}>
          <Text style={[styles.textButtonCopy, { color: theme.ink }]}>Dismiss</Text>
        </Pressable>
        {pendingText ? (
          <Pressable accessibilityRole="button" onPress={() => void sendText(pendingText)} style={styles.textButton}>
            <Text style={[styles.textButtonCopy, { color: theme.ink }]}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  ) : null, [error, pendingText, sendText, theme]);

  const renderInputToolbar = useCallback(() => review ? null : (
    <FlyntChatInputToolbar
      accessibilityLabel="Message FLYNT"
      composerHeight={composerHeight}
      disabled={sending}
      maximumHeight={consultationComposerMaximumHeight}
      message={message}
      onChangeMessage={setMessage}
      onComposerHeightChange={setComposerHeight}
      onSend={() => void sendText()}
      placeholder="Message FLYNT"
    />
  ), [composerHeight, message, review, sendText, sending]);

  if (!loaded) return <View style={[styles.loading, { backgroundColor: appSurfaces[mode].primaryBackground }]}><ActivityIndicator color={theme.ink} /></View>;

  if (basics && conversation) {
    return (
      <View style={styles.screen}>
        <AppScreen
          contentExtendsUnderTopbar
          scrollable={false}
          testID="screen-consultation"
        >
          <FlyntChatThread<ConsultationChatMessage>
            composerClearance={spacing.xl}
            extendsUnderStatusBar
            header={<AppScreenHero eyebrow="YOUR COACH" intro="Ask about your goals, schedule, experience, and anything your plan should respect." title="Trainer" />}
            messages={chatMessages}
            renderChatFooter={renderError}
            renderInputToolbar={renderInputToolbar}
            renderMessage={renderMessage}
            scrollRevision={composerHeight}
            sending={sending}
            topInset={appTopbarHeight}
          />
        </AppScreen>
        <LegalSheet isPresented={legalView !== null} kind={legalView ?? 'terms'} onDismiss={() => setLegalView(null)} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: appSurfaces[mode].primaryBackground }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <View style={styles.topBarPlaceholder} />
          <GlassSymbolButton accessibilityLabel="Open consultation settings" color={theme.ink} colorScheme={mode} name="ellipsis" onPress={() => router.push('/settings')} />
        </View>
        {!basics ? (
          <SetupFlow draft={draft} error={error} onFinish={() => void finishSetup()} onUpdate={update} theme={theme} />
        ) : (
          <View style={styles.unavailable}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Your consultation is unavailable.</Text>
            <Text style={[styles.body, { color: theme.muted }]}>Refresh FLYNT, open Settings, or sign out and try again.</Text>
            <Pressable accessibilityRole="button" onPress={() => void refresh()} style={[styles.primaryButton, { backgroundColor: theme.primaryFill }]}>
              <Text style={[styles.primaryCopy, { color: theme.primaryText }]}>Try again</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.textButton}>
              <Text style={[styles.textButtonCopy, { color: theme.ink }]}>Sign out</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
      <LegalSheet isPresented={legalView !== null} kind={legalView ?? 'terms'} onDismiss={() => setLegalView(null)} />
    </View>
  );
}

function SetupFlow({ draft, error, onFinish, onUpdate, theme }: { draft: SetupDraft; error: string | null; onFinish: () => void; onUpdate: (patch: Partial<SetupDraft>) => void; theme: ReturnType<typeof useFlyntTheme>['theme'] }) {
  const { mode } = useFlyntTheme();
  const [metricPicker, setMetricPicker] = useState<MetricPicker | null>(null);
  const step = draft.step;
  return <><ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.setupContent} keyboardDismissMode="interactive">
    <View style={styles.progressHeader}><Text style={[styles.eyebrow, { color: theme.muted }]}>MEET YOUR TRAINER</Text><Text style={[styles.progressCount, { color: theme.muted }]}>{step + 1} / 4</Text></View>
    <View style={[styles.progressTrack, { backgroundColor: theme.line }]}><View style={[styles.progressFill, { backgroundColor: theme.ink, width: `${((step + 1) / 4) * 100}%` }]} /></View>
    {step === 0 ? <View style={styles.welcome}><View accessibilityLabel="FLYNT" style={styles.welcomeMarkFrame}><Image accessibilityIgnoresInvertColors source={mode === 'dark' ? require('@/assets/images/flynt-mark-light.png') : require('@/assets/images/flynt-mark-ink.png')} style={styles.welcomeMark} /></View><Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>A few basics, then we’ll talk.</Text><Text style={[styles.body, { color: theme.muted }]}>Start with the easy details. After that, FLYNT asks one question at a time. Tap a typical response to send it immediately, or write or dictate anything that fits you better.</Text><Pressable accessibilityRole="button" onPress={() => onUpdate({ step: 1 })} style={[styles.primaryButton, { backgroundColor: theme.primaryFill }]}><Text style={[styles.primaryCopy, { color: theme.primaryText }]}>Get started</Text></Pressable></View> : null}
    {step === 1 ? <View style={styles.setupStack}><Text style={[styles.eyebrow, { color: theme.muted }]}>THE BASICS</Text><Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>First, a little about you.</Text><SetupField autoComplete="name" label="What should FLYNT call you?" onChange={(name) => onUpdate({ name })} theme={theme} value={draft.name} /><SetupMetricField label="Age" onPress={() => setMetricPicker('age')} theme={theme} value={`${boundedInteger(draft.age, 30, 13, 120)} years`} /><SetupMetricField accessibilityValue={`${heightParts(draft.height).feet} feet ${heightParts(draft.height).inches} inches`} label="Height" onPress={() => setMetricPicker('height')} theme={theme} value={formatHeight(draft.height)} /><SetupMetricField label="Weight" onPress={() => setMetricPicker('weight')} theme={theme} value={`${boundedInteger(draft.weight, 175, 50, 1000)} lb`} /></View> : null}
    {step === 2 ? <OptionStep detail="This changes the language, examples, and depth of the conversation." eyebrow="HOW FLYNT SHOULD TALK WITH YOU" onSelect={(experience) => onUpdate({ experience })} options={experienceOptions} selected={draft.experience} theme={theme} title="How familiar does training feel?" /> : null}
    {step === 3 ? <OptionStep detail="This sets the starting point. You can still change any workout later." eyebrow="HOW YOU WANT TO TRAIN" onSelect={(trainingIntent) => onUpdate({ trainingIntent })} options={intentOptions} selected={draft.trainingIntent} theme={theme} title="What role should FLYNT play?" /> : null}
    {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    {step > 0 ? <View style={styles.setupActions}><Pressable accessibilityRole="button" onPress={() => onUpdate({ step: step - 1 })} style={styles.textButton}><Text style={[styles.textButtonCopy, { color: theme.ink }]}>Back</Text></Pressable><Pressable accessibilityRole="button" disabled={(step === 1 && !draft.name.trim()) || (step === 2 && !draft.experience) || (step === 3 && !draft.trainingIntent)} onPress={step === 3 ? onFinish : () => onUpdate({ step: step + 1 })} style={[styles.setupContinue, { backgroundColor: theme.primaryFill, opacity: (step === 1 && !draft.name.trim()) || (step === 2 && !draft.experience) || (step === 3 && !draft.trainingIntent) ? 0.4 : 1 }]}><Text style={[styles.primaryCopy, { color: theme.primaryText }]}>{step === 3 ? 'Talk with FLYNT' : 'Continue'}</Text></Pressable></View> : null}
  </ScrollView><MetricPickerSheet draft={draft} metric={metricPicker} onDismiss={() => setMetricPicker(null)} onUpdate={onUpdate} /></>;
}

function SetupField({ autoComplete, keyboardType = 'default', label, onChange, theme, value }: { autoComplete?: 'name'; keyboardType?: 'default' | 'decimal-pad' | 'number-pad'; label: string; onChange: (value: string) => void; theme: ReturnType<typeof useFlyntTheme>['theme']; value: string }) {
  return <View style={styles.fieldGroup}><Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text><TextInput accessibilityLabel={label} autoComplete={autoComplete} keyboardType={keyboardType} onChangeText={onChange} style={[styles.field, { backgroundColor: theme.raised, borderColor: theme.line, color: theme.ink }]} value={value} /></View>;
}

function SetupMetricField({ accessibilityValue, label, onPress, theme, value }: { accessibilityValue?: string; label: string; onPress: () => void; theme: ReturnType<typeof useFlyntTheme>['theme']; value: string }) {
  return <View style={styles.fieldGroup}><Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text><Pressable accessibilityHint={`Opens the ${label.toLowerCase()} selector`} accessibilityLabel={label} accessibilityRole="button" accessibilityValue={{ text: accessibilityValue ?? value }} onPress={() => { void selection(); onPress(); }} style={({ pressed }) => [styles.metricField, { backgroundColor: theme.raised, borderColor: theme.line }, pressed && styles.pressed]}><Text style={[styles.metricValue, { color: theme.ink }]}>{value}</Text><NativeSymbol color={theme.muted} name="chevron.up.chevron.down" size={15} /></Pressable></View>;
}

function MetricPickerSheet({ draft, metric, onDismiss, onUpdate }: { draft: SetupDraft; metric: MetricPicker | null; onDismiss: () => void; onUpdate: (patch: Partial<SetupDraft>) => void }) {
  const { mode, theme } = useFlyntTheme();
  const age = boundedInteger(draft.age, 30, 13, 120);
  const weight = boundedInteger(draft.weight, 175, 50, 1000);
  const { feet, inches } = heightParts(draft.height);
  const inchOptions = feet === 9 ? [0] : standardInchOptions;
  const title = metric === 'age' ? 'Choose age' : metric === 'height' ? 'Choose height' : 'Choose weight';
  const helper = metric === 'height' ? 'Select feet and inches.' : metric === 'weight' ? 'Select weight in pounds.' : 'Select age in years.';

  return <FlyntSheet footer={<View style={styles.pickerFooter}><Pressable accessibilityRole="button" onPress={onDismiss} style={({ pressed }) => [styles.pickerDone, { backgroundColor: theme.primaryFill }, pressed && styles.pressed]}><Text style={[styles.primaryCopy, { color: theme.primaryText }]}>Done</Text></Pressable></View>} isPresented={metric !== null} onDismiss={onDismiss} presentationOverride={metricPickerPresentation} scroll={false} title={title}>
    <Text style={[styles.pickerHelper, { color: theme.muted }]}>{helper}</Text>
    {metric === 'age' ? <SwiftUIHost colorScheme={mode} style={styles.pickerHost}><SwiftUIPicker label="Age in years" modifiers={[pickerStyle('wheel')]} onSelectionChange={(value) => { onUpdate({ age: String(value) }); void selection(); }} selection={String(age)}>{ageOptions.map((value) => <SwiftUIText key={value} modifiers={[tag(String(value))]}>{`${value} years`}</SwiftUIText>)}</SwiftUIPicker></SwiftUIHost> : null}
    {metric === 'height' ? <View style={styles.heightPickers}><SwiftUIHost colorScheme={mode} style={styles.heightPickerHost}><SwiftUIPicker label="Feet" modifiers={[pickerStyle('wheel')]} onSelectionChange={(value) => { const nextFeet = Number(value); onUpdate({ height: String(nextFeet * 12 + (nextFeet === 9 ? 0 : inches)) }); void selection(); }} selection={String(feet)}>{feetOptions.map((value) => <SwiftUIText key={value} modifiers={[tag(String(value))]}>{`${value} ft`}</SwiftUIText>)}</SwiftUIPicker></SwiftUIHost><SwiftUIHost colorScheme={mode} style={styles.heightPickerHost}><SwiftUIPicker label="Inches" modifiers={[pickerStyle('wheel')]} onSelectionChange={(value) => { onUpdate({ height: String(Math.min(108, feet * 12 + Number(value))) }); void selection(); }} selection={String(inches)}>{inchOptions.map((value) => <SwiftUIText key={value} modifiers={[tag(String(value))]}>{`${value} in`}</SwiftUIText>)}</SwiftUIPicker></SwiftUIHost></View> : null}
    {metric === 'weight' ? <SwiftUIHost colorScheme={mode} style={styles.pickerHost}><SwiftUIPicker label="Weight in pounds" modifiers={[pickerStyle('wheel')]} onSelectionChange={(value) => { onUpdate({ weight: String(value) }); void selection(); }} selection={String(weight)}>{weightOptions.map((value) => <SwiftUIText key={value} modifiers={[tag(String(value))]}>{`${value} lb`}</SwiftUIText>)}</SwiftUIPicker></SwiftUIHost> : null}
  </FlyntSheet>;
}

function OptionStep<Value extends string>({ detail, eyebrow, onSelect, options, selected, theme, title }: { detail: string; eyebrow: string; onSelect: (value: Value) => void; options: readonly (readonly [Value, string, string])[]; selected: Value | ''; theme: ReturnType<typeof useFlyntTheme>['theme']; title: string }) {
  return <View style={styles.setupStack}><Text style={[styles.eyebrow, { color: theme.muted }]}>{eyebrow}</Text><Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{title}</Text><Text style={[styles.body, { color: theme.muted }]}>{detail}</Text>{options.map(([value, label, description]) => <Pressable accessibilityLabel={`${label}. ${description}`} accessibilityRole="button" accessibilityState={{ selected: selected === value }} key={value} onPress={() => { void selection(); onSelect(value); }} style={({ pressed }) => [styles.option, { backgroundColor: theme.raised, borderColor: selected === value ? theme.ink : theme.line }, pressed && styles.pressed]}><View style={styles.optionCopy}><Text style={[styles.optionTitle, { color: theme.ink }]}>{label}</Text><Text style={[styles.optionDetail, { color: theme.muted }]}>{description}</Text></View><View style={[styles.selectionIndicator, { backgroundColor: selected === value ? theme.primaryFill : 'transparent', borderColor: selected === value ? theme.primaryFill : theme.line }]}>{selected === value ? <NativeSymbol color={theme.primaryText} name="checkmark" size={14} /> : null}</View></Pressable>)}</View>;
}

function ConsultationPromptCard({ disabled, onSelect, prompt, theme }: {
  disabled: boolean;
  onSelect: (message: string) => void;
  prompt: ConsultationPrompt;
  theme: ReturnType<typeof useFlyntTheme>['theme'];
}) {
  const { mode } = useFlyntTheme();
  const isReviewPrompt = prompt.choices.length === 1 && prompt.choices[0]?.[0] === 'Show my review';
  return (
    <View style={[styles.promptCard, { backgroundColor: appSurfaces[mode].itemBackground }]}>
      <Text style={[styles.eyebrow, { color: theme.muted }]}>TYPICAL RESPONSES</Text>
      <Text style={[styles.promptHelper, { color: theme.muted }]}>Tap to send, or use the message field for a different answer.</Text>
      <View style={styles.choices}>
        {prompt.choices.map(([label, value]) => (
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            key={label}
            onPress={() => {
              void selection();
              onSelect(value);
            }}
            style={({ pressed }) => [
              styles.choice,
              {
                backgroundColor: isReviewPrompt ? theme.primaryFill : appSurfaces[mode].interactiveBackground,
                borderColor: isReviewPrompt ? theme.primaryFill : appSurfaces[mode].interactiveBorder,
              },
              (pressed || disabled) && styles.pressed,
            ]}
          >
            <Text style={[styles.choiceCopy, { color: isReviewPrompt ? theme.primaryText : theme.ink }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ReviewCard({ accepted, onAccepted, onBuild, onDecline, onLegal, review, sending, theme }: { accepted: boolean; onAccepted: () => void; onBuild: () => void; onDecline: () => void; onLegal: (value: 'terms' | 'privacy') => void; review: NonNullable<ReturnType<typeof consultationReview>>['consultation']; sending: boolean; theme: ReturnType<typeof useFlyntTheme>['theme'] }) {
  return <View style={[styles.reviewCard, { backgroundColor: theme.raised }]}><Text style={[styles.eyebrow, { color: theme.muted }]}>CONSULTATION SUMMARY</Text><Text selectable style={[styles.reviewSummary, { color: theme.ink }]}>{review.summary}</Text>{review.coachingPriorities.map((item) => <View key={item} style={styles.priority}><View style={styles.priorityIcon}><NativeSymbol color={theme.muted} name="checkmark" size={14} /></View><Text style={[styles.body, styles.priorityCopy, { color: theme.ink }]}>{item}</Text></View>)}<View style={styles.termsRow}><Pressable accessibilityLabel="Accept Terms and Privacy Notice" accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} onPress={onAccepted} style={styles.checkboxTarget}><View style={[styles.checkbox, { backgroundColor: accepted ? theme.primaryFill : 'transparent', borderColor: accepted ? theme.primaryFill : theme.line }]}>{accepted ? <NativeSymbol color={theme.primaryText} name="checkmark" size={13} /> : null}</View></Pressable><View style={styles.termsCopy}><Text style={{ color: theme.muted }}>I agree to FLYNT&apos;s notices.</Text><View style={styles.legalLinks}><Pressable accessibilityRole="button" onPress={() => onLegal('terms')} style={styles.legalLink}><Text style={{ color: theme.ink, textDecorationLine: 'underline' }}>Terms &amp; Safety Notice</Text></Pressable><Pressable accessibilityRole="button" onPress={() => onLegal('privacy')} style={styles.legalLink}><Text style={{ color: theme.ink, textDecorationLine: 'underline' }}>Privacy Notice</Text></Pressable></View></View></View><Pressable accessibilityRole="button" disabled={!accepted || sending} onPress={onBuild} style={[styles.primaryButton, { backgroundColor: theme.primaryFill, opacity: accepted && !sending ? 1 : 0.4 }]}>{sending ? <ActivityIndicator color={theme.primaryText} /> : <Text style={[styles.primaryCopy, { color: theme.primaryText }]}>Build my program</Text>}</Pressable><Pressable accessibilityRole="button" disabled={sending} onPress={onDecline} style={styles.textButton}><Text style={[styles.textButtonCopy, { color: theme.ink }]}>Add or change something</Text></Pressable></View>;
}

function LegalSheet({ isPresented, kind, onDismiss }: { isPresented: boolean; kind: 'terms' | 'privacy'; onDismiss: () => void }) {
  const { theme } = useFlyntTheme();
  return <FlyntSheet eyebrow="EFFECTIVE JULY 27, 2026" isPresented={isPresented} onDismiss={onDismiss} title={kind === 'terms' ? 'Terms & Safety Notice' : 'Privacy Notice'}>{kind === 'terms' ? <View style={styles.legalContent}><Text style={[styles.body, { color: theme.ink }]}>FLYNT uses artificial intelligence to provide personalized training recommendations. AI output can be incomplete or wrong, and it is not medical advice, diagnosis, rehabilitation, or emergency guidance.</Text><LegalSection body="Use accurate information, appropriate equipment, sound judgment, and a safe environment. Stop an exercise for sharp, severe, radiating, worsening, traumatic, or neurologic symptoms. Consult a physician or qualified clinician when health or injury risk may affect exercise." title="Train within your limits" /><LegalSection body="Trainer changes are recommendations. FLYNT shows proposed program changes for your approval before applying them. You may reject or edit any proposal." title="You stay in control" /><LegalSection body="Exercise carries inherent risks, including soreness and injury. FLYNT cannot guarantee safety, performance, physique, or health outcomes." title="Training involves risk" /></View> : <View style={styles.legalContent}><Text style={[styles.body, { color: theme.ink }]}>FLYNT stores the account, consultation answers, training plan, completed sets, progress, and settings needed to operate and personalize the app.</Text><LegalSection body="Relevant profile and training context may be sent to our AI service providers to generate plans and Trainer responses. FLYNT does not use health or training information for advertising or sell it to data brokers." title="How your data is used" /><LegalSection body="Signed-in data is stored with our infrastructure providers, including Supabase and Vercel. Account data is isolated by user. You can sign out, export your data, or permanently delete your account from App settings." title="Storage and control" /></View>}</FlyntSheet>;
}
function LegalSection({ body, title }: { body: string; title: string }) { const { theme } = useFlyntTheme(); return <View style={styles.legalSection}><Text style={[styles.legalTitle, { color: theme.ink }]}>{title}</Text><Text style={[styles.body, { color: theme.muted }]}>{body}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1 }, safeArea: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { height: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, topBarPlaceholder: { width: 44, height: 44 },
  setupContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }, progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }, progressCount: { fontSize: 13, fontWeight: '600' }, progressTrack: { height: 3, borderRadius: 2, marginTop: spacing.sm, overflow: 'hidden' }, progressFill: { height: 3 },
  welcome: { flex: 1, justifyContent: 'center', gap: spacing.lg, paddingVertical: spacing.xl }, welcomeMarkFrame: { width: 72, height: 72, alignItems: 'flex-start', justifyContent: 'center' }, welcomeMark: { width: 47, height: 72, resizeMode: 'contain' }, title: { ...type.title }, body: { ...type.body }, caption: { fontSize: 13, lineHeight: 18, textAlign: 'center' }, eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.3 },
  setupStack: { gap: spacing.md, marginTop: spacing.xl }, fieldGroup: { gap: 7 }, fieldLabel: { fontSize: 14, lineHeight: 19, fontWeight: '600' }, field: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 17 }, metricField: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, metricValue: { fontSize: 17, lineHeight: 22 },
  option: { minHeight: 88, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', padding: spacing.md }, optionCopy: { flex: 1, gap: 4 }, optionTitle: { fontSize: 17, lineHeight: 22, fontWeight: '600' }, optionDetail: { fontSize: 14, lineHeight: 20 }, selectionIndicator: { width: 28, height: 28, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
  pickerHelper: { ...type.body, textAlign: 'center' }, pickerHost: { height: 160, marginTop: spacing.md }, heightPickers: { flexDirection: 'row', marginTop: spacing.md }, heightPickerHost: { flex: 1, height: 160 }, pickerFooter: { paddingHorizontal: 18, paddingTop: spacing.sm, paddingBottom: spacing.md }, pickerDone: { minHeight: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  setupActions: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg }, setupContinue: { minWidth: 132, minHeight: 50, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primaryButton: { minHeight: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg }, primaryCopy: { ...type.button }, textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm }, textButtonCopy: { fontSize: 15, lineHeight: 20, fontWeight: '600' }, pressed: { opacity: 0.7 }, error: { fontSize: 14, lineHeight: 20 },
  unavailable: { flex: 1, justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  promptCard: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm }, promptHelper: { fontSize: 14, lineHeight: 20 }, choices: { gap: spacing.xs }, choice: { minHeight: 48, borderWidth: 1, borderRadius: radius.md, justifyContent: 'center', paddingHorizontal: spacing.md }, choiceCopy: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  errorCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.md }, errorActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  reviewCard: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.md }, reviewSummary: { fontSize: 17, lineHeight: 25, fontWeight: '400' }, priority: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, priorityIcon: { width: 20, height: 25, paddingTop: 5, alignItems: 'center' }, priorityCopy: { flex: 1 }, termsRow: { minHeight: 56, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, paddingVertical: spacing.xs }, checkboxTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, checkbox: { width: 28, height: 28, borderWidth: 1.5, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, termsCopy: { flex: 1, gap: 4, paddingTop: 4 }, legalLinks: { gap: 2 }, legalLink: { minHeight: 44, justifyContent: 'center' },
  legalContent: { gap: spacing.lg }, legalSection: { gap: spacing.xs }, legalTitle: { fontSize: 18, lineHeight: 23, fontWeight: '600' },
});
