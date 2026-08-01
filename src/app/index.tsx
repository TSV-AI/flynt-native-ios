import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FirstRunIntroduction } from '@/components/first-run-introduction';
import { radius, spacing, type } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { hasSeenFirstRunIntroduction, markFirstRunIntroductionSeen } from '@/lib/first-run';

export default function HomeScreen() {
  const { theme } = useFlyntTheme();
  const [showIntroduction, setShowIntroduction] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    void hasSeenFirstRunIntroduction()
      .then((seen) => {
        if (mounted) setShowIntroduction(!seen);
      })
      .catch(() => {
        if (mounted) setShowIntroduction(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function navigate(path: '/create-account' | '/sign-in') {
    router.push(path);
  }

  function finishIntroduction() {
    setShowIntroduction(false);
    void markFirstRunIntroductionSeen();
  }

  if (showIntroduction === null) {
    return <View style={[styles.container, { backgroundColor: theme.canvas }]} />;
  }

  if (showIntroduction) {
    return <FirstRunIntroduction onFinish={finishIntroduction} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.brandRow}>
          <Image
            accessibilityIgnoresInvertColors
            source={require('@/assets/images/splash-icon.png')}
            style={[styles.mark, { tintColor: theme.ink }]}
          />
          <Text style={[styles.wordmark, { color: theme.ink }]}>FLYNT</Text>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>TRAIN WITH INTENT</Text>
          <Text style={[styles.title, { color: theme.ink }]}>Training that learns you.</Text>
          <Text style={[styles.body, { color: theme.muted }]}>
            A thoughtful program, shaped around your life and refined as you train.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigate('/create-account')}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.primaryFill, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
              Create account
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigate('/sign-in')}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderColor: theme.line,
                backgroundColor: theme.raised,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.ink }]}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  mark: {
    width: 20,
    height: 30,
    resizeMode: 'contain',
  },
  wordmark: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 3.6,
    fontWeight: '700',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  eyebrow: {
    ...type.label,
  },
  title: {
    ...type.display,
    maxWidth: 340,
  },
  body: {
    ...type.body,
    maxWidth: 340,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    ...type.button,
  },
  secondaryButton: {
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    ...type.button,
  },
});
