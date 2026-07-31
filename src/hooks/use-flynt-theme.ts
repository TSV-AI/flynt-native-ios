import { useColorScheme } from 'react-native';

import { themeFor } from '@/constants/theme';

export function useFlyntTheme() {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { mode, theme: themeFor(mode) };
}
