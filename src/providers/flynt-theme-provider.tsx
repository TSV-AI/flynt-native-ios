import { createContext, type PropsWithChildren, useContext, useLayoutEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { signedOutColorMode, type ColorMode, themeFor } from '@/constants/theme';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

export type ThemePreference = 'system' | 'light' | 'dark';

type FlyntThemeContextValue = {
  mode: ColorMode;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  theme: ReturnType<typeof themeFor>;
};

const FlyntThemeContext = createContext<FlyntThemeContextValue | null>(null);

export function FlyntThemeProvider({ children }: PropsWithChildren) {
  const { appState, hasSession, phase } = useLifecycleNavigation();
  const systemMode: ColorMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const voiceDemoPreview = __DEV__ && process.env.EXPO_PUBLIC_VOICE_DEMO_AUTO_OPEN === '1';
  const defaultPreference: ThemePreference = 'dark';
  const accountKey = appState?.profile.email ?? 'signed-out';
  const [localPreference, setLocalPreference] = useState<{ accountKey: string; value: ThemePreference } | null>(null);
  const usesOnboardingAppearance = phase !== 'ready'
    || (!hasSession && !voiceDemoPreview);
  const preference = usesOnboardingAppearance
    ? signedOutColorMode
    : localPreference?.accountKey === accountKey
      ? localPreference.value
      : appState?.preferences.appearance ?? defaultPreference;
  const setPreference = (value: ThemePreference) => setLocalPreference({ accountKey, value });
  const mode = preference === 'system' ? systemMode : preference;
  const value = { mode, preference, setPreference, theme: themeFor(mode) };

  useLayoutEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  return <FlyntThemeContext.Provider value={value}>{children}</FlyntThemeContext.Provider>;
}

export function useFlyntThemeContext() {
  const context = useContext(FlyntThemeContext);
  if (!context) throw new Error('useFlyntTheme must be used within FlyntThemeProvider');
  return context;
}
