import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { NativeMaterialSheet } from '@/components/native-material-sheet';
import { NativeSymbol } from '@/components/native-symbol';
import { flyntInvertedSheetPresentation } from '@/constants/sheet';
import { fonts, radius, spacing, themeFor, type } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useSmoothProgress } from '@/hooks/use-smooth-progress';

type RestTimerSheetProps = {
  isPresented: boolean;
  onAdjust: (delta: number) => void;
  onDismiss: () => void;
  onSkip: () => void;
  timer: {
    exercise: string;
    seconds: number;
    total: number;
  } | null;
};

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

const restTimerPresentation = flyntInvertedSheetPresentation({ fraction: 0.36 });

export function RestTimerSheet({ isPresented, onAdjust, onDismiss, onSkip, timer }: RestTimerSheetProps) {
  const { mode } = useFlyntTheme();
  const isDarkSheet = mode === 'light';
  const theme = themeFor(isDarkSheet ? 'dark' : 'light');
  const finished = timer?.seconds === 0;
  const progress = timer ? timer.seconds / Math.max(1, timer.total) : 0;
  const progressStyle = useSmoothProgress(progress);

  return (
    <NativeMaterialSheet
      colorScheme={isDarkSheet ? 'dark' : 'light'}
      isPresented={isPresented}
      onDismiss={onDismiss}
      presentationOverride={restTimerPresentation}
    >
      <View style={styles.screen}>
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.eyebrow, { color: theme.muted }]}>{finished ? 'REST COMPLETE' : 'REST TIMER'}</Text>
              <Text accessibilityRole="header" numberOfLines={1} style={[styles.title, { color: theme.ink }]}>
                {timer?.exercise ?? 'Recovery'}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Minimize rest timer"
              accessibilityRole="button"
              onPress={onDismiss}
              style={[styles.close, { backgroundColor: theme.card }]}
            >
              <NativeSymbol color={theme.ink} name="chevron.down" size={16} />
            </Pressable>
          </View>

          <View style={styles.timerContent}>
            <View style={styles.timerReadout}>
              <Text
                accessibilityLabel={finished ? 'Rest complete. Next set.' : `${timer?.seconds ?? 0} seconds remaining`}
                style={[styles.time, { color: theme.ink }]}
              >
                {finished ? 'NEXT SET' : formatTimer(timer?.seconds ?? 0)}
              </Text>
            </View>
            <View style={styles.timerFooter}>
              <View style={[styles.progressTrack, { backgroundColor: theme.line }]}>
                <Animated.View style={[styles.progressFill, { backgroundColor: theme.ink }, progressStyle]} />
              </View>
              {!finished ? (
                <View style={styles.controls}>
                  <Pressable accessibilityRole="button" onPress={() => onAdjust(-15)} style={styles.adjustButton}>
                    <Text style={[styles.adjustLabel, { color: theme.ink }]}>−15</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={onSkip}
                    style={({ pressed }) => [styles.skipButton, { backgroundColor: theme.ink, opacity: pressed ? 0.72 : 1 }]}
                  >
                    <Text style={[styles.skipLabel, { color: theme.primaryText }]}>Skip</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => onAdjust(15)} style={styles.adjustButton}>
                    <Text style={[styles.adjustLabel, { color: theme.ink }]}>+15</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </NativeMaterialSheet>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  headerCopy: { flex: 1, gap: 4 },
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.2 },
  title: { fontSize: 22, lineHeight: 27, fontWeight: '600', letterSpacing: -0.6 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  timerContent: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  timerReadout: { flex: 1, minHeight: 96, alignItems: 'center', justifyContent: 'center' },
  timerFooter: { paddingBottom: spacing.sm },
  time: { ...type.display, fontFamily: fonts.sans, fontSize: 64, lineHeight: 70, letterSpacing: -2.6, textAlign: 'center', fontVariant: ['tabular-nums'] },
  progressTrack: { height: 4, overflow: 'hidden', borderRadius: radius.pill },
  progressFill: { width: '100%', height: 4, borderRadius: radius.pill, transformOrigin: 'left center' },
  controls: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  adjustButton: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  adjustLabel: { fontSize: 17, lineHeight: 22, fontWeight: '500', fontVariant: ['tabular-nums'] },
  skipButton: { flex: 1, minHeight: 50, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  skipLabel: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
});
