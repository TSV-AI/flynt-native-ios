import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, type } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';

export default function SignInScreen() {
  const { theme } = useFlyntTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.content} edges={['bottom']}>
        <Text style={[styles.eyebrow, { color: theme.muted }]}>WELCOME BACK</Text>
        <Text style={[styles.title, { color: theme.ink }]}>Pick up where you left off.</Text>
        <Text style={[styles.body, { color: theme.muted }]}>
          Secure native sign-in arrives with the identity milestone.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  eyebrow: { ...type.label },
  title: { ...type.title },
  body: { ...type.body, maxWidth: 340 },
});
