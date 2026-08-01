import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, type } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { selection } from '@/lib/haptics';
import { clearSecureSession } from '@/lib/secure-session';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

type LifecyclePlaceholderProps = {
  eyebrow: string;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function LifecyclePlaceholder({
  eyebrow,
  title,
  body,
  actionLabel,
  onAction,
}: LifecyclePlaceholderProps) {
  const { theme } = useFlyntTheme();
  const { signOut: leaveAuthenticatedFlow } = useLifecycleNavigation();

  async function openSettings() {
    await selection();
    router.push('/lifecycle-settings' as Href);
  }

  async function signOut() {
    await clearSecureSession();
    leaveAuthenticatedFlow();
    router.replace('/');
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>{eyebrow}</Text>
          <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
          <Text style={[styles.body, { color: theme.muted }]}>{body}</Text>
        </View>

        <View style={styles.actions}>
          {actionLabel && onAction ? (
            <Pressable
              accessibilityRole="button"
              onPress={onAction}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.primaryFill, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" onPress={openSettings} style={styles.textButton}>
            <Text style={[styles.textButtonCopy, { color: theme.ink }]}>Settings</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={signOut} style={styles.textButton}>
            <Text style={[styles.textButtonCopy, { color: theme.danger }]}>Sign out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  copy: { flex: 1, justifyContent: 'center', gap: spacing.md },
  eyebrow: { ...type.label },
  title: { ...type.title, maxWidth: 350 },
  body: { ...type.body, maxWidth: 360 },
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
