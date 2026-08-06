import 'react-native-url-polyfill/auto';
import '@/global.css';

import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { appSurfaces, signedOutColorMode } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { RestTimerSheet } from '@/components/rest-timer-sheet';
import { WidgetLifecycleSync } from '@/components/widget-lifecycle-sync';
import { FlyntThemeProvider } from '@/providers/flynt-theme-provider';
import { LifecycleNavigationProvider, useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';
import { ModalPresentationProvider } from '@/providers/modal-presentation-provider';
import { RestTimerProvider, useRestTimer } from '@/providers/rest-timer-provider';
import { SettingsPreferencesProvider } from '@/providers/settings-preferences-provider';
import { SpotifyProvider } from '@/providers/spotify-provider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { mode, theme } = useFlyntTheme();
  const { destination, hasSession, phase } = useLifecycleNavigation();
  const restTimer = useRestTimer();
  const router = useRouter();
  const linkingUrl = Linking.useLinkingURL();
  const bootReady = phase === 'ready';

  const navigationTheme = mode === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: theme.canvas, card: theme.canvas } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.canvas, card: theme.canvas } };

  useEffect(() => {
    if (!hasSession) restTimer.stop();
  }, [hasSession, restTimer]);

  useEffect(() => {
    if (phase !== 'loading') void SplashScreen.hideAsync();
  }, [phase]);

  useEffect(() => {
    if (!bootReady || destination !== 'ready' || !linkingUrl) return;
    const parsed = Linking.parse(linkingUrl);
    const route = [parsed.hostname, parsed.path]
      .filter(Boolean)
      .join('/')
      .replace(/^\/+|\/+$/g, '');

    if (route.endsWith('plan')) router.replace('/(tabs)/plan');
    if (route.endsWith('today')) router.replace('/(tabs)/today');
  }, [bootReady, destination, linkingUrl, router]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
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
          <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: appSurfaces[signedOutColorMode].primaryBackground }, headerShown: false }} />
          <Stack.Screen name="create-account" options={{ contentStyle: { backgroundColor: appSurfaces[signedOutColorMode].primaryBackground }, headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ contentStyle: { backgroundColor: appSurfaces[signedOutColorMode].primaryBackground }, headerShown: false }} />
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
          <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card' }} />
        </Stack.Protected>
        <Stack.Screen name="auth-callback" options={{ contentStyle: { backgroundColor: appSurfaces[signedOutColorMode].primaryBackground }, headerShown: false }} />
      </Stack>
      <RestTimerSheet
        isPresented={restTimer.isExpanded && restTimer.timer !== null}
        onAdjust={restTimer.adjust}
        onDismiss={restTimer.minimize}
        onSkip={restTimer.stop}
        timer={restTimer.timer}
      />
      <WidgetLifecycleSync />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LifecycleNavigationProvider>
      <FlyntThemeProvider>
        <SettingsPreferencesProvider>
          <SpotifyProvider>
            <ModalPresentationProvider>
              <RestTimerProvider>
                <RootNavigator />
              </RestTimerProvider>
            </ModalPresentationProvider>
          </SpotifyProvider>
        </SettingsPreferencesProvider>
      </FlyntThemeProvider>
    </LifecycleNavigationProvider>
  );
}
