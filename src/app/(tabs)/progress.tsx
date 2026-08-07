import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-surface';
import { FlyntSheet, FlyntSheetCard } from '@/components/flynt-sheet';
import { NativeSymbol } from '@/components/native-symbol';
import { appSurfaces, spacing } from '@/constants/theme';
import type { PreviewWorkoutHistory } from '@/features/app-preview-data';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useWorkoutData } from '@/providers/workout-data-provider';

export default function ProgressScreen() {
  const { mode, theme } = useFlyntTheme();
  const itemBackground = appSurfaces[mode].itemBackground;
  const { history, historyError, historyPhase, retryHistory, sessionCount, trackedLiftCount } = useWorkoutData();
  const [selectedWorkout, setSelectedWorkout] = useState<PreviewWorkoutHistory | null>(null);
  return (
    <>
      <AppScreen modalActive={selectedWorkout !== null} testID="screen-progress" title="Progress">
        <View style={styles.metrics}>
          <View style={[styles.metric, { backgroundColor: itemBackground }]}>
            <Text style={[styles.metricValue, { color: theme.ink }]}>{sessionCount}</Text>
            <Text style={[styles.metricLabel, { color: theme.muted }]}>Sessions</Text>
          </View>
          <View style={[styles.metric, { backgroundColor: itemBackground }]}>
            <Text style={[styles.metricValue, { color: theme.ink }]}>{trackedLiftCount}</Text>
            <Text style={[styles.metricLabel, { color: theme.muted }]}>Tracked lifts</Text>
          </View>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Recent workouts</Text>
        <View style={[styles.history, { backgroundColor: itemBackground }]}>
          {history.map((item, index) => (
            <Pressable
              accessibilityHint="Opens completed workout details"
              accessibilityLabel={`${item.title}, ${item.fullDate}, ${item.completedSets} of ${item.plannedSets} sets completed`}
              accessibilityRole="button"
              key={item.id}
              onPress={() => setSelectedWorkout(item)}
              style={({ pressed }) => [styles.historyRow, index < history.length - 1 && { borderBottomColor: theme.line, borderBottomWidth: StyleSheet.hairlineWidth }, pressed && styles.pressed]}
            >
              <View style={styles.historyCopy}>
                <Text style={[styles.historyTitle, { color: theme.ink }]}>{item.title}</Text>
                <Text style={[styles.historyDate, { color: theme.muted }]}>{item.date} · {item.detail}</Text>
              </View>
              <View style={styles.historyTrailing}>
                <Text style={[styles.historyValue, { color: theme.ink }]}>{item.change}</Text>
                <NativeSymbol color={theme.muted} name="chevron.right" size={13} />
              </View>
            </Pressable>
          ))}
          {history.length === 0 && historyPhase !== 'loading' ? (
            <View style={styles.historyEmpty}>
              <Text style={[styles.historyTitle, { color: theme.ink }]}>No completed workouts yet</Text>
              <Text style={[styles.historyDate, { color: theme.muted }]}>Finish your first session and its history will appear here.</Text>
            </View>
          ) : null}
        </View>
        {historyPhase === 'loading' ? <Text style={[styles.syncStatus, { color: theme.muted }]}>Refreshing workout history…</Text> : null}
        {historyPhase === 'error' ? (
          <View style={styles.syncError}>
            <Text style={[styles.syncStatus, { color: theme.muted }]}>{historyError}</Text>
            <Pressable accessibilityRole="button" onPress={retryHistory} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: theme.ink }]}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
      </AppScreen>
      {selectedWorkout ? (
        <WorkoutHistorySheet onDismiss={() => setSelectedWorkout(null)} workout={selectedWorkout} />
      ) : null}
    </>
  );
}

function WorkoutHistorySheet({ onDismiss, workout }: { onDismiss: () => void; workout: PreviewWorkoutHistory }) {
  const { theme } = useFlyntTheme();
  return (
    <FlyntSheet
      closeAccessibilityLabel="Close completed workout"
      eyebrow="COMPLETED WORKOUT"
      isPresented
      nativeScroll
      onDismiss={onDismiss}
      scroll={false}
      title={workout.title}
    >
      <Text style={[styles.fullDate, { color: theme.muted }]}>{workout.fullDate}</Text>
      <FlyntSheetCard style={styles.summaryCard}>
        <SummaryMetric label="Completed sets" value={String(workout.completedSets)} />
        <View style={[styles.summaryDivider, { backgroundColor: theme.line }]} />
        <SummaryMetric label="Planned sets" value={String(workout.plannedSets)} />
        <View style={[styles.summaryDivider, { backgroundColor: theme.line }]} />
        <SummaryMetric label="Volume" value={workout.volume} />
      </FlyntSheetCard>

      {workout.exercises.length ? (
        <View style={styles.exerciseList}>
          {workout.exercises.map((exercise) => (
            <FlyntSheetCard key={exercise.id} style={styles.exerciseCard}>
              <Text style={[styles.exerciseTitle, { color: theme.ink }]}>{exercise.name}</Text>
              {exercise.sets.map((set, index) => (
                <View key={`${exercise.id}-${index}`} style={[styles.setRow, index > 0 && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <Text style={[styles.setIndex, { color: theme.muted }]}>Set {index + 1}</Text>
                  <Text style={[styles.setResult, { color: theme.ink }]}>{set.load} lb × {set.reps}</Text>
                  <Text style={[styles.setMeta, { color: theme.muted }]}>{set.rpe ? `RPE ${set.rpe}` : set.control ? set.control.replace('_', ' ') : ''}</Text>
                </View>
              ))}
            </FlyntSheetCard>
          ))}
        </View>
      ) : (
        <FlyntSheetCard style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: theme.ink }]}>Workout complete</Text>
          <Text style={[styles.emptyBody, { color: theme.muted }]}>Set-by-set history was not available for this older session.</Text>
        </FlyntSheetCard>
      )}
    </FlyntSheet>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  const { theme } = useFlyntTheme();
  return (
    <View style={styles.summaryMetric}>
      <Text style={[styles.summaryValue, { color: theme.ink }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, minHeight: 104, paddingHorizontal: 18, paddingVertical: 24, borderRadius: 22 },
  metricValue: { fontSize: 34, lineHeight: 37, fontWeight: '600', letterSpacing: -2 },
  metricLabel: { marginTop: 6, fontSize: 12, lineHeight: 17 },
  sectionTitle: { marginHorizontal: 2, marginTop: 36, marginBottom: 14, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  history: { borderCurve: 'continuous', borderRadius: 22, overflow: 'hidden', paddingHorizontal: 16 },
  historyRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyCopy: { flex: 1 },
  historyTitle: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  historyDate: { marginTop: 4, fontSize: 12, lineHeight: 16 },
  historyValue: { fontSize: 13, lineHeight: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
  historyTrailing: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  historyEmpty: { minHeight: 92, justifyContent: 'center', paddingVertical: spacing.md },
  syncStatus: { marginTop: spacing.sm, fontSize: 12, lineHeight: 17 },
  syncError: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  retryButton: { minWidth: 64, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
  pressed: { opacity: 0.62 },
  fullDate: { marginBottom: spacing.md, fontSize: 14, lineHeight: 19 },
  summaryCard: { minHeight: 112, flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: spacing.sm },
  summaryMetric: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  summaryValue: { fontSize: 19, lineHeight: 24, fontWeight: '600', letterSpacing: -0.4, fontVariant: ['tabular-nums'], textAlign: 'center' },
  summaryLabel: { marginTop: 6, fontSize: 10, lineHeight: 13, fontWeight: '600', textAlign: 'center' },
  summaryDivider: { width: StyleSheet.hairlineWidth, marginVertical: 18 },
  exerciseList: { gap: spacing.sm, marginTop: spacing.lg },
  exerciseCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  exerciseTitle: { paddingVertical: spacing.sm, fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.25 },
  setRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  setIndex: { width: 46, fontSize: 12, lineHeight: 16 },
  setResult: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '500', fontVariant: ['tabular-nums'] },
  setMeta: { minWidth: 52, fontSize: 12, lineHeight: 16, textAlign: 'right', fontVariant: ['tabular-nums'] },
  emptyCard: { marginTop: spacing.lg, padding: spacing.lg },
  emptyTitle: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  emptyBody: { marginTop: spacing.xs, fontSize: 14, lineHeight: 20 },
});
