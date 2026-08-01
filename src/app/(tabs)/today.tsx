import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/app-surface';
import { ExerciseDetailSheet } from '@/components/exercise-detail-sheet';
import { NativeSymbol } from '@/components/native-symbol';
import { palette, radius } from '@/constants/theme';
import { previewExercisesByDay, previewWeek } from '@/features/app-preview-data';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { deliberateAction, selection } from '@/lib/haptics';

export default function TodayScreen() {
  const params = useLocalSearchParams<{ day?: string }>();
  const initialDay = Math.min(Math.max(Number(params.day ?? 4), 0), previewWeek.length - 1);
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [activeExercise, setActiveExercise] = useState(1);
  const [detailSheet, setDetailSheet] = useState<{ mode: 'stats' | 'guide'; name: string } | null>(null);
  const [completedByDay, setCompletedByDay] = useState(() =>
    previewExercisesByDay.map((exercises) => exercises.map((exercise) => exercise.completed)),
  );
  const { mode, theme } = useFlyntTheme();
  const exerciseCardColor = mode === 'light' ? '#FAFAFA' : theme.card;
  const exerciseCardBevel = mode === 'light'
    ? { borderTopColor: '#FFFFFF', borderBottomColor: 'rgba(11,11,11,0.16)', shadowOpacity: 0.055 }
    : { borderTopColor: 'rgba(255,255,255,0.08)', borderBottomColor: 'rgba(0,0,0,0.28)', shadowOpacity: 0.14 };
  const selectedDayBevel = mode === 'light'
    ? { borderTopColor: 'rgba(255,255,255,0.24)', borderBottomColor: 'rgba(0,0,0,0.48)' }
    : { borderTopColor: 'rgba(255,255,255,0.72)', borderBottomColor: 'rgba(0,0,0,0.16)' };
  const weekStripBevel = mode === 'light'
    ? { borderTopColor: 'rgba(11,11,11,0.14)', borderRightColor: 'rgba(11,11,11,0.055)', borderBottomColor: '#FFFFFF', borderLeftColor: 'rgba(11,11,11,0.055)' }
    : { borderColor: theme.line };
  const day = previewWeek[selectedDay];
  const exercises = previewExercisesByDay[selectedDay];
  const completed = completedByDay[selectedDay];
  const completedSets = useMemo(() => completed.reduce((sum, value) => sum + value, 0), [completed]);
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.total, 0);
  const progress = totalSets ? completedSets / totalSets : 0;
  const dateLabels = ['MONDAY, JULY 27', 'TUESDAY, JULY 28', 'WEDNESDAY, JULY 29', 'THURSDAY, JULY 30', 'FRIDAY, JULY 31', 'SATURDAY, AUGUST 1', 'SUNDAY, AUGUST 2'];

  function chooseDay(index: number) {
    if (index === selectedDay) return;
    void selection();
    setSelectedDay(index);
    setActiveExercise(index === 4 ? 1 : 0);
  }

  function toggleExercise(index: number) {
    void selection();
    setActiveExercise((current) => current === index ? -1 : index);
  }

  function toggleSet(exerciseIndex: number, setIndex: number) {
    void selection();
    setCompletedByDay((current) => current.map((dayProgress, dayIndex) => {
      if (dayIndex !== selectedDay) return dayProgress;
      return dayProgress.map((count, index) => {
        if (index !== exerciseIndex) return count;
        return setIndex < count ? setIndex : Math.min(count + 1, exercises[index].total);
      });
    }));
  }

  return (
    <>
    <AppScreen
      backgroundColor={mode === 'light' ? '#F3F2EE' : undefined}
      eyebrow={dateLabels[selectedDay]}
      intro={day.focus}
      testID="screen-today"
      title={day.title}
    >
      <View accessibilityLabel="Choose training day" style={[styles.weekStrip, { backgroundColor: mode === 'light' ? '#FAFAFA' : theme.card }, weekStripBevel]}>
        {previewWeek.map((item, index) => {
          const selected = index === selectedDay;
          return (
            <Pressable
              accessibilityLabel={`${item.shortDay} ${item.date}, ${item.title}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={`${item.shortDay}-${item.date}`}
              onPress={() => chooseDay(index)}
              style={[
                styles.day,
                selected && {
                  backgroundColor: theme.primaryFill,
                  shadowColor: theme.ink,
                },
                selected && styles.selectedDayBevel,
                selected && selectedDayBevel,
              ]}
            >
              <Text style={[styles.dayLetter, { color: selected ? theme.primaryText : '#777773' }]}>{item.shortDay.slice(0, 1)}</Text>
              <Text style={[styles.dayDate, { color: selected ? theme.primaryText : theme.muted }]}>{item.date}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.progressRow}>
        <Text style={[styles.progressLabel, { color: theme.muted }]}>{totalSets ? `${completedSets} of ${totalSets} sets` : day.duration}</Text>
        <Text style={[styles.progressLabel, { color: theme.muted }]}>{Math.round(progress * 100)}%</Text>
        <View style={[styles.progressTrack, { backgroundColor: theme.line }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.ink, width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>

      {day.kind === 'recovery' ? (
        <View style={[styles.exerciseCard, { backgroundColor: exerciseCardColor }, exerciseCardBevel]}>
          <Text style={[styles.exerciseTitle, { color: theme.ink }]}>Recovery is part of the plan.</Text>
          <Text style={[styles.exerciseSummary, { color: theme.muted }]}>Keep the day easy. Your next training session is already scheduled.</Text>
        </View>
      ) : (
        <View style={styles.exerciseList}>
          {exercises.map((exercise, index) => {
            const expanded = activeExercise === index;
            const done = completed[index] === exercise.total;
            return (
              <View key={exercise.name} style={[styles.exerciseCard, { backgroundColor: exerciseCardColor }, exerciseCardBevel, done && !expanded && styles.completedCard]}>
                <Pressable
                  accessibilityLabel={`${expanded ? 'Current exercise' : 'Make current exercise'}: ${exercise.name}`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => toggleExercise(index)}
                  style={styles.exerciseHeading}
                >
                  <Text style={styles.exerciseNumber}>{String(index + 1).padStart(2, '0')}</Text>
                  <View style={styles.exerciseCopy}>
                    <Text style={[styles.exerciseTitle, { color: theme.ink }]}>{exercise.name}</Text>
                    <Text style={styles.exerciseSummary}>{exercise.detail} · 1:30 rest</Text>
                  </View>
                  {done ? <View style={[styles.doneMark, { backgroundColor: theme.ink }]}><NativeSymbol color={theme.canvas} name="checkmark" size={11} /></View> : null}
                </Pressable>

                {expanded ? (
                  <View>
                    <View style={[styles.tools, { borderColor: theme.line }]}>
                      <Pressable accessibilityRole="button" onPress={() => { void deliberateAction(); setDetailSheet({ mode: 'stats', name: exercise.name }); }} style={styles.toolButton}>
                        <NativeSymbol color={theme.ink} name="chart.xyaxis.line" size={17} /><Text style={[styles.toolText, { color: theme.ink }]}>Stats</Text>
                      </Pressable>
                      <View style={[styles.toolDivider, { backgroundColor: theme.line }]} />
                      <Pressable accessibilityRole="button" onPress={() => { void deliberateAction(); setDetailSheet({ mode: 'guide', name: exercise.name }); }} style={styles.toolButton}>
                        <NativeSymbol color={theme.ink} name="book.closed" size={16} /><Text style={[styles.toolText, { color: theme.ink }]}>Guide</Text>
                      </Pressable>
                    </View>
                    <View style={styles.setLabels}>
                      <Text style={styles.setLabel}>SET</Text><Text style={styles.setLabel}>LB</Text><Text style={styles.setLabel}>REPS</Text><Text />
                    </View>
                    {Array.from({ length: exercise.total }, (_, setIndex) => {
                      const checked = setIndex < completed[index];
                      return (
                        <View key={setIndex} style={styles.setRow}>
                          <Text style={styles.setNumber}>{setIndex + 1}</Text>
                          <TextInput accessibilityLabel={`${exercise.name} set ${setIndex + 1} weight`} keyboardType="decimal-pad" placeholder="–" placeholderTextColor="#777773" style={[styles.setInput, { backgroundColor: theme.raised, color: theme.ink }]} />
                          <TextInput accessibilityLabel={`${exercise.name} set ${setIndex + 1} reps`} keyboardType="number-pad" placeholder={exercise.detail.match(/\d+/)?.[0] ?? '–'} placeholderTextColor="#777773" style={[styles.setInput, { backgroundColor: theme.raised, color: theme.ink }]} />
                          <Pressable accessibilityLabel={`${checked ? 'Uncheck' : 'Complete'} ${exercise.name} set ${setIndex + 1}`} accessibilityRole="button" onPress={() => toggleSet(index, setIndex)} style={styles.checkButton}>
                            <View style={[styles.checkCircle, { borderColor: checked ? theme.ink : '#4b4b48', backgroundColor: checked ? theme.ink : 'transparent' }]}>
                              {checked ? <NativeSymbol color={theme.canvas} name="checkmark" size={12} /> : null}
                            </View>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </AppScreen>
    <ExerciseDetailSheet
      isPresented={detailSheet !== null}
      mode={detailSheet?.mode ?? 'stats'}
      name={detailSheet?.name ?? 'Exercise'}
      onDismiss={() => setDetailSheet(null)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  weekStrip: { height: 68, flexDirection: 'row', gap: 3, padding: 4, borderTopWidth: 1, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: 1, borderLeftWidth: StyleSheet.hairlineWidth, borderRadius: 21, overflow: 'hidden' },
  day: { flex: 1, minWidth: 0, alignSelf: 'stretch', borderRadius: 17, alignItems: 'center', justifyContent: 'center', gap: 5, shadowOpacity: 0.16, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  selectedDayBevel: { borderTopWidth: 1, borderBottomWidth: 1 },
  dayLetter: { fontSize: 11, lineHeight: 13, fontWeight: '700' },
  dayDate: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  progressRow: { marginHorizontal: 4, marginTop: 26, marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  progressLabel: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
  progressTrack: { width: '100%', height: 2, overflow: 'hidden' },
  progressFill: { height: 2 },
  exerciseList: { gap: 12 },
  exerciseCard: { paddingHorizontal: 16, paddingTop: 19, paddingBottom: 14, borderRadius: 24, borderTopWidth: 1, borderBottomWidth: 1, shadowColor: palette.black, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  completedCard: { opacity: 0.62 },
  exerciseHeading: { minHeight: 45, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exerciseNumber: { width: 28, paddingTop: 3, color: '#858581', fontSize: 11, lineHeight: 14, fontVariant: ['tabular-nums'] },
  exerciseCopy: { flex: 1 },
  exerciseTitle: { fontSize: 18, lineHeight: 22, letterSpacing: -0.45, fontWeight: '600' },
  exerciseSummary: { marginTop: 5, color: '#858581', fontSize: 11, lineHeight: 15 },
  doneMark: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tools: { height: 46, marginHorizontal: -16, marginTop: 15, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  toolButton: { flex: 1, minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  toolDivider: { width: StyleSheet.hairlineWidth },
  toolText: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
  setLabels: { marginTop: 14, paddingHorizontal: 3, paddingBottom: 7, display: 'flex', flexDirection: 'row', alignItems: 'center' },
  setLabel: { flex: 1, color: '#6f6f6b', fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8, textAlign: 'center' },
  setRow: { minHeight: 56, flexDirection: 'row', gap: 8, alignItems: 'center' },
  setNumber: { width: 42, color: '#858581', textAlign: 'center', fontSize: 11, fontVariant: ['tabular-nums'] },
  setInput: { flex: 1, height: 44, borderRadius: radius.sm, textAlign: 'center', fontSize: 14, fontWeight: '600' },
  checkButton: { width: 48, height: 44, alignItems: 'center', justifyContent: 'center' },
  checkCircle: { width: 29, height: 29, borderWidth: 1.25, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
