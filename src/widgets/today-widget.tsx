import { Circle, Divider, HStack, Image, RoundedRectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityElement,
  accessibilityHidden,
  accessibilityLabel,
  background,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  kerning,
  lineHeight,
  lineLimit,
  monospacedDigit,
  padding,
  shapes,
  strokeBorder,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { FlyntWidgetSnapshot } from './widget-model';

function TodayWidgetView(props: FlyntWidgetSnapshot, environment: WidgetEnvironment) {
  'widget';

  const isAccented = environment.widgetRenderingMode === 'accented';
  const isDark = environment.colorScheme === 'dark';
  const primary = isAccented ? '#FFFFFFFF' : isDark ? '#F7F6F2' : '#0B0B0B';
  const secondary = isAccented ? '#FFFFFFB3' : isDark ? '#AAA89F' : '#686761';
  const surface = isDark ? '#171717' : '#FFFFFF';
  const item = isAccented ? '#FFFFFF20' : isDark ? '#222222' : '#F2F2F1';
  const divider = isAccented ? '#FFFFFF4D' : isDark ? '#353532' : '#D8D6CF';
  const inverseText = isAccented ? '#FFFFFFFF' : isDark ? '#0B0B0B' : '#F7F6F2';
  const emphasisSurface = isAccented ? '#FFFFFF2E' : primary;
  const family = environment.widgetFamily;
  const isSmall = family === 'systemSmall';
  const isMedium = family === 'systemMedium';
  const paddingValue = isSmall ? 14 : 16;
  const complete = props.lifecycle === 'complete';
  const progress = props.totalSets > 0
    ? Math.min(Math.max(props.completedSets / props.totalSets, 0), 1)
    : complete ? 1 : 0;
  const percent = Math.round(progress * 100);
  const duration = props.duration || 'Workout';
  const meta = `${props.exercises.length} exercises · ${duration}`;
  const root = [
    padding({ all: paddingValue }),
    frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
    containerBackground(surface, 'widget'),
    widgetURL('flynt://today'),
    accessibilityElement('ignore'),
  ];
  const eyebrow = [
    font({ size: 9, weight: 'semibold' }),
    kerning(0.7),
    foregroundStyle(secondary),
  ];

  if (props.lifecycle === 'signedOut' || props.lifecycle === 'noPlan' || props.lifecycle === 'building' || props.lifecycle === 'unavailable') {
    const action = props.lifecycle === 'noPlan' ? 'Get started' : props.lifecycle === 'signedOut' ? 'Open FLYNT' : '';
    return (
      <VStack alignment="leading" spacing={0} modifiers={[...root, accessibilityLabel(`${props.title}. ${props.focus}`)]}>
        <Text modifiers={eyebrow}>{props.lifecycle === 'building' ? 'BUILDING' : 'FLYNT'}</Text>
        <Text modifiers={[font({ size: 19, weight: 'semibold' }), lineHeight(22), foregroundStyle(primary), lineLimit(2), padding({ top: 6 })]}>{props.title}</Text>
        <Spacer minLength={8} />
        {props.lifecycle === 'building' ? (
          <HStack spacing={5} modifiers={[frame({ maxWidth: Infinity })]}>
            {[0, 1, 2, 3].map((index) => (
              <RoundedRectangle key={index} cornerRadius={99} modifiers={[frame({ maxWidth: Infinity, height: 3 }), foregroundStyle(index < 2 ? primary : divider)]} />
            ))}
          </HStack>
        ) : action ? (
          <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(props.lifecycle === 'noPlan' ? inverseText : secondary), frame({ maxWidth: Infinity, minHeight: props.lifecycle === 'noPlan' ? 28 : 18 }), ...(props.lifecycle === 'noPlan' ? [background(emphasisSurface, shapes.capsule())] : [])]}>{action}</Text>
        ) : (
          <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary), lineLimit(2)]}>{props.focus}</Text>
        )}
      </VStack>
    );
  }

  if (props.lifecycle === 'rest') {
    return (
      <VStack alignment="leading" spacing={0} modifiers={[...root, accessibilityLabel(`Today, ${props.title}. ${props.focus}`)]}>
        <Text modifiers={eyebrow}>{props.dateLabel.replace(',', '').toUpperCase()}</Text>
        <Text modifiers={[font({ size: 19, weight: 'semibold' }), lineHeight(22), foregroundStyle(primary), padding({ top: 6 })]}>{props.title}</Text>
        <Spacer minLength={8} />
        <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary), lineLimit(2)]}>{props.focus}</Text>
      </VStack>
    );
  }

  if (isSmall) {
    return (
      <VStack alignment="leading" spacing={0} modifiers={[...root, accessibilityLabel(`${props.title}. ${props.completedSets} of ${props.totalSets} sets complete.`)]}>
        <Text modifiers={eyebrow}>{props.dateLabel.replace(',', '').toUpperCase()}</Text>
        <Text modifiers={[font({ size: 17, weight: 'semibold' }), lineHeight(20), kerning(-0.35), foregroundStyle(primary), lineLimit(2), padding({ top: 6 })]}>{complete ? 'Workout complete' : props.title}</Text>
        <Spacer minLength={8} />
        <ZStack alignment="leading" modifiers={[frame({ width: 142, height: 3 }), accessibilityHidden()]}>
          <RoundedRectangle cornerRadius={99} modifiers={[frame({ width: 142, height: 3 }), foregroundStyle(divider)]} />
          <RoundedRectangle cornerRadius={99} modifiers={[frame({ width: 142 * progress, height: 3 }), foregroundStyle(primary)]} />
        </ZStack>
        <Text modifiers={[font({ size: 10 }), foregroundStyle(secondary), monospacedDigit(), padding({ top: 8 })]}>{complete ? `${props.totalSets} sets · ${duration}` : meta}</Text>
      </VStack>
    );
  }

  if (isMedium) {
    return (
      <HStack spacing={10} modifiers={[...root, accessibilityLabel(`${props.title}. ${props.completedSets} of ${props.totalSets} sets complete.`)]}>
        <VStack alignment="leading" spacing={0} modifiers={[frame({ width: 155, maxHeight: Infinity, alignment: 'topLeading' })]}>
          <Text modifiers={eyebrow}>{props.dateLabel.replace(',', '').toUpperCase()}</Text>
          <Text modifiers={[font({ size: 19, weight: 'semibold' }), lineHeight(21), kerning(-0.45), foregroundStyle(primary), lineLimit(2), padding({ top: 6 })]}>{complete ? 'Workout complete' : props.title}</Text>
          <Text modifiers={[font({ size: 10 }), foregroundStyle(secondary), monospacedDigit(), padding({ top: 4 })]}>{meta}</Text>
          <Spacer minLength={6} />
          <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(inverseText), frame({ width: 155, height: 32 }), background(emphasisSurface, shapes.capsule())]}>{complete ? 'Review' : props.completedSets > 0 ? 'Continue' : 'Start'}</Text>
        </VStack>
        <Divider modifiers={[foregroundStyle(divider)]} />
        <VStack alignment="leading" spacing={4} modifiers={[frame({ width: 112, maxHeight: Infinity, alignment: 'topLeading' })]}>
          {props.exercises[0] ? (
            <HStack spacing={6} modifiers={[frame({ width: 112, height: 26 })]}>
              <RoundedRectangle cornerRadius={8} modifiers={[frame({ width: 26, height: 26 }), foregroundStyle(item), accessibilityHidden()]} />
              <VStack alignment="leading" spacing={1} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
                <Text modifiers={[font({ size: 9, weight: 'semibold' }), foregroundStyle(primary), lineLimit(1)]}>{props.exercises[0].name}</Text>
                <Text modifiers={[font({ size: 9 }), foregroundStyle(secondary), monospacedDigit(), lineLimit(1)]}>{props.exercises[0].totalSets} × {props.exercises[0].targetReps || '−'}{props.exercises[0].targetLoad >= 0 ? ` · ${props.exercises[0].targetLoad} LB` : ''}</Text>
              </VStack>
            </HStack>
          ) : null}
          {props.exercises[1] ? (
            <HStack spacing={6} modifiers={[frame({ width: 112, height: 26 })]}>
              <RoundedRectangle cornerRadius={8} modifiers={[frame({ width: 26, height: 26 }), foregroundStyle(item), accessibilityHidden()]} />
              <VStack alignment="leading" spacing={1} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
                <Text modifiers={[font({ size: 9, weight: 'semibold' }), foregroundStyle(primary), lineLimit(1)]}>{props.exercises[1].name}</Text>
                <Text modifiers={[font({ size: 9 }), foregroundStyle(secondary), monospacedDigit(), lineLimit(1)]}>{props.exercises[1].totalSets} × {props.exercises[1].targetReps || '−'}{props.exercises[1].targetLoad >= 0 ? ` · ${props.exercises[1].targetLoad} LB` : ''}</Text>
              </VStack>
            </HStack>
          ) : null}
          {props.exercises[2] ? (
            <HStack spacing={6} modifiers={[frame({ width: 112, height: 26 })]}>
              <RoundedRectangle cornerRadius={8} modifiers={[frame({ width: 26, height: 26 }), foregroundStyle(item), accessibilityHidden()]} />
              <VStack alignment="leading" spacing={1} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
                <Text modifiers={[font({ size: 9, weight: 'semibold' }), foregroundStyle(primary), lineLimit(1)]}>{props.exercises[2].name}</Text>
                <Text modifiers={[font({ size: 9 }), foregroundStyle(secondary), monospacedDigit(), lineLimit(1)]}>{props.exercises[2].totalSets} × {props.exercises[2].targetReps || '−'}{props.exercises[2].targetLoad >= 0 ? ` · ${props.exercises[2].targetLoad} LB` : ''}</Text>
              </VStack>
            </HStack>
          ) : null}
          {props.exercises.length > 3 ? <Text modifiers={[font({ size: 10 }), foregroundStyle(secondary)]}>+{props.exercises.length - 3} more</Text> : null}
        </VStack>
      </HStack>
    );
  }

  return (
    <VStack alignment="leading" spacing={0} modifiers={[...root, accessibilityLabel(`${props.title}. ${props.completedSets} of ${props.totalSets} sets complete.`)]}>
      <HStack spacing={2} modifiers={[frame({ maxWidth: Infinity, height: 40 })]}>
        {props.week.slice(0, 7).map((day, index) => (
          <VStack
            key={`${day.shortDay}-${day.date}-${index}`}
            alignment="center"
            spacing={1}
            modifiers={[
              frame({ width: 34, height: 40 }),
              ...(day.isToday ? [background(emphasisSurface, { shape: 'roundedRectangle', cornerRadius: 11 })] : []),
            ]}
          >
            <Text modifiers={[font({ size: 9, weight: 'semibold' }), kerning(0.6), foregroundStyle(day.isToday ? inverseText : secondary)]}>{day.shortDay.slice(0, 1)}</Text>
            <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(day.isToday ? inverseText : secondary), monospacedDigit()]}>{day.date}</Text>
          </VStack>
        ))}
      </HStack>
      <Text modifiers={[font({ size: 21, weight: 'semibold' }), lineHeight(24), kerning(-0.6), foregroundStyle(primary), lineLimit(1), padding({ top: 4 })]}>{complete ? 'Workout complete' : props.title}</Text>
      <Text modifiers={[font({ size: 11 }), lineHeight(14), foregroundStyle(secondary), lineLimit(2), padding({ top: 4 })]}>{props.focus}</Text>
      <HStack spacing={10} modifiers={[padding({ top: 12 }), frame({ maxWidth: Infinity })]}>
        <ZStack alignment="leading" modifiers={[frame({ width: 298, height: 3 }), accessibilityHidden()]}>
          <RoundedRectangle cornerRadius={99} modifiers={[frame({ width: 298, height: 3 }), foregroundStyle(divider)]} />
          <RoundedRectangle cornerRadius={99} modifiers={[frame({ width: 298 * progress, height: 3 }), foregroundStyle(primary)]} />
        </ZStack>
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(secondary), monospacedDigit()]}>{percent}%</Text>
      </HStack>
      <VStack alignment="leading" spacing={4} modifiers={[padding({ top: 10 }), frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })]}>
        {props.exercises.slice(0, 4).map((exercise, index) => (
          <HStack key={`${exercise.name}-${index}`} spacing={10} modifiers={[frame({ maxWidth: Infinity, height: 36 })]}>
            <RoundedRectangle cornerRadius={10} modifiers={[frame({ width: 36, height: 36 }), foregroundStyle(item), accessibilityHidden()]} />
            <VStack alignment="leading" spacing={1} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
              <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(primary), lineLimit(1)]}>{exercise.name}</Text>
              <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary), monospacedDigit(), lineLimit(1)]}>{exercise.targetLoad >= 0 ? `${exercise.totalSets} × ${exercise.targetReps || '−'} · ${exercise.targetLoad} LB${exercise.targetRpe >= 0 ? ` · RPE ${exercise.targetRpe}` : ''}` : `${exercise.totalSets} sets${exercise.restSeconds > 0 ? ` · ${exercise.restSeconds} sec rest` : ` · ${exercise.targetReps || '−'} reps`}`}</Text>
            </VStack>
            <ZStack modifiers={[frame({ width: 17, height: 17 }), accessibilityHidden()]}>
              <Circle modifiers={[frame({ width: 17, height: 17 }), foregroundStyle(exercise.completedSets >= exercise.totalSets ? emphasisSurface : 'transparent'), ...(exercise.completedSets >= exercise.totalSets ? [] : [strokeBorder({ color: divider, style: { lineWidth: 1.5 }, shape: 'circle' })])]} />
              {exercise.completedSets >= exercise.totalSets ? <Image systemName="checkmark" size={9} color={inverseText} /> : null}
            </ZStack>
          </HStack>
        ))}
      </VStack>
      <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(inverseText), frame({ width: 332, height: 40 }), background(emphasisSurface, shapes.roundedRectangle({ cornerRadius: 12 }))]}>{complete ? 'Review workout' : props.completedSets > 0 ? 'Continue workout' : 'Start workout'}</Text>
    </VStack>
  );
}

export const FlyntTodayWidget = createWidget<FlyntWidgetSnapshot>('FlyntTodayWidget', TodayWidgetView);
