import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-surface';
import { previewWeek } from '@/features/app-preview-data';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { selection } from '@/lib/haptics';

export default function PlanScreen() {
  const { theme } = useFlyntTheme();
  function openDay(day: number) {
    void selection();
    router.navigate({ pathname: '/today', params: { day: String(day) } });
  }

  return (
    <AppScreen testID="screen-plan" title="Weekly plan">
      <View style={[styles.planList, { borderTopColor: theme.line }]}>
        {previewWeek.map((day, index) => (
          <Pressable
            accessibilityRole="button"
            key={`${day.shortDay}-${day.date}`}
            onPress={() => openDay(index)}
            style={[styles.row, { borderBottomColor: theme.line }]}
          >
            <Text style={styles.planDay}>{day.shortDay}</Text>
            <View style={styles.copy}>
              <Text style={[styles.title, { color: theme.ink }]}>{day.title}</Text>
              <Text style={styles.focus}>{day.focus}</Text>
            </View>
            <View style={[styles.count, { backgroundColor: theme.raised }]}>
              <Text style={[styles.countText, { color: theme.ink }]}>{day.exerciseCount}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  planList: { borderTopWidth: StyleSheet.hairlineWidth },
  row: { width: '100%', minHeight: 76, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  planDay: { width: 42, color: '#777772', fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
  copy: { flex: 1 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  focus: { marginTop: 5, color: '#858581', fontSize: 11, lineHeight: 16 },
  count: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
});
