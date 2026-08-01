import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NativeMaterialSheet } from '@/components/native-material-sheet';
import { NativeSymbol } from '@/components/native-symbol';
import { radius, spacing, themeFor } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';

type ExerciseDetailSheetProps = {
  isPresented: boolean;
  mode: 'stats' | 'guide';
  name: string;
  onDismiss: () => void;
};

export function ExerciseDetailSheet({ isPresented, mode, name, onDismiss }: ExerciseDetailSheetProps) {
  const { mode: appearanceMode } = useFlyntTheme();
  const isDarkSheet = appearanceMode === 'light';
  const sheetTheme = themeFor(isDarkSheet ? 'dark' : 'light');

  function close() {
    onDismiss();
  }

  return (
    <NativeMaterialSheet
      colorScheme={isDarkSheet ? 'dark' : 'light'}
      detents={[{ fraction: 0.92 }]}
      isPresented={isPresented}
      onDismiss={onDismiss}
    >
      <View style={styles.screen}>
              <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: sheetTheme.muted }]}>{mode === 'stats' ? 'EXERCISE STATS' : 'FLYNT GUIDE'}</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: sheetTheme.ink }]}>{name}</Text>
          </View>
          <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={close} style={[styles.close, { backgroundColor: sheetTheme.card }]}><NativeSymbol color={sheetTheme.ink} name="xmark" size={16} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {mode === 'stats' ? <StatsContent /> : <GuideContent name={name} />}
        </ScrollView>
              </SafeAreaView>
      </View>
    </NativeMaterialSheet>
  );
}

function StatsContent() {
  const { mode } = useFlyntTheme();
  const theme = themeFor(mode === 'light' ? 'dark' : 'light');
  const sessions = [
    { date: 'JUL 03', load: '205', reps: '5', effort: 'RPE 8' },
    { date: 'JUL 10', load: '210', reps: '5', effort: 'RPE 8' },
    { date: 'JUL 17', load: '215', reps: '5', effort: 'RPE 8' },
    { date: 'TODAY', load: '225', reps: '5', effort: 'RPE 8' },
  ];

  return (
    <>
      <View style={styles.signalHeader}>
        <View style={styles.signalCopy}>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>TRAINING SIGNAL</Text>
          <Text style={[styles.signalTitle, { color: theme.ink }]}>Load is rising. Effort is holding.</Text>
          <Text style={[styles.signalDetail, { color: theme.muted }]}>Four clean exposures at RPE 8 with no reported pain.</Text>
        </View>
        <View style={[styles.deltaBadge, { backgroundColor: theme.ink }]}>
          <Text style={[styles.deltaValue, { color: theme.primaryText }]}>+20</Text>
          <Text style={[styles.deltaUnit, { color: theme.primaryText }]}>LB</Text>
        </View>
      </View>

      <View accessibilityLabel="Recent top sets increased from 205 to 225 pounds across four workouts" style={styles.history}>
        <View style={styles.historyHeading}>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>RECENT TOP SETS</Text>
          <Text style={[styles.historyCaption, { color: theme.muted }]}>Completed work only</Text>
        </View>
        {sessions.map((session, index) => (
          <View key={session.date} style={[styles.historyRow, { borderTopColor: theme.line }]}>
            <View style={styles.historyRail}>
              <View style={[styles.historyDot, { backgroundColor: index === sessions.length - 1 ? theme.ink : theme.canvas, borderColor: theme.ink }]} />
              {index < sessions.length - 1 ? <View style={[styles.historyLine, { backgroundColor: theme.line }]} /> : null}
            </View>
            <Text style={[styles.historyDate, { color: theme.muted }]}>{session.date}</Text>
            <Text style={[styles.historyLoad, { color: theme.ink }]}>{session.load}<Text style={styles.historyUnit}> LB</Text></Text>
            <Text style={[styles.historyMeta, { color: theme.muted }]}>{session.reps} reps · {session.effort}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.nextTarget, { borderTopColor: theme.line }]}>
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>NEXT WORKOUT</Text>
        <View style={styles.targetHeading}>
          <Text style={[styles.targetLoad, { color: theme.ink }]}>230 <Text style={styles.targetUnit}>LB × 5</Text></Text>
          <View style={[styles.recommendationBadge, { borderColor: theme.line }]}><Text style={[styles.recommendationText, { color: theme.ink }]}>+5 LB</Text></View>
        </View>
        <Text style={[styles.guidanceCopy, { color: theme.muted }]}>FLYNT recommends a small increase because load improved while RPE and pain stayed stable. Hold at 225 if warm-ups feel slow or discomfort rises.</Text>
      </View>
    </>
  );
}

function GuideContent({ name }: { name: string }) {
  const { mode } = useFlyntTheme();
  const theme = themeFor(mode === 'light' ? 'dark' : 'light');
  const steps = ['Set your position with a stable brace and full-foot pressure.', 'Move through the programmed range without rushing the transition.', 'Finish each rep under control and reset before the next one.'];
  return (
    <>
      <View style={styles.visual}><Text style={[styles.visualLabel, { color: theme.muted }]}>FLYNT VISUAL</Text><Text style={[styles.visualTitle, { color: theme.ink }]}>{name}</Text><Text style={[styles.supporting, { color: theme.muted }]}>The written guide is ready. The movement visual will appear here when published.</Text></View>
      <Text style={[styles.sectionLabel, styles.executionLabel, { color: theme.muted }]}>EXECUTION</Text>
      {steps.map((step, index) => <View key={step} style={[styles.step, { borderTopColor: theme.line }]}><Text style={[styles.stepNumber, { color: theme.muted }]}>{String(index + 1).padStart(2, '0')}</Text><Text style={[styles.stepCopy, { color: theme.ink }]}>{step}</Text></View>)}
      <Text style={[styles.sectionLabel, styles.executionLabel, { color: theme.muted }]}>TARGETS</Text>
      <View style={styles.targets}>{['Strength', 'Control', 'Posterior chain'].map((target) => <View key={target} style={[styles.target, { borderColor: theme.line }]}><Text style={[styles.targetText, { color: theme.ink }]}>{target}</Text></View>)}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safeArea: { flex: 1 },
  header: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  headerCopy: { flex: 1, gap: 4 }, eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.2 }, title: { fontSize: 22, lineHeight: 27, fontWeight: '600', letterSpacing: -0.6 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  sectionLabel: { fontSize: 11, lineHeight: 15, fontWeight: '700', letterSpacing: 1.1 }, supporting: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  signalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }, signalCopy: { flex: 1 }, signalTitle: { marginTop: spacing.xs, fontSize: 24, lineHeight: 28, fontWeight: '600', letterSpacing: -0.7 }, signalDetail: { marginTop: spacing.xs, fontSize: 13, lineHeight: 19 },
  deltaBadge: { minWidth: 62, minHeight: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' }, deltaValue: { fontSize: 20, lineHeight: 22, fontWeight: '700' }, deltaUnit: { fontSize: 11, lineHeight: 13, fontWeight: '700', letterSpacing: 1 },
  history: { marginTop: spacing.xs }, historyHeading: { minHeight: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, historyCaption: { fontSize: 11, lineHeight: 14 },
  historyRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth }, historyRail: { width: 20, height: 58, alignItems: 'center' }, historyDot: { position: 'absolute', top: 24, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, zIndex: 1 }, historyLine: { position: 'absolute', top: 29, bottom: -30, width: 1 }, historyDate: { width: 56, fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.7 }, historyLoad: { width: 78, fontSize: 20, lineHeight: 24, fontWeight: '600', letterSpacing: -0.4 }, historyUnit: { fontSize: 11, fontWeight: '700' }, historyMeta: { flex: 1, fontSize: 11, lineHeight: 15, textAlign: 'right' },
  nextTarget: { paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth }, targetHeading: { marginTop: spacing.xs, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }, targetLoad: { fontSize: 34, lineHeight: 39, fontWeight: '600', letterSpacing: -1.1 }, targetUnit: { fontSize: 15, fontWeight: '600' }, recommendationBadge: { minHeight: 34, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.pill, paddingHorizontal: spacing.sm }, recommendationText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }, guidanceCopy: { marginTop: spacing.xs, fontSize: 14, lineHeight: 21 },
  visual: { minHeight: 150, justifyContent: 'flex-end', paddingVertical: spacing.sm }, visualLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 }, visualTitle: { marginTop: spacing.xs, fontSize: 24, lineHeight: 29, fontWeight: '600' },
  executionLabel: { marginTop: spacing.sm }, step: { minHeight: 68, flexDirection: 'row', gap: spacing.md, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth }, stepNumber: { width: 28, fontSize: 11 }, stepCopy: { flex: 1, fontSize: 14, lineHeight: 21 },
  targets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, target: { minHeight: 38, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: spacing.md }, targetText: { fontSize: 12, fontWeight: '600' },
});
