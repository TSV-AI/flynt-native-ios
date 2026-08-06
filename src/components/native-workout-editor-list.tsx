import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  PlatformColor,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { NativeSymbol } from '@/components/native-symbol';
import { motion } from '@/constants/motion';

export type NativeWorkoutEditorExercise = {
  id: string;
  name: string;
  summary: string;
  artworkUrl?: string;
};

export type NativeWorkoutEditorListProps = ViewProps & {
  activeBackgroundColor: string;
  backgroundColor: string;
  exercises: NativeWorkoutEditorExercise[];
  foregroundColor: string;
  instructions: string;
  mutedColor: string;
  onAddExercise: () => void;
  onDeleteExercise: (event: { nativeEvent: { index: number } }) => void;
  onMoveExercise: (event: { nativeEvent: { from: number; to: number } }) => void;
  onReplaceExercise: (event: { nativeEvent: { index: number } }) => void;
  onSelectExercise: (event: { nativeEvent: { index: number } }) => void;
  title: string;
};

function DotGrid({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={[styles.dotGrid, styles.dotGridMuted]}>
      {Array.from({ length: 6 }, (_, index) => (
        <View key={index} style={[styles.dot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

function WorkoutEditorRow({
  active,
  activeBackgroundColor,
  backgroundColor,
  drag,
  exercise,
  foregroundColor,
  mutedColor,
  onDelete,
  onReplace,
  onSelect,
  onSwipeState,
}: {
  active: boolean;
  activeBackgroundColor: string;
  backgroundColor: string;
  drag: () => void;
  exercise: NativeWorkoutEditorExercise;
  foregroundColor: string;
  mutedColor: string;
  onDelete: () => void;
  onReplace: () => void;
  onSelect: () => void;
  onSwipeState: (open: boolean) => void;
}) {
  const swipeable = useRef<SwipeableMethods>(null);
  const reduceMotion = useReducedMotion();
  const cardLift = useSharedValue(active ? 1 : 0);

  function liftCard() {
    cardLift.value = reduceMotion
      ? 1
      : withTiming(1, {
        duration: motion.duration.quick,
        easing: Easing.out(Easing.cubic),
      });
  }

  function settleCard() {
    cardLift.value = reduceMotion
      ? 0
      : withTiming(0, {
        duration: motion.duration.quick,
        easing: Easing.out(Easing.cubic),
      });
  }

  useEffect(() => {
    cardLift.value = reduceMotion
      ? (active ? 1 : 0)
      : active
        ? withTiming(1, {
          duration: motion.duration.quick,
          easing: Easing.out(Easing.cubic),
        })
        : withTiming(0, {
          duration: motion.duration.quick,
          easing: Easing.out(Easing.cubic),
        });
  }, [active, cardLift, reduceMotion]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      cardLift.value,
      [0, 1],
      [backgroundColor, activeBackgroundColor],
    ),
    shadowOpacity: interpolate(cardLift.value, [0, 1], [0, 0.18]),
    shadowRadius: interpolate(cardLift.value, [0, 1], [0, 12]),
    shadowOffset: {
      width: 0,
      height: interpolate(cardLift.value, [0, 1], [0, 6]),
    },
    transform: [{ scale: interpolate(cardLift.value, [0, 1], [1, 1.006]) }],
    zIndex: cardLift.value > 0 ? 4 : 0,
  }));

  function confirmDelete() {
    Alert.alert(
      'Delete exercise?',
      `This removes ${exercise.name} from your edited workout.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  }

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      containerStyle={styles.swipeContainer}
      friction={1.4}
      overshootRight={false}
      rightThreshold={52}
      onSwipeableOpenStartDrag={liftCard}
      onSwipeableWillOpen={() => onSwipeState(true)}
      onSwipeableWillClose={settleCard}
      onSwipeableClose={() => onSwipeState(false)}
      renderRightActions={() => (
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={`Replace ${exercise.name}`}
            accessibilityRole="button"
            onPress={() => {
              swipeable.current?.close();
              onReplace();
            }}
            style={styles.actionButton}
          >
            <View style={[styles.actionCircle, { backgroundColor: PlatformColor('systemIndigo') }]}>
              <NativeSymbol color="#FFFFFF" name="arrow.triangle.2.circlepath" size={20} />
            </View>
            <Text style={[styles.actionLabel, { color: mutedColor }]}>Replace</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Delete ${exercise.name}`}
            accessibilityRole="button"
            onPress={confirmDelete}
            style={styles.actionButton}
          >
            <View style={[styles.actionCircle, { backgroundColor: PlatformColor('systemRed') }]}>
              <NativeSymbol color="#FFFFFF" name="trash" size={19} />
            </View>
            <Text style={[styles.actionLabel, { color: mutedColor }]}>Delete</Text>
          </Pressable>
        </View>
      )}
    >
      <Animated.View style={[styles.row, styles.rowShadow, animatedCardStyle]}>
        <Pressable
          accessibilityHint="Opens exercise editing"
          accessibilityLabel={`${exercise.name}, ${exercise.summary}`}
          accessibilityRole="button"
          onPress={onSelect}
          style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
        >
          <View style={[styles.artwork, { backgroundColor: `${mutedColor}1F` }]}>
            {exercise.artworkUrl ? (
              <Image resizeMode="contain" source={{ uri: exercise.artworkUrl }} style={styles.artworkImage} />
            ) : (
              <NativeSymbol color={mutedColor} name="figure.strengthtraining.traditional" size={24} />
            )}
          </View>
          <View style={styles.copy}>
            <Text numberOfLines={2} style={[styles.title, { color: foregroundColor }]}>{exercise.name}</Text>
            <Text numberOfLines={1} style={[styles.summary, { color: mutedColor }]}>{exercise.summary}</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityHint="Drag up or down to reorder"
          accessibilityLabel={`Reorder ${exercise.name}`}
          accessibilityRole="button"
          delayLongPress={120}
          onLongPress={drag}
          style={({ pressed }) => [styles.handle, pressed && styles.pressed]}
        >
          <DotGrid color={mutedColor} />
        </Pressable>
      </Animated.View>
    </ReanimatedSwipeable>
  );
}

export function NativeWorkoutEditorList({
  activeBackgroundColor,
  backgroundColor,
  exercises,
  foregroundColor,
  instructions,
  mutedColor,
  onAddExercise,
  onDeleteExercise,
  onMoveExercise,
  onReplaceExercise,
  onSelectExercise,
  style,
  title,
}: NativeWorkoutEditorListProps) {
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [dragReleased, setDragReleased] = useState(false);

  function renderItem({ item, drag, getIndex, isActive }: RenderItemParams<NativeWorkoutEditorExercise>) {
    const index = getIndex() ?? 0;
    return (
      <WorkoutEditorRow
        active={swipedId === item.id || (isActive && !dragReleased)}
        activeBackgroundColor={activeBackgroundColor}
        backgroundColor={backgroundColor}
        drag={drag}
        exercise={item}
        foregroundColor={foregroundColor}
        mutedColor={mutedColor}
        onDelete={() => onDeleteExercise({ nativeEvent: { index } })}
        onReplace={() => onReplaceExercise({ nativeEvent: { index } })}
        onSelect={() => onSelectExercise({ nativeEvent: { index } })}
        onSwipeState={(open) => {
          if (open) {
            setSwipedId(item.id);
          } else {
            setSwipedId((current) => current === item.id ? null : current);
          }
        }}
      />
    );
  }

  return (
    <GestureHandlerRootView style={[styles.root, style]}>
      <DraggableFlatList
        activationDistance={6}
        autoscrollThreshold={0}
        contentContainerStyle={{ backgroundColor }}
        data={exercises}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: foregroundColor }]}>{title}</Text>
            <Text style={[styles.headerInstructions, { color: mutedColor }]}>{instructions}</Text>
          </View>
        )}
        ListFooterComponent={(
          <View>
            <Pressable
              accessibilityLabel="Add exercise"
              accessibilityRole="button"
              onPress={onAddExercise}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            >
              <NativeSymbol color={foregroundColor} name="plus" size={16} />
              <Text style={[styles.addLabel, { color: foregroundColor }]}>Add exercise</Text>
            </Pressable>
            <View style={styles.bottomClearance} />
          </View>
        )}
        onDragBegin={() => {
          setDragReleased(false);
          setSwipedId(null);
        }}
        onDragEnd={({ from, to }) => onMoveExercise({ nativeEvent: { from, to } })}
        onRelease={() => setDragReleased(true)}
        renderItem={renderItem}
        scrollEnabled
        showsVerticalScrollIndicator={false}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 20 },
  headerTitle: { fontSize: 34, lineHeight: 41, fontWeight: '600', letterSpacing: 0.2 },
  headerInstructions: { marginTop: 8, fontSize: 15, lineHeight: 21 },
  swipeContainer: { overflow: 'visible' },
  row: {
    height: 82,
    borderRadius: 18,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowShadow: { shadowColor: '#000000' },
  rowMain: {
    flex: 1,
    height: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 10,
  },
  artwork: {
    width: 80,
    height: 60,
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkImage: { width: '100%', height: '100%' },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  summary: { fontSize: 15, lineHeight: 20 },
  handle: { width: 44, height: 72, alignItems: 'center', justifyContent: 'center' },
  dotGrid: { width: 24, height: 34, flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignContent: 'center', justifyContent: 'center' },
  dotGridMuted: { opacity: 0.65 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  actions: { width: 156, height: 82, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  actionButton: { width: 70, minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 3 },
  actionCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, lineHeight: 16 },
  addButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  addLabel: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  bottomClearance: { height: 96 },
  pressed: { opacity: 0.72 },
});
