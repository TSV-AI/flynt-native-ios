import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

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
}: {
  exercise: string;
  inline: boolean;
  primaryColor: string;
  secondaryColor: string;
  time: string;
  width?: number;
}) {
  return (
    <View style={[styles.accessoryContent, inline && styles.accessoryContentInline, width ? { width } : null]}>
      {!inline ? (
        <View style={styles.accessoryCopy}>
          <Text style={[styles.accessoryLabel, { color: secondaryColor }]}>REST</Text>
          <Text numberOfLines={1} style={[styles.accessoryExercise, { color: primaryColor }]}>{exercise}</Text>
        </View>
      ) : null}
      <Text style={[styles.accessoryTime, { color: primaryColor }, inline && styles.accessoryTimeInline]}>{time}</Text>
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
  const { timer } = useRestTimer();
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
    <Pressable
      accessibilityHint="Opens the rest timer"
      accessibilityLabel={`${time} remaining for ${timer.exercise}`}
      accessibilityRole="button"
      onLayout={(event) => setMeasuredWidth(event.nativeEvent.layout.width)}
      onPress={onPress}
      style={({ pressed }) => [surfaceStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
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
  accessoryProgressClip: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden', borderRadius: radius.pill },
  accessoryProgressFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius.pill },
  accessoryCopy: { flex: 1, gap: 1 },
  accessoryExercise: { fontSize: 15, lineHeight: 19, fontWeight: '600' },
  accessoryLabel: { opacity: 0.64, fontSize: 9, lineHeight: 12, fontWeight: '700', letterSpacing: 0.8 },
  accessoryTime: { fontSize: 17, lineHeight: 22, fontWeight: '600', fontVariant: ['tabular-nums'] },
  accessoryTimeInline: { fontSize: 14, lineHeight: 18 },
  pressed: { opacity: 0.72 },
});
