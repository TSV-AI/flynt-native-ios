import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appSurfaces, radius, spacing, type } from '@/constants/theme';
import type { AuthoritativeBootFailure } from '@/lib/authoritative-boot';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

const failureCopy: Record<AuthoritativeBootFailure, string> = {
  offline: 'Check your connection, then try loading your training again.',
  forbidden: 'Your account cannot load this training state. You can retry or sign out safely.',
  conflict: 'Your account changed while FLYNT was opening. Reload the latest state to continue.',
  'rate-limited': 'FLYNT needs a moment before trying again.',
  server: 'FLYNT could not load your training right now. Your account data has not been replaced.',
  'malformed-response': 'FLYNT received an app state it could not safely display.',
  unknown: 'FLYNT could not open your training. Try again or sign out safely.',
};

export default function BootScreen() {
  const { theme } = useFlyntTheme();
  const { bootError, phase, retry, signOut } = useLifecycleNavigation();
  const isLoading = phase === 'loading';

  async function openSettings() {
    router.push('/lifecycle-settings');
  }

  async function leaveAccount() {
    await signOut();
    router.replace('/');
  }

  return (
    <View style={[styles.screen, { backgroundColor: appSurfaces.dark.primaryBackground }]} testID="screen-authoritative-boot">
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>FLYNT</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>
            {isLoading ? 'Loading your training.' : 'Your training did not load.'}
          </Text>
          <Text style={[styles.body, { color: theme.muted }]}>
            {isLoading
              ? 'Checking your account and latest program state.'
              : failureCopy[bootError?.kind ?? 'unknown']}
          </Text>
          {isLoading ? <ActivityIndicator color={theme.ink} size="small" style={styles.spinner} /> : null}
        </View>

        {!isLoading ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                retry();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.primaryFill, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>Try again</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={openSettings} style={styles.textButton}>
              <Text style={[styles.textButtonCopy, { color: theme.ink }]}>Settings</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={leaveAccount} style={styles.textButton}>
              <Text style={[styles.textButtonCopy, { color: theme.danger }]}>Sign out</Text>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'space-between', padding: spacing.lg },
  copy: { flex: 1, justifyContent: 'center', gap: spacing.md },
  eyebrow: { ...type.label },
  title: { ...type.title, maxWidth: 350 },
  body: { ...type.body, maxWidth: 360 },
  spinner: { alignSelf: 'flex-start', marginTop: spacing.xs },
  actions: { gap: spacing.xs },
  primaryButton: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: { ...type.button },
  textButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  textButtonCopy: { ...type.button },
});
