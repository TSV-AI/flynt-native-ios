import {
  Button,
  DisclosureGroup,
  Divider,
  HStack,
  Host,
  Image as SwiftUIImage,
  ProgressView,
  RNHostView,
  ScrollView,
  Spacer,
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
  buttonStyle,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  kerning,
  keyboardType,
  layoutPriority,
  monospacedDigit,
  offset,
  padding,
  progressViewStyle,
  shadow,
  shapes,
  strokeBorder,
  textFieldStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { Image, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { motion } from '@/constants/motion';
import type { PreviewDay } from '@/features/app-preview-data';
import type { ColorMode, Theme } from '@/constants/theme';

type PreviewExercise = {
  completed: number;
  detail: string;
  name: string;
  total: number;
};

type NativeTodayWorkoutProps = {
  activeExercise: number;
  completed: number[];
  dateLabel: string;
  day: PreviewDay;
  exercises: PreviewExercise[];
  mode: ColorMode;
  onChooseDay: (index: number) => void;
  onOpenExerciseDetail: (mode: 'stats' | 'guide', name: string) => void;
  onOpenSettings: () => void;
  onSetExerciseExpanded: (index: number, expanded: boolean) => void;
  onToggleSet: (exerciseIndex: number, setIndex: number) => void;
  progress: number;
  selectedDay: number;
  theme: Theme;
  totalSets: number;
  completedSets: number;
  week: PreviewDay[];
};

type NativeSetRowProps = {
  checked: boolean;
  exerciseName: string;
  index: number;
  onToggle: () => void;
  prescribedReps: string;
  theme: Theme;
  inputColor: string;
  outlineColor: string;
};

const cardShape = shapes.roundedRectangle({ cornerRadius: 24, roundedCornerStyle: 'continuous' });
const dayShape = shapes.roundedRectangle({ cornerRadius: 18, roundedCornerStyle: 'continuous' });
const inputShape = shapes.roundedRectangle({ cornerRadius: 12, roundedCornerStyle: 'continuous' });

function NativeSetRow({ checked, exerciseName, index, onToggle, prescribedReps, theme, inputColor, outlineColor }: NativeSetRowProps) {
  const weight = useNativeState('');
  const reps = useNativeState(prescribedReps);
  const fieldModifiers = [
    frame({ width: 88, height: 44 }),
    padding({ horizontal: 10 }),
    textFieldStyle('plain' as const),
    keyboardType('decimal-pad' as const),
    background(inputColor, inputShape),
    strokeBorder({ color: outlineColor, style: { lineWidth: 0.5 }, shape: 'roundedRectangle', cornerRadius: 12 }),
    foregroundStyle(theme.ink),
    font({ textStyle: 'body', weight: 'semibold' }),
  ];

  return (
    <HStack spacing={8} modifiers={[frame({ minHeight: 56 })]}>
      <NativeText
        modifiers={[
          frame({ width: 28, alignment: 'center' }),
          font({ textStyle: 'caption2' }),
          foregroundStyle(theme.muted),
          monospacedDigit(),
        ]}
      >
        {index + 1}
      </NativeText>
      <TextField
        placeholder="–"
        text={weight}
        modifiers={[...fieldModifiers, accessibilityLabel(`${exerciseName} set ${index + 1} weight`)]}
      />
      <TextField
        placeholder="–"
        text={reps}
        modifiers={[
          ...fieldModifiers,
          keyboardType('ascii-capable-number-pad'),
          accessibilityLabel(`${exerciseName} set ${index + 1} reps`),
        ]}
      />
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
          size={29}
          systemName={checked ? 'checkmark.circle.fill' : 'circle'}
        />
      </Button>
    </HStack>
  );
}

export function NativeTodayWorkout({
  activeExercise,
  completed,
  completedSets,
  dateLabel,
  day,
  exercises,
  mode,
  onChooseDay,
  onOpenExerciseDetail,
  onOpenSettings,
  onSetExerciseExpanded,
  onToggleSet,
  progress,
  selectedDay,
  theme,
  totalSets,
  week,
}: NativeTodayWorkoutProps) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const contentWidth = width - 32;
  const daySelectorWidth = contentWidth - 8;
  const unselectedDayWidth = (contentWidth - 64) / 6;
  const canvas = mode === 'light' ? '#F2F2F1' : theme.canvas;
  const card = mode === 'light' ? '#FAFAFA' : theme.card;
  const input = mode === 'light' ? '#F2F2F1' : theme.raised;
  const outline = mode === 'light' ? 'rgba(216,214,207,0.72)' : 'rgba(255,255,255,0.10)';
  const shadowColor = mode === 'light' ? 'rgba(11,11,11,0.06)' : 'rgba(0,0,0,0.20)';

  return (
    <View style={{ flex: 1, backgroundColor: canvas }}>
      <Host colorScheme={mode} seedColor={theme.ink} style={{ flex: 1 }}>
        <ZStack>
          <ScrollView showsIndicators={false}>
          <VStack
            alignment="leading"
            spacing={0}
            modifiers={[
              frame({ width: contentWidth, alignment: 'leading' }),
              padding({ horizontal: 16, bottom: 36 }),
              background(canvas),
            ]}
          >
            <HStack modifiers={[frame({ width: contentWidth, height: 58 })]}>
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
              <Button
                onPress={onOpenSettings}
                modifiers={[
                  buttonStyle('glass'),
                  frame({ width: 44, height: 44 }),
                  accessibilityLabel('Open menu and settings'),
                ]}
              >
                <SwiftUIImage color={theme.ink} size={17} systemName="ellipsis" />
              </Button>
            </HStack>

            <VStack alignment="leading" spacing={9} modifiers={[padding({ top: 12, horizontal: 4, bottom: 25 })]}>
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
              <HStack
                spacing={0}
                modifiers={[
                  frame({ width: daySelectorWidth, height: 64 }),
                  ...(!reduceMotion ? [animation(Animation.interpolatingSpring(motion.spring.responsive), selectedDay)] : []),
                ]}
              >
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
                      <ZStack modifiers={[frame({ width: dayWidth, height: 64 })]}>
                        <VStack spacing={7}>
                          <NativeText modifiers={[font({ textStyle: 'caption2', weight: 'bold' }), foregroundStyle(selected ? theme.primaryText : theme.muted)]}>
                            {item.shortDay.slice(0, 1)}
                          </NativeText>
                          <NativeText modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(selected ? theme.primaryText : theme.muted), monospacedDigit()]}>
                            {item.date}
                          </NativeText>
                        </VStack>
                      </ZStack>
                    </Button>
                  );
                })}
              </HStack>
            </ZStack>

            {totalSets ? (
              <VStack spacing={9} modifiers={[frame({ width: contentWidth - 8 }), padding({ top: 24, horizontal: 4, bottom: 16 })]}>
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
              <HStack spacing={8} modifiers={[frame({ minHeight: 64 }), padding({ horizontal: 4 })]}>
                <SwiftUIImage color={theme.muted} size={16} systemName="figure.walk" />
                <NativeText modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(theme.muted)]}>
                  {day.duration}
                </NativeText>
              </HStack>
            )}

            {day.kind === 'recovery' ? (
              <VStack
                alignment="leading"
                spacing={6}
                modifiers={[
                  frame({ width: contentWidth - 36, alignment: 'leading' }),
                  padding({ all: 18 }),
                  background(card, cardShape),
                  strokeBorder({ color: outline, style: { lineWidth: 0.5 }, shape: 'roundedRectangle', cornerRadius: 24 }),
                ]}
              >
                <NativeText modifiers={[font({ textStyle: 'headline' }), foregroundStyle(theme.ink)]}>
                  Recovery is part of the plan.
                </NativeText>
                <NativeText modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(theme.muted)]}>
                  Keep the day easy. Your next training session is already scheduled.
                </NativeText>
              </VStack>
            ) : (
              <VStack spacing={12} modifiers={[frame({ width: contentWidth })]}>
                {exercises.map((exercise, exerciseIndex) => {
                  const expanded = activeExercise === exerciseIndex;
                  const done = completed[exerciseIndex] === exercise.total;
                  const prescribedReps = exercise.detail.match(/\d+/)?.[0] ?? '';
                  return (
                    <DisclosureGroup
                      key={exercise.name}
                      isExpanded={expanded}
                      onIsExpandedChange={(isExpanded) => onSetExerciseExpanded(exerciseIndex, isExpanded)}
                      modifiers={[
                        frame({ width: contentWidth - 34 }),
                        padding({ all: 17 }),
                        background(card, cardShape),
                        strokeBorder({ color: outline, style: { lineWidth: 0.5 }, shape: 'roundedRectangle', cornerRadius: 24 }),
                        shadow({ color: shadowColor, radius: 7, y: 3 }),
                        tint(theme.ink),
                      ]}
                    >
                      <DisclosureGroup.Label>
                        <HStack alignment="top" spacing={10}>
                          <NativeText modifiers={[frame({ width: 28, alignment: 'leading' }), padding({ top: 3 }), font({ textStyle: 'caption2' }), foregroundStyle(theme.muted), monospacedDigit()]}>
                            {String(exerciseIndex + 1).padStart(2, '0')}
                          </NativeText>
                          <VStack alignment="leading" spacing={5} modifiers={[layoutPriority(1)]}>
                            <NativeText modifiers={[font({ textStyle: 'headline' }), foregroundStyle(theme.ink)]}>
                              {exercise.name}
                            </NativeText>
                            <NativeText modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(theme.muted)]}>
                              {exercise.detail} · 1:30 rest
                            </NativeText>
                          </VStack>
                          <Spacer minLength={0} />
                          {done ? <SwiftUIImage color={theme.ink} size={22} systemName="checkmark.circle.fill" /> : null}
                        </HStack>
                      </DisclosureGroup.Label>

                      <VStack spacing={0} modifiers={[padding({ top: 14 })]}>
                        <Divider />
                        <HStack spacing={16} modifiers={[frame({ height: 58 }), padding({ vertical: 9 })]}>
                          <Button
                            onPress={() => onOpenExerciseDetail('stats', exercise.name)}
                            modifiers={[
                              buttonStyle('plain'),
                              frame({ width: 112, height: 40 }),
                              background(input, shapes.roundedRectangle({ cornerRadius: 13, roundedCornerStyle: 'continuous' })),
                              strokeBorder({ color: outline, style: { lineWidth: 0.5 }, shape: 'roundedRectangle', cornerRadius: 13 }),
                            ]}
                          >
                            <HStack spacing={7}>
                              <SwiftUIImage color={theme.ink} size={14} systemName="chart.xyaxis.line" />
                              <NativeText modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' }), foregroundStyle(theme.ink)]}>Stats</NativeText>
                            </HStack>
                          </Button>
                          <Button
                            onPress={() => onOpenExerciseDetail('guide', exercise.name)}
                            modifiers={[
                              buttonStyle('plain'),
                              frame({ width: 112, height: 40 }),
                              background(input, shapes.roundedRectangle({ cornerRadius: 13, roundedCornerStyle: 'continuous' })),
                              strokeBorder({ color: outline, style: { lineWidth: 0.5 }, shape: 'roundedRectangle', cornerRadius: 13 }),
                            ]}
                          >
                            <HStack spacing={7}>
                              <SwiftUIImage color={theme.ink} size={14} systemName="book.closed" />
                              <NativeText modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' }), foregroundStyle(theme.ink)]}>Guide</NativeText>
                            </HStack>
                          </Button>
                        </HStack>
                        <Divider />
                        <HStack spacing={8} modifiers={[padding({ top: 13, bottom: 5 })]}>
                          <NativeText modifiers={[frame({ width: 28 }), font({ textStyle: 'caption2', weight: 'bold' }), kerning(0.8), foregroundStyle(theme.muted)]}>SET</NativeText>
                          <NativeText modifiers={[frame({ width: 88 }), font({ textStyle: 'caption2', weight: 'bold' }), kerning(0.8), foregroundStyle(theme.muted)]}>LB</NativeText>
                          <NativeText modifiers={[frame({ width: 88 }), font({ textStyle: 'caption2', weight: 'bold' }), kerning(0.8), foregroundStyle(theme.muted)]}>REPS</NativeText>
                          <Spacer minLength={44} />
                        </HStack>
                        {Array.from({ length: exercise.total }, (_, setIndex) => (
                          <NativeSetRow
                            key={setIndex}
                            checked={setIndex < completed[exerciseIndex]}
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
                    </DisclosureGroup>
                  );
                })}
              </VStack>
            )}
          </VStack>
          </ScrollView>
        </ZStack>
      </Host>
    </View>
  );
}
