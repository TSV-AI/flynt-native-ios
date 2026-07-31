import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, type } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';

export default function CreateAccountScreen() {
  const { theme } = useFlyntTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.content} edges={['bottom']}>
        <Text style={[styles.eyebrow, { color: theme.muted }]}>CREATE ACCOUNT</Text>
        <Text style={[styles.title, { color: theme.ink }]}>Let&apos;s start with you.</Text>
        <Text style={[styles.body, { color: theme.muted }]}>
          Account creation and the native basics flow land in the next identity milestone.
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
