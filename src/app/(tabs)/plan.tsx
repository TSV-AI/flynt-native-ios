import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-surface';
import { appSurfaces } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useWorkoutData } from '@/providers/workout-data-provider';

export default function PlanScreen() {
  const { mode, theme } = useFlyntTheme();
  const { completedByDay, exercisesByDay, finishedByDay, week } = useWorkoutData();
  const itemBackground = appSurfaces[mode].itemBackground;
  function openDay(day: number) {
    router.navigate({ pathname: '/today', params: { day: String(day) } });
  }

  return (
    <AppScreen testID="screen-plan" title="Weekly plan">
      <View style={[styles.planList, { backgroundColor: itemBackground }]}>
        {week.map((day, index) => {
          const totalSets = exercisesByDay[index].reduce((sum, exercise) => sum + exercise.total, 0);
          const completedSets = completedByDay[index].reduce((sum, completed) => sum + completed, 0);
          const completed = totalSets > 0 && (finishedByDay[index] || completedSets === totalSets);
          const partial = totalSets > 0 && completedSets > 0 && !completed;
          const statusLabel = completed
            ? 'Completed'
            : partial
              ? `${completedSets} of ${totalSets} sets complete`
              : day.title === 'Rest'
                ? 'Rest day'
                : 'Not started';

          return (
            <Pressable
              accessibilityLabel={`${day.shortDay}, ${day.title}, ${day.focus}, ${statusLabel}`}
              accessibilityRole="button"
              key={`${day.shortDay}-${day.date}`}
              onPress={() => openDay(index)}
              style={[styles.row, { borderBottomColor: theme.line }]}
            >
              <Text style={[styles.planDay, { color: theme.muted }]}>{day.shortDay}</Text>
              <View style={styles.copy}>
                <Text style={[styles.title, { color: theme.ink }]}>{day.title}</Text>
                <Text style={[styles.focus, { color: theme.muted }]}>{day.focus}</Text>
              </View>
              {completed ? (
                <View accessibilityElementsHidden style={styles.statusIcon}>
                  <SymbolView name="checkmark.circle.fill" size={22} tintColor={theme.ink} />
                </View>
              ) : partial ? (
                <Text accessibilityElementsHidden style={[styles.progressText, { color: theme.muted }]}>
                  {completedSets} of {totalSets}
                </Text>
              ) : day.title === 'Rest' ? (
                <Text accessibilityElementsHidden style={[styles.restText, { color: theme.muted }]}>Rest</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  planList: { borderCurve: 'continuous', borderRadius: 22, overflow: 'hidden', paddingHorizontal: 16 },
  row: { width: '100%', minHeight: 76, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  planDay: { width: 42, fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
  copy: { flex: 1 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  focus: { marginTop: 5, fontSize: 12, lineHeight: 17 },
  statusIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  progressText: { minWidth: 54, fontSize: 12, lineHeight: 17, fontWeight: '600', textAlign: 'right', fontVariant: ['tabular-nums'] },
  restText: { minWidth: 44, fontSize: 12, lineHeight: 17, fontWeight: '600', textAlign: 'right' },
});
