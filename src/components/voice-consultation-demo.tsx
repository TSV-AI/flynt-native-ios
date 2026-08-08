import {
  ConversationProvider,
  type ConversationProviderProps,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from '@elevenlabs/react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import type { IMessage, MessageProps } from '@kesha-antonov/react-native-chat';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FlyntElevenLabsOrb, type FlyntElevenLabsOrbState } from 'flynt-elevenlabs-orb';

import { GlassSymbolButton, GlassTextButton, NativeSymbol } from '@/components/native-symbol';
import { FlyntSheetCard } from '@/components/flynt-sheet';
import { NativeMaterialSheet } from '@/components/native-material-sheet';
import {
  FlyntChatComposerOverlay,
  FlyntChatThread,
  FlyntUserMessage,
  flyntAthlete,
  flyntTrainer,
} from '@/components/flynt-chat-thread';
import { FlyntChatInputToolbar } from '@/components/trainer-composer-accessory';
import { motion } from '@/constants/motion';
import { flyntInvertedSheetPresentation } from '@/constants/sheet';
import { appSurfaces, palette, radius, spacing, themeFor, type } from '@/constants/theme';
import { parseVoiceDemoPlan, type VoiceDemoPlan, type VoiceDemoPlanDelivery } from '@/features/voice-demo-plan';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { deliberateAction, selection } from '@/lib/haptics';
import { composerMinimumHeight, consultationComposerMaximumHeight } from '@/lib/composer-layout';
import {
  elevenLabsReviewConsultationTool,
  parseElevenLabsConsultationParameters,
} from '@/contracts/elevenlabs-consultation';
import type { CompletedConsultation } from '@/contracts/app-state';
import { confirmConsultation } from '@/lib/api-client';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

const defaultAgentId = 'agent_3501kzcymvw5fs0tqcp946q4e11d';
const demoAgentId = process.env.EXPO_PUBLIC_ELEVENLABS_DEMO_AGENT_ID ?? defaultAgentId;
const orbRestingSize = 214;
const demoTopbarHeight = 64;
const consultationReviewSheetPresentation = flyntInvertedSheetPresentation({ fraction: 0.75 });

type TranscriptItem = {
  id: string;
  message: string;
  role: 'agent' | 'user';
};

type CallLayout = 'orb' | 'split';
type ConsultationMode = 'message' | 'voice';
type DemoChatMessage = IMessage & {
  kind: 'assistant' | 'user';
};

const audioDirectionTag = /\s*\[(?:empathetically|confidently|warmly|excitedly|patiently|enthusiastically|seriously|chuckles|laughing|sighs)\]\s*/gi;

function visibleTranscriptMessage(message: string) {
  return message.replace(audioDirectionTag, ' ').replace(/\s{2,}/g, ' ').trim();
}

function deduplicatedTranscript(items: TranscriptItem[]) {
  return items.filter((item, index) => {
    const previous = items[index - 1];
    return !previous
      || previous.role !== item.role
      || visibleTranscriptMessage(previous.message) !== visibleTranscriptMessage(item.message);
  });
}

function consultationValidationIssues(issues: Array<{ message: string; path: PropertyKey[] }>) {
  return issues
    .slice(0, 8)
    .map((issue) => `${issue.path.length ? issue.path.join('.') : 'consultation'}: ${issue.message}`)
    .join('; ');
}

function ConsultationReviewSheet({
  approved,
  consultation,
  error,
  isPresented,
  mode,
  onApprove,
  onContinue,
}: {
  approved: boolean;
  consultation: CompletedConsultation;
  error: string | null;
  isPresented: boolean;
  mode: 'light' | 'dark';
  onApprove: () => void;
  onContinue: () => void;
}) {
  const { fontScale, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetMode = mode === 'light' ? 'dark' : 'light';
  const theme = themeFor(sheetMode);
  const sheetHeight = Math.round((height - insets.top) * (fontScale >= 1.35 ? 0.94 : 0.75));
  return (
    <NativeMaterialSheet
      colorScheme={sheetMode}
      isPresented={isPresented}
      onDismiss={onContinue}
      presentationOverride={consultationReviewSheetPresentation}
    >
      <View style={[styles.reviewSheetScreen, { height: sheetHeight }]}>
        <SafeAreaView edges={['bottom']} style={styles.reviewSheetSafeArea}>
          <View style={styles.reviewSheetHeader}>
            <View style={styles.reviewSheetHeaderCopy}>
              <Text style={[styles.reviewSheetEyebrow, { color: theme.muted }]}>INITIAL CONSULTATION</Text>
              <Text accessibilityRole="header" style={[styles.reviewSheetTitle, { color: theme.ink }]}>Review your consultation</Text>
            </View>
            <GlassSymbolButton
              accessibilityLabel="Keep talking with FLYNT"
              color={theme.ink}
              colorScheme={sheetMode}
              name="xmark"
              onPress={onContinue}
            />
          </View>
          <View style={styles.reviewSheetBody}>
            <ScrollView
              contentContainerStyle={styles.reviewSheetScroll}
              showsVerticalScrollIndicator={false}
              style={styles.reviewSheetScroller}
            >
              <FlyntSheetCard mode={sheetMode} style={styles.reviewSheetCard}>
                <Text style={[styles.reviewSummary, { color: theme.ink }]}>{consultation.summary}</Text>
                <View style={[styles.reviewDivider, { backgroundColor: theme.line }]} />
                <View style={styles.reviewFactGroup}>
                  <Text style={[styles.reviewFactLabel, { color: theme.muted }]}>GOALS</Text>
                  <Text style={[styles.reviewDetail, { color: theme.ink }]}>{consultation.objectives.primaryGoals.join(', ')}</Text>
                </View>
                <View style={styles.reviewFactGroup}>
                  <Text style={[styles.reviewFactLabel, { color: theme.muted }]}>SCHEDULE</Text>
                  <Text style={[styles.reviewDetail, { color: theme.ink }]}>{consultation.schedule.daysPerWeek} days per week, {consultation.schedule.sessionMinutes} minutes per session</Text>
                </View>
                <View style={styles.reviewFactGroup}>
                  <Text style={[styles.reviewFactLabel, { color: theme.muted }]}>TRAINING</Text>
                  <Text style={[styles.reviewDetail, { color: theme.ink }]}>Coached at {consultation.equipmentProfile.environment.replaceAll('_', ' ')}</Text>
                </View>
              </FlyntSheetCard>
            </ScrollView>
            <View style={[styles.reviewSheetFooter, { borderTopColor: theme.line }]}>
              {error ? (
                <Text accessibilityRole="alert" style={[styles.reviewApprovalError, { color: theme.danger }]}>
                  {error}
                </Text>
              ) : null}
              <Pressable
                accessibilityLabel="Keep talking with FLYNT"
                accessibilityRole="button"
                disabled={approved}
                onPress={onContinue}
                style={({ pressed }) => [styles.reviewContinueButton, pressed && styles.pressed, approved && styles.disabled]}
              >
                <Text style={[styles.reviewContinueCopy, { color: theme.ink }]}>Keep talking</Text>
              </Pressable>
              <GlassTextButton
                accessibilityLabel={approved ? 'Consultation approved and program build requested' : 'Approve consultation and build program'}
                color={theme.ink}
                colorScheme={sheetMode}
                disabled={approved}
                label={approved ? 'Starting...' : 'Approve and build'}
                onPress={onApprove}
                prominence="prominent"
                state={approved ? 'loading' : 'idle'}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </NativeMaterialSheet>
  );
}

export function VoiceConsultationDemo() {
  const router = useRouter();
  const { appState, refresh } = useLifecycleNavigation();
  const [plan, setPlan] = useState<VoiceDemoPlan | null>(null);
  const [planJson, setPlanJson] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [consultationReview, setConsultationReview] = useState<CompletedConsultation | null>(null);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  const appendTranscript = useCallback((message: string, role: TranscriptItem['role']) => {
    setTranscript((current) => {
      const previous = current.at(-1);
      if (
        previous?.role === role
        && visibleTranscriptMessage(previous.message) === visibleTranscriptMessage(message)
      ) return current;

      return [
        ...current,
        { id: `${Date.now()}:${current.length}`, message, role },
      ];
    });
  }, []);

  const clientTools = useMemo(() => ({
    [elevenLabsReviewConsultationTool.name]: async (parameters: Record<string, unknown>) => {
      const consultation = parseElevenLabsConsultationParameters(parameters);
      if (!consultation.success) {
        const issues = consultationValidationIssues(consultation.error.issues);
        setDeliveryError(`FLYNT could not prepare the consultation review. ${issues}`);
        return `FLYNT rejected the review payload. Correct these schema version 1.0 fields and call review_consultation again: ${issues}`;
      }
      setConsultationReview(consultation.data);
      setApprovalSubmitting(false);
      setDeliveryError(null);
      return 'FLYNT displayed the native consultation review sheet. Wait for the athlete to approve it or continue the conversation.';
    },
    deliver_demo_plan: (parameters: VoiceDemoPlanDelivery) => {
      try {
        const deliveredPlan = parseVoiceDemoPlan(parameters);
        setPlan(deliveredPlan);
        setPlanJson(JSON.stringify(deliveredPlan, null, 2));
        setDeliveryError(null);
        return 'FLYNT received and validated the demo plan JSON.';
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The plan JSON was invalid.';
        setDeliveryError('FLYNT could not validate the plan JSON. Ask the agent to try the handoff again.');
        return `FLYNT rejected the demo plan JSON: ${message}`;
      }
    },
  }), []);

  const resetDemo = useCallback(() => {
    setPlan(null);
    setPlanJson(null);
    setDeliveryError(null);
    setSessionError(null);
    setTranscript([]);
    setSessionStarted(false);
    setConsultationReview(null);
    setApprovalSubmitting(false);
  }, []);

  const markSessionStarted = useCallback(() => {
    setTranscript([]);
    setSessionStarted(true);
  }, []);

  return (
    <GestureHandlerRootView style={styles.screen}>
      <ConversationProvider
        agentId={demoAgentId}
        onConnect={() => setSessionError(null)}
        onError={(message) => setSessionError(message || 'The consultation could not connect.')}
        onMessage={({ message, role }) => appendTranscript(message, role)}
        onUnhandledClientToolCall={({ tool_name: toolName }) => {
          setSessionError(`FLYNT could not handle the ${toolName} consultation action.`);
        }}
      >
        <VoiceConsultationDemoScreen
          clientTools={clientTools}
          deliveryError={deliveryError}
          flyntConversationId={appState?.conversation?.kind === 'consultation' ? appState.conversation.id : null}
          consultationReview={consultationReview}
          reviewApproved={approvalSubmitting}
          onApproveReview={async (consultation) => {
            const conversation = appState?.conversation;
            if (!conversation || conversation.kind !== 'consultation') {
              setDeliveryError('FLYNT could not find the consultation session. Start the consultation again.');
              return;
            }
            setApprovalSubmitting(true);
            setDeliveryError(null);
            try {
              await confirmConsultation(consultation, conversation.id);
              await refresh();
              router.replace('/program-building');
            } catch (error) {
              setApprovalSubmitting(false);
              setDeliveryError(error instanceof Error ? error.message : 'Your program could not be started.');
            }
          }}
          onContinueReview={() => {
            setConsultationReview(null);
            setApprovalSubmitting(false);
          }}
          onReset={resetDemo}
          onLocalUserMessage={(message) => appendTranscript(message, 'user')}
          onSessionStarted={markSessionStarted}
          plan={plan}
          planJson={planJson}
          sessionError={sessionError}
          sessionStarted={sessionStarted}
          transcript={transcript}
        />
      </ConversationProvider>
    </GestureHandlerRootView>
  );
}

function VoiceConsultationDemoScreen({
  clientTools,
  consultationReview,
  deliveryError,
  flyntConversationId,
  onApproveReview,
  onContinueReview,
  onLocalUserMessage,
  onReset,
  onSessionStarted,
  plan,
  planJson,
  reviewApproved,
  sessionError,
  sessionStarted,
  transcript,
}: {
  clientTools: NonNullable<ConversationProviderProps['clientTools']>;
  consultationReview: CompletedConsultation | null;
  deliveryError: string | null;
  flyntConversationId: string | null;
  onLocalUserMessage: (message: string) => void;
  onApproveReview: (consultation: CompletedConsultation) => Promise<void>;
  onContinueReview: () => void;
  onReset: () => void;
  onSessionStarted: () => void;
  plan: VoiceDemoPlan | null;
  planJson: string | null;
  reviewApproved: boolean;
  sessionError: string | null;
  sessionStarted: boolean;
  transcript: TranscriptItem[];
}) {
  const router = useRouter();
  const { mode, theme } = useFlyntTheme();
  const insets = useSafeAreaInsets();
  const { startSession, endSession, getInputVolume, getOutputVolume, sendUserMessage } = useConversationControls();
  const { isMuted, setMuted } = useConversationInput();
  const { isSpeaking, isListening } = useConversationMode();
  const { status } = useConversationStatus();
  const [showJson, setShowJson] = useState(false);
  const [audioLevels, setAudioLevels] = useState({ input: 0, output: 0 });
  const [callLayout, setCallLayout] = useState<CallLayout>('orb');
  const [consultationMode, setConsultationMode] = useState<ConsultationMode>('voice');
  const [showsConsultationIntroduction, setShowsConsultationIntroduction] = useState(true);
  const [formatMounted, setFormatMounted] = useState(false);
  const [sessionTransitioning, setSessionTransitioning] = useState(false);
  const [flowWidth, setFlowWidth] = useState(0);
  const [previewAnimationActive, setPreviewAnimationActive] = useState(true);
  const [formatPageWidth, setFormatPageWidth] = useState(0);
  const [formatSelectorWidth, setFormatSelectorWidth] = useState(0);
  const [message, setMessage] = useState('');
  const [composerHeight, setComposerHeight] = useState(composerMinimumHeight);
  const voiceTranscriptRef = useRef<ScrollView>(null);
  const shouldUnmuteOnConnect = useRef(false);
  const reduceMotion = useReducedMotion();
  const introductionProgress = useSharedValue(0);
  const sessionProgress = useSharedValue(0);
  const composerEntryProgress = useSharedValue(0);
  const formatTranslateX = useSharedValue(0);
  const formatGestureStartX = useSharedValue(0);
  const formatSettledPage = useSharedValue(0);
  const connected = status === 'connected';
  const connecting = status === 'connecting';
  const displayedAudioLevels = connected ? audioLevels : { input: 0, output: 0 };
  const orbState: FlyntElevenLabsOrbState = connecting
    ? 'connecting'
    : connected
      ? isSpeaking
        ? 'speaking'
        : isListening
          ? 'listening'
          : 'thinking'
      : sessionStarted
        ? 'disconnected'
        : 'unknown';
  const nextCallLayout = callLayout === 'orb' ? 'split' : 'orb';
  const fullBleedMessageSession = sessionStarted && consultationMode === 'message';

  const finishIntroductionTransition = useCallback(() => {
    setShowsConsultationIntroduction(false);
  }, []);

  const finishReturnToIntroduction = useCallback(() => {
    setFormatMounted(false);
  }, []);

  const finishSessionTransition = useCallback(() => {
    setSessionTransitioning(false);
  }, []);

  const showFormatChoice = useCallback(() => {
    void selection();
    setFormatMounted(true);
    requestAnimationFrame(() => {
      introductionProgress.value = withTiming(
        1,
        { duration: reduceMotion ? 0 : motion.duration.deliberate },
        (finished) => {
          if (finished) runOnJS(finishIntroductionTransition)();
        },
      );
    });
  }, [finishIntroductionTransition, introductionProgress, reduceMotion]);

  const showIntroduction = useCallback(() => {
    void selection();
    setShowsConsultationIntroduction(true);
    requestAnimationFrame(() => {
      introductionProgress.value = withTiming(
        0,
        { duration: reduceMotion ? 0 : motion.duration.deliberate },
        (finished) => {
          if (finished) runOnJS(finishReturnToIntroduction)();
        },
      );
    });
  }, [finishReturnToIntroduction, introductionProgress, reduceMotion]);

  const discardSessionToFormat = useCallback(() => {
    if (connected || connecting) endSession();
    onReset();
    sessionProgress.set(0);
    setSessionTransitioning(false);
    setShowsConsultationIntroduction(false);
    setFormatMounted(true);
    setCallLayout('orb');
  }, [connected, connecting, endSession, onReset, sessionProgress]);

  useEffect(() => {
    if (consultationMode !== 'voice' || !connected || !shouldUnmuteOnConnect.current) return;

    shouldUnmuteOnConnect.current = false;
    setMuted(false);
  }, [connected, consultationMode, setMuted]);

  useEffect(() => {
    if (consultationMode !== 'voice' || !connected) return;

    const timer = setInterval(() => {
      setAudioLevels({
        input: getInputVolume(),
        output: getOutputVolume(),
      });
    }, 50);
    return () => clearInterval(timer);
  }, [connected, consultationMode, getInputVolume, getOutputVolume]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'background' || !sessionStarted) return;
      if (connected || connecting) endSession();
      onReset();
      introductionProgress.value = 0;
      sessionProgress.value = 0;
      setSessionTransitioning(false);
      setShowsConsultationIntroduction(true);
      setFormatMounted(false);
      setCallLayout('orb');
    });
    return () => subscription.remove();
  }, [connected, connecting, endSession, introductionProgress, onReset, sessionProgress, sessionStarted]);

  useEffect(() => {
    if (consultationMode !== 'voice' || callLayout !== 'split') return;
    requestAnimationFrame(() => voiceTranscriptRef.current?.scrollToEnd({ animated: !reduceMotion }));
  }, [callLayout, consultationMode, reduceMotion, transcript.length]);

  const openSettings = useCallback(() => {
    if (sessionStarted) discardSessionToFormat();
    router.push('/settings');
  }, [discardSessionToFormat, router, sessionStarted]);

  const beginSessionTransition = useCallback(() => {
    setSessionTransitioning(true);
    sessionProgress.set(0);
    sessionProgress.set(withTiming(
      1,
      { duration: reduceMotion ? 0 : motion.duration.deliberate * 2.5 },
      (finished) => {
        if (finished) runOnJS(finishSessionTransition)();
      },
    ));
  }, [finishSessionTransition, reduceMotion, sessionProgress]);

  const startVoiceConsultation = useCallback(() => {
    setConsultationMode('voice');
    beginSessionTransition();
    onSessionStarted();
    void deliberateAction();
    shouldUnmuteOnConnect.current = true;
    startSession({
      agentId: demoAgentId,
      clientTools,
      connectionType: 'webrtc',
      dynamicVariables: {
        platform: 'FLYNT iOS voice consultation demo',
        ...(flyntConversationId ? { flynt_conversation_id: flyntConversationId } : {}),
      },
    });
  }, [beginSessionTransition, clientTools, flyntConversationId, onSessionStarted, startSession]);

  const startMessageConsultation = useCallback(() => {
    setConsultationMode('message');
    beginSessionTransition();
    setMessage('');
    setComposerHeight(composerMinimumHeight);
    shouldUnmuteOnConnect.current = false;
    onSessionStarted();
    void deliberateAction();
    startSession({
      agentId: demoAgentId,
      clientTools,
      connectionType: 'websocket',
      textOnly: true,
      dynamicVariables: {
        platform: 'FLYNT iOS message consultation demo',
        ...(flyntConversationId ? { flynt_conversation_id: flyntConversationId } : {}),
      },
    });
  }, [beginSessionTransition, clientTools, flyntConversationId, onSessionStarted, startSession]);

  const restartConsultation = consultationMode === 'message' ? startMessageConsultation : startVoiceConsultation;

  const sendMessage = useCallback(() => {
    const nextMessage = message.trim();
    if (!connected || !nextMessage) return;
    if (consultationReview) onContinueReview();
    onLocalUserMessage(nextMessage);
    sendUserMessage(nextMessage);
    setMessage('');
    setComposerHeight(composerMinimumHeight);
  }, [connected, consultationReview, message, onContinueReview, onLocalUserMessage, sendUserMessage]);

  const approveSummary = useCallback(() => {
    if (!consultationReview || reviewApproved) return;
    void deliberateAction();
    void onApproveReview(consultationReview);
    setMessage('');
    setComposerHeight(composerMinimumHeight);
  }, [consultationReview, onApproveReview, reviewApproved]);

  const continueReview = useCallback(() => {
    onContinueReview();
    setMessage('I need to change: ');
  }, [onContinueReview]);

  useEffect(() => {
    if (
      consultationMode !== 'message'
      || !sessionStarted
      || sessionTransitioning
      || !connected
    ) {
      composerEntryProgress.value = 0;
      return;
    }

    composerEntryProgress.value = withTiming(1, {
      duration: reduceMotion ? 0 : motion.duration.standard,
    });
  }, [composerEntryProgress, connected, consultationMode, reduceMotion, sessionStarted, sessionTransitioning]);

  const composerEntryStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: reduceMotion
        ? 0
        : interpolate(
          composerEntryProgress.value,
          [0, 1],
          [spacing.hero, 0],
          Extrapolation.CLAMP,
        ),
    }],
  }));

  const textChatMessages = useMemo<DemoChatMessage[]>(() => deduplicatedTranscript(transcript).map((item, index) => ({
    _id: item.id,
    createdAt: index,
    kind: item.role === 'user' ? 'user' : 'assistant',
    text: visibleTranscriptMessage(item.message),
    user: item.role === 'user' ? flyntAthlete : flyntTrainer,
  })), [transcript]);

  const renderTextMessage = useCallback(({ currentMessage }: MessageProps<DemoChatMessage>) => (
    currentMessage.kind === 'user'
      ? <FlyntUserMessage text={currentMessage.text} />
      : <TypedAgentMessage message={currentMessage.text} />
  ), []);

  const renderTextError = useCallback(() => sessionError || deliveryError ? (
    <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>
      {sessionError ?? deliveryError}
    </Text>
  ) : null, [deliveryError, sessionError, theme.danger]);

  const renderTextComposer = useCallback(() => (
    <Animated.View style={composerEntryStyle}>
      <FlyntChatInputToolbar
        accessibilityLabel="Message FLYNT"
        composerHeight={composerHeight}
        maximumHeight={consultationComposerMaximumHeight}
        message={message}
        onChangeMessage={setMessage}
        onComposerHeightChange={setComposerHeight}
        onSend={sendMessage}
        placeholder="Message FLYNT"
      />
    </Animated.View>
  ), [composerEntryStyle, composerHeight, message, sendMessage]);

  const renderTextInputToolbar = useCallback(() => {
    if (connecting || connected) return null;
    return (
    <View style={styles.messageRestartRow}>
      <Pressable
        accessibilityLabel="Start consultation again"
        accessibilityRole="button"
        onPress={restartConsultation}
        style={({ pressed }) => [
          styles.restartControl,
          { backgroundColor: theme.primaryFill },
          pressed && styles.pressed,
        ]}
      >
        <NativeSymbol color={theme.primaryText} name="arrow.clockwise" size={24} />
      </Pressable>
    </View>
    );
  }, [connected, connecting, restartConsultation, theme.primaryFill, theme.primaryText]);

  function commitFormatMode(nextMode: ConsultationMode, shouldHaptic: boolean) {
    if (shouldHaptic) void selection();
    setConsultationMode(nextMode);
    setPreviewAnimationActive(nextMode === 'voice');
  }

  function selectConsultationMode(nextMode: ConsultationMode) {
    if (nextMode === consultationMode || !formatPageWidth) return;
    void selection();
    const targetPage = nextMode === 'voice' ? 0 : 1;
    formatSettledPage.value = targetPage;
    setConsultationMode(nextMode);
    formatTranslateX.value = withTiming(
      -targetPage * formatPageWidth,
      { duration: reduceMotion ? 0 : motion.duration.standard },
      (finished) => {
        if (finished) runOnJS(commitFormatMode)(nextMode, false);
      },
    );
  }

  const formatPanGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      formatGestureStartX.value = formatTranslateX.value;
    })
    .onUpdate((event) => {
      if (!formatPageWidth) return;
      const proposedOffset = formatGestureStartX.value + event.translationX;
      formatTranslateX.value = Math.max(-formatPageWidth, Math.min(0, proposedOffset));
    })
    .onEnd((event) => {
      if (!formatPageWidth) return;
      const projectedOffset = formatTranslateX.value + event.velocityX * 0.12;
      const targetPage = projectedOffset <= -formatPageWidth / 2 ? 1 : 0;
      formatTranslateX.value = withTiming(
        -targetPage * formatPageWidth,
        { duration: reduceMotion ? 0 : motion.duration.standard },
        (finished) => {
          if (!finished || targetPage === formatSettledPage.value) return;
          formatSettledPage.value = targetPage;
          runOnJS(commitFormatMode)(targetPage === 0 ? 'voice' : 'message', true);
        },
      );
    });

  const formatRailStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: formatTranslateX.value }],
  }));
  const selectionPillStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        -formatTranslateX.value,
        [0, Math.max(formatPageWidth, 1)],
        [0, Math.max((formatSelectorWidth - 4) / 2, 0)],
        Extrapolation.CLAMP,
      ),
    }],
  }));
  const introductionLayerStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? interpolate(introductionProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP)
      : 1,
    transform: [{
      translateX: reduceMotion
        ? 0
        : interpolate(
          introductionProgress.value,
          [0, 1],
          [0, -flowWidth],
          Extrapolation.CLAMP,
        ),
    }],
  }));
  const formatLayerStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? interpolate(introductionProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP)
      : 1,
    transform: [{
      translateX: reduceMotion
        ? 0
        : interpolate(
          introductionProgress.value,
          [0, 1],
          [flowWidth, 0],
          Extrapolation.CLAMP,
        ),
    }],
  }));
  const formatHeaderExitStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sessionProgress.value, [0, 0.62], [1, 0], Extrapolation.CLAMP),
    transform: [{
      translateY: reduceMotion
        ? 0
        : interpolate(sessionProgress.value, [0, 0.62], [0, -72], Extrapolation.CLAMP),
    }],
  }));
  const formatActionsExitStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sessionProgress.value, [0, 0.62], [1, 0], Extrapolation.CLAMP),
    transform: [{
      translateY: reduceMotion
        ? 0
        : interpolate(sessionProgress.value, [0, 0.62], [0, 96], Extrapolation.CLAMP),
    }],
  }));
  const formatPreviewExitStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sessionProgress.value, [0, 0.1, 0.48], [1, 1, 0], Extrapolation.CLAMP),
  }));
  const sharedOrbAnchorStyle = useAnimatedStyle(() => ({
    opacity: sessionStarted
      ? 1
      : interpolate(
        -formatTranslateX.value,
        [0, Math.max(formatPageWidth * 0.62, 1)],
        [1, 0],
        Extrapolation.CLAMP,
      ),
    transform: [
      {
        translateX: sessionStarted ? 0 : formatTranslateX.value,
      },
      {
        scale: reduceMotion
          ? 1
        : interpolate(
          sessionProgress.value,
          [0, 0.3, 1],
          [1, 1.065, 1],
            Extrapolation.CLAMP,
          ),
      },
    ],
  }));
  const previewOrbDissolveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sessionProgress.value, [0, 0.3, 0.8], [1, 1, 0], Extrapolation.CLAMP),
  }));
  const liveOrbDissolveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sessionProgress.value, [0, 0.42, 1], [0, 0, 1], Extrapolation.CLAMP),
  }));
  const sessionLayerStyle = useAnimatedStyle(() => ({
    opacity: consultationMode === 'message'
      ? interpolate(sessionProgress.value, [0, 0.52, 0.9], [0, 0, 1], Extrapolation.CLAMP)
      : interpolate(sessionProgress.value, [0, 0.35, 1], [0, 0, 1], Extrapolation.CLAMP),
  }));
  const sessionControlsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sessionProgress.value, [0, 0.42, 1], [0, 0, 1], Extrapolation.CLAMP),
    transform: [{
      translateY: reduceMotion
        ? 0
        : interpolate(sessionProgress.value, [0.42, 1], [18, 0], Extrapolation.CLAMP),
    }],
  }));

  if (plan && !connected && !connecting) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.canvas }]}>
        <DemoTopbar onOpenSettings={openSettings} />
        <ScrollView contentContainerStyle={styles.planContent}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>VOICE DEMO PLAN</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{plan.title}</Text>
          <Text style={[styles.body, { color: theme.muted }]}>{plan.summary}</Text>
          <View style={styles.planDays}>
            {plan.days.map((day, dayIndex) => (
              <View key={`${day.day}:${dayIndex}`} style={[styles.planCard, { backgroundColor: appSurfaces[mode].itemBackground }]}>
                <Text style={[styles.dayEyebrow, { color: theme.muted }]}>{day.day.toUpperCase()}</Text>
                <Text style={[styles.dayTitle, { color: theme.ink }]}>{day.focus}</Text>
                <View style={styles.exercises}>
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <View key={`${exercise.name}:${exerciseIndex}`} style={[styles.exerciseRow, exerciseIndex > 0 && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
                      <View style={styles.exerciseIndex}><Text style={[styles.exerciseIndexCopy, { color: theme.muted }]}>{String(exerciseIndex + 1).padStart(2, '0')}</Text></View>
                      <View style={styles.exerciseCopy}>
                        <Text style={[styles.exerciseName, { color: theme.ink }]}>{exercise.name}</Text>
                        <Text style={[styles.exercisePrescription, { color: theme.muted }]}>{exercise.sets} sets · {exercise.reps}{exercise.restSeconds !== undefined ? ` · ${exercise.restSeconds}s rest` : ''}</Text>
                        {exercise.note ? <Text style={[styles.exerciseNote, { color: theme.muted }]}>{exercise.note}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
          {plan.guidance.length ? (
            <View style={[styles.guidanceCard, { borderColor: theme.line }]}>
              <Text style={[styles.dayTitle, { color: theme.ink }]}>Plan notes</Text>
              {plan.guidance.map((item) => <Text key={item} style={[styles.guidanceItem, { color: theme.muted }]}>• {item}</Text>)}
            </View>
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => setShowJson((current) => !current)} style={styles.jsonToggle}>
            <Text style={[styles.textButtonCopy, { color: theme.ink }]}>{showJson ? 'Hide JSON' : 'View JSON'}</Text>
            <NativeSymbol color={theme.ink} name={showJson ? 'chevron.up' : 'chevron.down'} size={14} />
          </Pressable>
          {showJson && planJson ? <Text selectable style={[styles.json, { backgroundColor: appSurfaces[mode].itemBackground, color: theme.ink }]}>{planJson}</Text> : null}
          <Pressable accessibilityRole="button" onPress={onReset} style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.primaryFill }, pressed && styles.pressed]}>
            <Text style={[styles.primaryCopy, { color: theme.primaryText }]}>Start another demo</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={fullBleedMessageSession ? [] : undefined}
      style={[styles.screen, { backgroundColor: theme.canvas }]}
    >
      <DemoTopbar
        backLabel={sessionStarted
          ? 'Discard consultation and return to format choice'
          : 'Return to introduction'}
        onBack={sessionStarted
          ? discardSessionToFormat
          : formatMounted && !showsConsultationIntroduction
            ? showIntroduction
            : undefined}
        onOpenSettings={sessionStarted ? undefined : openSettings}
        overlaysContent={fullBleedMessageSession}
      />
      {fullBleedMessageSession ? (
        <View
          pointerEvents="none"
          style={[
            styles.statusBarScrim,
            {
              height: insets.top + spacing.sm,
              experimental_backgroundImage: `linear-gradient(180deg, ${appSurfaces[mode].edgeScrim} 0%, ${appSurfaces[mode].edgeScrim} 34%, transparent 100%)`,
            },
          ]}
        />
      ) : null}
      <View
        onLayout={({ nativeEvent }) => setFlowWidth(nativeEvent.layout.width)}
        style={styles.flowViewport}
      >
        {showsConsultationIntroduction ? (
          <Animated.View style={[styles.flowLayer, introductionLayerStyle]}>
            <ConsultationIntroduction onStart={showFormatChoice} />
          </Animated.View>
        ) : null}
        {formatMounted && (!sessionStarted || sessionTransitioning) ? (
          <Animated.View
            pointerEvents={sessionStarted ? 'none' : 'auto'}
            style={[styles.flowLayer, formatLayerStyle]}
          >
            <ScrollView contentContainerStyle={styles.formatContent} showsVerticalScrollIndicator={false}>
            <GestureDetector gesture={formatPanGesture}>
              <View onLayout={({ nativeEvent }) => setFormatPageWidth(nativeEvent.layout.width)} style={styles.formatCarousel}>
                <Animated.View style={[styles.formatRail, formatRailStyle]}>
                  <FormatChoicePage
                    headerStyle={formatHeaderExitStyle}
                    mode="voice"
                    pageWidth={formatPageWidth}
                  />
                  <FormatChoicePage
                    headerStyle={formatHeaderExitStyle}
                    mode="message"
                    pageWidth={formatPageWidth}
                    previewStyle={formatPreviewExitStyle}
                  />
                </Animated.View>
              </View>
            </GestureDetector>
            <Animated.View style={[styles.formatActions, formatActionsExitStyle]}>
              <View
                accessibilityLabel="Consultation format"
                onLayout={({ nativeEvent }) => setFormatSelectorWidth(nativeEvent.layout.width)}
                style={[styles.formatSelector, { backgroundColor: appSurfaces[mode].itemBackground, borderColor: theme.line }]}
              >
                {formatSelectorWidth > 0 ? (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.formatSelectionPill,
                      {
                        backgroundColor: appSurfaces[mode].interactiveBackground,
                        width: (formatSelectorWidth - 12) / 2,
                      },
                      selectionPillStyle,
                    ]}
                  />
                ) : null}
                {(['voice', 'message'] as const).map((option) => {
                  const selected = consultationMode === option;
                  const label = option === 'voice' ? 'Talk' : 'Text';
                  return (
                    <Pressable
                      accessibilityLabel={label}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={option}
                      onPress={() => {
                        selectConsultationMode(option);
                      }}
                      style={({ pressed }) => [
                        styles.formatOption,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.formatOptionCopy, { color: selected ? theme.ink : theme.muted }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                accessibilityLabel={consultationMode === 'voice' ? 'Start talking' : 'Start texting'}
                accessibilityRole="button"
                disabled={sessionTransitioning}
                onPress={consultationMode === 'voice' ? startVoiceConsultation : startMessageConsultation}
                style={({ pressed }) => [styles.formatStart, { backgroundColor: theme.primaryFill }, pressed && styles.pressed, sessionTransitioning && styles.disabled]}
              >
                <Text style={[styles.formatStartCopy, { color: theme.primaryText }]}>
                  {consultationMode === 'voice' ? 'Start talking' : 'Start texting'}
                </Text>
              </Pressable>
            </Animated.View>
            </ScrollView>
          </Animated.View>
        ) : null}
        {sessionStarted ? (
          <Animated.View
            pointerEvents={sessionTransitioning ? 'none' : 'auto'}
            style={[styles.flowLayer, sessionLayerStyle]}
          >
          {consultationMode === 'message' ? (
          <View style={styles.messageSession}>
            <Animated.View style={[styles.messageChat, sessionControlsStyle]}>
              <FlyntChatThread<DemoChatMessage>
                messages={textChatMessages}
                renderChatFooter={renderTextError}
                renderInputToolbar={renderTextInputToolbar}
                renderMessage={renderTextMessage}
                scrollRevision={connected ? composerHeight : 88}
                sending={connected && isSpeaking}
                thinkingLabel="FLYNT is responding"
                extendsUnderStatusBar
                topInset={demoTopbarHeight}
              />
            </Animated.View>
        </View>
        ) : (
          <View style={styles.callContent}>
            <View style={[styles.voiceStage, callLayout === 'split' && styles.voiceStageSplit]}>
            </View>
          {callLayout === 'split' ? (
            <ScrollView
              contentContainerStyle={styles.transcriptContent}
              ref={voiceTranscriptRef}
              showsVerticalScrollIndicator={false}
              style={styles.transcript}
            >
              {deduplicatedTranscript(transcript).some((item) => item.role === 'agent') ? deduplicatedTranscript(transcript).filter((item) => item.role === 'agent').slice(-2).map((item) => (
                <View key={item.id} style={styles.transcriptRow}>
                  <Text style={[styles.transcriptRole, { color: theme.muted }]}>FLYNT</Text>
                  <Text style={[styles.transcriptMessage, { color: theme.ink }]}>{visibleTranscriptMessage(item.message)}</Text>
                </View>
              )) : <Text style={[styles.emptyTranscript, { color: theme.muted }]}>The conversation will appear here.</Text>}
            </ScrollView>
          ) : null}
          {sessionError || deliveryError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{sessionError ?? deliveryError}</Text> : null}
          <Animated.View style={[styles.callControls, sessionControlsStyle]}>
            {connected ? (
              <Pressable accessibilityLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'} accessibilityRole="button" accessibilityState={{ selected: isMuted }} onPress={() => { void selection(); setMuted(!isMuted); }} style={({ pressed }) => [styles.iconControl, pressed && styles.pressed]}>
                <NativeSymbol color={isMuted ? theme.danger : theme.ink} name={isMuted ? 'mic.slash.fill' : 'mic.fill'} size={24} />
              </Pressable>
            ) : null}
            {connected ? (
              <Pressable accessibilityLabel={nextCallLayout === 'orb' ? 'Show orb only' : 'Show orb and conversation'} accessibilityRole="button" onPress={() => { void selection(); setCallLayout(nextCallLayout); }} style={({ pressed }) => [styles.iconControl, pressed && styles.pressed]}>
                <NativeSymbol
                  color={theme.ink}
                  name={nextCallLayout === 'orb' ? 'circle.fill' : 'text.alignleft'}
                  size={24}
                  weight={nextCallLayout === 'orb' ? undefined : 'semibold'}
                />
              </Pressable>
            ) : null}
            {!connected ? (
              <Pressable accessibilityLabel="Start consultation again" accessibilityRole="button" disabled={connecting} onPress={restartConsultation} style={({ pressed }) => [styles.iconControl, pressed && styles.pressed, connecting && styles.disabled]}>
                {connecting ? <ActivityIndicator color={theme.ink} /> : <NativeSymbol color={theme.ink} name="arrow.clockwise" size={24} />}
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
        )}
          </Animated.View>
        ) : null}
        {sessionStarted
        && consultationMode === 'message'
        && connected
        && !sessionTransitioning ? (
          <View pointerEvents="box-none" style={styles.externalComposerLayer}>
            <FlyntChatComposerOverlay>
              {renderTextComposer()}
            </FlyntChatComposerOverlay>
          </View>
        ) : null}
        {formatMounted && !showsConsultationIntroduction && (!sessionStarted || consultationMode === 'voice') ? (
          <Animated.View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            style={[styles.sharedOrbAnchor, sharedOrbAnchorStyle]}
          >
            {(!sessionStarted || sessionTransitioning) ? (
              <Animated.View style={[styles.sharedOrbLayer, previewOrbDissolveStyle]}>
                <FlyntElevenLabsOrb
                  agentState="unknown"
                  colorOne="#ADD1DC"
                  colorTwo="#B0E9E9"
                  inputVolume={0.12}
                  outputVolume={0.08}
                  previewActive={previewAnimationActive}
                  previewMode
                  style={styles.orbVisual}
                />
              </Animated.View>
            ) : null}
            {sessionStarted ? (
              <Animated.View style={[styles.sharedOrbLayer, liveOrbDissolveStyle]}>
                <FlyntElevenLabsOrb
                  agentState={orbState}
                  colorOne="#ADD1DC"
                  colorTwo="#B0E9E9"
                  inputVolume={displayedAudioLevels.input}
                  outputVolume={displayedAudioLevels.output}
                  style={styles.orbVisual}
                />
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
      {consultationReview ? (
        <ConsultationReviewSheet
          approved={reviewApproved}
          consultation={consultationReview}
          error={deliveryError}
          isPresented
          mode={mode}
          onApprove={approveSummary}
          onContinue={continueReview}
        />
      ) : null}
    </SafeAreaView>
  );
}

function ConsultationIntroduction({ onStart }: { onStart: () => void }) {
  const { theme } = useFlyntTheme();
  return (
    <View style={styles.introductionContent}>
      <View style={styles.introductionCopy}>
        <Text style={[styles.introductionEyebrow, { color: theme.muted }]}>WELCOME TO FLYNT</Text>
        <Text accessibilityRole="header" style={[styles.introductionTitle, { color: theme.ink }]}>Hey, I&apos;m FLYNT.</Text>
        <View style={styles.introductionBodyGroup}>
          <Text style={[styles.introductionBody, { color: theme.muted }]}>Before I build your program, I want to get a feel for you: what you&apos;d like training to change, what you&apos;ve tried, and what can actually fit your life.</Text>
          <Text style={[styles.introductionBody, { color: theme.muted }]}>It takes about five minutes. Nothing to prepare, no fitness pop quiz, and no wrong answers. We&apos;ll just talk it through.</Text>
          <Text style={[styles.introductionBody, { color: theme.muted }]}>When we&apos;re done, I&apos;ll turn what you tell me into a program built around you. If now isn&apos;t a good time, no worries. Come back when you have a few uninterrupted minutes.</Text>
        </View>
      </View>
      <View style={styles.introductionActions}>
        <Pressable accessibilityRole="button" onPress={onStart} style={({ pressed }) => [styles.formatStart, { backgroundColor: theme.primaryFill }, pressed && styles.pressed]}>
          <Text style={[styles.formatStartCopy, { color: theme.primaryText }]}>Let&apos;s get started</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TypedAgentMessage({ message }: { message: string }) {
  const { theme } = useFlyntTheme();
  const reduceMotion = useReducedMotion();
  const [visibleLength, setVisibleLength] = useState(reduceMotion ? message.length : 0);

  useEffect(() => {
    if (reduceMotion || visibleLength >= message.length) return;
    const timer = setInterval(() => {
      setVisibleLength((current) => Math.min(current + 2, message.length));
    }, 24);
    return () => clearInterval(timer);
  }, [message.length, reduceMotion, visibleLength]);

  return (
    <Text
      accessibilityLabel={message}
      style={[styles.messageThreadCopy, { color: theme.ink }]}
    >
      {message.slice(0, visibleLength)}
    </Text>
  );
}

function FormatChoicePage({
  headerStyle,
  mode,
  pageWidth,
  previewStyle,
}: {
  headerStyle?: object;
  mode: ConsultationMode;
  pageWidth: number;
  previewStyle?: object;
}) {
  const { theme } = useFlyntTheme();
  return (
    <View style={[styles.formatPage, pageWidth ? { width: pageWidth } : null]}>
      <Animated.View style={[styles.formatHeader, headerStyle]}>
        <Text style={[styles.formatEyebrow, { color: theme.muted }]}>INITIAL CONSULTATION · ~5 MIN</Text>
        <Text accessibilityRole="header" style={[styles.formatTitle, { color: theme.ink }]}>
          {mode === 'voice' ? 'Talk it through with FLYNT.' : 'Text with FLYNT.'}
        </Text>
      </Animated.View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.formatPreview}>
        {mode === 'voice'
          ? <View style={styles.choiceOrbPlaceholder} />
          : <Animated.View style={previewStyle}><MessageChoiceVisual /></Animated.View>}
      </View>
    </View>
  );
}

function MessageChoiceVisual() {
  const { mode, theme } = useFlyntTheme();
  return (
    <View style={styles.messagePreviewShadowFrame}>
      <View style={[
        styles.messagePreview,
        { backgroundColor: appSurfaces[mode].itemBackground, borderColor: theme.line },
        mode === 'light' && styles.messagePreviewLift,
      ]}>
        <View style={styles.previewAssistant}>
          <Text style={[styles.previewRole, { color: theme.muted }]}>FLYNT</Text>
          <Text style={[styles.previewMessage, { color: theme.ink }]}>So, what are you hoping training does for you?</Text>
        </View>
        <View style={[styles.previewUser, { backgroundColor: appSurfaces[mode].interactiveBackground }]}>
          <Text style={[styles.previewUserCopy, { color: theme.ink }]}>I want to get stronger.</Text>
        </View>
        <View style={styles.previewAssistant}>
          <Text style={[styles.previewRole, { color: theme.muted }]}>FLYNT</Text>
          <Text style={[styles.previewMessage, { color: theme.ink }]}>Love that. Stronger in a way you would feel where: lifting heavier, or holding up better day to day?</Text>
        </View>
      </View>
    </View>
  );
}

function DemoTopbar({
  backLabel = 'Back',
  onBack,
  onOpenSettings,
  overlaysContent = false,
}: {
  backLabel?: string;
  onBack?: () => void;
  onOpenSettings?: () => void;
  overlaysContent?: boolean;
}) {
  const { mode, theme } = useFlyntTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topbar, overlaysContent && styles.topbarOverlay, overlaysContent && { top: insets.top }]}>
      {onBack ? (
        <GlassSymbolButton
          accessibilityLabel={backLabel}
          color={theme.ink}
          colorScheme={mode}
          name="chevron.left"
          onPress={onBack}
        />
      ) : <View style={styles.topbarPlaceholder} />}
      {onOpenSettings ? (
        <GlassSymbolButton
          accessibilityLabel="Open menu and settings"
          color={theme.ink}
          colorScheme={mode}
          name="ellipsis"
          onPress={onOpenSettings}
        />
      ) : <View style={styles.topbarPlaceholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topbar: { minHeight: demoTopbarHeight, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topbarOverlay: { position: 'absolute', left: 0, right: 0, zIndex: 3 },
  statusBarScrim: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
  topbarPlaceholder: { width: 44, height: 44 },
  flowViewport: { flex: 1, overflow: 'hidden' },
  flowLayer: { position: 'absolute', inset: 0 },
  introductionContent: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  introductionCopy: { gap: spacing.md, paddingTop: spacing.xl },
  introductionEyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 1.3 },
  introductionTitle: { fontSize: 42, lineHeight: 45, fontWeight: '600', letterSpacing: -1.8 },
  introductionBodyGroup: { gap: spacing.md, paddingTop: spacing.sm },
  introductionBody: { ...type.body },
  introductionActions: { paddingBottom: spacing.sm },
  formatContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  formatCarousel: { flex: 1, minHeight: 430, overflow: 'hidden' },
  formatRail: { flex: 1, flexDirection: 'row' },
  formatPage: { height: '100%' },
  formatHeader: { gap: spacing.xs, paddingTop: spacing.sm },
  formatEyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 1.3 },
  formatTitle: { ...type.title },
  formatPreview: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  formatActions: { gap: spacing.sm },
  formatSelector: { minHeight: 52, flexDirection: 'row', borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, padding: 4, gap: 4 },
  formatSelectionPill: { position: 'absolute', left: 4, top: 4, bottom: 4, borderRadius: radius.pill },
  formatOption: { zIndex: 1, flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  formatOptionCopy: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  formatStart: { minHeight: 54, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  formatStartCopy: { ...type.button },
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.3 },
  title: { ...type.title },
  body: { ...type.body },
  choiceOrbPlaceholder: { width: orbRestingSize, height: orbRestingSize },
  sharedOrbAnchor: {
    position: 'absolute',
    top: 190,
    left: '50%',
    width: orbRestingSize,
    height: orbRestingSize,
    marginLeft: -(orbRestingSize / 2),
    zIndex: 2,
  },
  sharedOrbLayer: { position: 'absolute', inset: 0 },
  messagePreview: { width: '100%', borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.lg },
  messagePreviewShadowFrame: { width: '100%', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  messagePreviewLift: { shadowColor: palette.black, shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  previewAssistant: { width: '100%', gap: spacing.xs },
  previewRole: { fontSize: 10, lineHeight: 13, fontWeight: '600', letterSpacing: 1.2 },
  previewMessage: { fontSize: 16, lineHeight: 23 },
  previewUser: { maxWidth: '78%', alignSelf: 'flex-end', borderRadius: radius.md, borderBottomRightRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  previewUserCopy: { fontSize: 15, lineHeight: 20 },
  messageSession: { flex: 1, paddingHorizontal: spacing.sm },
  messageChat: { flex: 1 },
  externalComposerLayer: { position: 'absolute', inset: 0, zIndex: 2147483647 },
  reviewSheetScreen: { flex: 1 },
  reviewSheetSafeArea: { flex: 1 },
  reviewSheetHeader: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: 18, paddingTop: spacing.md, paddingBottom: spacing.xs },
  reviewSheetHeaderCopy: { flex: 1, minWidth: 0, paddingBottom: spacing.xxs },
  reviewSheetEyebrow: { marginBottom: 5, fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.3 },
  reviewSheetTitle: { fontSize: 28, lineHeight: 33, fontWeight: '600', letterSpacing: -0.9 },
  reviewSheetBody: { flex: 1, minHeight: 0 },
  reviewSheetScroller: { flex: 1 },
  reviewSheetScroll: { paddingHorizontal: 18, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  reviewSheetCard: { padding: spacing.lg, gap: spacing.md },
  reviewSummary: { fontSize: 17, lineHeight: 24, fontWeight: '500' },
  reviewDivider: { height: StyleSheet.hairlineWidth },
  reviewFactGroup: { gap: spacing.xxs },
  reviewFactLabel: { fontSize: 10, lineHeight: 13, fontWeight: '700', letterSpacing: 1.1 },
  reviewDetail: { fontSize: 15, lineHeight: 21 },
  reviewSheetFooter: {
    minHeight: 122,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'stretch',
    gap: spacing.sm,
    paddingHorizontal: 18,
    paddingVertical: spacing.sm,
  },
  reviewApprovalError: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  reviewContinueButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  reviewContinueCopy: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  messageThreadCopy: { fontSize: 16, lineHeight: 23 },
  messageRestartRow: { minHeight: 88, alignItems: 'center', justifyContent: 'center' },
  restartControl: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { minHeight: 56, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  primaryCopy: { ...type.button },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
  callContent: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  voiceStage: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center' },
  voiceStageSplit: { minHeight: 250 },
  orbFrame: { width: orbRestingSize, height: orbRestingSize, alignItems: 'center', justifyContent: 'center' },
  orbVisual: { width: orbRestingSize, height: orbRestingSize },
  transcript: { maxHeight: 220 },
  transcriptContent: { flexGrow: 1, gap: spacing.md, paddingHorizontal: spacing.xs, paddingVertical: spacing.md },
  transcriptRow: { gap: spacing.xxs },
  transcriptRole: { fontSize: 10, lineHeight: 13, fontWeight: '700', letterSpacing: 1.1 },
  transcriptMessage: { fontSize: 14, lineHeight: 20 },
  emptyTranscript: { alignSelf: 'center', marginVertical: 32, fontSize: 14, lineHeight: 20 },
  error: { fontSize: 14, lineHeight: 20, marginTop: spacing.sm, textAlign: 'center' },
  callControls: { minHeight: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingTop: spacing.lg },
  iconControl: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  planContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  planDays: { gap: spacing.md, marginTop: spacing.sm },
  planCard: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  dayEyebrow: { fontSize: 10, lineHeight: 13, fontWeight: '700', letterSpacing: 1.1 },
  dayTitle: { fontSize: 18, lineHeight: 23, fontWeight: '600' },
  exercises: { marginTop: spacing.xs },
  exerciseRow: { minHeight: 68, flexDirection: 'row', paddingVertical: spacing.sm },
  exerciseIndex: { width: 34, paddingTop: 2 },
  exerciseIndexCopy: { fontSize: 11, lineHeight: 16, fontVariant: ['tabular-nums'] },
  exerciseCopy: { flex: 1, gap: 2 },
  exerciseName: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  exercisePrescription: { fontSize: 14, lineHeight: 19 },
  exerciseNote: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  guidanceCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  guidanceItem: { fontSize: 14, lineHeight: 20 },
  jsonToggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  textButtonCopy: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  json: { borderRadius: radius.md, padding: spacing.md, fontFamily: 'ui-monospace', fontSize: 11, lineHeight: 17 },
});
