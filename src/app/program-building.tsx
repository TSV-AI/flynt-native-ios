import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppScreen } from '@/components/app-surface';
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

const phaseCopy: Record<string, string> = {
  queued: 'Getting started',
  generating_program: 'Designing your training week',
  resolving_exercises: 'Matching exercises',
  building_guides: 'Movement guides',
  validating: 'Checking each session',
  publishing: 'Preparing your first week',
  complete: 'Ready',
};

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
  const [completed, setCompleted] = useState<number | null>(isBuildPreview ? 7 : null);
  const [total, setTotal] = useState<number | null>(isBuildPreview ? 11 : null);
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
        setCompleted(status.progress.completed);
        setTotal(status.progress.total);
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

    void poll();
    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [announceCompletion, isBuildPreview, refresh]);

  const notificationLabel = notificationState === 'requesting'
    ? 'Turning on notifications…'
    : notificationState === 'ready'
      ? 'We’ll notify you when it’s ready'
      : notificationState === 'denied'
        ? 'Notifications are off in Settings'
        : notificationState === 'error'
          ? 'Try enabling notifications again'
          : 'Notify me when it’s ready';

  const currentPhase = phaseCopy[phase] ?? phaseCopy.building_guides;
  const phaseDetail = phase === 'building_guides' && total !== null && completed !== null
    ? `${currentPhase} · ${completed} of ${total}`
    : currentPhase;

  return (
    <AppScreen scrollable={false} testID="screen-program-building">
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Building your program</Text>
          <Text style={[styles.phase, { color: theme.muted }]}>{phaseDetail}</Text>
        </View>

        <View
          accessibilityLabel={`Program build progress, ${progress} percent`}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: progress }}
          style={styles.progressFrame}
        >
          <ProgramProgressRing progress={progress} tint={theme.ink} track={theme.line} />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={notificationState === 'requesting' || notificationState === 'ready' || notificationState === 'denied'}
          onPress={() => void notifyWhenReady()}
          style={({ pressed }) => [
            styles.notifyButton,
            {
              backgroundColor: notificationState === 'ready' ? theme.card : theme.primaryFill,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <Text style={[
            styles.notifyLabel,
            { color: notificationState === 'ready' ? theme.ink : theme.primaryText },
          ]}>
            {notificationLabel}
          </Text>
        </Pressable>
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
  copy: { alignItems: 'center', maxWidth: 330 },
  title: { ...type.body, fontSize: 16, lineHeight: 21, textAlign: 'center' },
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
  notifyLabel: { ...type.button, textAlign: 'center' },
});
