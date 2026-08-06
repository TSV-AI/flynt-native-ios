import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-surface';
import { appSurfaces, spacing } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { useWorkoutData } from '@/providers/workout-data-provider';

export default function PlanScreen() {
  const { mode, theme } = useFlyntTheme();
  const { completedByDay, exercisesByDay, finishedByDay, week } = useWorkoutData();
  const tileBackground = appSurfaces[mode].itemBackground;
  function openDay(day: number) {
    router.navigate({ pathname: '/today', params: { day: String(day) } });
  }

  return (
    <AppScreen contentExtendsUnderTopbar testID="screen-plan" title="Weekly plan">
      <View style={styles.planList}>
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
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: theme.raised },
              ]}
            >
              <View accessibilityElementsHidden style={[styles.dayTile, { backgroundColor: tileBackground }]}>
                <Text style={[styles.planDay, { color: theme.ink }]}>{day.shortDay.slice(0, 1)}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={[styles.title, { color: theme.ink }]}>{day.title}</Text>
                <Text style={[styles.focus, { color: theme.muted }]}>{day.focus}</Text>
              </View>
              {day.title !== 'Rest' ? (
                <View accessibilityElementsHidden style={styles.statusIcon}>
                  <SymbolView name={completed ? 'checkmark.circle.fill' : 'circle'} size={22} tintColor={completed ? theme.ink : theme.muted} />
                </View>
              ) : day.title === 'Rest' ? (
                <Text accessibilityElementsHidden style={[styles.restText, { color: theme.muted }]}>Rest</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <View accessibilityElementsHidden style={styles.bottomClearance} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  planList: { gap: 8 },
  row: { width: '100%', minHeight: 88, paddingVertical: 14, paddingLeft: 12, paddingRight: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dayTile: { width: 80, height: 60, borderRadius: 14, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  planDay: { fontSize: 21, lineHeight: 26, fontWeight: '600' },
  copy: { flex: 1, gap: 5 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  focus: { fontSize: 13, lineHeight: 18 },
  statusIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  restText: { minWidth: 44, fontSize: 12, lineHeight: 17, fontWeight: '600', textAlign: 'right' },
  bottomClearance: { height: spacing.hero },
});
