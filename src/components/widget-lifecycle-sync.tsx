import { useEffect } from 'react';

import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';
import { FlyntTodayWidget } from '@/widgets/today-widget';
import { signedOutWidgetSnapshot, type FlyntWidgetSnapshot } from '@/widgets/widget-model';

function publishSnapshot(snapshot: FlyntWidgetSnapshot) {
  FlyntTodayWidget.updateSnapshot(snapshot);
}

export function WidgetLifecycleSync() {
  const { destination, phase } = useLifecycleNavigation();

  useEffect(() => {
    if (phase !== 'ready' || destination === 'ready') return;

    const updatedAt = Date.now();
    if (destination === 'building') {
      publishSnapshot({
        ...signedOutWidgetSnapshot,
        focus: 'Today’s training will appear when the program is ready.',
        lifecycle: 'building',
        title: 'Building your week',
        updatedAt,
      });
      return;
    }

    if (destination === 'attention') {
      publishSnapshot({
        ...signedOutWidgetSnapshot,
        focus: 'Open FLYNT to review the next step.',
        lifecycle: 'unavailable',
        title: 'Your program needs attention',
        updatedAt,
      });
      return;
    }

    if (destination === 'consultation') {
      publishSnapshot({
        ...signedOutWidgetSnapshot,
        focus: 'Open FLYNT to continue setup.',
        lifecycle: 'noPlan',
        title: 'Finish setting up your training',
        updatedAt,
      });
      return;
    }

    publishSnapshot({ ...signedOutWidgetSnapshot, updatedAt });
  }, [destination, phase]);

  return null;
}
