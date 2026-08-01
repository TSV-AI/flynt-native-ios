import 'react-native-url-polyfill/auto';
import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { FlyntThemeProvider } from '@/providers/flynt-theme-provider';
import { LifecycleNavigationProvider, useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';
import { SettingsPreferencesProvider } from '@/providers/settings-preferences-provider';

function RootNavigator() {
  const { mode, theme } = useFlyntTheme();
  const { destination } = useLifecycleNavigation();

  const navigationTheme = mode === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: theme.canvas, card: theme.canvas } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.canvas, card: theme.canvas } };

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
        <Stack.Protected guard={destination === 'signed-out'}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="create-account" />
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={destination === 'consultation'}>
          <Stack.Screen name="consultation" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={destination === 'building'}>
          <Stack.Screen name="program-building" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={destination === 'ready'}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={destination === 'attention'}>
          <Stack.Screen name="build-attention" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={destination !== 'signed-out'}>
          <Stack.Screen name="lifecycle-settings" />
          <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <FlyntThemeProvider>
      <SettingsPreferencesProvider>
        <LifecycleNavigationProvider>
          <RootNavigator />
        </LifecycleNavigationProvider>
      </SettingsPreferencesProvider>
    </FlyntThemeProvider>
  );
}
