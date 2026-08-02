import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { PlatformColor } from 'react-native';

import { NativeTabRestTimerAccessory } from '@/components/rest-timer-accessory';
import { useModalPresentation } from '@/providers/modal-presentation-provider';
import { useRestTimer } from '@/providers/rest-timer-provider';

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
          <NativeTabRestTimerAccessory />
        </NativeTabs.BottomAccessory>
      ) : null}
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="today">
        <NativeTabs.Trigger.Icon sf={{ default: 'dumbbell', selected: 'dumbbell.fill' }} />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="plan">
        <NativeTabs.Trigger.Icon sf={{ default: 'text.page', selected: 'text.page.fill' }} />
        <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="progress">
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <NativeTabs.Trigger.Label>Progress</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="trainer">
        <NativeTabs.Trigger.Icon sf={{ default: 'message', selected: 'message.fill' }} />
        <NativeTabs.Trigger.Label>Trainer</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
