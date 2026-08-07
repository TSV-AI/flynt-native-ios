import { Stack } from 'expo-router';

import { appSurfaces } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';

export default function TodayLayout() {
  const { mode } = useFlyntTheme();

  return (
    <Stack
      screenOptions={{
        animation: 'default',
        contentStyle: { backgroundColor: appSurfaces[mode].todayBackground },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="exercise" />
    </Stack>
  );
}
