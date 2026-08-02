import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-surface';
import { appSurfaces } from '@/constants/theme';
import { previewWeek } from '@/features/app-preview-data';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';

export default function PlanScreen() {
  const { mode, theme } = useFlyntTheme();
  const itemBackground = appSurfaces[mode].itemBackground;
  function openDay(day: number) {
    router.navigate({ pathname: '/today', params: { day: String(day) } });
  }

  return (
    <AppScreen testID="screen-plan" title="Weekly plan">
      <View style={[styles.planList, { backgroundColor: itemBackground }]}>
        {previewWeek.map((day, index) => (
          <Pressable
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
  planList: { borderCurve: 'continuous', borderRadius: 22, overflow: 'hidden', paddingHorizontal: 16 },
  row: { width: '100%', minHeight: 76, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  planDay: { width: 42, fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
  copy: { flex: 1 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  focus: { marginTop: 5, fontSize: 12, lineHeight: 17 },
  count: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
});
