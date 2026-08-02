import {
  BottomSheet,
  Button,
  Divider,
  Group,
  HStack,
  Host,
  Image as SwiftUIImage,
  List,
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
  accessibilityHint,
  accessibilityLabel,
  animation,
  background,
  buttonBorderShape,
  buttonStyle,
  environment,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  kerning,
  keyboardType,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  listStyle,
  monospacedDigit,
  multilineTextAlignment,
  offset,
  padding,
  presentationDetents,
  presentationDragIndicator,
  progressViewStyle,
  scrollContentBackground,
  shapes,
  strokeBorder,
  tabViewStyle,
  textFieldStyle,
  tint,
  type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { GlassSymbolButton, NativeSymbol } from '@/components/native-symbol';
import { RestTimerAccessorySurface } from '@/components/rest-timer-accessory';
import { motion } from '@/constants/motion';
import { spacing, type ColorMode, type Theme } from '@/constants/theme';
import type { PreviewDay } from '@/features/app-preview-data';
import { getExerciseArtwork } from '@/features/exercise-artwork';
import { useModalPresentation } from '@/providers/modal-presentation-provider';
import { useRestTimer } from '@/providers/rest-timer-provider';

type PreviewExercise = {
  completed: number;
  detail: string;
  name: string;
  total: number;
};

type NativeTodayWorkoutProps = {
  completed: number[];
  dateLabel: string;
  day: PreviewDay;
  exercises: PreviewExercise[];
  mode: ColorMode;
  onChooseDay: (index: number) => void;
  onExerciseSheetDismissed: () => void;
  onOpenSettings: () => void;
  onSelectExercise: (index: number) => void;
  onToggleSet: (exerciseIndex: number, setIndex: number) => void;
  progress: number;
  selectedDay: number;
  selectedExercise: number;
  theme: Theme;
  totalSets: number;
  completedSets: number;
  week: PreviewDay[];
};

type NativeSetRowProps = {
  checked: boolean;
  exerciseName: string;
  index: number;
  inputColor: string;
  onToggle: () => void;
  outlineColor: string;
  prescribedReps: string;
  theme: Theme;
};

const dayShape = shapes.roundedRectangle({ cornerRadius: 18, roundedCornerStyle: 'continuous' });

function exerciseSummary(detail: string): string {
  return detail.replace(/^\d+\s+sets\s+·\s*/i, '');
}

function ExerciseArtwork({
  accessible = false,
  height,
  name,
  width,
}: {
  accessible?: boolean;
  height: number;
  name: string;
  width: number;
}) {
  const source = getExerciseArtwork(name);
  if (!source) return null;

  return (
    <RNHostView matchContents>
      <View
        accessibilityElementsHidden={!accessible}
        accessibilityLabel={accessible ? `Two-position movement illustration for ${name}` : undefined}
        accessibilityRole={accessible ? 'image' : undefined}
        accessible={accessible}
        importantForAccessibility={accessible ? 'yes' : 'no-hide-descendants'}
        style={{
          width,
          height,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
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
  );
}

function NativeSetRow({ checked, exerciseName, index, inputColor, onToggle, outlineColor, prescribedReps, theme }: NativeSetRowProps) {
  const weight = useNativeState('');
  const reps = useNativeState(prescribedReps);
  const adjustReps = (change: number) => {
    const currentReps = Number.parseInt(reps.get(), 10);
    const nextReps = Math.min(99, Math.max(1, (Number.isFinite(currentReps) ? currentReps : 1) + change));
    reps.set(String(nextReps));
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
  exercise,
  onPress,
  rowWidth,
  theme,
}: {
  completed: number;
  exercise: PreviewExercise;
  onPress: () => void;
  rowWidth: number;
  theme: Theme;
}) {
  const done = completed === exercise.total;
  const artwork = getExerciseArtwork(exercise.name);
  return (
    <RNHostView matchContents>
      <Pressable
        accessibilityHint="Opens exercise details and set entry"
        accessibilityLabel={`${exercise.name}, ${exerciseSummary(exercise.detail)}, 1 minute 30 seconds rest, ${completed} of ${exercise.total} sets complete`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.exerciseRow,
          { width: rowWidth },
          pressed && { backgroundColor: theme.raised, opacity: 0.72 },
        ]}
      >
        {artwork ? (
          <Image
            accessibilityElementsHidden
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={artwork}
            style={[styles.exerciseRowArtwork, done && styles.exerciseRowArtworkDone]}
          />
        ) : (
          <View accessibilityElementsHidden style={[styles.exerciseRowArtwork, styles.exerciseRowArtworkFallback, { backgroundColor: theme.raised }]}>
            <NativeSymbol color={theme.muted} name="figure.strengthtraining.traditional" size={24} />
          </View>
        )}
        <View style={styles.exerciseRowCopy}>
          <Text style={[styles.exerciseRowTitle, { color: done ? theme.muted : theme.ink }]}>
            {exercise.name}
          </Text>
          <Text style={[styles.exerciseRowDetail, { color: theme.muted }]}>
            {exercise.total} sets · 1:30 rest
          </Text>
        </View>
        <NativeSymbol color={done ? theme.ink : theme.muted} name={done ? 'checkmark.circle.fill' : 'circle'} size={20} />
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
  mediaWidth,
  onAdvance,
  onClose,
  onOpenStats,
  onToggleSet,
  outline,
  theme,
}: {
  advanceLabel: string;
  completed: number;
  exercise: PreviewExercise;
  exerciseIndex: number;
  input: string;
  isLarge: boolean;
  mediaWidth: number;
  onAdvance: () => void;
  onClose: () => void;
  onOpenStats: () => void;
  onToggleSet: (exerciseIndex: number, setIndex: number) => void;
  outline: string;
  theme: Theme;
}) {
  const { expand: expandRest, timer } = useRestTimer();
  const prescribedReps = exercise.detail.match(/(\d+(?:[–-]\d+)?)\s+reps?/i)?.[1] ?? '';
  const artwork = getExerciseArtwork(exercise.name);
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
            <SwiftUIImage color={theme.ink} size={16} systemName="xmark" />
          </Button>
        </HStack>

        {isLarge ? (
          <VStack
            alignment="leading"
            spacing={spacing.md}
            modifiers={[padding({ top: spacing.lg, bottom: spacing.lg })]}
          >
            {artwork ? (
              <ExerciseArtwork accessible height={190} name={exercise.name} width={mediaWidth} />
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
            <VStack alignment="leading" spacing={spacing.sm}>
              {[
                'Brace with full-foot pressure before the first rep.',
                'Use the programmed range without rushing the transition.',
                'Finish under control, then reset your position.',
              ].map((step, index) => (
                <HStack key={step} alignment="top" spacing={10}>
                  <NativeText modifiers={[frame({ width: 24 }), font({ textStyle: 'caption2' }), foregroundStyle(theme.muted), monospacedDigit()]}>
                    {String(index + 1).padStart(2, '0')}
                  </NativeText>
                  <NativeText modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(theme.ink), fixedSize({ vertical: true })]}>
                    {step}
                  </NativeText>
                </HStack>
              ))}
            </VStack>
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
              outlineColor={outline}
              prescribedReps={prescribedReps}
              theme={theme}
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

function ExerciseStatsPage({ exercise, onBack, onClose, theme }: { exercise: PreviewExercise; onBack: () => void; onClose: () => void; theme: Theme }) {
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

        <VStack
          alignment="leading"
          spacing={7}
          modifiers={[
            padding({ all: spacing.md }),
            background(theme.raised, shapes.roundedRectangle({ cornerRadius: 16, roundedCornerStyle: 'continuous' })),
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
      </VStack>
    </ScrollView>
  );
}

export function NativeTodayWorkout({
  completed,
  completedSets,
  dateLabel,
  day,
  exercises,
  mode,
  onChooseDay,
  onExerciseSheetDismissed,
  onOpenSettings,
  onSelectExercise,
  onToggleSet,
  progress,
  selectedDay,
  selectedExercise,
  theme,
  totalSets,
  week,
}: NativeTodayWorkoutProps) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const { setModalPresented } = useModalPresentation();
  const [sheetDetent, setSheetDetent] = useState<PresentationDetent>('large');
  const [sheetPage, setSheetPage] = useState<'exercise' | 'stats'>('exercise');
  const contentWidth = width - 32;
  const daySelectorWidth = contentWidth - 8;
  const unselectedDayWidth = (contentWidth - 64) / 6;
  const canvas = theme.sheet;
  const card = mode === 'light' ? '#FAFAFA' : theme.card;
  const input = mode === 'light' ? '#F2F2F1' : theme.raised;
  const outline = mode === 'light' ? 'rgba(216,214,207,0.72)' : 'rgba(255,255,255,0.10)';
  const sheetPresented = selectedExercise >= 0 && selectedExercise < exercises.length;
  const exercise = sheetPresented ? exercises[selectedExercise] : null;
  const nextExerciseIndex = sheetPresented
    ? [
      ...exercises.slice(selectedExercise + 1).map((_, offset) => selectedExercise + 1 + offset),
      ...exercises.slice(0, selectedExercise).map((_, index) => index),
    ].find((index) => completed[index] < exercises[index].total)
    : undefined;

  useEffect(() => {
    if (!sheetPresented) return;
    setModalPresented(true);
    return () => setModalPresented(false);
  }, [setModalPresented, sheetPresented]);

  function selectExercise(index: number) {
    setSheetDetent('large');
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
          <List modifiers={[listStyle('plain'), scrollContentBackground('hidden'), background(canvas)]}>
            <HStack modifiers={[...commonRow, frame({ width: contentWidth, height: 58 })]}>
              <RNHostView matchContents>
                <Image
                  accessibilityLabel="FLYNT"
                  source={mode === 'dark'
                    ? require('@/assets/images/flynt-mark-light.png')
                    : require('@/assets/images/flynt-mark-ink.png')}
                  style={{ width: 28, height: 42.5, resizeMode: 'contain' }}
                />
              </RNHostView>
              <Spacer />
              <RNHostView matchContents>
                <GlassSymbolButton
                  accessibilityLabel="Open menu and settings"
                  color={theme.ink}
                  colorScheme={mode}
                  name="ellipsis"
                  onPress={onOpenSettings}
                />
              </RNHostView>
            </HStack>

            <VStack alignment="leading" spacing={9} modifiers={[...commonRow, padding({ top: 12, horizontal: 4, bottom: 25 })]}>
              <NativeText modifiers={[font({ textStyle: 'caption2', weight: 'bold' }), kerning(1.45), foregroundStyle(theme.muted)]}>
                {dateLabel}
              </NativeText>
              <NativeText modifiers={[font({ textStyle: 'largeTitle', weight: 'semibold' }), foregroundStyle(theme.ink), fixedSize({ vertical: true })]}>
                {day.title}
              </NativeText>
              <NativeText modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(theme.muted)]}>
                {day.focus}
              </NativeText>
            </VStack>

            <ZStack
              modifiers={[
                ...commonRow,
                frame({ width: daySelectorWidth, height: 64 }),
                background(card, shapes.roundedRectangle({ cornerRadius: 21, roundedCornerStyle: 'continuous' })),
                strokeBorder({ color: outline, style: { lineWidth: 0.5 }, shape: 'roundedRectangle', cornerRadius: 21 }),
              ]}
            >
              <VStack
                modifiers={[
                  frame({ width: 56, height: 64 }),
                  background(theme.primaryFill, dayShape),
                  offset({ x: (selectedDay - 3) * unselectedDayWidth }),
                  ...(!reduceMotion ? [animation(Animation.interpolatingSpring(motion.spring.responsive), selectedDay)] : []),
                ]}
              >
                <Spacer />
              </VStack>
              <HStack spacing={0} modifiers={[frame({ width: daySelectorWidth, height: 64 })]}>
                {week.map((item, index) => {
                  const selected = index === selectedDay;
                  const dayWidth = selected ? 56 : unselectedDayWidth;
                  return (
                    <Button
                      key={`${item.shortDay}-${item.date}`}
                      onPress={() => onChooseDay(index)}
                      modifiers={[
                        buttonStyle('plain'),
                        frame({ width: dayWidth, height: 64 }),
                        accessibilityLabel(`${item.shortDay} ${item.date}, ${item.title}`),
                        accessibilityHint("Shows this day's workout"),
                        ...(selected ? [accessibilityAddTraits(['isSelected'])] : []),
                      ]}
                    >
                      <VStack spacing={7} modifiers={[frame({ width: dayWidth, height: 64 })]}>
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

            {totalSets ? (
              <VStack spacing={9} modifiers={[...commonRow, frame({ width: contentWidth - 8 }), padding({ top: 24, horizontal: 4, bottom: 16 })]}>
                <HStack>
                  <NativeText modifiers={[font({ textStyle: 'caption2', weight: 'semibold' }), foregroundStyle(theme.muted)]}>
                    {completedSets} of {totalSets} sets
                  </NativeText>
                  <Spacer />
                  <NativeText modifiers={[font({ textStyle: 'caption2', weight: 'semibold' }), foregroundStyle(theme.muted), monospacedDigit()]}>
                    {Math.round(progress * 100)}%
                  </NativeText>
                </HStack>
                <ProgressView
                  value={progress}
                  modifiers={[
                    progressViewStyle('linear'),
                    tint(theme.ink),
                    animation(Animation.easeInOut({ duration: motion.duration.standard / 1000 }), progress),
                  ]}
                />
              </VStack>
            ) : (
              <HStack spacing={8} modifiers={[...commonRow, frame({ minHeight: 64 }), padding({ horizontal: 4 })]}>
                <SwiftUIImage color={theme.muted} size={16} systemName="figure.walk" />
                <NativeText modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(theme.muted)]}>
                  {day.duration}
                </NativeText>
              </HStack>
            )}

            {day.kind === 'recovery' ? (
              <VStack alignment="leading" spacing={6} modifiers={[...commonRow, padding({ vertical: 18 })]}>
                <NativeText modifiers={[font({ textStyle: 'headline' }), foregroundStyle(theme.ink)]}>
                  Recovery is part of the plan.
                </NativeText>
                <NativeText modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(theme.muted)]}>
                  Keep the day easy. Your next training session is already scheduled.
                </NativeText>
              </VStack>
            ) : exercises.map((item, index) => (
              <ExerciseListRow
                key={item.name}
                completed={completed[index]}
                exercise={item}
                onPress={() => selectExercise(index)}
                rowWidth={contentWidth}
                theme={theme}
              />
            )).map((row) => (
              <Group key={row.key} modifiers={commonRow}>{row}</Group>
            ))}
          </List>

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
                presentationDetents(['large', 'medium'], {
                  selection: sheetDetent,
                  onSelectionChange: setSheetDetent,
                }),
                presentationDragIndicator('visible'),
                environment('colorScheme', mode),
                background(canvas),
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
                      input={input}
                      isLarge={sheetDetent === 'large'}
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
                      outline={outline}
                      theme={theme}
                    />
                  </TabView.Tab>
                  <TabView.Tab value="stats">
                    <ExerciseStatsPage
                      exercise={exercise}
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
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseRow: {
    minHeight: 82,
    paddingVertical: 14,
    paddingRight: spacing.md,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseRowArtwork: {
    width: 72,
    height: 54,
  },
  exerciseRowArtworkDone: {
    opacity: 0.5,
  },
  exerciseRowArtworkFallback: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
