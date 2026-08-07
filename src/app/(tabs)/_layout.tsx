import { usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect, useState } from 'react';
import { AppState, Platform, PlatformColor } from 'react-native';

import { NativeTabRestTimerAccessory } from '@/components/rest-timer-accessory';
import { WidgetSnapshotSync } from '@/components/widget-snapshot-sync';
import { appSurfaces } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useModalPresentation } from '@/providers/modal-presentation-provider';
import { useRestTimer } from '@/providers/rest-timer-provider';
import { TrainerConversationProvider } from '@/providers/trainer-conversation-provider';
import { WorkoutDataProvider } from '@/providers/workout-data-provider';

function NativeAppTabs() {
  const { mode } = useFlyntTheme();
  const { isModalPresented } = useModalPresentation();
  const { isExpanded, timer } = useRestTimer();
  const pathname = usePathname();
  const [dayOfMonth, setDayOfMonth] = useState(() => new Date().getDate());
  const isTrainer = pathname.endsWith('/trainer');
  const isExercise = pathname.endsWith('/today/exercise');
  const selectedColor = PlatformColor('label');
  const unselectedColor = PlatformColor('secondaryLabel');
  const tabContentStyle = { backgroundColor: appSurfaces[mode].primaryBackground };
  const supportsNumberedCalendar = Number.parseInt(String(Platform.Version), 10) >= 26;
  const todaySymbol = supportsNumberedCalendar
    ? (`${dayOfMonth}.calendar` as '1.calendar')
    : 'calendar';

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout> | undefined;

    const refreshDayAndScheduleMidnight = () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      setDayOfMonth(now.getDate());
      midnightTimer = setTimeout(
        refreshDayAndScheduleMidnight,
        nextMidnight.getTime() - now.getTime() + 1000
      );
    };

    refreshDayAndScheduleMidnight();
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshDayAndScheduleMidnight();
    });

    return () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      appStateSubscription.remove();
    };
  }, []);

  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      hidden={isModalPresented || isExercise}
      iconColor={{ default: unselectedColor, selected: selectedColor }}
      labelStyle={{
        default: { color: unselectedColor },
        selected: { color: selectedColor },
      }}
      minimizeBehavior="automatic"
      tintColor={selectedColor}
      unstable_nativeProps={{
        colorScheme: mode,
        nativeContainerStyle: tabContentStyle,
      }}
    >
      {!isTrainer && timer && timer.seconds > 0 && !isExpanded ? (
        <NativeTabs.BottomAccessory>
          <NativeTabRestTimerAccessory />
        </NativeTabs.BottomAccessory>
      ) : null}
      <NativeTabs.Trigger contentStyle={tabContentStyle} disableTransparentOnScrollEdge name="today">
        <NativeTabs.Trigger.Icon sf={todaySymbol} />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={tabContentStyle} disableTransparentOnScrollEdge name="plan">
        <NativeTabs.Trigger.Icon sf={{ default: 'text.page', selected: 'text.page.fill' }} />
        <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={tabContentStyle} disableTransparentOnScrollEdge name="progress">
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <NativeTabs.Trigger.Label>Progress</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={tabContentStyle} disableTransparentOnScrollEdge name="trainer">
        <NativeTabs.Trigger.Icon sf={{ default: 'message', selected: 'message.fill' }} />
        <NativeTabs.Trigger.Label>Trainer</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function AppTabsLayout() {
  return (
    <TrainerConversationProvider>
      <WorkoutDataProvider>
        <WidgetSnapshotSync />
        <NativeAppTabs />
      </WorkoutDataProvider>
    </TrainerConversationProvider>
  );
}
