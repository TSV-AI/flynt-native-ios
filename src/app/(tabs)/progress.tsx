import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-surface';
import { NativeSymbol } from '@/components/native-symbol';
import { previewHistory } from '@/features/app-preview-data';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { selection } from '@/lib/haptics';

export default function ProgressScreen() {
  const { theme } = useFlyntTheme();
  return (
    <AppScreen testID="screen-progress" title="Progress">
      <View style={styles.metrics}>
        <View style={[styles.metric, { backgroundColor: theme.card }]}>
          <Text style={[styles.metricValue, { color: theme.ink }]}>11</Text>
          <Text style={styles.metricLabel}>Sessions</Text>
        </View>
        <View style={[styles.metric, { backgroundColor: theme.card }]}>
          <Text style={[styles.metricValue, { color: theme.ink }]}>5</Text>
          <Text style={styles.metricLabel}>Tracked lifts</Text>
        </View>
      </View>
      <Text style={[styles.sectionTitle, { color: theme.ink }]}>Recent workouts</Text>
      <View>
        {previewHistory.map((item) => (
          <Pressable accessibilityRole="button" key={item.date} onPress={() => void selection()} style={[styles.historyRow, { borderBottomColor: theme.line }]}>
            <View style={styles.historyCopy}>
              <Text style={[styles.historyTitle, { color: theme.ink }]}>{item.title}</Text>
              <Text style={styles.historyDate}>{item.date}</Text>
            </View>
            <Text style={[styles.historyValue, { color: theme.ink }]}>{item.change}</Text>
            <View style={styles.chevron}><NativeSymbol color={theme.muted} name="chevron.right" size={13} /></View>
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, minHeight: 104, paddingHorizontal: 18, paddingVertical: 24, borderRadius: 22 },
  metricValue: { fontSize: 34, lineHeight: 37, fontWeight: '600', letterSpacing: -2 },
  metricLabel: { marginTop: 6, color: '#858581', fontSize: 11, lineHeight: 15 },
  sectionTitle: { marginHorizontal: 2, marginTop: 36, marginBottom: 14, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  historyRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  historyCopy: { flex: 1 },
  historyTitle: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  historyDate: { marginTop: 4, color: '#777772', fontSize: 11, lineHeight: 14 },
  historyValue: { fontSize: 13, lineHeight: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
  chevron: { width: 20, alignItems: 'center', opacity: 0.7 },
});
