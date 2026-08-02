import 'react-native-url-polyfill/auto';
import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { RestTimerSheet } from '@/components/rest-timer-sheet';
import { FlyntThemeProvider } from '@/providers/flynt-theme-provider';
import { LifecycleNavigationProvider, useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';
import { ModalPresentationProvider } from '@/providers/modal-presentation-provider';
import { RestTimerProvider, useRestTimer } from '@/providers/rest-timer-provider';
import { SettingsPreferencesProvider } from '@/providers/settings-preferences-provider';
import { SpotifyProvider } from '@/providers/spotify-provider';

function RootNavigator() {
  const { mode, theme } = useFlyntTheme();
  const { destination, hasSession, phase } = useLifecycleNavigation();
  const restTimer = useRestTimer();
  const bootReady = phase === 'ready';

  const navigationTheme = mode === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: theme.canvas, card: theme.canvas } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.canvas, card: theme.canvas } };

  useEffect(() => {
    if (!hasSession) restTimer.stop();
  }, [hasSession, restTimer]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.canvas },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.canvas },
          headerTintColor: theme.ink,
          headerTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Protected guard={!bootReady}>
          <Stack.Screen name="boot" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={bootReady && destination === 'signed-out'}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="create-account" />
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={bootReady && destination === 'consultation'}>
          <Stack.Screen name="consultation" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={bootReady && destination === 'building'}>
          <Stack.Screen name="program-building" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={bootReady && destination === 'ready'}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={bootReady && destination === 'attention'}>
          <Stack.Screen name="build-attention" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={hasSession}>
          <Stack.Screen name="lifecycle-settings" />
          <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card' }} />
        </Stack.Protected>
        <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
      </Stack>
      <RestTimerSheet
        isPresented={restTimer.isExpanded && restTimer.timer !== null}
        onAdjust={restTimer.adjust}
        onDismiss={restTimer.minimize}
        onSkip={restTimer.stop}
        timer={restTimer.timer}
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <FlyntThemeProvider>
      <SettingsPreferencesProvider>
        <SpotifyProvider>
          <ModalPresentationProvider>
            <RestTimerProvider>
              <LifecycleNavigationProvider>
                <RootNavigator />
              </LifecycleNavigationProvider>
            </RestTimerProvider>
          </ModalPresentationProvider>
        </SpotifyProvider>
      </SettingsPreferencesProvider>
    </FlyntThemeProvider>
  );
}
