import 'react-native-url-polyfill/auto';
import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useFlyntTheme } from '@/hooks/use-flynt-theme';

export default function RootLayout() {
  const { mode, theme } = useFlyntTheme();

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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="create-account" />
        <Stack.Screen name="sign-in" />
      </Stack>
    </ThemeProvider>
  );
}
