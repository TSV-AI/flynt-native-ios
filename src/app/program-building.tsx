import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  FadeIn,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AppScreen } from '@/components/app-surface';
import { motion } from '@/constants/motion';
import { radius, spacing, type } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { fetchProgramStatus } from '@/lib/api-client';
import { saved } from '@/lib/haptics';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

type NotificationState = 'idle' | 'requesting' | 'ready' | 'denied' | 'error';

const progressRingSize = 184;
const progressRingCenter = progressRingSize / 2;
const progressRingRadius = 84;
const progressRingStroke = 9;
const progressRingCircumference = 2 * Math.PI * progressRingRadius;
const progressCopyWidth = 330;
const shimmerTrailLength = 4;

const phaseCopy: Record<string, { title: string; detail?: string }> = {
  queued: {
    title: 'Reviewing your goals and limitations',
    detail: 'Preparing your training profile',
  },
  generating_program: {
    title: 'Structuring your training week',
    detail: 'Balancing training and recovery',
  },
  resolving_exercises: {
    title: 'Selecting exercises for you',
    detail: 'Matching your experience and equipment',
  },
  building_guides: {
    title: 'Programming each movement',
  },
  validating: {
    title: 'Checking every session',
    detail: 'Reviewing volume, intensity, and recovery',
  },
  publishing: {
    title: 'Preparing your first week',
    detail: 'Finalizing your complete plan',
  },
  complete: {
    title: 'Your program is ready',
    detail: 'Ready to train',
  },
};

function ShimmerGlyph({
  color,
  glyph,
  glyphCount,
  index,
  shimmer,
}: {
  color: string;
  glyph: string;
  glyphCount: number;
  index: number;
  shimmer: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const position = (shimmer.value * (glyphCount + (shimmerTrailLength * 2))) - shimmerTrailLength;
    const distance = Math.abs(index - position);
    return {
      opacity: interpolate(distance, [0, shimmerTrailLength], [1, 0.3], Extrapolation.CLAMP),
    };
  });

  return (
    <Reanimated.Text accessible={false} style={[{ color }, animatedStyle]}>
      {glyph}
    </Reanimated.Text>
  );
}

function ShimmeringStatusText({
  active,
  color,
  label,
}: {
  active: boolean;
  color: string;
  label: string;
}) {
  const reduceMotion = useReducedMotion();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!active || reduceMotion) {
      cancelAnimation(shimmer);
      shimmer.value = 0;
      return;
    }

    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: motion.duration.statusShimmerSweep,
          easing: Easing.linear,
        }),
        withDelay(motion.duration.statusShimmerPause, withTiming(0, { duration: 0 })),
      ),
      -1,
    );
    return () => cancelAnimation(shimmer);
  }, [active, reduceMotion, shimmer]);

  const glyphs = Array.from(label);

  return (
    <Reanimated.View
      entering={reduceMotion ? undefined : FadeIn.duration(motion.duration.standard)}
      style={styles.statusTitle}
    >
      {active && !reduceMotion ? (
        <Text accessibilityLabel={label} accessibilityRole="header" style={styles.title}>
          {glyphs.map((glyph, index) => (
            <ShimmerGlyph
              color={color}
              glyph={glyph}
              glyphCount={glyphs.length}
              index={index}
              key={`${index}-${glyph}`}
              shimmer={shimmer}
            />
          ))}
        </Text>
      ) : (
        <Text accessibilityRole="header" style={[styles.title, { color }]}>{label}</Text>
      )}
    </Reanimated.View>
  );
}

function notificationsAllowed(status: Notifications.NotificationPermissionsStatus) {
  return status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;
}

function ProgramProgressRing({ progress, track, tint }: { progress: number; track: string; tint: string }) {
  const boundedProgress = Math.max(0, Math.min(progress, 100));
  const progressOffset = progressRingCircumference * (1 - boundedProgress / 100);
  const markerAngle = ((boundedProgress / 100) * Math.PI * 2) - (Math.PI / 2);
  const markerX = progressRingCenter + (progressRingRadius * Math.cos(markerAngle));
  const markerY = progressRingCenter + (progressRingRadius * Math.sin(markerAngle));

  return (
    <View style={styles.progressRing}>
      <Svg height={progressRingSize} viewBox={`0 0 ${progressRingSize} ${progressRingSize}`} width={progressRingSize}>
        <Circle
          cx={progressRingCenter}
          cy={progressRingCenter}
          fill="none"
          r={progressRingRadius}
          stroke={track}
          strokeWidth={2}
        />
        <Circle cx={progressRingCenter} cy={progressRingCenter - progressRingRadius} fill={tint} r={1.5} />
        <Circle
          cx={progressRingCenter}
          cy={progressRingCenter}
          fill="none"
          origin={`${progressRingCenter}, ${progressRingCenter}`}
          r={progressRingRadius}
          rotation={-90}
          stroke={tint}
          strokeDasharray={`${progressRingCircumference} ${progressRingCircumference}`}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          strokeWidth={progressRingStroke}
        />
        <Circle cx={markerX} cy={markerY} fill={tint} r={progressRingStroke / 2} />
      </Svg>
      <Text style={[styles.progressValue, { color: tint }]}>{`${boundedProgress}%`}</Text>
    </View>
  );
}

export default function ProgramBuildingScreen() {
  const { theme } = useFlyntTheme();
  const { appState, refresh } = useLifecycleNavigation();
  const isBuildPreview = __DEV__ && process.env.EXPO_PUBLIC_FLYNT_PREVIEW === 'program_building';
  const [phase, setPhase] = useState(isBuildPreview ? 'building_guides' : appState?.build?.phase ?? 'queued');
  const [progress, setProgress] = useState(isBuildPreview ? 64 : 4);
  const [notificationState, setNotificationState] = useState<NotificationState>('idle');
  const notificationRequested = useRef(false);
  const completionNotificationSent = useRef(false);

  const notifyWhenReady = useCallback(async () => {
    setNotificationState('requesting');
    try {
      const current = await Notifications.getPermissionsAsync();
      const permission = notificationsAllowed(current)
        ? current
        : await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: false, allowSound: true },
        });
      if (!notificationsAllowed(permission)) {
        setNotificationState('denied');
        return;
      }
      notificationRequested.current = true;
      setNotificationState('ready');
      void saved();
    } catch {
      setNotificationState('error');
    }
  }, []);

  const announceCompletion = useCallback(async () => {
    if (!notificationRequested.current || completionNotificationSent.current) return;
    completionNotificationSent.current = true;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your FLYNT program is ready',
        body: 'Open FLYNT to review your first training week.',
        sound: 'default',
      },
      trigger: null,
    });
  }, []);

  useEffect(() => {
    if (isBuildPreview) return;
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const status = await fetchProgramStatus();
        if (!active) return;
        setPhase(status.build?.phase ?? (status.ready ? 'complete' : 'queued'));
        setProgress(Math.round(status.progress.percent));
        if (status.ready) {
          await announceCompletion();
          if (active) await refresh();
          return;
        }
        if (status.lifecycle === 'build_attention') {
          await refresh();
          return;
        }
      } catch {
        // The build continues on the server. The next bounded poll retries.
      }
      if (active) timeout = setTimeout(() => void poll(), 5000);
    };

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' || !active) return;
      if (timeout) clearTimeout(timeout);
      timeout = undefined;
      void poll();
    });

    void poll();
    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
      appStateSubscription.remove();
    };
  }, [announceCompletion, isBuildPreview, refresh]);

  const notificationLabel = notificationState === 'requesting'
    ? 'Turning on notifications…'
    : notificationState === 'ready'
      ? 'We’ll notify you when it’s ready!'
      : notificationState === 'denied'
        ? 'Notifications are off in Settings'
        : notificationState === 'error'
          ? 'Try enabling notifications again'
          : 'Notify me when it’s ready';

  const currentPhase = phaseCopy[phase] ?? phaseCopy.building_guides;

  return (
    <AppScreen scrollable={false} testID="screen-program-building">
      <View style={styles.content}>
        <View style={styles.copy}>
          <ShimmeringStatusText
            active={phase !== 'complete'}
            color={theme.ink}
            key={phase}
            label={currentPhase.title}
          />
          {currentPhase.detail ? (
            <Text style={[styles.phase, { color: theme.muted }]}>{currentPhase.detail}</Text>
          ) : null}
        </View>

        <View
          accessibilityLabel={`Program build progress, ${progress} percent`}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: progress }}
          style={styles.progressFrame}
        >
          <ProgramProgressRing progress={progress} tint={theme.ink} track={theme.line} />
        </View>

        {notificationState === 'ready' ? (
          <View accessibilityLiveRegion="polite" style={styles.notifyStatus}>
            <Text style={[styles.notifyLabel, { color: theme.ink }]}>{notificationLabel}</Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={notificationState === 'requesting' || notificationState === 'denied'}
            onPress={() => void notifyWhenReady()}
            style={({ pressed }) => [
              styles.notifyButton,
              {
                backgroundColor: theme.primaryFill,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Text style={[styles.notifyLabel, { color: theme.primaryText }]}>
              {notificationLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.hero,
    paddingBottom: spacing.lg,
  },
  progressFrame: {
    width: 184,
    height: 184,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 82,
  },
  progressRing: { width: progressRingSize, height: progressRingSize, alignItems: 'center', justifyContent: 'center' },
  progressValue: { position: 'absolute', fontSize: 23, lineHeight: 28, fontWeight: '400', fontVariant: ['tabular-nums'] },
  copy: { alignItems: 'center', maxWidth: progressCopyWidth },
  statusTitle: { width: progressCopyWidth, alignItems: 'center' },
  title: { ...type.body, width: progressCopyWidth, fontSize: 16, lineHeight: 21, textAlign: 'center' },
  phase: { fontSize: 12, lineHeight: 17, marginTop: spacing.xxs, textAlign: 'center' },
  notifyButton: {
    minHeight: 52,
    minWidth: 280,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 104,
    paddingHorizontal: spacing.lg,
  },
  notifyStatus: {
    minHeight: 52,
    minWidth: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 104,
    paddingHorizontal: spacing.lg,
  },
  notifyLabel: { ...type.button, textAlign: 'center' },
});
