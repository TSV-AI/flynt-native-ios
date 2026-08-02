import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { PlatformColor, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useState } from 'react';

import { radius } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useSmoothProgressWidth } from '@/hooks/use-smooth-progress';
import { useModalPresentation } from '@/providers/modal-presentation-provider';
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
          <Text style={[styles.accessoryLabel, { color: secondaryColor }]}>NEXT UP</Text>
          <Text numberOfLines={1} style={[styles.accessoryExercise, { color: primaryColor }]}>{exercise}</Text>
        </View>
      ) : null}
      <Text style={[styles.accessoryTime, { color: primaryColor }, inline && styles.accessoryTimeInline]}>{time}</Text>
    </View>
  );
}

function RestTimerAccessory() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const { expand, timer } = useRestTimer();
  const { theme } = useFlyntTheme();
  const [accessoryWidth, setAccessoryWidth] = useState(0);
  const inline = placement === 'inline';
  const progressStyle = useSmoothProgressWidth(timer ? timer.seconds / Math.max(1, timer.total) : 0, accessoryWidth);

  if (!timer) return null;
  const time = formatTimer(timer.seconds);

  return (
    <Pressable
      accessibilityHint="Opens the rest timer sheet"
      accessibilityLabel={`${time} remaining for ${timer.exercise}`}
      accessibilityRole="button"
      onLayout={(event) => setAccessoryWidth(event.nativeEvent.layout.width)}
      onPress={expand}
      style={[styles.accessory, inline && styles.accessoryInline]}
    >
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
    </Pressable>
  );
}

export default function AppTabsLayout() {
  const { isModalPresented } = useModalPresentation();
  const { isExpanded, timer } = useRestTimer();
  const selectedColor = PlatformColor('label');
  const unselectedColor = PlatformColor('secondaryLabel');

  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      hidden={isModalPresented}
      iconColor={{ default: unselectedColor, selected: selectedColor }}
      labelStyle={{
        default: { color: unselectedColor },
        selected: { color: selectedColor },
      }}
      tintColor={selectedColor}
    >
      {timer && timer.seconds > 0 && !isExpanded ? (
        <NativeTabs.BottomAccessory>
          <RestTimerAccessory />
        </NativeTabs.BottomAccessory>
      ) : null}
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="today">
        <NativeTabs.Trigger.Icon sf={{ default: 'dumbbell', selected: 'dumbbell.fill' }} />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="plan">
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar.circle.fill' }} />
        <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="progress">
        <NativeTabs.Trigger.Icon sf="chart.xyaxis.line" />
        <NativeTabs.Trigger.Label>Progress</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="trainer">
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} />
        <NativeTabs.Trigger.Label>Trainer</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
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
});
