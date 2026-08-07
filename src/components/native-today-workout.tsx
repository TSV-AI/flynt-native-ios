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
  Picker,
  ProgressView,
  RNHostView,
  ScrollView,
  Spacer,
  Text as NativeText,
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
  disabled,
  environment,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  ignoreSafeArea,
  kerning,
  labelStyle,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  listStyle,
  lineLimit,
  monospacedDigit,
  opacity,
  offset,
  padding,
  pickerStyle,
  presentationBackground,
  presentationBackgroundInteraction,
  presentationDetents,
  presentationDragIndicator,
  progressViewStyle,
  scrollContentBackground,
  shapes,
  strokeBorder,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { type ReactElement, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreenTopbar, NativeAppScreenTopbar, appTopbarHeight, nativeHeaderGlassButtonModifiers } from '@/components/app-surface';
import { GlassTextButton, NativeSymbol } from '@/components/native-symbol';
import { NativeWorkoutEditorList } from '@/components/native-workout-editor-list';
import { RestTimerAccessorySurface } from '@/components/rest-timer-accessory';
import { motion } from '@/constants/motion';
import { flyntSheetBackgroundColor, flyntSheetDetent } from '@/constants/sheet';
import { appSurfaces, spacing, type ColorMode, type Theme } from '@/constants/theme';
import type { PreviewDay, PreviewExercise } from '@/features/app-preview-data';
import { getExerciseArtwork } from '@/features/exercise-artwork';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import { formatLoad, loadPickerOptions, normalizedLoad, normalizedReps, repPickerOptions } from '@/lib/load-picker';
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
  onEditWorkout: () => void;
  onFinishWorkout: () => void;
  onMoveExercises: (sourceIndices: number[], destination: number) => void;
  onOpenSettings: () => void;
  onReplaceExercise: (index: number) => void;
  onSaveWorkout: () => void;
  onSpotifySheetDismissed: () => void;
  onSelectExercise: (index: number) => void;
  progress: number;
  selectedDay: number;
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

function workoutSectionLabel(exercise: PreviewExercise) {
  if (exercise.role === 'warmup') return 'WARM UP';
  if (exercise.role === 'conditioning') return 'CONDITIONING';
  if (exercise.role === 'recovery') return 'RECOVERY';
  return 'WORKOUT';
}

type NativeSetRowProps = {
  checked: boolean;
  entry: WorkoutSetEntry;
  exerciseName: string;
  index: number;
  inputColor: string;
  metrics: TrackingMetric[];
  onChooseMetric: (metric: TrackingMetric) => void;
  onToggle: () => void;
  outlineColor: string;
  prescribedReps: string;
  theme: Theme;
  tracking: PreviewExercise['tracking'];
};

export type TrackingMetric = NonNullable<PreviewExercise['tracking']>['metrics'][number];

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

function metricLabel(metric: TrackingMetric, tracking: PreviewExercise['tracking']) {
  if (metric === 'load') return 'LOAD (LBS)';
  if (metric === 'reps') return 'REPS';
  if (metric === 'duration') return 'DURATION';
  if (metric === 'rounds') return 'ROUNDS';
  return `DISTANCE${tracking?.distanceUnit ? ` (${tracking.distanceUnit.toUpperCase()})` : ''}`;
}

function formatTrackedDuration(value: string) {
  const seconds = Number.parseInt(value, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return '–';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes}:${String(remainder).padStart(2, '0')}` : `${seconds} sec`;
}

function metricValue(metric: TrackingMetric, entry: WorkoutSetEntry, prescribedReps: string) {
  if (metric === 'load') return entry.weight || '–';
  if (metric === 'reps') return entry.reps || prescribedReps || '–';
  if (metric === 'duration') return formatTrackedDuration(entry.durationSeconds);
  if (metric === 'distance') return entry.distance || '–';
  return entry.rounds || '–';
}

function NativeSetRow({ checked, entry, exerciseName, index, inputColor, metrics, onChooseMetric, onToggle, outlineColor, prescribedReps, theme, tracking }: NativeSetRowProps) {
  const inputWidth = metrics.length === 1 ? 248 : 118;
  return (
    <VStack modifiers={[padding({ vertical: spacing.xxs })]}>
      <HStack
        spacing={0}
        modifiers={[
          frame({ minHeight: 56, maxWidth: 1000 }),
        ]}
      >
        {metrics.map((metric, metricIndex) => (
          <Group key={metric}>
            {metricIndex > 0 ? <Spacer minLength={12} /> : null}
            <Button
              onPress={() => onChooseMetric(metric)}
              modifiers={[
                buttonStyle('plain'),
                frame({ width: inputWidth, height: 52 }),
                background(inputColor, shapes.capsule()),
                strokeBorder({ color: outlineColor, style: { lineWidth: 0.5 }, shape: 'capsule' }),
                accessibilityLabel(`${exerciseName} set ${index + 1} ${metric}, ${metricValue(metric, entry, prescribedReps)}`),
                accessibilityHint(`Opens the ${metric} selector`),
              ]}
            >
              <NativeText modifiers={[font({ textStyle: 'body', weight: 'semibold' }), foregroundStyle(theme.ink), monospacedDigit()]}>
                {metricValue(metric, entry, prescribedReps)}
              </NativeText>
            </Button>
          </Group>
        ))}
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

export function NativeExerciseContent({
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
  onChooseMetric,
  onOpenStats,
  onPrevious,
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
  onChooseMetric: (setIndex: number, metric: TrackingMetric) => void;
  onOpenStats: () => void;
  onPrevious?: () => void;
  onToggleSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSetEntry>, immediate?: boolean) => void;
  outline: string;
  setEntries: WorkoutSetEntry[];
  theme: Theme;
}) {
  const { expand: expandRest, timer } = useRestTimer();
  const prescribedReps = exercise.detail.match(/(\d+(?:[–-]\d+)?)\s+reps?/i)?.[1] ?? '';
  const trackingMetrics = exercise.tracking?.metrics ?? ['load', 'reps'];
  const artwork = exerciseArtworkSource(exercise);
  const guideSteps = exercise.guideSteps === undefined
    ? [
        'Brace with full-foot pressure before the first rep.',
        'Use the programmed range without rushing the transition.',
        'Finish under control, then reset your position.',
      ]
    : exercise.guideSteps;
  const activeRest = timer?.exercise === exercise.name ? timer : null;
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
              top: appTopbarHeight + spacing.lg,
              bottom: activeRest ? spacing.hero + spacing.xl : spacing.xl,
            }),
          ]}
        >
        {isLarge ? (
          <VStack
            alignment="leading"
            spacing={spacing.md}
            modifiers={[padding({ top: spacing.xl, bottom: spacing.lg })]}
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
            {trackingMetrics.map((metric, metricIndex) => (
              <Group key={metric}>
                {metricIndex > 0 ? <Spacer minLength={12} /> : null}
                <NativeText
                  modifiers={[
                    frame({ width: trackingMetrics.length === 1 ? 248 : 118, alignment: 'center' }),
                    font({ textStyle: 'caption2', weight: 'bold' }),
                    foregroundStyle(theme.muted),
                    kerning(0.8),
                  ]}
                >
                  {metricLabel(metric, exercise.tracking)}
                </NativeText>
              </Group>
            ))}
            <Spacer minLength={12} />
            <Spacer modifiers={[frame({ width: 44 })]} />
          </HStack>
          {Array.from({ length: exercise.total }, (_, setIndex) => (
            <NativeSetRow
              key={setIndex}
              checked={setIndex < completed}
              entry={setEntries[setIndex] ?? {
                complete: false,
                distance: String(exercise.tracking?.targetDistance ?? ''),
                durationSeconds: String(exercise.tracking?.targetDurationSeconds ?? ''),
                reps: prescribedReps,
                rounds: String(exercise.tracking?.targetRounds ?? ''),
                weight: String(exercise.targetLoad ?? ''),
              }}
              exerciseName={exercise.name}
              index={setIndex}
              inputColor={input}
              metrics={trackingMetrics}
              onChooseMetric={(metric) => onChooseMetric(setIndex, metric)}
              onToggle={() => onToggleSet(exerciseIndex, setIndex)}
              outlineColor={outline}
              prescribedReps={prescribedReps}
              theme={theme}
              tracking={exercise.tracking}
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
          {onPrevious ? (
            <Button
              onPress={onPrevious}
              modifiers={[buttonStyle('glass'), buttonBorderShape('circle'), frame({ width: 44, height: 44 }), accessibilityLabel('Previous exercise')]}
            >
              <SwiftUIImage color={theme.ink} size={16} systemName="chevron.left" />
            </Button>
          ) : null}
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
            <HStack spacing={6}>
              <NativeText modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' }), foregroundStyle(theme.primaryText)]}>
                {advanceLabel}
              </NativeText>
              {advanceLabel === 'Next exercise' ? <SwiftUIImage color={theme.primaryText} size={13} systemName="chevron.right" /> : null}
            </HStack>
          </Button>
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

function metricPickerOptions(metric: TrackingMetric, selectedValue: string) {
  if (metric === 'load') return loadPickerOptions(selectedValue).map(String);
  if (metric === 'reps') return repPickerOptions().map(String);
  if (metric === 'duration') {
    return [...new Set([15, 20, 30, 45, 60, 90, 120, 180, 300, 600, 900, 1200, 1800, 2400, 3600, Number(selectedValue)])]
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b)
      .map(String);
  }
  if (metric === 'distance') {
    return [...new Set([0.1, 0.25, 0.5, 1, 1.5, 2, 3, 5, 10, 20, 50, 100, Number(selectedValue)])]
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b)
      .map(String);
  }
  return Array.from({ length: 50 }, (_, index) => String(index + 1));
}

function metricPickerValue(metric: TrackingMetric, value: string, tracking: PreviewExercise['tracking']) {
  if (metric === 'load') return `${formatLoad(Number(value))} lb`;
  if (metric === 'reps') return `${value} reps`;
  if (metric === 'duration') return formatTrackedDuration(value);
  if (metric === 'distance') return `${value} ${tracking?.distanceUnit ?? ''}`.trim();
  return `${value} rounds`;
}

function metricPickerSelection(metric: TrackingMetric, selectedValue: string, options: string[]) {
  if (metric === 'load') return String(normalizedLoad(selectedValue));
  if (metric === 'reps') return String(normalizedReps(selectedValue));
  return options.includes(selectedValue) ? selectedValue : options[0];
}

export function MetricPickerPage({
  exercise,
  metric,
  onCancel,
  onDone,
  onSelect,
  selectedValue,
  setIndex,
  theme,
}: {
  exercise: PreviewExercise;
  metric: TrackingMetric;
  onCancel: () => void;
  onDone: (value: string) => void;
  onSelect: (value: string) => void;
  selectedValue: string;
  setIndex: number;
  theme: Theme;
}) {
  const options = metricPickerOptions(metric, selectedValue);
  const selection = metricPickerSelection(metric, selectedValue, options);
  return (
    <VStack alignment="leading" spacing={spacing.md} modifiers={[padding({ horizontal: spacing.lg, top: spacing.md, bottom: spacing.lg })]}>
      <HStack alignment="top" spacing={12}>
        <Button
          onPress={onCancel}
          modifiers={[
            buttonStyle('plain'),
            frame({ minWidth: 60, minHeight: 44, alignment: 'leading' }),
            accessibilityLabel(`Cancel ${metric} change`),
          ]}
        >
          <NativeText modifiers={[font({ textStyle: 'body' }), foregroundStyle(theme.ink)]}>Cancel</NativeText>
        </Button>
        <VStack alignment="center" spacing={4} modifiers={[frame({ maxWidth: 1000 })]}>
          <NativeText modifiers={[font({ textStyle: 'title2', weight: 'semibold' }), foregroundStyle(theme.ink), fixedSize({ vertical: true })]}>
            Choose {metric}
          </NativeText>
          <NativeText modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(theme.muted), fixedSize({ vertical: true })]}>
            {exercise.name}, set {setIndex + 1}
          </NativeText>
        </VStack>
        <Button
          onPress={() => onDone(selection)}
          modifiers={[
            buttonStyle('plain'),
            frame({ minWidth: 60, minHeight: 44, alignment: 'trailing' }),
            accessibilityLabel(`Save ${metric} change`),
          ]}
        >
          <NativeText modifiers={[font({ textStyle: 'body', weight: 'semibold' }), foregroundStyle(theme.ink)]}>Done</NativeText>
        </Button>
      </HStack>
      <Picker
        label={metricLabel(metric, exercise.tracking)}
        modifiers={[pickerStyle('wheel'), frame({ maxWidth: 1000, height: 216 })]}
        onSelectionChange={(value) => onSelect(String(value))}
        selection={selection}
      >
        {options.map((value) => (
          <NativeText key={value} modifiers={[tag(value)]}>{metricPickerValue(metric, value, exercise.tracking)}</NativeText>
        ))}
      </Picker>
    </VStack>
  );
}

export function ExerciseStatsPage({ exercise, itemBackground, onClose, theme }: { exercise: PreviewExercise; itemBackground: string; onClose: () => void; theme: Theme }) {
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
            onPress={onClose}
            modifiers={[buttonStyle('glass'), buttonBorderShape('circle'), frame({ width: 44, height: 44 }), accessibilityLabel('Close exercise stats')]}
          >
            <SwiftUIImage color={theme.ink} size={16} systemName="xmark" />
          </Button>
          <VStack alignment="center" spacing={3} modifiers={[frame({ maxWidth: 1000 })]}>
            <NativeText modifiers={[font({ textStyle: 'headline' }), foregroundStyle(theme.ink), fixedSize({ vertical: true })]}>Exercise stats</NativeText>
            <NativeText modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(theme.muted), fixedSize({ vertical: true })]}>{exercise.name}</NativeText>
          </VStack>
          <Spacer modifiers={[frame({ width: 44 })]} />
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

type ExercisePageSheet =
  | { draft: string; metric: TrackingMetric; setIndex: number; type: 'metric' }
  | { type: 'stats' }
  | null;

export function NativeExercisePage({
  completed,
  exercise,
  exerciseIndex,
  mode,
  nextExerciseIndex,
  onBack,
  onNavigateExercise,
  onToggleSet,
  onUpdateSet,
  previousExerciseIndex,
  setEntries,
  theme,
}: {
  completed: number;
  exercise: PreviewExercise;
  exerciseIndex: number;
  mode: ColorMode;
  nextExerciseIndex?: number;
  onBack: () => void;
  onNavigateExercise: (index: number) => void;
  onToggleSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSetEntry>, immediate?: boolean) => void;
  previousExerciseIndex?: number;
  setEntries: WorkoutSetEntry[];
  theme: Theme;
}) {
  const { width } = useWindowDimensions();
  const reduceTransparency = useReduceTransparency();
  const [activeSheet, setActiveSheet] = useState<ExercisePageSheet>(null);
  const canvas = appSurfaces[mode].todayBackground;
  const input = mode === 'dark' ? '#282828' : appSurfaces.light.exerciseSurface;
  const mediaBackground = mode === 'dark' ? 'rgba(34,34,34,0.90)' : appSurfaces.light.exerciseSurface;
  const outline = mode === 'light' ? 'rgba(216,214,207,0.72)' : 'rgba(255,255,255,0.10)';
  const sheetBackgroundColor = flyntSheetBackgroundColor(mode, reduceTransparency);
  const sheetDetent = flyntSheetDetent();
  const selectedMetric = activeSheet?.type === 'metric' ? activeSheet.metric : 'reps';
  const metricSetIndex = activeSheet?.type === 'metric' ? activeSheet.setIndex : 0;
  const metricDraft = activeSheet?.type === 'metric' ? activeSheet.draft : '';
  const metricEntryField: Record<TrackingMetric, keyof WorkoutSetEntry> = {
    load: 'weight',
    reps: 'reps',
    duration: 'durationSeconds',
    distance: 'distance',
    rounds: 'rounds',
  };

  function openMetric(setIndex: number, metric: TrackingMetric) {
    const entry = setEntries[setIndex];
    const values: Record<TrackingMetric, string> = {
      load: entry?.weight ?? '',
      reps: entry?.reps ?? exercise.detail.match(/(\d+(?:[–-]\d+)?)\s+reps?/i)?.[1] ?? '',
      duration: entry?.durationSeconds ?? String(exercise.tracking?.targetDurationSeconds ?? ''),
      distance: entry?.distance ?? String(exercise.tracking?.targetDistance ?? ''),
      rounds: entry?.rounds ?? String(exercise.tracking?.targetRounds ?? ''),
    };
    setActiveSheet({ draft: values[metric], metric, setIndex, type: 'metric' });
  }

  return (
    <View style={[styles.exercisePage, { backgroundColor: canvas }]}>
      <Host colorScheme={mode} seedColor={theme.ink} style={styles.exercisePageHost}>
        <ZStack alignment="top" modifiers={[frame({ maxWidth: 1000, maxHeight: 1000 }), background(canvas)]}>
        <NativeExerciseContent
          advanceLabel={nextExerciseIndex === undefined ? 'Back to workout' : 'Next exercise'}
          completed={completed}
          exercise={exercise}
          exerciseIndex={exerciseIndex}
          input={input}
          isLarge
          mediaBackground={mediaBackground}
          mediaWidth={Math.min(width - spacing.xxl, 560)}
          onAdvance={() => nextExerciseIndex === undefined ? onBack() : onNavigateExercise(nextExerciseIndex)}
          onClose={onBack}
          onChooseMetric={openMetric}
          onOpenStats={() => setActiveSheet({ type: 'stats' })}
          onPrevious={previousExerciseIndex === undefined ? undefined : () => onNavigateExercise(previousExerciseIndex)}
          onToggleSet={onToggleSet}
          onUpdateSet={onUpdateSet}
          outline={outline}
          setEntries={setEntries}
          theme={theme}
        />

          <BottomSheet
            fitToContents={activeSheet?.type === 'metric'}
            isPresented={activeSheet !== null}
            modifiers={[environment('colorScheme', mode)]}
            onDismiss={() => setActiveSheet(null)}
            onIsPresentedChange={(presented) => {
              if (!presented) setActiveSheet(null);
            }}
          >
            <Group
              modifiers={[
                ...(activeSheet?.type === 'metric' ? [] : [presentationDetents([sheetDetent])]),
                presentationBackgroundInteraction('disabled'),
                presentationDragIndicator('visible'),
                presentationBackground(sheetBackgroundColor),
                environment('colorScheme', mode),
              ]}
            >
              {activeSheet?.type === 'metric' ? (
                <MetricPickerPage
                  exercise={exercise}
                  metric={selectedMetric}
                  onCancel={() => setActiveSheet(null)}
                  onDone={(value) => {
                    onUpdateSet(exerciseIndex, metricSetIndex, {
                      [metricEntryField[selectedMetric]]: value,
                    }, true);
                    setActiveSheet(null);
                  }}
                  onSelect={(value) => setActiveSheet((current) => current?.type === 'metric'
                    ? { ...current, draft: value }
                    : current)}
                  selectedValue={metricDraft}
                  setIndex={metricSetIndex}
                  theme={theme}
                />
              ) : activeSheet?.type === 'stats' ? (
                <ExerciseStatsPage
                  exercise={exercise}
                  itemBackground="#222222"
                  onClose={() => setActiveSheet(null)}
                  theme={theme}
                />
              ) : <Spacer />}
            </Group>
          </BottomSheet>
          <NativeAppScreenTopbar color={theme.ink} colorScheme={mode} onBack={onBack} title={exercise.name} />
        </ZStack>
      </Host>
    </View>
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
  onEditWorkout,
  onFinishWorkout,
  onMoveExercises,
  onOpenSettings,
  onReplaceExercise,
  onSaveWorkout,
  onSpotifySheetDismissed,
  onSelectExercise,
  progress,
  selectedDay,
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
  const contentWidth = width - 32;
  const editListHeight = Math.max(420, height - safeAreaInsets.top - 142);
  const daySelectorWidth = contentWidth - 8;
  const dayColumnWidth = daySelectorWidth / 7;
  const workoutHeaderGap = spacing.xl;
  const editHeaderContentGap = 36;
  const canvas = appSurfaces[mode].todayBackground;
  const input = appSurfaces[mode].exerciseSurface;
  const exerciseEntryBackground = 'rgba(34,34,34,0.90)';
  const sheetBackgroundColor = flyntSheetBackgroundColor(mode, reduceTransparency);
  const sheetDetent = flyntSheetDetent();
  const outline = mode === 'light' ? 'rgba(216,214,207,0.72)' : 'rgba(255,255,255,0.10)';
  const finishingWorkout = !editingWorkout && workoutSaveState === 'saving';
  const workoutMenu = (
    <Host colorScheme={mode} seedColor={theme.ink} style={styles.topbarControlHost}>
      <Menu
        label="Workout actions"
        systemImage="ellipsis"
        modifiers={[
          ...nativeHeaderGlassButtonModifiers('Workout actions'),
          labelStyle('iconOnly'),
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

  function selectExercise(index: number) {
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
            ) : exercises.map((item, index) => {
              const section = workoutSectionLabel(item);
              const previousSection = index > 0
                ? workoutSectionLabel(exercises[index - 1])
                : null;
              return (
                <VStack
                  alignment="leading"
                  key={item.id ?? `${item.name}-${index}`}
                  spacing={0}
                  modifiers={commonRow}
                >
                  {section !== previousSection ? (
                    <NativeText
                      modifiers={[
                        padding({ top: index === 0 ? spacing.md : spacing.xl, horizontal: 4, bottom: spacing.sm }),
                        font({ textStyle: 'caption2', weight: 'bold' }),
                        kerning(1.35),
                        foregroundStyle(theme.muted),
                      ]}
                    >
                      {section}
                    </NativeText>
                  ) : null}
                  <ExerciseListRow
                    completed={completed[index]}
                    exercise={item}
                    inputColor={input}
                    onPress={() => selectExercise(index)}
                    outlineColor={outline}
                    rowWidth={contentWidth}
                    theme={theme}
                  />
                </VStack>
              );
            })}

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
  exercisePage: { flex: 1 },
  exercisePageHost: { flex: 1 },
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
