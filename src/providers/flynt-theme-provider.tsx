import { createContext, type PropsWithChildren, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { type ColorMode, themeFor } from '@/constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';

type FlyntThemeContextValue = {
  mode: ColorMode;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  theme: ReturnType<typeof themeFor>;
};

const FlyntThemeContext = createContext<FlyntThemeContextValue | null>(null);

export function FlyntThemeProvider({ children }: PropsWithChildren) {
  const systemMode: ColorMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const previewPreference: ThemePreference = __DEV__ && process.env.EXPO_PUBLIC_FLYNT_PREVIEW === 'ready' ? 'dark' : 'system';
  const [preference, setPreference] = useState<ThemePreference>(previewPreference);
  const mode = preference === 'system' ? systemMode : preference;
  const value = useMemo(() => ({ mode, preference, setPreference, theme: themeFor(mode) }), [mode, preference]);

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
