import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen, appSurfaceStyles } from '@/components/app-surface';
import { TrainerComposerFooter } from '@/components/trainer-composer-accessory';
import { appSurfaces, radius, spacing } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useTrainerConversation } from '@/providers/trainer-conversation-provider';

const prompts = ['Adjust today', 'Swap an exercise', 'Explain my plan'];

export default function TrainerScreen() {
  const { mode, theme } = useFlyntTheme();
  const { choosePrompt, sentMessages } = useTrainerConversation();
  const itemBackground = appSurfaces[mode].itemBackground;

  return (
    <View style={styles.flex}>
      <AppScreen eyebrow="YOUR COACH" footer={<TrainerComposerFooter />} title="Trainer" intro="Ask about today, your plan, or an adjustment you need." testID="screen-trainer">
        <View style={appSurfaceStyles.section}>
          <View style={[styles.coachBubble, { backgroundColor: itemBackground, borderColor: theme.line }]}>
            <Text style={[appSurfaceStyles.cardTitle, { color: theme.ink }]}>Good morning. Lower Power is ready.</Text>
            <Text style={[appSurfaceStyles.body, styles.bubbleBody, { color: theme.muted }]}>Your top set moved well last week, so today keeps the load steady and adds one back-off rep.</Text>
          </View>
          {sentMessages.map((sentMessage, index) => (
            <View key={`${sentMessage}-${index}`} style={[styles.userBubble, { backgroundColor: theme.primaryFill }]}>
              <Text style={[appSurfaceStyles.body, { color: theme.primaryText }]}>{sentMessage}</Text>
            </View>
          ))}
        </View>

        <View style={styles.prompts}>
          {prompts.map((prompt) => (
            <Pressable
              accessibilityRole="button"
              key={prompt}
              onPress={() => choosePrompt(prompt)}
              style={({ pressed }) => [styles.prompt, { borderColor: theme.line, backgroundColor: itemBackground, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.promptText, { color: theme.ink }]}>{prompt}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.previewNote, { color: theme.muted }]}>Preview only. Messages are not sent.</Text>

      </AppScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  coachBubble: { maxWidth: '92%', alignSelf: 'flex-start', borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, borderBottomLeftRadius: radius.sm, padding: spacing.md },
  userBubble: { maxWidth: '88%', alignSelf: 'flex-end', borderRadius: radius.lg, borderBottomRightRadius: radius.sm, padding: spacing.md },
  bubbleBody: { marginTop: spacing.xs },
  prompts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.lg },
  prompt: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: spacing.md },
  promptText: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  previewNote: { marginTop: spacing.lg, paddingHorizontal: spacing.sm, fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
