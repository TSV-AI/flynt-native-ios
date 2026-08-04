import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FlyntSheet } from '@/components/flynt-sheet';
import { NativeSymbol } from '@/components/native-symbol';
import { appSurfaces, radius, spacing, type } from '@/constants/theme';
import { consultationBasicsSchema, type ConsultationBasics } from '@/contracts/app-state';
import { consultationReview, messagesWithToolApproval, requestMessages, textFromTrainerMessage } from '@/features/trainer-messages';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { acceptTerms, confirmConsultation, sendTrainerMessage } from '@/lib/api-client';
import { deliberateAction, failed, saved, selection } from '@/lib/haptics';
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

function startingDraft(fullName: string, age: number | null, height: number | null, weight: number | null): SetupDraft {
  return {
    age: String(age ?? 30), experience: '', height: String(height ?? 68), name: fullName,
    step: 0, trainingIntent: '', weight: String(weight ?? 175),
  };
}

function promptForTurn(turn: number, name: string) {
  if (turn === 0) return {
    eyebrow: 'START IN YOUR OWN WORDS', title: `${name || 'Tell me'}, what would you most like training to change?`,
    detail: 'Choose a starting point or use the message field below.',
    choices: [
      ['Feel stronger', 'My main goal is to feel stronger and more capable in everyday life.'],
      ['Build muscle', 'My main goal is to build visible muscle and change how my body looks.'],
      ['Move and feel better', 'My main goal is to have more energy, move better, and reduce everyday aches.'],
      ['Train for something', 'My main goal is to prepare for a sport, event, or performance target. I’m preparing for: . Success would look like: .'],
    ],
  };
  if (turn === 1) return {
    eyebrow: 'MAKE THE GOAL CONCRETE', title: 'What would make that feel like real progress?', detail: 'This gives FLYNT a clear way to judge success.',
    choices: [
      ['Stronger in real life', 'That direction is right. Focus on useful full-body strength. I’ll know it’s working when everyday tasks and the same exercises feel easier and I can steadily do more.'],
      ['Visible muscle', 'That direction is right. My main focus areas are: . I’ll judge success through progress photos, measurements, how clothes fit, and stronger performance.'],
      ['Move with confidence', 'That direction is right. Focus on comfortable, confident movement. I’ll know it’s working when I move through daily life and training with less hesitation.'],
      ['Not quite', 'Not quite. What I mean is: '],
    ],
  };
  if (turn === 2) return {
    eyebrow: 'YOUR REAL WEEK', title: 'What does training need to fit around?', detail: 'Include your available days, session length, schedule, and other activity.',
    choices: [
      ['2 shorter days', 'I can train 2 days per week for up to 45 minutes. I have no major schedule constraints and no regular sport demands.'],
      ['3 balanced days', 'I can train 3 days per week for up to 60 minutes. I have no major schedule constraints and no regular sport demands.'],
      ['4 focused days', 'I can train 4 days per week for up to 60 minutes. I have no major schedule constraints and no regular sport demands.'],
      ['My week varies', 'My schedule changes week to week. A realistic training week looks like: . My session time limit is: . My sports or other regular activities are: .'],
    ],
  };
  if (turn === 3) return {
    eyebrow: 'YOUR TRAINING BACKGROUND', title: 'What has training felt like so far?', detail: 'Include what you enjoy and anything you would rather avoid.',
    choices: [
      ['Starting fresh', 'I’m mostly starting fresh and do not have established movement preferences yet. There are no exercises I already know I want to avoid.'],
      ['On and off', 'I’ve trained on and off, but consistency has been difficult. I’m open to most movement styles and do not have an exercise preference or avoidance I feel strongly about yet.'],
      ['Consistent lately', 'I’ve trained consistently recently. What has worked well is: . Movements I prefer are: . Movements I avoid are: .'],
    ],
  };
  if (turn === 4) return {
    eyebrow: 'WHAT YOU HAVE', title: 'What equipment can you reliably use?', detail: 'Describe your normal environment, not equipment you only sometimes have.',
    choices: [
      ['Bodyweight only', 'I usually train with bodyweight only and no equipment.'],
      ['Home basics', 'I usually train at home. I reliably have dumbbells or kettlebells plus: .'],
      ['Full gym', 'I train at a fully equipped gym with barbells, dumbbells, cables, machines, benches, and cardio equipment.'],
      ['Something else', 'My normal training location and complete equipment setup are: '],
    ],
  };
  if (turn === 5) return {
    eyebrow: 'MOVE AND RECOVER SAFELY', title: 'What should the program respect?', detail: 'Cover pain, movement limits, sleep, stress, and recovery.',
    choices: [
      ['Good to go, recover well', 'I have no current pain, injuries, medical restrictions, or movement limitations. My sleep is generally consistent, stress is manageable, and I usually recover well.'],
      ['Recovery varies', 'I have no current pain, injuries, medical restrictions, or movement limitations, but my sleep, stress, or recovery can be inconsistent. The main issue is: .'],
      ['One thing to mention', 'I have one injury, pain issue, or movement limitation FLYNT should work around: . It affects these movements: . My sleep, stress, and recovery are generally: .'],
    ],
  };
  return {
    eyebrow: 'READY WHEN YOU ARE', title: 'Review what FLYNT understood.', detail: 'Nothing is built until you confirm the complete profile.',
    choices: [['Show my review', 'Show me the complete consultation summary so I can confirm or edit every detail before you build my program.']],
  };
}

export default function ConsultationScreen() {
  const { mode, theme } = useFlyntTheme();
  const { appState, refresh, signOut } = useLifecycleNavigation();
  const conversation = appState?.conversation?.kind === 'consultation' ? appState.conversation : null;
  const initial = startingDraft(appState?.profile.fullName ?? '', appState?.profile.age ?? null, appState?.profile.heightInches ?? null, appState?.profile.currentWeightLb ?? null);
  const [draft, setDraft] = useState<SetupDraft>(initial);
  const [basics, setBasics] = useState<ConsultationBasics | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalView, setLegalView] = useState<'terms' | 'privacy' | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const messages = useMemo(() => conversation?.messages ?? [], [conversation?.messages]);
  const review = useMemo(() => consultationReview(messages), [messages]);
  const userTurns = messages.filter((item) => item.role === 'user' && textFromTrainerMessage(item).length >= 20).length;
  const prompt = promptForTurn(userTurns, basics?.name.split(/\s+/)[0] ?? draft.name.split(/\s+/)[0]);
  const storageKey = `flynt.consultation.${conversation?.id ?? 'pending'}`;

  useEffect(() => {
    let active = true;
    void SecureStore.getItemAsync(storageKey).then((value) => {
      if (!active) return;
      if (value) {
        const parsed = consultationBasicsSchema.safeParse(JSON.parse(value));
        if (parsed.success) {
          setBasics(parsed.data);
          setDraft((current) => ({ ...current, ...parsed.data, age: String(parsed.data.age), height: String(parsed.data.height), weight: String(parsed.data.weight), step: 3 }));
        }
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
    return () => { active = false; };
  }, [storageKey]);

  useEffect(() => {
    if (!sending) scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, sending]);

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
    await saved();
  }

  async function sendText(text = message) {
    const trimmed = text.trim();
    if (!trimmed || !basics || !conversation || sending) return;
    setPendingText(trimmed);
    setMessage('');
    setSending(true);
    setError(null);
    await deliberateAction();
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
  }

  async function declineReview() {
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
  }

  async function buildProgram() {
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
      await confirmConsultation(review.consultation, conversation.id);
      await SecureStore.deleteItemAsync(storageKey);
      await refresh();
      await saved();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Your program could not be started.');
      await failed();
    } finally { setSending(false); }
  }

  if (!loaded) return <View style={[styles.loading, { backgroundColor: appSurfaces[mode].primaryBackground }]}><ActivityIndicator color={theme.ink} /></View>;

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, { backgroundColor: appSurfaces[mode].primaryBackground }]}>
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.topBar}><Text style={[styles.brand, { color: theme.ink }]}>FLYNT</Text><Pressable accessibilityLabel="Open consultation settings" accessibilityRole="button" onPress={() => router.push('/lifecycle-settings')} style={styles.topAction}><NativeSymbol color={theme.ink} name="ellipsis" size={19} /></Pressable></View>
      {!basics ? <SetupFlow draft={draft} error={error} onFinish={() => void finishSetup()} onUpdate={update} theme={theme} /> : !conversation ? <View style={styles.unavailable}><Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Your consultation is unavailable.</Text><Text style={[styles.body, { color: theme.muted }]}>Refresh FLYNT, open Settings, or sign out and try again.</Text><Pressable accessibilityRole="button" onPress={() => void refresh()} style={[styles.primaryButton, { backgroundColor: theme.primaryFill }]}><Text style={[styles.primaryCopy, { color: theme.primaryText }]}>Try again</Text></Pressable><Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.textButton}><Text style={[styles.textButtonCopy, { color: theme.ink }]}>Sign out</Text></Pressable></View> : <>
        <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets contentContainerStyle={styles.chatContent} keyboardDismissMode="interactive">
          <Text style={[styles.eyebrow, { color: theme.muted }]}>FLYNT TRAINER</Text><Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Initial consultation</Text>
          {!messages.length ? <View style={[styles.coachBubble, { backgroundColor: appSurfaces[mode].itemBackground }]}><Text style={[styles.body, { color: theme.ink }]}>Tell me what you want from training. I’ll keep the conversation focused and make corrections easy.</Text></View> : null}
          {messages.flatMap((item) => {
            const text = textFromTrainerMessage(item); if (!text || (item.role !== 'user' && item.role !== 'assistant')) return [];
            return [<View key={item.id} style={item.role === 'user' ? [styles.userBubble, { backgroundColor: theme.primaryFill }] : [styles.coachBubble, { backgroundColor: appSurfaces[mode].itemBackground }]}><Text style={[styles.body, { color: item.role === 'user' ? theme.primaryText : theme.ink }]}>{text}</Text></View>];
          })}
          {pendingText ? <View style={[styles.userBubble, { backgroundColor: theme.primaryFill, opacity: 0.72 }]}><Text style={[styles.body, { color: theme.primaryText }]}>{pendingText}</Text></View> : null}
          {review ? <ReviewCard accepted={termsAccepted} onAccepted={() => setTermsAccepted((value) => !value)} onBuild={() => void buildProgram()} onDecline={() => void declineReview()} onLegal={setLegalView} review={review.consultation} sending={sending} theme={theme} /> : !sending ? <View style={[styles.promptCard, { backgroundColor: appSurfaces[mode].itemBackground }]}><Text style={[styles.eyebrow, { color: theme.muted }]}>{prompt.eyebrow}</Text><Text style={[styles.promptTitle, { color: theme.ink }]}>{prompt.title}</Text><Text style={[styles.body, { color: theme.muted }]}>{prompt.detail}</Text><View style={styles.choices}>{prompt.choices.map(([label, value]) => <Pressable accessibilityRole="button" key={label} onPress={() => { void selection(); setMessage(value); }} style={({ pressed }) => [styles.choice, { borderColor: theme.line }, pressed && styles.pressed]}><Text style={[styles.choiceCopy, { color: theme.ink }]}>{label}</Text></Pressable>)}</View></View> : null}
          {sending ? <View accessibilityLabel="FLYNT is thinking" style={styles.thinking}><ActivityIndicator color={theme.ink} /><Text style={[styles.body, { color: theme.muted }]}>FLYNT is thinking</Text></View> : null}
          {error ? <View accessibilityRole="alert" style={[styles.errorCard, { borderColor: theme.danger }]}><Text style={[styles.error, { color: theme.danger }]}>{error}</Text><View style={styles.errorActions}><Pressable accessibilityRole="button" onPress={() => setError(null)} style={styles.textButton}><Text style={[styles.textButtonCopy, { color: theme.ink }]}>Dismiss</Text></Pressable>{pendingText ? <Pressable accessibilityRole="button" onPress={() => void sendText(pendingText)} style={styles.textButton}><Text style={[styles.textButtonCopy, { color: theme.ink }]}>Retry</Text></Pressable> : null}</View></View> : null}
        </ScrollView>
        {!review ? <View style={[styles.composer, { backgroundColor: appSurfaces[mode].itemBackground }]}><TextInput accessibilityLabel="Message FLYNT" autoCapitalize="sentences" autoCorrect multiline onChangeText={setMessage} placeholder="Message FLYNT" placeholderTextColor={theme.muted} style={[styles.composerInput, { color: theme.ink }]} value={message} /><Pressable accessibilityLabel="Send message" accessibilityRole="button" disabled={!message.trim() || sending} onPress={() => void sendText()} style={[styles.send, { backgroundColor: theme.primaryFill, opacity: message.trim() && !sending ? 1 : 0.35 }]}><NativeSymbol color={theme.primaryText} name="arrow.up" size={16} /></Pressable></View> : null}
      </>}
    </SafeAreaView>
    <LegalSheet isPresented={legalView !== null} kind={legalView ?? 'terms'} onDismiss={() => setLegalView(null)} />
  </KeyboardAvoidingView>;
}

function SetupFlow({ draft, error, onFinish, onUpdate, theme }: { draft: SetupDraft; error: string | null; onFinish: () => void; onUpdate: (patch: Partial<SetupDraft>) => void; theme: ReturnType<typeof useFlyntTheme>['theme'] }) {
  const step = draft.step;
  return <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.setupContent} keyboardDismissMode="interactive">
    <View style={styles.progressHeader}><Text style={[styles.eyebrow, { color: theme.muted }]}>MEET YOUR TRAINER</Text><Text style={[styles.progressCount, { color: theme.muted }]}>{step + 1} / 4</Text></View>
    <View style={[styles.progressTrack, { backgroundColor: theme.line }]}><View style={[styles.progressFill, { backgroundColor: theme.ink, width: `${((step + 1) / 4) * 100}%` }]} /></View>
    {step === 0 ? <View style={styles.welcome}><View style={[styles.orb, { backgroundColor: theme.primaryFill }]}><Text style={[styles.orbCopy, { color: theme.primaryText }]}>F</Text></View><Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>A few basics, then we’ll talk.</Text><Text style={[styles.body, { color: theme.muted }]}>Start with the easy details. After that, FLYNT will ask a few useful questions and adapt the conversation to you.</Text><Pressable accessibilityRole="button" onPress={() => onUpdate({ step: 1 })} style={[styles.primaryButton, { backgroundColor: theme.primaryFill }]}><Text style={[styles.primaryCopy, { color: theme.primaryText }]}>Get started</Text></Pressable><Text style={[styles.caption, { color: theme.muted }]}>You can type, tap, or use keyboard dictation once the conversation begins.</Text></View> : null}
    {step === 1 ? <View style={styles.setupStack}><Text style={[styles.eyebrow, { color: theme.muted }]}>THE BASICS</Text><Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>First, a little about you.</Text><SetupField autoComplete="name" label="What should FLYNT call you?" onChange={(name) => onUpdate({ name })} theme={theme} value={draft.name} /><SetupField keyboardType="number-pad" label="Age" onChange={(age) => onUpdate({ age })} theme={theme} value={draft.age} /><SetupField keyboardType="number-pad" label="Height in inches" onChange={(height) => onUpdate({ height })} theme={theme} value={draft.height} /><SetupField keyboardType="decimal-pad" label="Weight in pounds" onChange={(weight) => onUpdate({ weight })} theme={theme} value={draft.weight} /></View> : null}
    {step === 2 ? <OptionStep detail="This changes the language, examples, and depth of the conversation." eyebrow="HOW FLYNT SHOULD TALK WITH YOU" onSelect={(experience) => onUpdate({ experience })} options={experienceOptions} selected={draft.experience} theme={theme} title="How familiar does training feel?" /> : null}
    {step === 3 ? <OptionStep detail="This sets the starting point. You can still change any workout later." eyebrow="HOW YOU WANT TO TRAIN" onSelect={(trainingIntent) => onUpdate({ trainingIntent })} options={intentOptions} selected={draft.trainingIntent} theme={theme} title="What role should FLYNT play?" /> : null}
    {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    {step > 0 ? <View style={styles.setupActions}><Pressable accessibilityRole="button" onPress={() => onUpdate({ step: step - 1 })} style={styles.textButton}><Text style={[styles.textButtonCopy, { color: theme.ink }]}>Back</Text></Pressable><Pressable accessibilityRole="button" disabled={(step === 1 && !draft.name.trim()) || (step === 2 && !draft.experience) || (step === 3 && !draft.trainingIntent)} onPress={step === 3 ? onFinish : () => onUpdate({ step: step + 1 })} style={[styles.setupContinue, { backgroundColor: theme.primaryFill, opacity: (step === 1 && !draft.name.trim()) || (step === 2 && !draft.experience) || (step === 3 && !draft.trainingIntent) ? 0.4 : 1 }]}><Text style={[styles.primaryCopy, { color: theme.primaryText }]}>{step === 3 ? 'Talk with FLYNT' : 'Continue'}</Text></Pressable></View> : null}
  </ScrollView>;
}

function SetupField({ autoComplete, keyboardType = 'default', label, onChange, theme, value }: { autoComplete?: 'name'; keyboardType?: 'default' | 'decimal-pad' | 'number-pad'; label: string; onChange: (value: string) => void; theme: ReturnType<typeof useFlyntTheme>['theme']; value: string }) {
  return <View style={styles.fieldGroup}><Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text><TextInput accessibilityLabel={label} autoComplete={autoComplete} keyboardType={keyboardType} onChangeText={onChange} style={[styles.field, { backgroundColor: theme.raised, borderColor: theme.line, color: theme.ink }]} value={value} /></View>;
}

function OptionStep<Value extends string>({ detail, eyebrow, onSelect, options, selected, theme, title }: { detail: string; eyebrow: string; onSelect: (value: Value) => void; options: readonly (readonly [Value, string, string])[]; selected: Value | ''; theme: ReturnType<typeof useFlyntTheme>['theme']; title: string }) {
  return <View style={styles.setupStack}><Text style={[styles.eyebrow, { color: theme.muted }]}>{eyebrow}</Text><Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{title}</Text><Text style={[styles.body, { color: theme.muted }]}>{detail}</Text>{options.map(([value, label, description]) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected === value }} key={value} onPress={() => { void selection(); onSelect(value); }} style={({ pressed }) => [styles.option, { backgroundColor: theme.raised, borderColor: selected === value ? theme.ink : theme.line }, pressed && styles.pressed]}><View style={styles.optionCopy}><Text style={[styles.optionTitle, { color: theme.ink }]}>{label}</Text><Text style={[styles.optionDetail, { color: theme.muted }]}>{description}</Text></View><View style={[styles.radio, { borderColor: selected === value ? theme.ink : theme.line }]}>{selected === value ? <View style={[styles.radioFill, { backgroundColor: theme.ink }]} /> : null}</View></Pressable>)}</View>;
}

function ReviewCard({ accepted, onAccepted, onBuild, onDecline, onLegal, review, sending, theme }: { accepted: boolean; onAccepted: () => void; onBuild: () => void; onDecline: () => void; onLegal: (value: 'terms' | 'privacy') => void; review: NonNullable<ReturnType<typeof consultationReview>>['consultation']; sending: boolean; theme: ReturnType<typeof useFlyntTheme>['theme'] }) {
  return <View style={[styles.reviewCard, { backgroundColor: theme.raised }]}><Text style={[styles.eyebrow, { color: theme.muted }]}>CONSULTATION SUMMARY</Text><Text style={[styles.reviewSummary, { color: theme.ink }]}>{review.summary}</Text>{review.coachingPriorities.map((item) => <View key={item} style={styles.priority}><NativeSymbol color={theme.muted} name="checkmark" size={13} /><Text style={[styles.body, styles.priorityCopy, { color: theme.ink }]}>{item}</Text></View>)}<View style={styles.termsRow}><Pressable accessibilityLabel="Accept Terms and Privacy Notice" accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} onPress={onAccepted} style={styles.checkboxTarget}><View style={[styles.checkbox, { backgroundColor: accepted ? theme.primaryFill : 'transparent', borderColor: accepted ? theme.primaryFill : theme.line }]}>{accepted ? <NativeSymbol color={theme.primaryText} name="checkmark" size={13} /> : null}</View></Pressable><View style={styles.termsCopy}><Text style={{ color: theme.muted }}>I agree to FLYNT&apos;s notices.</Text><View style={styles.legalLinks}><Pressable accessibilityRole="button" onPress={() => onLegal('terms')} style={styles.legalLink}><Text style={{ color: theme.ink, textDecorationLine: 'underline' }}>Terms &amp; Safety Notice</Text></Pressable><Pressable accessibilityRole="button" onPress={() => onLegal('privacy')} style={styles.legalLink}><Text style={{ color: theme.ink, textDecorationLine: 'underline' }}>Privacy Notice</Text></Pressable></View></View></View><Pressable accessibilityRole="button" disabled={!accepted || sending} onPress={onBuild} style={[styles.primaryButton, { backgroundColor: theme.primaryFill, opacity: accepted && !sending ? 1 : 0.4 }]}>{sending ? <ActivityIndicator color={theme.primaryText} /> : <Text style={[styles.primaryCopy, { color: theme.primaryText }]}>Build my program</Text>}</Pressable><Pressable accessibilityRole="button" disabled={sending} onPress={onDecline} style={styles.textButton}><Text style={[styles.textButtonCopy, { color: theme.ink }]}>Add or change something</Text></Pressable></View>;
}

function LegalSheet({ isPresented, kind, onDismiss }: { isPresented: boolean; kind: 'terms' | 'privacy'; onDismiss: () => void }) {
  const { theme } = useFlyntTheme();
  return <FlyntSheet eyebrow="EFFECTIVE JULY 27, 2026" isPresented={isPresented} onDismiss={onDismiss} title={kind === 'terms' ? 'Terms & Safety Notice' : 'Privacy Notice'}>{kind === 'terms' ? <View style={styles.legalContent}><Text style={[styles.body, { color: theme.ink }]}>FLYNT uses artificial intelligence to provide personalized training recommendations. AI output can be incomplete or wrong, and it is not medical advice, diagnosis, rehabilitation, or emergency guidance.</Text><LegalSection body="Use accurate information, appropriate equipment, sound judgment, and a safe environment. Stop an exercise for sharp, severe, radiating, worsening, traumatic, or neurologic symptoms. Consult a physician or qualified clinician when health or injury risk may affect exercise." title="Train within your limits" /><LegalSection body="Trainer changes are recommendations. FLYNT shows proposed program changes for your approval before applying them. You may reject or edit any proposal." title="You stay in control" /><LegalSection body="Exercise carries inherent risks, including soreness and injury. FLYNT cannot guarantee safety, performance, physique, or health outcomes." title="Training involves risk" /></View> : <View style={styles.legalContent}><Text style={[styles.body, { color: theme.ink }]}>FLYNT stores the account, consultation answers, training plan, completed sets, progress, and settings needed to operate and personalize the app.</Text><LegalSection body="Relevant profile and training context may be sent to our AI service providers to generate plans and Trainer responses. FLYNT does not use health or training information for advertising or sell it to data brokers." title="How your data is used" /><LegalSection body="Signed-in data is stored with our infrastructure providers, including Supabase and Vercel. Account data is isolated by user. You can sign out, export your data, or permanently delete your account from App settings." title="Storage and control" /></View>}</FlyntSheet>;
}
function LegalSection({ body, title }: { body: string; title: string }) { const { theme } = useFlyntTheme(); return <View style={styles.legalSection}><Text style={[styles.legalTitle, { color: theme.ink }]}>{title}</Text><Text style={[styles.body, { color: theme.muted }]}>{body}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1 }, safeArea: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg }, brand: { fontSize: 16, fontWeight: '800', letterSpacing: 3 }, topAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  setupContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }, progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }, progressCount: { fontSize: 13, fontWeight: '600' }, progressTrack: { height: 3, borderRadius: 2, marginTop: spacing.sm, overflow: 'hidden' }, progressFill: { height: 3 },
  welcome: { flex: 1, justifyContent: 'center', gap: spacing.lg, paddingVertical: spacing.xl }, orb: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }, orbCopy: { fontSize: 32, fontWeight: '600' }, title: { ...type.title }, body: { ...type.body }, caption: { fontSize: 13, lineHeight: 18, textAlign: 'center' }, eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.3 },
  setupStack: { gap: spacing.md, marginTop: spacing.xl }, fieldGroup: { gap: 7 }, fieldLabel: { fontSize: 14, lineHeight: 19, fontWeight: '600' }, field: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 17 },
  option: { minHeight: 88, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', padding: spacing.md }, optionCopy: { flex: 1, gap: 4 }, optionTitle: { fontSize: 17, lineHeight: 22, fontWeight: '600' }, optionDetail: { fontSize: 14, lineHeight: 20 }, radio: { width: 24, height: 24, borderWidth: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm }, radioFill: { width: 12, height: 12, borderRadius: 6 },
  setupActions: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg }, setupContinue: { minWidth: 132, minHeight: 50, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primaryButton: { minHeight: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg }, primaryCopy: { ...type.button }, textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm }, textButtonCopy: { fontSize: 15, lineHeight: 20, fontWeight: '600' }, pressed: { opacity: 0.7 }, error: { fontSize: 14, lineHeight: 20 },
  unavailable: { flex: 1, justifyContent: 'center', gap: spacing.lg, padding: spacing.lg }, chatContent: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120 },
  coachBubble: { maxWidth: '92%', alignSelf: 'flex-start', borderRadius: radius.lg, borderBottomLeftRadius: radius.sm, padding: spacing.md }, userBubble: { maxWidth: '88%', alignSelf: 'flex-end', borderRadius: radius.lg, borderBottomRightRadius: radius.sm, padding: spacing.md },
  promptCard: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm }, promptTitle: { fontSize: 22, lineHeight: 27, fontWeight: '600' }, choices: { gap: spacing.xs }, choice: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, justifyContent: 'center', paddingHorizontal: spacing.md }, choiceCopy: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  thinking: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, composer: { minHeight: 60, flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: spacing.md, marginBottom: spacing.xs, borderRadius: 24, padding: 8 }, composerInput: { flex: 1, minHeight: 44, maxHeight: 100, fontSize: 16, lineHeight: 21, paddingHorizontal: spacing.sm, paddingVertical: 11 }, send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  errorCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.md }, errorActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  reviewCard: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.md }, reviewSummary: { fontSize: 20, lineHeight: 26, fontWeight: '600' }, priority: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }, priorityCopy: { flex: 1 }, termsRow: { minHeight: 56, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, paddingVertical: spacing.xs }, checkboxTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, checkbox: { width: 28, height: 28, borderWidth: 1.5, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, termsCopy: { flex: 1, gap: 4, paddingTop: 4 }, legalLinks: { gap: 2 }, legalLink: { minHeight: 44, justifyContent: 'center' },
  legalContent: { gap: spacing.lg }, legalSection: { gap: spacing.xs }, legalTitle: { fontSize: 18, lineHeight: 23, fontWeight: '600' },
});
