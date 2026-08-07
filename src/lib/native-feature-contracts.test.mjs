import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  appStateSchema,
  completedConsultationSchema,
  consultationBasicsSchema,
  normalizedWorkoutSetSchema,
  programChangeSchema,
  workoutOverrideExerciseSchema,
} from '../contracts/app-state.ts';
import { firstRunSlides } from '../features/first-run-content.ts';
import { hasCurrentFlyntAccount } from './auth-admission.ts';
import { formatLoad, loadPickerOptions, normalizedLoad, normalizedReps, repPickerOptions } from './load-picker.ts';
import { sentenceCaseMarkdownListItems } from './markdown-presentation.ts';
import { consultationPromptForTurn } from '../features/consultation-prompts.ts';
import { parseVoiceDemoPlan } from '../features/voice-demo-plan.ts';

test('load picker preserves current half-pound values and bounded options', () => {
  const options = loadPickerOptions('132.5');
  assert.equal(normalizedLoad('132.5'), 132.5);
  assert.equal(formatLoad(132.5), '132.5');
  assert.ok(options.includes(132.5));
  assert.equal(options[0], 0);
  assert.equal(options.at(-1), 1000);
});

test('rep picker normalizes prescriptions to a bounded native wheel value', () => {
  const options = repPickerOptions();
  assert.equal(normalizedReps('6–8'), 6);
  assert.equal(normalizedReps(''), 1);
  assert.equal(options[0], 1);
  assert.equal(options.at(-1), 99);
});

test('workout overrides preserve the editable production prescription fields', () => {
  const parsed = workoutOverrideExerciseSchema.parse({
    id: 'custom-tall-kneeling-press',
    name: 'Tall-kneeling Press',
    sets: 12,
    reps: '8–10',
    rest: 120,
    group: 'upper',
    targetLoad: 45,
    targetRpe: 8,
    tempo: '3-1-1',
    note: 'Keep ribs stacked.',
  });
  assert.equal(parsed.tempo, '3-1-1');
  assert.equal(parsed.sets, 12);
});

test('normalized workout history uses movement control instead of routine pain scoring', () => {
  const parsed = normalizedWorkoutSetSchema.parse({
    exercise_id: 'goblet-squat',
    exercise_name: 'Goblet Squat',
    set_index: 0,
    actual_reps: 8,
    actual_load: 60,
    rpe: 8,
    control: 'controlled',
    complete: true,
  });
  assert.equal(parsed.control, 'controlled');
  assert.equal('pain' in parsed, false);
});

test('Today renders prescribed exercise roles as ordered session sections', async () => {
  const today = await readFile(new URL('../components/native-today-workout.tsx', import.meta.url), 'utf8');
  assert.match(today, /exercise\.role === 'warmup'\) return 'WARM UP'/);
  assert.match(today, /exercise\.role === 'conditioning'\) return 'CONDITIONING'/);
  assert.match(today, /exercise\.role === 'recovery'\) return 'RECOVERY'/);
  assert.match(today, /return 'WORKOUT'/);
  assert.match(today, /section !== previousSection/);
});

test('Progress workout history gives scrolling to the native sheet container', async () => {
  const progress = await readFile(new URL('../app/(tabs)/progress.tsx', import.meta.url), 'utf8');
  const flyntSheet = await readFile(new URL('../components/flynt-sheet.tsx', import.meta.url), 'utf8');
  const nativeSheet = await readFile(new URL('../components/native-material-sheet.tsx', import.meta.url), 'utf8');
  assert.match(progress, /<FlyntSheet[\s\S]*nativeScroll[\s\S]*scroll=\{false\}/);
  assert.match(flyntSheet, /nativeScroll=\{nativeScroll\}/);
  assert.match(nativeSheet, /<NativeScrollView axes="vertical"/);
  assert.match(nativeSheet, /<RNHostView matchContents>/);
});

test('consultation basics require both communication and training intent choices', () => {
  assert.equal(consultationBasicsSchema.safeParse({
    name: 'Priya', age: 34, height: 66, weight: 142, experience: 'some', trainingIntent: 'hybrid',
  }).success, true);
  assert.equal(consultationBasicsSchema.safeParse({
    name: 'Priya', age: 34, height: 66, weight: 142, experience: 'some',
  }).success, false);
});

test('training intent visibly changes the opening consultation task', () => {
  assert.match(consultationPromptForTurn(0, 'Priya', 'coached').title, /training to change/);
  assert.match(consultationPromptForTurn(0, 'Priya', 'self_directed').title, /workouts do you want to bring/);
  assert.match(consultationPromptForTurn(0, 'Priya', 'hybrid').title, /what do you want to keep/i);
});

test('voice consultation demo accepts only structured plan JSON', () => {
  const plan = parseVoiceDemoPlan({
    plan_json: JSON.stringify({
      title: 'Three-day strength foundation',
      summary: 'A balanced week built around full-body strength and consistent practice.',
      days: [{
        day: 'Monday',
        focus: 'Full-body strength',
        exercises: [{ name: 'Goblet Squat', sets: 3, reps: '8', restSeconds: 90 }],
      }],
      guidance: ['Leave two good repetitions in reserve.'],
    }),
  });

  assert.equal(plan.days[0].exercises[0].name, 'Goblet Squat');
  assert.throws(() => parseVoiceDemoPlan({ plan_json: '{"title":"Incomplete"}' }));
});

test('provider sign-in admits only an existing account with current legal acceptance', () => {
  assert.equal(hasCurrentFlyntAccount({ exists: false, legal: null }, '2026-07-27'), false);
  assert.equal(hasCurrentFlyntAccount({
    exists: true,
    legal: { acceptedAt: '2026-08-05T08:00:00.000Z', termsVersion: '2026-07-26' },
  }, '2026-07-27'), false);
  assert.equal(hasCurrentFlyntAccount({
    exists: true,
    legal: { acceptedAt: '2026-08-05T08:00:00.000Z', termsVersion: '2026-07-27' },
  }, '2026-07-27'), true);
});

test('authoritative boot normalizes only empty numeric profile sentinels', () => {
  const parsed = appStateSchema.parse({
    lifecycle: 'consultation_required',
    profile: {
      fullName: 'Luke',
      age: 0,
      heightInches: 0,
      currentWeightLb: 0,
      email: 'luke@example.com',
      avatarUrl: null,
      trainerReport: {},
      consultationSnapshot: {},
    },
    preferences: {},
    program: null,
    programMeta: null,
    build: null,
    conversation: null,
    workoutState: {
      logs: {},
      loads: {},
      sessions: [],
      liftHistory: {},
      workoutOverrides: {},
    },
  });

  assert.equal(parsed.profile.age, null);
  assert.equal(parsed.profile.heightInches, null);
  assert.equal(parsed.profile.currentWeightLb, null);
  assert.equal(appStateSchema.safeParse({
    ...parsed,
    profile: { ...parsed.profile, age: 12 },
  }).success, false);
});

test('post-account consultation matches the PWA setup and securely resumes its draft', async () => {
  const source = await readFile(new URL('../app/consultation.tsx', import.meta.url), 'utf8');
  const rootNavigation = await readFile(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
  const lifecyclePlaceholder = await readFile(new URL('../components/lifecycle-placeholder.tsx', import.meta.url), 'utf8');

  assert.match(source, /I’m new to this/);
  assert.match(source, /I’ve trained a bit/);
  assert.match(source, /I train regularly/);
  assert.match(source, /Build my plan/);
  assert.match(source, /Bring my own workouts/);
  assert.match(source, /Mix both/);
  assert.match(source, /const draftStorageKey = `\$\{storageKey\}\.draft`/);
  assert.match(source, /setupDraftSchema\.safeParse\(JSON\.parse\(storedDraft\)\)/);
  assert.match(source, /SecureStore\.setItemAsync\(draftStorageKey/);
  assert.match(source, /SecureStore\.deleteItemAsync\(draftStorageKey\)/);
  assert.match(source, /accessibilityState=\{\{ selected: selected === value \}\}/);
  assert.match(source, /type MetricPicker = 'age' \| 'height' \| 'weight'/);
  assert.match(source, /metricPickerPresentation = \{ detent: 'medium' \}/);
  assert.match(source, /<MetricPickerSheet/);
  assert.match(source, /<FlyntSheet[\s\S]*pickerStyle\('wheel'\)/);
  assert.match(source, /label="Height"[\s\S]*formatHeight\(draft\.height\)/);
  assert.match(source, /accessibilityValue=\{\{ text: accessibilityValue \?\? value \}\}/);
  assert.match(source, /styles\.selectionIndicator[\s\S]*name="checkmark"/);
  assert.doesNotMatch(source, /styles\.radio|styles\.radioFill/);
  assert.match(source, /router\.push\('\/settings'\)/);
  assert.match(source, /<GlassSymbolButton[\s\S]*name="ellipsis"/);
  assert.doesNotMatch(source, /styles\.brand/);
  assert.match(lifecyclePlaceholder, /router\.push\('\/settings'\)/);
  assert.doesNotMatch(`${source}\n${rootNavigation}\n${lifecyclePlaceholder}`, /lifecycle-settings/);
});

test('Trainer approvals validate consultation and bounded program-change payloads', () => {
  const consultation = completedConsultationSchema.safeParse({
    schemaVersion: '1.0',
    trainingIntent: 'coached',
    summary: 'Three balanced training days focused on useful strength.',
    coachingPriorities: ['Build consistency', 'Respect recovery'],
    profile: {
      name: 'Priya', age: 34, height: { feet: 5, inches: 6 }, weightLb: 142, experience: 'some',
    },
    objectives: { primaryGoals: ['Feel stronger'], focusAreas: ['Full body'], successMeasures: ['Steady load progress'] },
    schedule: { daysPerWeek: 3, sessionMinutes: 60, availableDays: ['Monday', 'Wednesday', 'Friday'], constraints: [], sportsAndActivity: [] },
    programOwnership: { mode: 'coached', preserve: [], athleteSuppliedWorkouts: [] },
    trainingBackground: { consistency: 'on_and_off', dailyActivity: 'mixed', preferredMovements: [], excludedMovements: [] },
    equipmentProfile: { environment: 'commercial_gym', presumed: [], confirmed: ['Full gym'], unavailable: [], incrementsLb: {} },
    readiness: { recovery: 'ready', movementControl: 'controlled', intensityPreference: 'moderate' },
    unknowns: [],
    confidence: 'high',
  });
  const change = programChangeSchema.safeParse({
    summary: 'Swap the press', rationale: 'Keep the same movement intent with available equipment.',
    operations: [{ type: 'replace_exercise', dayIndex: 0, exerciseId: 'overhead-press', replacement: {
      id: 'landmine-press', name: 'Landmine Press', sets: 3, reps: '8', rest: 90, group: 'upper',
    } }],
  });
  assert.equal(consultation.success, true);
  assert.equal(change.success, true);
});

test('Trainer Markdown presents list items in sentence case without changing code fences', () => {
  assert.equal(
    sentenceCaseMarkdownListItems('- goal: feel stronger\n1. schedule: three days\n- iOS workout sync\n```\n- lowercase code\n```'),
    '- Goal: feel stronger\n1. Schedule: three days\n- iOS workout sync\n```\n- lowercase code\n```',
  );
});

test('every workout customization sheet uses the shared FLYNT sheet component', async () => {
  const source = await readFile(new URL('../components/workout-editor-sheet.tsx', import.meta.url), 'utf8');
  assert.match(source, /<FlyntSheet/);
  assert.doesNotMatch(source, /<NativeMaterialSheet|<BottomSheet/);
});

test('Trainer uses the maintained native chat shell and native Markdown responses', async () => {
  const screenSource = await readFile(new URL('../app/(tabs)/trainer.tsx', import.meta.url), 'utf8');
  const tabsSource = await readFile(new URL('../app/(tabs)/_layout.tsx', import.meta.url), 'utf8');
  const chatSource = await readFile(new URL('../components/flynt-chat-thread.tsx', import.meta.url), 'utf8');
  const composerSource = await readFile(new URL('../components/trainer-composer-accessory.tsx', import.meta.url), 'utf8');
  const conversationProvider = await readFile(new URL('../providers/trainer-conversation-provider.tsx', import.meta.url), 'utf8');
  const markdownSource = await readFile(new URL('../components/trainer-markdown-message.tsx', import.meta.url), 'utf8');
  assert.match(chatSource, /@kesha-antonov\/react-native-chat/);
  assert.match(chatSource, /<Chat<TMessage>/);
  assert.match(chatSource, /onContentSizeChange: scrollToBottom/);
  assert.match(chatSource, /ListFooterComponent: \(/);
  assert.match(chatSource, /\{renderThinking\(\)\}/);
  assert.match(chatSource, /height: listEndClearance/);
  assert.match(chatSource, /thinkingLabel = 'FLYNT is thinking'/);
  assert.match(screenSource, /<FlyntChatThread<TrainerChatMessage>/);
  assert.match(screenSource, /<AppScreen contentExtendsUnderTopbar/);
  assert.match(screenSource, /topInset=\{appTopbarHeight\}/);
  assert.match(screenSource, /kind: 'welcome'/);
  assert.match(screenSource, /const persisted = sessionMessages/);
  assert.match(conversationProvider, /const \[sessionBoundary\] = useState/);
  assert.match(conversationProvider, /requestMessages\(sessionMessages, text\)/);
  assert.match(markdownSource, /<EnrichedMarkdownText/);
  assert.match(markdownSource, /flavor="github"/);
  assert.match(markdownSource, /bulletColor/);
  const consultationSource = await readFile(new URL('../app/consultation.tsx', import.meta.url), 'utf8');
  assert.match(consultationSource, /<FlyntChatThread<ConsultationChatMessage>/);
  assert.match(consultationSource, /contentExtendsUnderTopbar/);
  assert.match(consultationSource, /topInset=\{appTopbarHeight\}/);
  assert.match(consultationSource, /<FlyntAssistantMessage markdown=\{currentMessage\.text\}/);
  assert.match(composerSource, /onContentSizeChange/);
  assert.match(composerSource, /boundedComposerHeight\(event\.nativeEvent\.contentSize\.height, maximumHeight\)/);
  assert.match(composerSource, /sendTarget: \{ position: 'absolute'/);
  assert.match(screenSource, /renderInputToolbar=\{\(\) => \([\s\S]*<FlyntChatInputToolbar/);
  assert.match(screenSource, /maximumHeight=\{trainerComposerMaximumHeight\}/);
  const composerLayout = await readFile(new URL('./composer-layout.ts', import.meta.url), 'utf8');
  assert.match(composerLayout, /trainerComposerMaximumHeight = 132/);
  assert.match(consultationSource, /consultationComposerMaximumHeight/);
  assert.match(consultationSource, /consultationIsReadyForReview/);
  assert.match(consultationSource, /userTurns <= 5 \|\| readyForReview/);
  assert.match(consultationSource, /onSelect=\{\(value\) => void sendText\(value\)\}/);
  assert.match(consultationSource, /composerClearance=\{spacing\.xl\}/);
  assert.match(consultationSource, /TYPICAL RESPONSES/);
  assert.doesNotMatch(consultationSource, /onSelect=\{setMessage\}/);
  assert.match(composerSource, /borderWidth: StyleSheet\.hairlineWidth/);
  assert.doesNotMatch(screenSource, /<FlatList/);
  assert.doesNotMatch(screenSource, /scrollToEnd/);
  assert.doesNotMatch(screenSource, /coachBubble/);
  assert.doesNotMatch(tabsSource, /TrainerComposerSurface/);
  assert.match(tabsSource, /!isTrainer && timer && timer\.seconds > 0 && !isExpanded/);
  assert.match(tabsSource, /nativeContainerStyle: tabContentStyle/);
  assert.equal((tabsSource.match(/contentStyle=\{tabContentStyle\}/g) ?? []).length, 4);
});

test('shared tab pages match Today with an open leading top bar', async () => {
  const source = await readFile(new URL('../components/app-surface.tsx', import.meta.url), 'utf8');
  const plan = await readFile(new URL('../app/(tabs)/plan.tsx', import.meta.url), 'utf8');
  const today = await readFile(new URL('../components/native-today-workout.tsx', import.meta.url), 'utf8');
  const theme = await readFile(new URL('../constants/theme.ts', import.meta.url), 'utf8');

  assert.match(source, /topbarPlaceholder/);
  assert.match(source, /export function AppScreenTopbar/);
  assert.match(plan, /<AppScreen contentExtendsUnderTopbar/);
  assert.match(today, /<AppScreenTopbar/);
  assert.match(today, /buttonStyle\('glass'\)/);
  assert.match(today, /controlSize\('large'\)/);
  assert.match(today, /labelStyle\('iconOnly'\)/);
  assert.doesNotMatch(today, /topbarMenuDecoration|glassEffect\(/);
  assert.match(today, /workoutSaveState === 'saving'/);
  const todayScreen = await readFile(new URL('../app/(tabs)/today.tsx', import.meta.url), 'utf8');
  assert.match(todayScreen, /motion\.duration\.deliberate - \(Date\.now\(\) - startedAt\)/);
  assert.match(todayScreen, /await finishDay\(selectedDay\)/);
  const workoutProvider = await readFile(new URL('../providers/workout-data-provider.tsx', import.meta.url), 'utf8');
  const api = await readFile(new URL('./api-client.ts', import.meta.url), 'utf8');
  assert.match(workoutProvider, /await recordWorkoutSession\(\{/);
  assert.match(workoutProvider, /persistLatestWorkoutState\(immediate \? 0 : 500\)/);
  assert.match(workoutProvider, /NativeAppState\.addEventListener\('change'/);
  assert.match(today, /function LoadPickerPage/);
  assert.match(today, /label="Load in pounds"/);
  assert.match(today, /onChooseLoad=\{\(\) => onChooseLoad\(setIndex\)\}/);
  assert.match(today, /function RepPickerPage/);
  assert.match(today, /label="Repetitions"/);
  assert.match(today, /onChooseReps=\{\(\) => onChooseReps\(setIndex\)\}/);
  assert.match(today, /const sheetExerciseIndex = sheetPresented \? selectedExercise : visibleExerciseIndex/);
  assert.doesNotMatch(today, /keyboardType\('decimal-pad'/);
  assert.doesNotMatch(today, /onTextChange=\{onRepsChange\}/);
  assert.match(api, /requestJson\('\/api\/workouts', savedWorkoutSessionSchema/);
  const nativeSymbol = await readFile(new URL('../components/native-symbol.tsx', import.meta.url), 'utf8');
  assert.match(nativeSymbol, /effect: 'drawOn'/);
  assert.match(nativeSymbol, /repeat: 'nonRepeating'/);
  assert.match(today, /ignoreSafeArea\(\{ regions: 'container', edges: 'top' \}\)/);
  assert.match(theme, /darkCanvas: '#141414'/);
  assert.match(theme, /todayBackground: palette\.darkCanvas/);
  assert.match(theme, /edgeScrim: 'rgba\(20,20,20,0\.92\)'/);
  assert.match(theme, /todayEdgeScrim: 'rgba\(20,20,20,0\.92\)'/);
  assert.doesNotMatch(plan, /backgroundColor: itemBackground|borderBottomWidth/);
  assert.match(plan, /day\.shortDay\.slice\(0, 1\)/);
  assert.match(plan, /fontSize: 17, lineHeight: 22, fontWeight: '600'/);
  assert.doesNotMatch(source, /flynt-mark/);
});

test('signed-out onboarding preserves the approved PWA story and unified account surface', async () => {
  assert.deepEqual(
    firstRunSlides.map(({ kind, title }) => [kind, title]),
    [
      ['today', 'Your training, in focus.'],
      ['timer', 'The right rest is already built in.'],
      ['guide', 'A custom guide for every exercise.'],
      ['progress', 'Progress you can actually use.'],
      ['trainer', 'A trainer that knows your plan.'],
      ['spotify', 'Your music stays in the workout.'],
    ],
  );

  const introduction = await readFile(new URL('../components/first-run-introduction.tsx', import.meta.url), 'utf8');
  const account = await readFile(new URL('../components/account-entry-screen.tsx', import.meta.url), 'utf8');
  const entry = await readFile(new URL('../app/index.tsx', import.meta.url), 'utf8');
  const auth = await readFile(new URL('./auth.ts', import.meta.url), 'utf8');
  const googleModule = await readFile(
    new URL('../../modules/flynt-google-auth/ios/FlyntGoogleAuthModule.swift', import.meta.url),
    'utf8',
  );
  const googleConfig = await readFile(new URL('../constants/google-auth.ts', import.meta.url), 'utf8');
  const appConfig = JSON.parse(await readFile(new URL('../../app.json', import.meta.url), 'utf8'));
  const packageConfig = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
  const theme = await readFile(new URL('../constants/theme.ts', import.meta.url), 'utf8');
  const themeProvider = await readFile(new URL('../providers/flynt-theme-provider.tsx', import.meta.url), 'utf8');

  assert.match(theme, /signedOutColorMode: ColorMode = 'dark'/);
  assert.match(themeProvider, /!hasSession\s*\|\| destination === 'consultation'/);
  assert.match(themeProvider, /usesOnboardingAppearance[\s\S]*signedOutColorMode/);

  assert.doesNotMatch(introduction, /styles\.skip|skipCopy/);
  assert.match(introduction, /function MarketingStageBackground/);
  assert.match(introduction, /id="sageCream"[\s\S]*id="blueGrey"[\s\S]*id="bronzeBlue"/);
  assert.match(introduction, /FeGaussianBlur stdDeviation="22"/);
  assert.match(introduction, /id="stageInsetBlur"[\s\S]*stdDeviation="19"/);
  assert.doesNotMatch(introduction, /stageInsetBlackBlur/);
  assert.match(introduction, /stroke="#FFFFFF"[\s\S]*strokeOpacity=\{0\.3\}[\s\S]*strokeWidth="28"[\s\S]*transform="translate\(-20 -20\)"/);
  assert.match(introduction, /stroke="#000000"[\s\S]*strokeWidth="28"[\s\S]*transform="translate\(20 20\)"/);
  assert.match(introduction, /styles\.interfaceCardShadow[\s\S]*<BlurView intensity=\{36\} style=\{styles\.interfaceCard\}/);
  assert.match(introduction, /interfaceCardShadow:[\s\S]*shadowOpacity: 0\.72[\s\S]*shadowRadius: 34/);
  assert.doesNotMatch(introduction, /marketing-stage-[a-z]+\.png/);
  assert.match(introduction, /appSurfaces\.dark\.primaryBackground/);
  assert.match(introduction, /<StatusBar animated style="light"/);
  assert.match(introduction, />Sign in</);
  assert.match(account, /Continue with Google/);
  assert.match(account, /pending === 'apple' \? 'Signing in with Apple'/);
  assert.match(account, /styles\.appleProgress/);
  assert.match(account, /accessibilityState=\{\{ busy: pending === 'google'/);
  assert.match(account, /AppleAuthenticationButtonType\.CONTINUE/);
  assert.ok(
    account.indexOf('AppleAuthenticationButtonType.CONTINUE') < account.indexOf('Continue with Google'),
    'Apple must be the first authentication provider',
  );
  assert.match(account, /Continue with email/);
  assert.match(account, /styles\.actions, \(emailOpen \|\| recoveryMode \|\| sentTo\) && styles\.focusedEmailActions/);
  assert.match(account, /focusedEmailActions: \{ paddingBottom: 96 \}/);
  assert.match(account, /fetchAccountStatus\(\)/);
  assert.match(account, /hasCurrentFlyntAccount\(status, flyntLegalVersion\)/);
  assert.match(account, /No existing FLYNT account was found/);
  assert.match(account, /styles\.emailTextAction/);
  assert.doesNotMatch(account, /markFirstRunIntroductionSeen/);
  assert.match(account, /<FlyntSheet/);
  assert.match(entry, /await markFirstRunIntroductionSeen\(\)/);
  assert.doesNotMatch(entry, /Training that learns you/);
  assert.match(auth, /FlyntGoogleAuth\.signIn\(hashedNonce\)/);
  assert.match(auth, /nonce: rawNonce/);
  assert.match(auth, /signInWithIdToken\(\{[\s\S]*provider: 'google'/);
  assert.match(auth, /Platform\.OS !== 'ios'/);
  assert.doesNotMatch(auth, /@react-native-google-signin\/google-signin/);
  assert.match(googleModule, /GIDConfiguration\(/);
  assert.match(googleModule, /nonce: hashedNonce/);
  assert.match(googleModule, /result\?\.user\.idToken\?\.tokenString/);
  assert.equal(packageConfig.dependencies['flynt-google-auth'], 'workspace:*');
  assert.equal(packageConfig.dependencies['@react-native-google-signin/google-signin'], undefined);
  assert.match(googleConfig, /iosClientId/);
  assert.match(googleConfig, /webClientId/);
  assert.ok(
    appConfig.expo.plugins.some((plugin) => Array.isArray(plugin)
      && plugin[0] === 'flynt-google-auth'
      && plugin[1]?.iosUrlScheme === 'com.googleusercontent.apps.404535560676-jpvemrs30oki2pt6vdgfvh5s0854r20j'),
    'Google native sign-in must register the iOS OAuth callback scheme',
  );
  assert.ok(
    appConfig.expo.plugins.some((plugin) => Array.isArray(plugin)
      && plugin[0] === 'expo-build-properties'
      && plugin[1]?.ios?.useFrameworks === 'static'),
    'Google Sign-In App Check dependencies must be integrated as static frameworks',
  );

  const firstRun = await readFile(new URL('./first-run.ts', import.meta.url), 'utf8');
  assert.match(firstRun, /new File\(Paths\.document/);
  assert.doesNotMatch(firstRun, /SecureStore/);
  assert.match(account, /if \(authMode === 'create' && !recoveryMode\) \{\s*await refresh\(\);\s*return;/);
});

test('session resolution stays behind the native launch screen', async () => {
  const rootLayout = await readFile(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
  const boot = await readFile(new URL('../app/boot.tsx', import.meta.url), 'utf8');
  const themeProvider = await readFile(new URL('../providers/flynt-theme-provider.tsx', import.meta.url), 'utf8');

  assert.match(rootLayout, /SplashScreen\.preventAutoHideAsync\(\)/);
  assert.match(rootLayout, /phase !== 'loading'[\s\S]*SplashScreen\.hideAsync\(\)/);
  assert.match(boot, /if \(isLoading\) return null/);
  assert.doesNotMatch(boot, /Loading your training|Checking your account and latest program state/);
  assert.match(boot, /screen-authoritative-boot-error/);
  assert.match(themeProvider, /phase !== 'ready'[\s\S]*signedOutColorMode/);
});

test('program building reports real progress and asks for notifications in context', async () => {
  const screen = await readFile(new URL('../app/program-building.tsx', import.meta.url), 'utf8');
  const api = await readFile(new URL('./api-client.ts', import.meta.url), 'utf8');
  const rootLayout = await readFile(new URL('../app/_layout.tsx', import.meta.url), 'utf8');

  assert.match(screen, /fetchProgramStatus\(\)/);
  assert.match(screen, /AppState\.addEventListener\('change'/);
  assert.match(screen, /import Svg, \{ Circle \} from 'react-native-svg'/);
  assert.match(screen, /progressRingCenter - progressRingRadius/);
  assert.match(screen, /strokeDashoffset=\{progressOffset\}/);
  assert.match(screen, /strokeWidth=\{progressRingStroke\}/);
  assert.match(screen, /<Circle cx=\{markerX\} cy=\{markerY\}/);
  assert.match(screen, /Reviewing your goals and preferences/);
  assert.match(screen, /Structuring your training week/);
  assert.match(screen, /Selecting exercises for you/);
  assert.match(screen, /Programming each movement/);
  assert.match(screen, /Balancing training and recovery/);
  assert.match(screen, /Checking every session/);
  assert.match(screen, /ShimmerGlyph/);
  assert.match(screen, /interpolate\(distance/);
  assert.match(screen, /useReducedMotion/);
  assert.doesNotMatch(screen, /Built around you/);
  assert.match(screen, /Notifications\.requestPermissionsAsync/);
  assert.match(screen, /Notify me when it’s ready/);
  assert.match(screen, /We’ll notify you when it’s ready!/);
  assert.doesNotMatch(screen, /of \$\{total\} movement guides/);
  assert.match(screen, /notificationState === 'ready' \? \(\s*<View accessibilityLiveRegion="polite"/);
  assert.doesNotMatch(screen, /LifecyclePlaceholder/);
  assert.match(api, /requestJson\('\/api\/program\/status'/);
  assert.match(rootLayout, /Notifications\.setNotificationHandler/);
  assert.match(rootLayout, /shouldShowBanner: true/);
});

test('exercise media and entry controls share the approved semantic surface', async () => {
  const theme = await readFile(new URL('../constants/theme.ts', import.meta.url), 'utf8');
  const today = await readFile(new URL('../components/native-today-workout.tsx', import.meta.url), 'utf8');
  const editor = await readFile(new URL('../components/workout-editor-sheet.tsx', import.meta.url), 'utf8');

  assert.match(theme, /exerciseSurface: '#D4D3D0'/);
  assert.match(today, /appSurfaces\[mode\]\.exerciseSurface/);
  assert.match(today, /sheetInput = mode === 'dark' \? '#282828' : appSurfaces\.light\.exerciseSurface/);
  assert.match(today, /mediaBackground = mode === 'dark' \? exerciseEntryBackground : appSurfaces\.light\.exerciseSurface/);
  assert.match(editor, /backgroundColor: appSurfaces\[mode\]\.exerciseSurface/);
  assert.match(editor, /onSelectField\('load'\)/);
  assert.match(editor, /loadPickerOptions\(exercise\.targetLoad\)/);
  assert.doesNotMatch(editor, /keyboardType="decimal-pad" label="Target load/);
});

test('Spotify restores an authorized App Remote connection after foreground transitions', async () => {
  const spotify = await readFile(new URL('../../modules/flynt-spotify/ios/FlyntSpotifyService.swift', import.meta.url), 'utf8');

  assert.match(spotify, /private var shouldMaintainConnection = false/);
  assert.match(spotify, /func applicationDidBecomeActive\(\) \{\s*scheduleReconnect\(\)/);
  assert.match(spotify, /UIApplication\.shared\.applicationState == \.active/);
  assert.match(spotify, /DispatchQueue\.main\.asyncAfter/);
  assert.match(spotify, /func disconnect\(\) \{\s*shouldMaintainConnection = false/);
});
