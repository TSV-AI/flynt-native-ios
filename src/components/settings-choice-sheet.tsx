import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NativeMaterialSheet } from '@/components/native-material-sheet';
import { NativeSymbol } from '@/components/native-symbol';
import { spacing, themeFor } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { selection } from '@/lib/haptics';
import { useSettingsPreferences } from '@/providers/settings-preferences-provider';

export type ChoiceKind = 'spotify' | 'reminder' | 'progression' | 'rest';

const CHOICES: Record<ChoiceKind, { eyebrow: string; title: string; options: { label: string; detail: string }[] }> = {
  spotify: {
    eyebrow: 'SPOTIFY PLAYER',
    title: 'Choose its workout position.',
    options: [
      { label: 'Bar', detail: 'Full controls above the tab bar' },
      { label: 'Pill', detail: 'A compact floating control' },
      { label: 'Hidden', detail: 'Open music from the workout menu' },
    ],
  },
  reminder: {
    eyebrow: 'REMINDER TIME',
    title: 'When should FLYNT check in?',
    options: [
      { label: '6:30 AM', detail: 'Before the day gets moving' },
      { label: '7:00 AM', detail: 'Early morning' },
      { label: '8:00 AM', detail: 'Morning' },
      { label: '12:00 PM', detail: 'Midday' },
      { label: '5:30 PM', detail: 'After work' },
    ],
  },
  progression: {
    eyebrow: 'PROGRESSION STYLE',
    title: 'Choose how quickly loads move.',
    options: [
      { label: 'Conservative', detail: 'Smaller changes with more confirmation' },
      { label: 'Balanced', detail: 'Steady changes when sessions support them' },
      { label: 'Assertive', detail: 'Faster changes when performance is clear' },
      { label: 'Custom', detail: 'Set your own progression preferences' },
    ],
  },
  rest: {
    eyebrow: 'REST DURATION',
    title: 'Choose the default recovery feel.',
    options: [
      { label: 'Quick', detail: 'Shorter rests and a faster session' },
      { label: 'Adaptive', detail: 'FLYNT follows the exercise and effort' },
      { label: 'Full recovery', detail: 'More time before demanding sets' },
    ],
  },
};

export function SettingsChoiceSheet({ isPresented, kind, onDismiss }: { isPresented: boolean; kind: ChoiceKind; onDismiss: () => void }) {
  const { mode } = useFlyntTheme();
  const isDarkSheet = mode === 'light';
  const theme = themeFor(isDarkSheet ? 'dark' : 'light');
  const preferences = useSettingsPreferences();
  const configuration = CHOICES[kind];
  const selected = kind === 'spotify'
    ? preferences.spotifyDisplay
    : kind === 'reminder'
      ? preferences.reminderTime
      : kind === 'progression'
        ? preferences.progressionStyle
        : preferences.restLength;

  function choose(value: string) {
    void selection();
    if (kind === 'spotify') preferences.setSpotifyDisplay(value);
    if (kind === 'reminder') preferences.setReminderTime(value);
    if (kind === 'progression') preferences.setProgressionStyle(value);
    if (kind === 'rest') preferences.setRestLength(value);
    onDismiss();
  }

  return (
    <NativeMaterialSheet
      colorScheme={isDarkSheet ? 'dark' : 'light'}
      detents={[{ fraction: kind === 'reminder' ? 0.72 : 0.6 }]}
      isPresented={isPresented}
      onDismiss={onDismiss}
    >
      <View style={styles.screen}>
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.muted }]}>{configuration.eyebrow}</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{configuration.title}</Text>
          </View>
          <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={onDismiss} style={[styles.close, { backgroundColor: theme.card }]}>
            <NativeSymbol color={theme.ink} name="xmark" size={16} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
          {configuration.options.map((option, index) => {
            const isSelected = option.label === selected;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                key={option.label}
                onPress={() => choose(option.label)}
                style={({ pressed }) => [
                  styles.option,
                  index > 0 && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth },
                  { opacity: pressed ? 0.55 : 1 },
                ]}
              >
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionLabel, { color: theme.ink }]}>{option.label}</Text>
                  <Text style={[styles.optionDetail, { color: theme.muted }]}>{option.detail}</Text>
                </View>
                <View style={[styles.radio, { borderColor: isSelected ? theme.ink : theme.line }]}>
                  {isSelected ? <View style={[styles.radioFill, { backgroundColor: theme.ink }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        </SafeAreaView>
      </View>
    </NativeMaterialSheet>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 10, lineHeight: 13, fontWeight: '700', letterSpacing: 1.2 },
  title: { maxWidth: 270, marginTop: 6, fontSize: 24, lineHeight: 28, fontWeight: '600', letterSpacing: -0.7 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  options: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  option: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionCopy: { flex: 1 },
  optionLabel: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  optionDetail: { marginTop: 3, fontSize: 12, lineHeight: 17 },
  radio: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 11 },
  radioFill: { width: 10, height: 10, borderRadius: 5 },
});
