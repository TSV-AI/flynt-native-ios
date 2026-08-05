import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appSurfaces, radius, signedOutColorMode, spacing, themeFor, type } from '@/constants/theme';
import { finishAuthUrl } from '@/lib/auth';
import { failed, saved } from '@/lib/haptics';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

export default function AuthCallbackScreen() {
  const url = Linking.useLinkingURL();
  const theme = themeFor(signedOutColorMode);
  const { retry } = useLifecycleNavigation();
  const handledUrl = useRef<string | null>(null);
  const [failure, setFailure] = useState(false);

  useEffect(() => {
    if (!url || handledUrl.current === url) return;
    handledUrl.current = url;
    void finishAuthUrl(url).then(async () => {
      await saved();
      retry();
      router.replace('/boot');
    }).catch(async () => {
      setFailure(true);
      await failed();
    });
  }, [retry, url]);

  return (
    <View style={[styles.screen, { backgroundColor: appSurfaces[signedOutColorMode].primaryBackground }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.content}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>FLYNT</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>
            {failure ? 'That link did not work.' : 'Signing you in.'}
          </Text>
          <Text style={[styles.body, { color: theme.muted }]}>
            {failure
              ? 'The link may have expired or already been used. Request a new secure link to continue.'
              : 'Securing your session and loading your latest account state.'}
          </Text>
          {!failure ? <ActivityIndicator color={theme.ink} style={styles.spinner} /> : null}
        </View>
        {failure ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/sign-in')}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.primaryFill, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <Text style={[styles.buttonCopy, { color: theme.primaryText }]}>Request a new link</Text>
          </Pressable>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, justifyContent: 'space-between', padding: spacing.lg },
  copy: { flex: 1, justifyContent: 'center', gap: spacing.md },
  eyebrow: { ...type.label },
  title: { ...type.title },
  body: { ...type.body, maxWidth: 360 },
  spinner: { alignSelf: 'flex-start' },
  button: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonCopy: { ...type.button },
});
