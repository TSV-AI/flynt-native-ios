import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  completedConsultationSchema,
  consultationBasicsSchema,
  programChangeSchema,
  workoutOverrideExerciseSchema,
} from '../contracts/app-state.ts';
import { firstRunSlides } from '../features/first-run-content.ts';

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

test('consultation basics require both communication and training intent choices', () => {
  assert.equal(consultationBasicsSchema.safeParse({
    name: 'Priya', age: 34, height: 66, weight: 142, experience: 'some', trainingIntent: 'hybrid',
  }).success, true);
  assert.equal(consultationBasicsSchema.safeParse({
    name: 'Priya', age: 34, height: 66, weight: 142, experience: 'some',
  }).success, false);
});

test('Trainer approvals validate consultation and bounded program-change payloads', () => {
  const consultation = completedConsultationSchema.safeParse({
    summary: 'Three balanced training days focused on useful strength.',
    coachingPriorities: ['Build consistency', 'Respect recovery'],
    profile: {
      name: 'Priya', age: '34', heightFeet: '5', heightInches: '6', weight: '142',
      experience: 'Some training experience', daysPerWeek: '3', equipment: 'Full gym',
      goal: 'Feel stronger', limitations: 'No current limitations',
    },
    answers: {
      primaryGoals: ['Feel stronger'], focusAreas: ['Full body'], sessionLength: '60 minutes',
      equipment: ['Full gym'], preferredMovements: 'No movement preference', avoidedMovements: 'No avoided movements',
      recovery: 'Generally good', trainingHistory: 'On and off', scheduleConstraints: 'Three weekdays',
      sportsActivity: 'No regular sport activity', mobilityPriorities: 'No current priority', successMeasures: 'Steady load progress',
    },
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

test('every workout customization sheet uses the shared FLYNT sheet component', async () => {
  const source = await readFile(new URL('../components/workout-editor-sheet.tsx', import.meta.url), 'utf8');
  assert.match(source, /<FlyntSheet/);
  assert.doesNotMatch(source, /<NativeMaterialSheet|<BottomSheet/);
});

test('Trainer uses the maintained native chat shell and native Markdown responses', async () => {
  const screenSource = await readFile(new URL('../app/(tabs)/trainer.tsx', import.meta.url), 'utf8');
  const tabsSource = await readFile(new URL('../app/(tabs)/_layout.tsx', import.meta.url), 'utf8');
  const markdownSource = await readFile(new URL('../components/trainer-markdown-message.tsx', import.meta.url), 'utf8');
  assert.match(screenSource, /@kesha-antonov\/react-native-chat/);
  assert.match(screenSource, /<Chat<TrainerChatMessage>/);
  assert.match(screenSource, /kind: 'welcome'/);
  assert.match(screenSource, /Trainer is thinking/);
  assert.match(markdownSource, /<EnrichedMarkdownText/);
  assert.match(markdownSource, /flavor="github"/);
  assert.match(markdownSource, /bulletColor/);
  assert.doesNotMatch(screenSource, /<FlatList/);
  assert.doesNotMatch(screenSource, /scrollToEnd/);
  assert.doesNotMatch(screenSource, /coachBubble/);
  assert.match(tabsSource, /<NativeTabs\.BottomAccessory>[\s\S]*<TrainerComposerSurface \/>/);
  assert.doesNotMatch(tabsSource, /<NativeTabs\.BottomAccessory>[\s\S]*<TrainerChatInputToolbar \/>/);
});

test('shared tab pages match Today with an open leading top bar', async () => {
  const source = await readFile(new URL('../components/app-surface.tsx', import.meta.url), 'utf8');
  assert.match(source, /topbarPlaceholder/);
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

  assert.doesNotMatch(introduction, /styles\.skip|skipCopy/);
  assert.match(introduction, />Sign in</);
  assert.match(account, /Continue with Google/);
  assert.match(account, /AppleAuthenticationButtonType\.CONTINUE/);
  assert.ok(
    account.indexOf('AppleAuthenticationButtonType.CONTINUE') < account.indexOf('Continue with Google'),
    'Apple must be the first authentication provider',
  );
  assert.match(account, /Continue with email/);
  assert.match(account, /styles\.emailTextAction/);
  assert.doesNotMatch(account, /markFirstRunIntroductionSeen/);
  assert.match(account, /<FlyntSheet/);
  assert.match(entry, /await markFirstRunIntroductionSeen\(\)/);
  assert.doesNotMatch(entry, /Training that learns you/);

  const firstRun = await readFile(new URL('./first-run.ts', import.meta.url), 'utf8');
  assert.match(firstRun, /new File\(Paths\.document/);
  assert.doesNotMatch(firstRun, /SecureStore/);
});
