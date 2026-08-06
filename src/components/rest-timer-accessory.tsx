import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { NativeSymbol } from '@/components/native-symbol';
import { radius } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useSmoothProgressWidth } from '@/hooks/use-smooth-progress';
import { useRestTimer } from '@/providers/rest-timer-provider';

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function AccessoryContent({
  exercise,
  inline,
  primaryColor,
  secondaryColor,
  time,
  width,
  withStopButton,
}: {
  exercise: string;
  inline: boolean;
  primaryColor: string;
  secondaryColor: string;
  time: string;
  width?: number;
  withStopButton?: boolean;
}) {
  return (
    <View
      style={[
        styles.accessoryContent,
        inline && styles.accessoryContentInline,
        withStopButton && styles.accessoryContentWithStop,
        width ? { width } : null,
      ]}
    >
      {!inline ? (
        <View style={styles.accessoryCopy}>
          <Text style={[styles.accessoryLabel, { color: secondaryColor }]}>REST</Text>
          <Text numberOfLines={1} style={[styles.accessoryExercise, { color: primaryColor }]}>{exercise}</Text>
        </View>
      ) : null}
      <Text style={[styles.accessoryTime, { color: primaryColor }, inline && styles.accessoryTimeInline]}>{time}</Text>
      {withStopButton ? (
        <View pointerEvents="none" style={styles.stopVisual}>
          <NativeSymbol color={primaryColor} name="xmark" size={14} />
        </View>
      ) : null}
    </View>
  );
}

export function RestTimerAccessorySurface({
  inline = false,
  onPress,
  width,
}: {
  inline?: boolean;
  onPress?: () => void;
  width?: number;
}) {
  const { stop, timer } = useRestTimer();
  const { theme } = useFlyntTheme();
  const [measuredWidth, setMeasuredWidth] = useState(width ?? 0);
  const accessoryWidth = width ?? measuredWidth;
  const progressStyle = useSmoothProgressWidth(timer ? timer.seconds / Math.max(1, timer.total) : 0, accessoryWidth);

  if (!timer) return null;
  const time = formatTimer(timer.seconds);
  const content = (
    <>
      <AccessoryContent
        exercise={timer.exercise}
        inline={inline}
        primaryColor={theme.ink}
        secondaryColor={theme.muted}
        time={time}
        withStopButton={Boolean(onPress)}
      />
      <Animated.View pointerEvents="none" style={[styles.accessoryProgressClip, progressStyle]}>
        <View style={[styles.accessoryProgressFill, { backgroundColor: theme.restTimerProgressFill }]} />
        <AccessoryContent
          exercise={timer.exercise}
          inline={inline}
          primaryColor={theme.primaryText}
          secondaryColor={theme.primaryText}
          time={time}
          width={accessoryWidth}
          withStopButton={Boolean(onPress)}
        />
      </Animated.View>
    </>
  );
  const surfaceStyle = [
    styles.accessory,
    inline && styles.accessoryInline,
    width ? { width } : null,
    { backgroundColor: theme.raised },
  ];

  if (!onPress) {
    return (
      <View
        accessibilityLabel={`${time} remaining for ${timer.exercise}`}
        onLayout={(event) => setMeasuredWidth(event.nativeEvent.layout.width)}
        style={surfaceStyle}
      >
        {content}
      </View>
    );
  }

  return (
    <View
      onLayout={(event) => setMeasuredWidth(event.nativeEvent.layout.width)}
      style={surfaceStyle}
    >
      <Pressable
        accessibilityHint="Opens the rest timer"
        accessibilityLabel={`${time} remaining for ${timer.exercise}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.expandTarget, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
      <Pressable
        accessibilityHint="Ends the current rest timer"
        accessibilityLabel="End rest timer"
        accessibilityRole="button"
        onPress={stop}
        style={({ pressed }) => [styles.stopTarget, pressed && styles.pressed]}
      />
    </View>
  );
}

export function NativeTabRestTimerAccessory() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const { expand } = useRestTimer();
  return <RestTimerAccessorySurface inline={placement === 'inline'} onPress={expand} />;
}

const styles = StyleSheet.create({
  accessory: { flex: 1, minHeight: 52, overflow: 'hidden', borderRadius: radius.pill },
  accessoryInline: { minHeight: 36 },
  accessoryContent: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  accessoryContentInline: { minHeight: 36, gap: 6, paddingHorizontal: 8 },
  accessoryContentWithStop: { paddingRight: 4 },
  accessoryProgressClip: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden', borderRadius: radius.pill },
  accessoryProgressFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius.pill },
  accessoryCopy: { flex: 1, gap: 1, transform: [{ translateX: 6 }, { translateY: -1 }] },
  accessoryExercise: { fontSize: 15, lineHeight: 19, fontWeight: '600' },
  accessoryLabel: { opacity: 0.64, fontSize: 9, lineHeight: 12, fontWeight: '700', letterSpacing: 0.8 },
  accessoryTime: { fontSize: 17, lineHeight: 22, fontWeight: '600', fontVariant: ['tabular-nums'] },
  accessoryTimeInline: { fontSize: 14, lineHeight: 18 },
  expandTarget: { flex: 1 },
  stopVisual: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stopTarget: { position: 'absolute', top: 4, right: 4, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72 },
});
