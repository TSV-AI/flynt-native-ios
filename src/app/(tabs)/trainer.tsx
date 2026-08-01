import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen, appSurfaceStyles } from '@/components/app-surface';
import { radius, spacing } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { deliberateAction, selection } from '@/lib/haptics';

const prompts = ['Adjust today', 'Swap an exercise', 'Explain my plan'];

export default function TrainerScreen() {
  const { theme } = useFlyntTheme();
  const [message, setMessage] = useState('');
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  function choosePrompt(prompt: string) {
    void selection();
    setMessage(prompt);
  }

  function send() {
    const trimmed = message.trim();
    if (!trimmed) return;
    void deliberateAction();
    setSentMessage(trimmed);
    setMessage('');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex} keyboardVerticalOffset={24}>
      <AppScreen eyebrow="YOUR COACH" title="Trainer" intro="Ask about today, your plan, or an adjustment you need." testID="screen-trainer">
        <View style={appSurfaceStyles.section}>
          <View style={[styles.coachBubble, { backgroundColor: theme.raised, borderColor: theme.line }]}>
            <Text style={[appSurfaceStyles.cardTitle, { color: theme.ink }]}>Good morning. Lower Power is ready.</Text>
            <Text style={[appSurfaceStyles.body, styles.bubbleBody, { color: theme.muted }]}>Your top set moved well last week, so today keeps the load steady and adds one back-off rep.</Text>
          </View>
          {sentMessage ? (
            <View style={[styles.userBubble, { backgroundColor: theme.primaryFill }]}>
              <Text style={[appSurfaceStyles.body, { color: theme.primaryText }]}>{sentMessage}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.prompts}>
          {prompts.map((prompt) => (
            <Pressable
              accessibilityRole="button"
              key={prompt}
              onPress={() => choosePrompt(prompt)}
              style={({ pressed }) => [styles.prompt, { borderColor: theme.line, backgroundColor: theme.raised, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.promptText, { color: theme.ink }]}>{prompt}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.composer, { backgroundColor: theme.raised, borderColor: theme.line }]}>
          <TextInput
            accessibilityLabel="Message Trainer"
            multiline
            onChangeText={setMessage}
            placeholder="Message Trainer"
            placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.ink }]}
            value={message}
          />
          <Pressable
            accessibilityLabel="Send message"
            accessibilityRole="button"
            disabled={!message.trim()}
            onPress={send}
            style={[styles.send, { backgroundColor: theme.primaryFill, opacity: message.trim() ? 1 : 0.32 }]}
          >
            <Text style={[styles.sendText, { color: theme.primaryText }]}>↑</Text>
          </Pressable>
        </View>
        <Text style={[styles.previewNote, { color: theme.muted }]}>Preview messages stay on this device and are not sent.</Text>
      </AppScreen>
    </KeyboardAvoidingView>
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
  composer: { minHeight: 58, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, marginTop: spacing.xl, padding: spacing.xs, paddingLeft: spacing.md },
  input: { flex: 1, minHeight: 44, maxHeight: 110, fontSize: 17, lineHeight: 22, paddingVertical: 11 },
  send: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 25, lineHeight: 28, fontWeight: '600' },
  previewNote: { marginTop: spacing.xs, paddingHorizontal: spacing.sm, fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
