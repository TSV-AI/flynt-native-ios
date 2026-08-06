import {
  BottomSheet,
  Button,
  Divider,
  Group,
  HStack,
  Host,
  Image as SwiftUIImage,
  List,
  Menu,
  ProgressView,
  RNHostView,
  ScrollView,
  Spacer,
  TabView,
  Text as NativeText,
  TextField,
  useNativeState,
  VStack,
  ZStack,
} from '@expo/ui/swift-ui';
import {
  Animation,
  accessibilityAddTraits,
  accessibilityHidden,
  accessibilityHint,
  accessibilityLabel,
  animation,
  background,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled,
  environment,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  ignoreSafeArea,
  kerning,
  keyboardType,
  labelStyle,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  listStyle,
  lineLimit,
  monospacedDigit,
  multilineTextAlignment,
  opacity,
  offset,
  padding,
  presentationBackground,
  presentationBackgroundInteraction,
  presentationDetents,
  presentationDragIndicator,
  progressViewStyle,
  scrollContentBackground,
  shapes,
  strokeBorder,
  tabViewStyle,
  textFieldStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { type ReactElement, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreenTopbar, appTopbarHeight } from '@/components/app-surface';
import { GlassTextButton, NativeSymbol } from '@/components/native-symbol';
import { NativeWorkoutEditorList } from '@/components/native-workout-editor-list';
import { RestTimerAccessorySurface } from '@/components/rest-timer-accessory';
import { motion } from '@/constants/motion';
import { flyntSheetBackgroundColor, flyntSheetDetent } from '@/constants/sheet';
import { appSurfaces, spacing, type ColorMode, type Theme } from '@/constants/theme';
import type { PreviewDay, PreviewExercise } from '@/features/app-preview-data';
import { getExerciseArtwork } from '@/features/exercise-artwork';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import { useModalPresentation } from '@/providers/modal-presentation-provider';
import { useRestTimer } from '@/providers/rest-timer-provider';
import type { WorkoutSetEntry } from '@/providers/workout-data-provider';

type NativeTodayWorkoutProps = {
  completed: number[];
  dateLabel: string;
  day: PreviewDay;
  editingWorkout: boolean;
  exercises: PreviewExercise[];
  finished: boolean;
  mode: ColorMode;
  onAddExercise: () => void;
  onCancelWorkout: () => void;
  onChooseDay: (index: number) => void;
  onDeleteExercises: (indices: number[]) => void;
  onEditExercise: (index: number) => void;
  onExerciseSheetDismissed: () => void;
  onEditWorkout: () => void;
  onFinishWorkout: () => void;
  onMoveExercises: (sourceIndices: number[], destination: number) => void;
  onOpenSettings: () => void;
  onReplaceExercise: (index: number) => void;
  onSaveWorkout: () => void;
  onSpotifySheetDismissed: () => void;
  onSelectExercise: (index: number) => void;
  onToggleSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSetEntry>, immediate?: boolean) => void;
  progress: number;
  selectedDay: number;
  selectedExercise: number;
  setEntries: WorkoutSetEntry[][];
  spotifyBar?: ReactElement;
  spotifyPill?: ReactElement;
  spotifySheet: ReactElement;
  spotifySheetPresented: boolean;
  theme: Theme;
  totalSets: number;
  completedSets: number;
  week: PreviewDay[];
  workoutSaveState: 'idle' | 'saving' | 'saved';
};

type NativeSetRowProps = {
  checked: boolean;
  exerciseName: string;
  index: number;
  inputColor: string;
  onToggle: () => void;
  onRepsChange: (value: string, immediate?: boolean) => void;
  onWeightChange: (value: string, immediate?: boolean) => void;
  outlineColor: string;
  prescribedReps: string;
  reps: string;
  theme: Theme;
  weight: string;
};

const dayShape = shapes.roundedRectangle({ cornerRadius: 18, roundedCornerStyle: 'continuous' });
function exerciseSummary(detail: string): string {
  return detail.replace(/^\d+\s+sets\s+·\s*/i, '');
}

function exerciseArtworkSource(exercise: PreviewExercise) {
  return exercise.visualUrl ? { uri: exercise.visualUrl } : getExerciseArtwork(exercise.name);
}

function exerciseArtworkUri(exercise: PreviewExercise) {
  const source = exerciseArtworkSource(exercise);
  return source ? Image.resolveAssetSource(source)?.uri : undefined;
}

function restLabel(seconds = 90) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes}:${String(remainder).padStart(2, '0')}` : `${remainder} sec`;
}

function ExerciseArtwork({
  accessible = false,
  backgroundColor,
  height,
  exercise,
  width,
}: {
  accessible?: boolean;
  backgroundColor: string;
  height: number;
  exercise: PreviewExercise;
  width: number;
}) {
  const source = exerciseArtworkSource(exercise);
  if (!source) return null;

  return (
    <Group
      modifiers={[
        background(backgroundColor, shapes.roundedRectangle({ cornerRadius: 18, roundedCornerStyle: 'continuous' })),
      ]}
    >
      <RNHostView matchContents>
        <View
          accessibilityElementsHidden={!accessible}
          accessibilityLabel={accessible ? exercise.visualAlt ?? `Movement illustration for ${exercise.name}` : undefined}
          accessibilityRole={accessible ? 'image' : undefined}
          accessible={accessible}
          importantForAccessibility={accessible ? 'yes' : 'no-hide-descendants'}
          style={{
            width,
            height,
            alignItems: 'center',
            justifyContent: 'center',
            borderCurve: 'continuous',
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={source}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </RNHostView>
    </Group>
  );
}

function NativeSetRow({ checked, exerciseName, index, inputColor, onRepsChange, onToggle, onWeightChange, outlineColor, prescribedReps, reps: initialReps, theme, weight: initialWeight }: NativeSetRowProps) {
  const weight = useNativeState(initialWeight);
  const reps = useNativeState(initialReps || prescribedReps);
  const adjustReps = (change: number) => {
    const currentReps = Number.parseInt(reps.get(), 10);
    const nextReps = Math.min(99, Math.max(1, (Number.isFinite(currentReps) ? currentReps : 1) + change));
    reps.set(String(nextReps));
    onRepsChange(String(nextReps));
  };
  const fieldModifiers = [
    frame({ width: 88, height: 44 }),
    textFieldStyle('plain' as const),
    keyboardType('decimal-pad' as const),
    multilineTextAlignment('center' as const),
    foregroundStyle(theme.ink),
    font({ textStyle: 'body', weight: 'semibold' }),
    monospacedDigit(),
    background(inputColor, shapes.capsule()),
    strokeBorder({ color: outlineColor, style: { lineWidth: 0.5 }, shape: 'capsule' }),
  ];

  return (
    <VStack modifiers={[padding({ vertical: spacing.xxs })]}>
      <HStack
        spacing={0}
        modifiers={[
          frame({ minHeight: 56, maxWidth: 1000 }),
        ]}
      >
        <TextField
          onFocusChange={(focused) => {
            if (!focused) onWeightChange(weight.get(), true);
          }}
          onTextChange={onWeightChange}
          placeholder="–"
          text={weight}
          modifiers={[
            ...fieldModifiers,
            accessibilityLabel(`${exerciseName} set ${index + 1} load in pounds`),
          ]}
        />
        <Spacer minLength={12} />
        <HStack
          spacing={0}
          modifiers={[
            frame({ width: 132, height: 44 }),
            background(inputColor, shapes.capsule()),
            strokeBorder({ color: outlineColor, style: { lineWidth: 0.5 }, shape: 'capsule' }),
          ]}
        >
          <Button
            onPress={() => adjustReps(-1)}
            modifiers={[
              buttonStyle('plain'),
              frame({ width: 44, height: 44 }),
              accessibilityLabel(`Decrease ${exerciseName} set ${index + 1} reps`),
            ]}
          >
            <SwiftUIImage color={theme.muted} size={13} systemName="minus" />
          </Button>
          <TextField
            onFocusChange={(focused) => {
              if (!focused) onRepsChange(reps.get(), true);
            }}
            onTextChange={onRepsChange}
            placeholder="–"
            text={reps}
            modifiers={[
              frame({ width: 44, height: 44 }),
              textFieldStyle('plain'),
              keyboardType('ascii-capable-number-pad'),
              multilineTextAlignment('center'),
              foregroundStyle(theme.ink),
              font({ textStyle: 'body', weight: 'semibold' }),
              monospacedDigit(),
              accessibilityLabel(`${exerciseName} set ${index + 1} reps`),
            ]}
          />
          <Button
            onPress={() => adjustReps(1)}
            modifiers={[
              buttonStyle('plain'),
              frame({ width: 44, height: 44 }),
              accessibilityLabel(`Increase ${exerciseName} set ${index + 1} reps`),
            ]}
          >
            <SwiftUIImage color={theme.muted} size={13} systemName="plus" />
          </Button>
        </HStack>
        <Spacer minLength={12} />
        <Button
          onPress={onToggle}
          modifiers={[
            buttonStyle('plain'),
            frame({ width: 44, height: 44 }),
            accessibilityLabel(`${checked ? 'Uncheck' : 'Complete'} ${exerciseName} set ${index + 1}`),
          ]}
        >
          <SwiftUIImage
            color={checked ? theme.ink : theme.muted}
            size={27}
            systemName={checked ? 'checkmark.circle.fill' : 'circle'}
          />
        </Button>
      </HStack>
    </VStack>
  );
}

function ExerciseListRow({
  completed,
  editing = false,
  exercise,
  inputColor,
  onPress,
  outlineColor,
  rowWidth,
  theme,
}: {
  completed: number;
  editing?: boolean;
  exercise: PreviewExercise;
  inputColor: string;
  onPress: () => void;
  outlineColor: string;
  rowWidth: number;
  theme: Theme;
}) {
  const done = completed === exercise.total;
  const artwork = exerciseArtworkSource(exercise);
  const rest = restLabel(exercise.restSeconds);
  return (
    <RNHostView matchContents>
      <Pressable
        accessibilityHint="Opens exercise details and set entry"
        accessibilityLabel={`${exercise.name}, ${exerciseSummary(exercise.detail)}, ${rest} rest, ${completed} of ${exercise.total} sets complete`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.exerciseRow,
          { width: rowWidth },
          pressed && { backgroundColor: theme.raised, opacity: 0.72 },
        ]}
      >
        {artwork ? (
          <View
            accessibilityElementsHidden
            style={[
              styles.exerciseRowArtwork,
              { backgroundColor: inputColor, borderColor: outlineColor },
              done && styles.exerciseRowArtworkDone,
            ]}
          >
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={artwork}
              style={styles.exerciseRowArtworkImage}
            />
          </View>
        ) : (
          <View
            accessibilityElementsHidden
            style={[
              styles.exerciseRowArtwork,
              { backgroundColor: inputColor, borderColor: outlineColor },
              done && styles.exerciseRowArtworkDone,
            ]}
          >
            <NativeSymbol color={theme.muted} name="figure.strengthtraining.traditional" size={24} />
          </View>
        )}
        <View style={styles.exerciseRowCopy}>
          <Text style={[styles.exerciseRowTitle, { color: done ? theme.muted : theme.ink }]}>
            {exercise.name}
          </Text>
          <Text style={[styles.exerciseRowDetail, { color: theme.muted }]}>
            {exercise.total} sets · {rest} rest
          </Text>
        </View>
        {!editing ? <NativeSymbol color={done ? theme.ink : theme.muted} name={done ? 'checkmark.circle.fill' : 'circle'} size={20} /> : null}
      </Pressable>
    </RNHostView>
  );
}

function ExerciseSheetContent({
  advanceLabel,
  completed,
  exercise,
  exerciseIndex,
  input,
  isLarge,
  mediaBackground,
  mediaWidth,
  onAdvance,
  onClose,
  onOpenStats,
  onToggleSet,
  onUpdateSet,
  outline,
  setEntries,
  theme,
}: {
  advanceLabel: string;
  completed: number;
  exercise: PreviewExercise;
  exerciseIndex: number;
  input: string;
  isLarge: boolean;
  mediaBackground: string;
  mediaWidth: number;
  onAdvance: () => void;
  onClose: () => void;
  onOpenStats: () => void;
  onToggleSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSetEntry>, immediate?: boolean) => void;
  outline: string;
  setEntries: WorkoutSetEntry[];
  theme: Theme;
}) {
  const { expand: expandRest, timer } = useRestTimer();
  const prescribedReps = exercise.detail.match(/(\d+(?:[–-]\d+)?)\s+reps?/i)?.[1] ?? '';
  const artwork = exerciseArtworkSource(exercise);
  const guideSteps = exercise.guideSteps === undefined
    ? [
        'Brace with full-foot pressure before the first rep.',
        'Use the programmed range without rushing the transition.',
        'Finish under control, then reset your position.',
      ]
    : exercise.guideSteps;
  const activeRest = timer?.exercise === exercise.name ? timer : null;
  const isComplete = completed >= exercise.total;
  function openRestTimer() {
    onClose();
    setTimeout(expandRest, motion.duration.standard);
  }
  return (
    <ZStack alignment="bottom">
      <ScrollView showsIndicators={false}>
        <VStack
          alignment="leading"
          spacing={0}
          modifiers={[
            padding({
              horizontal: spacing.lg,
              top: spacing.lg,
              bottom: activeRest ? spacing.hero + spacing.xl : spacing.xl,
            }),
          ]}
        >
        <HStack alignment="top" spacing={12}>
          <VStack alignment="leading" spacing={6}>
            <NativeText modifiers={[font({ textStyle: 'title2', weight: 'semibold' }), foregroundStyle(theme.ink), fixedSize({ vertical: true })]}>
              {exercise.name}
            </NativeText>
          </VStack>
          <Spacer minLength={8} />
          <Button
            onPress={onClose}
            modifiers={[
              buttonStyle('glass'),
              buttonBorderShape('circle'),
              frame({ width: 44, height: 44 }),
              accessibilityLabel('Close exercise'),
            ]}
          >
            <SwiftUIImage color={theme.ink} size={17} systemName="xmark" />
          </Button>
        </HStack>

        {isLarge ? (
          <VStack
            alignment="leading"
            spacing={spacing.md}
            modifiers={[padding({ top: spacing.lg, bottom: spacing.lg })]}
          >
            {artwork ? (
              <ExerciseArtwork
                accessible
                backgroundColor={mediaBackground}
                exercise={exercise}
                height={190}
                width={mediaWidth}
              />
            ) : (
              <VStack
                alignment="leading"
                spacing={6}
                modifiers={[
                  frame({ minHeight: 120, maxWidth: 1000, alignment: 'bottomLeading' }),
                  accessibilityLabel(`Movement visual for ${exercise.name} is not yet published`),
                ]}
              >
                <NativeText modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(theme.muted), fixedSize({ vertical: true })]}>
                  Movement media is not yet published.
                </NativeText>
              </VStack>
            )}
            {guideSteps.length ? <VStack alignment="leading" spacing={spacing.sm}>
              {guideSteps.map((step, index) => (
                <HStack key={step} alignment="top" spacing={10}>
                  <NativeText modifiers={[frame({ width: 24 }), font({ textStyle: 'caption2' }), foregroundStyle(theme.muted), monospacedDigit()]}>
                    {String(index + 1).padStart(2, '0')}
                  </NativeText>
                  <NativeText modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(theme.ink), fixedSize({ vertical: true })]}>
                    {step}
                  </NativeText>
                </HStack>
              ))}
            </VStack> : (
              <NativeText modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(theme.muted), fixedSize({ vertical: true })]}>
                Written guidance is not yet published.
              </NativeText>
            )}
          </VStack>
        ) : <Spacer modifiers={[frame({ height: 20 })]} />}

        <Divider />
        <VStack spacing={0} modifiers={[padding({ top: spacing.md })]}>
          <HStack spacing={0} modifiers={[padding({ bottom: spacing.xs })]}>
            <NativeText
              modifiers={[
                frame({ width: 88, alignment: 'center' }),
                font({ textStyle: 'caption2', weight: 'bold' }),
                foregroundStyle(theme.muted),
                kerning(0.8),
              ]}
            >
              LOAD (LBS)
            </NativeText>
            <Spacer minLength={12} />
            <NativeText
              modifiers={[
                frame({ width: 132, alignment: 'center' }),
                font({ textStyle: 'caption2', weight: 'bold' }),
                foregroundStyle(theme.muted),
                kerning(0.8),
              ]}
            >
              REPS
            </NativeText>
            <Spacer minLength={12} />
            <Spacer modifiers={[frame({ width: 44 })]} />
          </HStack>
          {Array.from({ length: exercise.total }, (_, setIndex) => (
            <NativeSetRow
              key={setIndex}
              checked={setIndex < completed}
              exerciseName={exercise.name}
              index={setIndex}
              inputColor={input}
              onToggle={() => onToggleSet(exerciseIndex, setIndex)}
              onRepsChange={(reps, immediate) => onUpdateSet(exerciseIndex, setIndex, { reps }, immediate)}
              onWeightChange={(weight, immediate) => onUpdateSet(exerciseIndex, setIndex, { weight }, immediate)}
              outlineColor={outline}
              prescribedReps={prescribedReps}
              reps={setEntries[setIndex]?.reps ?? prescribedReps}
              theme={theme}
              weight={setEntries[setIndex]?.weight ?? ''}
            />
          ))}
        </VStack>
        <HStack spacing={spacing.sm} modifiers={[frame({ minHeight: 52, maxWidth: 1000 }), padding({ top: spacing.xs })]}>
          <Button
            onPress={onOpenStats}
            modifiers={[
              buttonStyle('plain'),
              frame({ minHeight: 44 }),
              accessibilityLabel(`Open exercise stats for ${exercise.name}`),
            ]}
          >
            <HStack spacing={7}>
              <SwiftUIImage color={theme.muted} size={14} systemName="chart.bar" />
              <NativeText modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' }), foregroundStyle(theme.ink)]}>
                Exercise stats
              </NativeText>
            </HStack>
          </Button>
          <Spacer minLength={0} />
          {isComplete ? (
            <Button
              onPress={onAdvance}
              modifiers={[
                buttonStyle('borderedProminent'),
                buttonBorderShape('capsule'),
                frame({ minHeight: 44 }),
                tint(theme.ink),
                accessibilityLabel(advanceLabel),
              ]}
            >
              <NativeText modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' }), foregroundStyle(theme.primaryText)]}>
                {advanceLabel}
              </NativeText>
            </Button>
          ) : null}
        </HStack>
        </VStack>
      </ScrollView>
      {activeRest ? (
        <VStack modifiers={[padding({ horizontal: spacing.lg, bottom: spacing.sm })]}>
          <RNHostView matchContents>
            <RestTimerAccessorySurface onPress={openRestTimer} width={mediaWidth} />
          </RNHostView>
        </VStack>
      ) : null}
    </ZStack>
  );
}

function ExerciseStatsPage({ exercise, itemBackground, onBack, onClose, theme }: { exercise: PreviewExercise; itemBackground: string; onBack: () => void; onClose: () => void; theme: Theme }) {
  const sessions = [
    { date: 'JUL 03', load: '205 LB', meta: '5 reps · RPE 8' },
    { date: 'JUL 10', load: '210 LB', meta: '5 reps · RPE 8' },
    { date: 'JUL 17', load: '215 LB', meta: '5 reps · RPE 8' },
    { date: 'TODAY', load: '225 LB', meta: '5 reps · RPE 8' },
  ];
  return (
    <ScrollView showsIndicators={false}>
      <VStack
        alignment="leading"
        spacing={0}
        modifiers={[padding({ horizontal: spacing.lg, top: spacing.lg, bottom: spacing.xl })]}
      >
        <HStack spacing={10}>
          <Button
            onPress={onBack}
            modifiers={[buttonStyle('plain'), frame({ width: 44, height: 44 }), accessibilityLabel('Back to exercise')]}
          >
            <SwiftUIImage color={theme.ink} size={18} systemName="chevron.left" />
          </Button>
          <NativeText modifiers={[font({ textStyle: 'headline' }), foregroundStyle(theme.ink), fixedSize({ vertical: true })]}>{exercise.name}</NativeText>
          <Spacer />
          <Button
            onPress={onClose}
            modifiers={[buttonStyle('glass'), buttonBorderShape('circle'), frame({ width: 44, height: 44 }), accessibilityLabel('Close exercise')]}
          >
            <SwiftUIImage color={theme.ink} size={16} systemName="xmark" />
          </Button>
        </HStack>

        <VStack alignment="leading" spacing={7} modifiers={[padding({ top: spacing.lg, bottom: spacing.lg })]}>
          <NativeText modifiers={[font({ textStyle: 'title2', weight: 'semibold' }), foregroundStyle(theme.ink), fixedSize({ vertical: true })]}>
            Load is rising while effort holds.
          </NativeText>
          <NativeText modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(theme.muted), fixedSize({ vertical: true })]}>
            4 sessions · Avg RPE 8 · Pain 0/10
          </NativeText>
        </VStack>

        <Divider />
        <NativeText modifiers={[padding({ top: spacing.lg, bottom: spacing.md }), font({ textStyle: 'headline' }), foregroundStyle(theme.ink)]}>
          Recent top sets
        </NativeText>
        {sessions.map((session, index) => (
          <HStack key={session.date} alignment="top" spacing={spacing.sm}>
            <VStack spacing={0} modifiers={[frame({ width: 12 })]}>
              <SwiftUIImage color={index === sessions.length - 1 ? theme.ink : theme.muted} size={8} systemName="circle.fill" />
              {index < sessions.length - 1 ? (
                <Spacer modifiers={[frame({ width: 1, height: 48 }), background(theme.line, shapes.rectangle())]} />
              ) : null}
            </VStack>
            <VStack alignment="leading" spacing={4} modifiers={[frame({ minHeight: 56, maxWidth: 1000, alignment: 'topLeading' })]}>
              <HStack>
                <NativeText modifiers={[font({ textStyle: 'caption2', weight: 'bold' }), foregroundStyle(theme.muted)]}>
                  {session.date}
                </NativeText>
                <Spacer />
                <NativeText modifiers={[font({ textStyle: 'caption' }), foregroundStyle(theme.muted)]}>{session.meta}</NativeText>
              </HStack>
              <NativeText modifiers={[font({ textStyle: 'body', weight: 'semibold' }), foregroundStyle(theme.ink), monospacedDigit()]}>
                {session.load}
              </NativeText>
            </VStack>
          </HStack>
        ))}

        <HStack spacing={0} modifiers={[frame({ maxWidth: 1000 })]}>
          <Spacer minLength={0} />
          <VStack
            alignment="leading"
            spacing={7}
            modifiers={[
              padding({ all: spacing.md }),
              background(itemBackground, shapes.roundedRectangle({ cornerRadius: 16, roundedCornerStyle: 'continuous' })),
              strokeBorder({ color: theme.line, style: { lineWidth: 0.5 }, shape: 'roundedRectangle', cornerRadius: 16 }),
            ]}
          >
            <NativeText modifiers={[font({ textStyle: 'headline' }), foregroundStyle(theme.ink)]}>
              Next workout
            </NativeText>
            <NativeText modifiers={[font({ textStyle: 'title', weight: 'semibold' }), foregroundStyle(theme.ink), monospacedDigit()]}>230 LBS × 5</NativeText>
            <NativeText modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(theme.muted), fixedSize({ vertical: true })]}>
              Add 5 LBS if warm-ups stay fast and discomfort remains unchanged.
            </NativeText>
          </VStack>
          <Spacer minLength={0} />
        </HStack>
      </VStack>
    </ScrollView>
  );
}

export function NativeTodayWorkout({
  completed,
  completedSets,
  dateLabel,
  day,
  editingWorkout,
  exercises,
  finished,
  mode,
  onAddExercise,
  onCancelWorkout,
  onChooseDay,
  onDeleteExercises,
  onEditExercise,
  onExerciseSheetDismissed,
  onEditWorkout,
  onFinishWorkout,
  onMoveExercises,
  onOpenSettings,
  onReplaceExercise,
  onSaveWorkout,
  onSpotifySheetDismissed,
  onSelectExercise,
  onToggleSet,
  onUpdateSet,
  progress,
  selectedDay,
  selectedExercise,
  setEntries,
  spotifyBar,
  spotifyPill,
  spotifySheet,
  spotifySheetPresented,
  theme,
  totalSets,
  week,
  workoutSaveState,
}: NativeTodayWorkoutProps) {
  const { height, width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const reduceTransparency = useReduceTransparency();
  const { setModalPresented } = useModalPresentation();
  const [sheetPage, setSheetPage] = useState<'exercise' | 'stats'>('exercise');
  const contentWidth = width - 32;
  const editListHeight = Math.max(420, height - safeAreaInsets.top - 142);
  const daySelectorWidth = contentWidth - 8;
  const dayColumnWidth = daySelectorWidth / 7;
  const workoutHeaderGap = spacing.xl;
  const editHeaderContentGap = 36;
  const canvas = appSurfaces[mode].todayBackground;
  const input = appSurfaces[mode].exerciseSurface;
  const sheetItemBackground = '#222222';
  const exerciseEntryBackground = 'rgba(34,34,34,0.90)';
  const sheetInput = mode === 'dark' ? '#282828' : appSurfaces.light.exerciseSurface;
  const mediaBackground = mode === 'dark' ? exerciseEntryBackground : appSurfaces.light.exerciseSurface;
  const sheetBackgroundColor = flyntSheetBackgroundColor(mode, reduceTransparency);
  const sheetDetent = flyntSheetDetent();
  const outline = mode === 'light' ? 'rgba(216,214,207,0.72)' : 'rgba(255,255,255,0.10)';
  const sheetPresented = selectedExercise >= 0 && selectedExercise < exercises.length;
  const finishingWorkout = !editingWorkout && workoutSaveState === 'saving';
  const exercise = sheetPresented ? exercises[selectedExercise] : null;
  const nextExerciseIndex = sheetPresented
    ? [
      ...exercises.slice(selectedExercise + 1).map((_, offset) => selectedExercise + 1 + offset),
      ...exercises.slice(0, selectedExercise).map((_, index) => index),
    ].find((index) => completed[index] < exercises[index].total)
    : undefined;
  const workoutMenu = (
    <Host colorScheme={mode} seedColor={theme.ink} style={styles.topbarControlHost}>
      <Menu
        label="Workout actions"
        systemImage="ellipsis"
        modifiers={[
          buttonStyle('glass'),
          buttonBorderShape('circle'),
          controlSize('large'),
          labelStyle('iconOnly'),
          frame({ width: 44, height: 44 }),
          accessibilityLabel('Workout actions'),
        ]}
      >
        <Button
          label="Edit Workout"
          onPress={onEditWorkout}
          systemImage="square.and.pencil"
        />
        <Button
          label="Settings"
          onPress={onOpenSettings}
          systemImage="gearshape"
        />
      </Menu>
    </Host>
  );

  useEffect(() => {
    if (!sheetPresented) return;
    setModalPresented(true);
    return () => setModalPresented(false);
  }, [setModalPresented, sheetPresented]);

  function selectExercise(index: number) {
    setSheetPage('exercise');
    onSelectExercise(index);
  }

  const commonRow = [
    listRowBackground(canvas),
    listRowInsets({ top: 0, leading: 16, bottom: 0, trailing: 16 }),
    listRowSeparator('hidden'),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: canvas }}>
      <Host colorScheme={mode} seedColor={theme.ink} style={{ flex: 1 }}>
        <ZStack>
          <List modifiers={[
            listStyle('plain'),
            scrollContentBackground('hidden'),
            background(canvas),
            ignoreSafeArea({ regions: 'container', edges: 'top' }),
            ...(!reduceMotion ? [animation(Animation.easeInOut({ duration: motion.duration.standard / 1000 }), editingWorkout)] : []),
          ]}>
            <VStack
              spacing={0}
              modifiers={[
                ...commonRow,
                frame({ height: safeAreaInsets.top + appTopbarHeight + (editingWorkout ? editHeaderContentGap : 0) }),
                accessibilityHidden(),
              ]}
            >
              <Spacer />
            </VStack>

            {!editingWorkout ? (
              <VStack alignment="leading" spacing={0} modifiers={[...commonRow, padding({ top: spacing.lg, horizontal: 4 })]}>
                <ZStack
                  alignment="bottomLeading"
                  modifiers={[frame({ width: daySelectorWidth, alignment: 'bottomLeading' })]}
                >
                  <VStack alignment="leading" spacing={9} modifiers={[opacity(0), accessibilityHidden()]}>
                    <NativeText modifiers={[font({ textStyle: 'caption2', weight: 'bold' }), kerning(1.45)]}>
                      {dateLabel}
                    </NativeText>
                    <NativeText
                      modifiers={[
                        font({ textStyle: 'largeTitle', weight: 'semibold' }),
                      ]}
                    >
                      {'Ag\nAg'}
                    </NativeText>
                    <NativeText modifiers={[font({ textStyle: 'subheadline' })]}>
                      {'Ag\nAg'}
                    </NativeText>
                  </VStack>
                  <VStack alignment="leading" spacing={9}>
                    <NativeText modifiers={[font({ textStyle: 'caption2', weight: 'bold' }), kerning(1.45), foregroundStyle(theme.muted)]}>
                      {dateLabel}
                    </NativeText>
                    <NativeText
                      modifiers={[
                        font({ textStyle: 'largeTitle', weight: 'semibold' }),
                        foregroundStyle(theme.ink),
                        lineLimit(2),
                      ]}
                    >
                      {day.title}
                    </NativeText>
                    <NativeText
                      modifiers={[
                        font({ textStyle: 'subheadline' }),
                        foregroundStyle(theme.muted),
                        lineLimit(2),
                      ]}
                    >
                      {day.focus}
                    </NativeText>
                  </VStack>
                </ZStack>
                <ZStack
                  modifiers={[
                    frame({ width: daySelectorWidth, height: 64 }),
                    padding({ top: workoutHeaderGap }),
                  ]}
                >
                  <VStack
                    modifiers={[
                      frame({ width: 62, height: 64 }),
                      background(theme.primaryFill, dayShape),
                      strokeBorder({ color: outline, style: { lineWidth: 0.5 }, shape: 'roundedRectangle', cornerRadius: 18 }),
                      offset({ x: (selectedDay - 3) * dayColumnWidth }),
                      ...(!reduceMotion ? [animation(Animation.interpolatingSpring(motion.spring.responsive), selectedDay)] : []),
                    ]}
                  >
                    <Spacer />
                  </VStack>
                  <HStack spacing={0} modifiers={[frame({ width: daySelectorWidth, height: 64 })]}>
                    {week.map((item, index) => {
                      const selected = index === selectedDay;
                      return (
                        <Button
                          key={`${item.shortDay}-${item.date}`}
                          onPress={() => onChooseDay(index)}
                          modifiers={[
                            buttonStyle('plain'),
                            frame({ width: dayColumnWidth, height: 64 }),
                            disabled(editingWorkout),
                            accessibilityLabel(`${item.shortDay} ${item.date}, ${item.title}`),
                            accessibilityHint("Shows this day's workout"),
                            ...(selected ? [accessibilityAddTraits(['isSelected'])] : []),
                          ]}
                        >
                          <VStack spacing={7} modifiers={[frame({ width: dayColumnWidth, height: 64 })]}>
                            <NativeText modifiers={[font({ textStyle: 'caption2', weight: 'bold' }), foregroundStyle(selected ? theme.primaryText : theme.muted)]}>
                              {item.shortDay.slice(0, 1)}
                            </NativeText>
                            <NativeText modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(selected ? theme.primaryText : theme.muted), monospacedDigit()]}>
                              {item.date}
                            </NativeText>
                          </VStack>
                        </Button>
                      );
                    })}
                  </HStack>
                </ZStack>
              </VStack>
            ) : null}

            {!editingWorkout && totalSets ? (
              <HStack
                spacing={spacing.sm}
                modifiers={[
                  ...commonRow,
                  frame({ width: contentWidth - 8 }),
                  padding({ top: workoutHeaderGap, horizontal: 4, bottom: workoutHeaderGap }),
                ]}
              >
                <ProgressView
                  value={progress}
                  modifiers={[
                    frame({ maxWidth: 1000 }),
                    progressViewStyle('linear'),
                    tint(theme.ink),
                    animation(Animation.easeInOut({ duration: motion.duration.standard / 1000 }), progress),
                  ]}
                />
                <NativeText
                  modifiers={[
                    frame({ width: 36, alignment: 'trailing' }),
                    font({ textStyle: 'caption2', weight: 'semibold' }),
                    foregroundStyle(theme.muted),
                    monospacedDigit(),
                  ]}
                >
                  {Math.round(progress * 100)}%
                </NativeText>
              </HStack>
            ) : !editingWorkout ? (
              <HStack spacing={8} modifiers={[...commonRow, frame({ minHeight: 64 }), padding({ horizontal: 4 })]}>
                <SwiftUIImage color={theme.muted} size={16} systemName="figure.walk" />
                <NativeText modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(theme.muted)]}>
                  {day.duration}
                </NativeText>
              </HStack>
            ) : null}

            {!editingWorkout && spotifyBar ? (
              <Group
                modifiers={[
                  ...commonRow,
                  frame({ width: contentWidth }),
                  padding({ horizontal: 4, bottom: spacing.md }),
                ]}
              >
                <RNHostView matchContents>{spotifyBar}</RNHostView>
              </Group>
            ) : null}

            {day.kind === 'recovery' ? (
              <VStack alignment="leading" spacing={6} modifiers={[...commonRow, padding({ vertical: 18 })]}>
                <NativeText modifiers={[font({ textStyle: 'headline' }), foregroundStyle(theme.ink)]}>
                  Recovery is part of the plan.
                </NativeText>
                <NativeText modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(theme.muted)]}>
                  Keep the day easy. Your next training session is already scheduled.
                </NativeText>
              </VStack>
            ) : editingWorkout ? (
              <Group
                modifiers={[
                  ...commonRow,
                  frame({ width: contentWidth, height: editListHeight }),
                ]}
              >
                <RNHostView>
                  <NativeWorkoutEditorList
                    activeBackgroundColor={input}
                    backgroundColor={canvas}
                    exercises={exercises.map((exercise, index) => ({
                      id: exercise.id ?? `${exercise.name}-${index}`,
                      name: exercise.name,
                      summary: `${exercise.total} sets · ${restLabel(exercise.restSeconds)} rest`,
                      artworkUrl: exerciseArtworkUri(exercise),
                    }))}
                    foregroundColor={theme.ink}
                    instructions="Drag to reorder. Swipe left to replace or delete. Tap an exercise to change it."
                    mutedColor={theme.muted}
                    onAddExercise={onAddExercise}
                    onDeleteExercise={({ nativeEvent }) => onDeleteExercises([nativeEvent.index])}
                    onMoveExercise={({ nativeEvent }) => onMoveExercises(
                      [nativeEvent.from],
                      nativeEvent.from < nativeEvent.to ? nativeEvent.to + 1 : nativeEvent.to
                    )}
                    onReplaceExercise={({ nativeEvent }) => onReplaceExercise(nativeEvent.index)}
                    onSelectExercise={({ nativeEvent }) => onEditExercise(nativeEvent.index)}
                    style={{ width: contentWidth, height: editListHeight }}
                    title={day.title}
                  />
                </RNHostView>
              </Group>
            ) : exercises.map((item, index) => (
              <ExerciseListRow
                key={item.name}
                completed={completed[index]}
                exercise={item}
                inputColor={input}
                onPress={() => selectExercise(index)}
                outlineColor={outline}
                rowWidth={contentWidth}
                theme={theme}
              />
            )).map((row) => (
              <Group key={row.key} modifiers={commonRow}>{row}</Group>
            ))}

            {!editingWorkout && day.kind !== 'recovery' && exercises.length > 0 ? (
              <VStack
                modifiers={[
                  ...commonRow,
                  frame({ width: contentWidth }),
                  padding({ horizontal: spacing.xs, top: spacing.md, bottom: spacing.hero }),
                ]}
              >
                <Button
                  onPress={onFinishWorkout}
                  modifiers={[
                    buttonStyle('borderedProminent'),
                    buttonBorderShape('capsule'),
                    tint(theme.ink),
                    disabled(finishingWorkout || finished || completedSets !== totalSets),
                    accessibilityLabel(finishingWorkout ? 'Saving workout' : finished ? 'Workout complete' : 'Finish workout'),
                    accessibilityHint(completedSets === totalSets
                      ? 'Marks this workout complete'
                      : 'Complete every set to enable this action'),
                  ]}
                >
                  <HStack spacing={8} modifiers={[frame({ minHeight: 56, maxWidth: 1000 })]}>
                    {finishingWorkout ? <ProgressView modifiers={[tint(theme.primaryText)]} /> : finished ? <SwiftUIImage color={theme.primaryText} size={15} systemName="checkmark" /> : null}
                    <NativeText modifiers={[font({ textStyle: 'body', weight: 'semibold' }), foregroundStyle(theme.primaryText)]}>
                      {finishingWorkout ? 'Saving workout' : finished ? 'Workout complete' : 'Finish workout'}
                    </NativeText>
                  </HStack>
                </Button>
              </VStack>
            ) : null}
          </List>

          <BottomSheet
            isPresented={spotifySheetPresented}
            modifiers={[environment('colorScheme', mode)]}
            onDismiss={onSpotifySheetDismissed}
            onIsPresentedChange={(presented) => {
              if (!presented) onSpotifySheetDismissed();
            }}
          >
            <Group
              modifiers={[
                presentationDetents([sheetDetent]),
                presentationBackgroundInteraction({ type: 'enabledUpThrough', detent: sheetDetent }),
                presentationDragIndicator('visible'),
                presentationBackground(sheetBackgroundColor),
                environment('colorScheme', mode),
              ]}
            >
              <RNHostView>
                <View style={styles.spotifySheetContent}>{spotifySheet}</View>
              </RNHostView>
            </Group>
          </BottomSheet>

          <BottomSheet
            isPresented={sheetPresented}
            modifiers={[environment('colorScheme', mode)]}
            onDismiss={onExerciseSheetDismissed}
            onIsPresentedChange={(presented) => {
              if (!presented) onSelectExercise(-1);
            }}
          >
            <Group
              modifiers={[
                presentationDetents([sheetDetent]),
                presentationBackgroundInteraction({ type: 'enabledUpThrough', detent: sheetDetent }),
                presentationDragIndicator('visible'),
                presentationBackground(sheetBackgroundColor),
                environment('colorScheme', mode),
              ]}
            >
              {exercise ? (
                <TabView
                  modifiers={[tabViewStyle({ type: 'page', indexDisplayMode: 'never' }), frame({ maxWidth: 1000, maxHeight: 1000 })]}
                  selection={sheetPage}
                >
                    <TabView.Tab value="exercise">
                      <ExerciseSheetContent
                        advanceLabel={nextExerciseIndex === undefined ? 'Back to workout' : 'Next exercise'}
                        completed={completed[selectedExercise]}
                        exercise={exercise}
                        exerciseIndex={selectedExercise}
                        input={sheetInput}
                        isLarge
                        mediaBackground={mediaBackground}
                        mediaWidth={Math.min(width - spacing.xxl, 560)}
                        onAdvance={() => {
                          if (nextExerciseIndex === undefined) {
                            onSelectExercise(-1);
                            return;
                          }
                          selectExercise(nextExerciseIndex);
                        }}
                        onClose={() => onSelectExercise(-1)}
                        onOpenStats={() => setSheetPage('stats')}
                        onToggleSet={onToggleSet}
                        onUpdateSet={onUpdateSet}
                        outline={outline}
                        setEntries={setEntries[selectedExercise] ?? []}
                        theme={theme}
                      />
                    </TabView.Tab>
                    <TabView.Tab value="stats">
                      <ExerciseStatsPage
                        exercise={exercise}
                        itemBackground={sheetItemBackground}
                        onBack={() => setSheetPage('exercise')}
                        onClose={() => onSelectExercise(-1)}
                        theme={theme}
                      />
                    </TabView.Tab>
                </TabView>
              ) : <Spacer />}
            </Group>
          </BottomSheet>
        </ZStack>
      </Host>
      <AppScreenTopbar
        centerAccessory={!editingWorkout ? spotifyPill : undefined}
        contentExtendsUnderTopbar
        edgeScrim={appSurfaces[mode].todayEdgeScrim}
        headerAccessory={editingWorkout ? (
          <GlassTextButton
            accessibilityLabel={workoutSaveState === 'saving' ? 'Saving workout edits' : workoutSaveState === 'saved' ? 'Workout edits saved' : 'Save workout edits'}
            color={theme.ink}
            colorScheme={mode}
            disabled={workoutSaveState !== 'idle'}
            label="Save"
            onPress={onSaveWorkout}
            state={workoutSaveState === 'saving' ? 'loading' : workoutSaveState === 'saved' ? 'success' : 'idle'}
          />
        ) : workoutMenu}
        leadingAccessory={editingWorkout ? (
          <GlassTextButton
            accessibilityLabel="Cancel workout edits"
            color={theme.ink}
            colorScheme={mode}
            disabled={workoutSaveState === 'saving'}
            label="Cancel"
            onPress={onCancelWorkout}
          />
        ) : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topbarControlHost: { width: 44, height: 44 },
  exerciseRow: {
    minHeight: 88,
    paddingVertical: 14,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spotifySheetContent: { flex: 1 },
  exerciseRowArtwork: {
    width: 80,
    height: 60,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseRowArtworkImage: {
    width: '100%',
    height: '100%',
  },
  exerciseRowArtworkDone: {
    opacity: 0.5,
  },
  exerciseRowCopy: {
    flex: 1,
    gap: 5,
  },
  exerciseRowTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  exerciseRowDetail: {
    fontSize: 13,
    lineHeight: 18,
  },
});
