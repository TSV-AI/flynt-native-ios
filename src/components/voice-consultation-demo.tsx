import {
  ConversationProvider,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from '@elevenlabs/react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

import { NativeSymbol } from '@/components/native-symbol';
import { FlyntChatInputToolbar } from '@/components/trainer-composer-accessory';
import { motion } from '@/constants/motion';
import { appSurfaces, radius, spacing, type } from '@/constants/theme';
import { parseVoiceDemoPlan, type VoiceDemoPlan, type VoiceDemoPlanDelivery } from '@/features/voice-demo-plan';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { deliberateAction, selection } from '@/lib/haptics';
import { composerMinimumHeight, consultationComposerMaximumHeight } from '@/lib/composer-layout';

const defaultAgentId = 'agent_3501kzcymvw5fs0tqcp946q4e11d';
const demoAgentId = process.env.EXPO_PUBLIC_ELEVENLABS_DEMO_AGENT_ID ?? defaultAgentId;

type TranscriptItem = {
  id: string;
  message: string;
  role: 'agent' | 'user';
};

type CallLayout = 'orb' | 'split';
type ConsultationMode = 'message' | 'voice';

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

export function VoiceConsultationDemo() {
  const [plan, setPlan] = useState<VoiceDemoPlan | null>(null);
  const [planJson, setPlanJson] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);

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
      ].slice(-8);
    });
  }, []);

  const clientTools = useMemo(() => ({
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

  return (
    <GestureHandlerRootView style={styles.screen}>
      <ConversationProvider
        agentId={demoAgentId}
        clientTools={clientTools}
        onConnect={() => setSessionError(null)}
        onError={(message) => setSessionError(message || 'The consultation could not connect.')}
        onMessage={({ message, role }) => appendTranscript(message, role)}
      >
        <VoiceConsultationDemoScreen
          deliveryError={deliveryError}
          onReset={() => {
            setPlan(null);
            setPlanJson(null);
            setDeliveryError(null);
            setSessionError(null);
            setTranscript([]);
            setSessionStarted(false);
          }}
          onLocalUserMessage={(message) => appendTranscript(message, 'user')}
          onSessionStarted={() => {
            setTranscript([]);
            setSessionStarted(true);
          }}
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
  deliveryError,
  onLocalUserMessage,
  onReset,
  onSessionStarted,
  plan,
  planJson,
  sessionError,
  sessionStarted,
  transcript,
}: {
  deliveryError: string | null;
  onLocalUserMessage: (message: string) => void;
  onReset: () => void;
  onSessionStarted: () => void;
  plan: VoiceDemoPlan | null;
  planJson: string | null;
  sessionError: string | null;
  sessionStarted: boolean;
  transcript: TranscriptItem[];
}) {
  const router = useRouter();
  const { mode, theme } = useFlyntTheme();
  const { startSession, endSession, getInputVolume, getOutputVolume, sendUserMessage } = useConversationControls();
  const { isMuted, setMuted } = useConversationInput();
  const { isSpeaking, isListening } = useConversationMode();
  const { status } = useConversationStatus();
  const [showJson, setShowJson] = useState(false);
  const [audioLevels, setAudioLevels] = useState({ input: 0, output: 0 });
  const [callLayout, setCallLayout] = useState<CallLayout>('orb');
  const [consultationMode, setConsultationMode] = useState<ConsultationMode>('voice');
  const [previewAnimationActive, setPreviewAnimationActive] = useState(true);
  const [formatPageWidth, setFormatPageWidth] = useState(0);
  const [formatSelectorWidth, setFormatSelectorWidth] = useState(0);
  const [message, setMessage] = useState('');
  const [composerHeight, setComposerHeight] = useState(composerMinimumHeight);
  const messageThreadRef = useRef<ScrollView>(null);
  const shouldUnmuteOnConnect = useRef(false);
  const reduceMotion = useReducedMotion();
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

  useEffect(() => {
    if (!connected || !shouldUnmuteOnConnect.current) return;

    shouldUnmuteOnConnect.current = false;
    setMuted(false);
  }, [connected, setMuted]);

  useEffect(() => {
    if (!connected) return;

    const timer = setInterval(() => {
      setAudioLevels({
        input: getInputVolume(),
        output: getOutputVolume(),
      });
    }, 50);
    return () => clearInterval(timer);
  }, [connected, getInputVolume, getOutputVolume]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' && connected) endSession();
    });
    return () => subscription.remove();
  }, [connected, endSession]);

  useEffect(() => {
    if (consultationMode !== 'message') return;
    requestAnimationFrame(() => messageThreadRef.current?.scrollToEnd({ animated: false }));
  }, [consultationMode, transcript.length]);

  const close = useCallback(() => {
    if (connected || connecting) endSession();
    if (router.canGoBack()) router.back();
    else router.replace('/consultation');
  }, [connected, connecting, endSession, router]);

  const startVoiceConsultation = useCallback(() => {
    setConsultationMode('voice');
    onSessionStarted();
    void deliberateAction();
    shouldUnmuteOnConnect.current = true;
    startSession({
      agentId: demoAgentId,
      connectionType: 'webrtc',
      dynamicVariables: {
        platform: 'FLYNT iOS voice consultation demo',
      },
    });
  }, [onSessionStarted, startSession]);

  const startMessageConsultation = useCallback(() => {
    setConsultationMode('message');
    setMessage('');
    setComposerHeight(composerMinimumHeight);
    onSessionStarted();
    void deliberateAction();
    startSession({
      agentId: demoAgentId,
      connectionType: 'websocket',
      textOnly: true,
      dynamicVariables: {
        platform: 'FLYNT iOS message consultation demo',
      },
    });
  }, [onSessionStarted, startSession]);

  const restartConsultation = consultationMode === 'message' ? startMessageConsultation : startVoiceConsultation;

  const sendMessage = useCallback(() => {
    const nextMessage = message.trim();
    if (!connected || !nextMessage) return;
    onLocalUserMessage(nextMessage);
    sendUserMessage(nextMessage);
    setMessage('');
    setComposerHeight(composerMinimumHeight);
  }, [connected, message, onLocalUserMessage, sendUserMessage]);

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

  if (plan && !connected && !connecting) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.canvas }]}>
        <DemoTopbar onClose={close} />
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
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.canvas }]}>
      <DemoTopbar onClose={close} />
      {!sessionStarted ? (
        <ScrollView contentContainerStyle={styles.formatContent} showsVerticalScrollIndicator={false}>
          <GestureDetector gesture={formatPanGesture}>
            <View onLayout={({ nativeEvent }) => setFormatPageWidth(nativeEvent.layout.width)} style={styles.formatCarousel}>
              <Animated.View style={[styles.formatRail, formatRailStyle]}>
                <FormatChoicePage mode="voice" pageWidth={formatPageWidth} previewAnimationActive={previewAnimationActive} />
                <FormatChoicePage mode="message" pageWidth={formatPageWidth} />
              </Animated.View>
            </View>
          </GestureDetector>
          <View style={styles.formatActions}>
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
              onPress={consultationMode === 'voice' ? startVoiceConsultation : startMessageConsultation}
              style={({ pressed }) => [styles.formatStart, { backgroundColor: theme.primaryFill }, pressed && styles.pressed]}
            >
              <Text style={[styles.formatStartCopy, { color: theme.primaryText }]}>
                {consultationMode === 'voice' ? 'Start talking' : 'Start texting'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : consultationMode === 'message' ? (
        <View style={styles.messageSession}>
          <ScrollView ref={messageThreadRef} contentContainerStyle={styles.messageThread} showsVerticalScrollIndicator={false}>
            {deduplicatedTranscript(transcript).map((item) => (
              <View key={item.id} style={[styles.messageThreadRow, item.role === 'user' && styles.messageThreadRowUser]}>
                <Text style={[styles.transcriptRole, { color: theme.muted }]}>{item.role === 'user' ? 'YOU' : 'FLYNT'}</Text>
                <View style={item.role === 'user' ? [styles.messageUserBubble, { backgroundColor: appSurfaces[mode].interactiveBackground }] : null}>
                  <Text style={[styles.messageThreadCopy, { color: theme.ink }]}>{visibleTranscriptMessage(item.message)}</Text>
                </View>
              </View>
            ))}
            {!transcript.length && connecting ? <ActivityIndicator color={theme.muted} style={styles.messageConnecting} /> : null}
          </ScrollView>
          {sessionError || deliveryError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{sessionError ?? deliveryError}</Text> : null}
          {connected ? (
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
          ) : (
            <View style={styles.messageRestartRow}>
              <Pressable accessibilityLabel="Start consultation again" accessibilityRole="button" disabled={connecting} onPress={restartConsultation} style={({ pressed }) => [styles.iconControl, pressed && styles.pressed, connecting && styles.disabled]}>
                {connecting ? <ActivityIndicator color={theme.ink} /> : <NativeSymbol color={theme.ink} name="arrow.clockwise" size={24} />}
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.callContent}>
          <View style={[styles.voiceStage, callLayout === 'split' && styles.voiceStageSplit]}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.orbFrame}>
              <FlyntElevenLabsOrb
                agentState={orbState}
                colorOne="#8ED1D0"
                colorTwo="#449E9E"
                inputVolume={displayedAudioLevels.input}
                outputVolume={displayedAudioLevels.output}
                style={styles.orbVisual}
              />
            </View>
          </View>
          {callLayout === 'split' ? (
            <ScrollView
              contentContainerStyle={styles.transcriptContent}
              showsVerticalScrollIndicator={false}
              style={styles.transcript}
            >
              {transcript.length ? deduplicatedTranscript(transcript).slice(-2).map((item) => (
                <View key={item.id} style={styles.transcriptRow}>
                  <Text style={[styles.transcriptRole, { color: theme.muted }]}>{item.role === 'user' ? 'YOU' : 'FLYNT'}</Text>
                  <Text numberOfLines={3} style={[styles.transcriptMessage, { color: theme.ink }]}>{visibleTranscriptMessage(item.message)}</Text>
                </View>
              )) : <Text style={[styles.emptyTranscript, { color: theme.muted }]}>The conversation will appear here.</Text>}
            </ScrollView>
          ) : null}
          {sessionError || deliveryError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{sessionError ?? deliveryError}</Text> : null}
          <View style={styles.callControls}>
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
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function VoiceChoiceVisual({ active }: { active: boolean }) {
  return (
    <FlyntElevenLabsOrb
      agentState="unknown"
      colorOne="#8ED1D0"
      colorTwo="#449E9E"
      inputVolume={0.12}
      outputVolume={0.08}
      previewActive={active}
      previewMode
      style={styles.choiceOrb}
    />
  );
}

function FormatChoicePage({
  mode,
  pageWidth,
  previewAnimationActive = false,
}: {
  mode: ConsultationMode;
  pageWidth: number;
  previewAnimationActive?: boolean;
}) {
  const { theme } = useFlyntTheme();
  return (
    <View style={[styles.formatPage, pageWidth ? { width: pageWidth } : null]}>
      <View style={styles.formatHeader}>
        <Text style={[styles.formatEyebrow, { color: theme.muted }]}>INITIAL CONSULTATION · ~5 MIN</Text>
        <Text accessibilityRole="header" style={[styles.formatTitle, { color: theme.ink }]}>
          {mode === 'voice' ? 'Talk it through with FLYNT.' : 'Text with FLYNT.'}
        </Text>
      </View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.formatPreview}>
        {mode === 'voice' ? <VoiceChoiceVisual active={previewAnimationActive} /> : <MessageChoiceVisual />}
      </View>
    </View>
  );
}

function MessageChoiceVisual() {
  const { mode, theme } = useFlyntTheme();
  return (
    <View style={styles.messagePreview}>
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
  );
}

function DemoTopbar({ onClose }: { onClose: () => void }) {
  const { theme } = useFlyntTheme();
  return (
    <View style={styles.topbar}>
      <Pressable accessibilityLabel="Close voice consultation demo" accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
        <NativeSymbol color={theme.ink} name="xmark" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topbar: { minHeight: 64, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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
  choiceOrb: { width: 214, height: 214 },
  messagePreview: { width: '100%', borderRadius: radius.lg, backgroundColor: '#1D1D1D', borderColor: '#333333', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.lg },
  previewAssistant: { width: '100%', gap: spacing.xs },
  previewRole: { fontSize: 10, lineHeight: 13, fontWeight: '600', letterSpacing: 1.2 },
  previewMessage: { fontSize: 16, lineHeight: 23 },
  previewUser: { maxWidth: '78%', alignSelf: 'flex-end', borderRadius: radius.md, borderBottomRightRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  previewUserCopy: { fontSize: 15, lineHeight: 20 },
  messageSession: { flex: 1, paddingHorizontal: spacing.sm, paddingBottom: spacing.xs },
  messageThread: { flexGrow: 1, justifyContent: 'flex-end', gap: spacing.lg, paddingHorizontal: spacing.sm, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  messageThreadRow: { maxWidth: '92%', gap: spacing.xxs, alignSelf: 'flex-start' },
  messageThreadRowUser: { maxWidth: '84%', alignSelf: 'flex-end' },
  messageUserBubble: { borderRadius: radius.lg, borderBottomRightRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  messageThreadCopy: { fontSize: 16, lineHeight: 23 },
  messageConnecting: { marginVertical: spacing.xl },
  messageRestartRow: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { minHeight: 56, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  primaryCopy: { ...type.button },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
  callContent: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  voiceStage: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center' },
  voiceStageSplit: { minHeight: 250 },
  orbFrame: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  orbVisual: { width: 220, height: 220 },
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
