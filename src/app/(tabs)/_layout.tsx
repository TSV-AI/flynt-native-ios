import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { usePathname } from 'expo-router';
import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NativeSymbol } from '@/components/native-symbol';
import { themeFor } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';

type TabKind = 'today' | 'plan' | 'progress' | 'trainer';

const tabSymbols = {
  today: { default: 'dumbbell', selected: 'dumbbell.fill' },
  plan: { default: 'calendar', selected: 'calendar.circle.fill' },
  progress: { default: 'chart.xyaxis.line', selected: 'chart.xyaxis.line' },
  trainer: { default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' },
} as const;

function TabIcon({ active, color, kind }: { active: boolean; color: string; kind: TabKind }) {
  const symbols = tabSymbols[kind];
  return <NativeSymbol color={color} name={active ? symbols.selected : symbols.default} size={21} />;
}

export default function AppTabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { mode, theme } = useFlyntTheme();
  const navigationTheme = themeFor('dark');
  const supportsGlass = isGlassEffectAPIAvailable();

  function item(name: TabKind, label: string) {
    const active = pathname === `/${name}`;
    const color = active ? navigationTheme.ink : navigationTheme.muted;
    return (
      <TabTrigger
        accessibilityLabel={`${label} tab`}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        href={`/${name}`}
        name={name}
        style={styles.tab}
        testID={`tab-${name}`}
      >
        <TabIcon active={active} color={color} kind={name} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </TabTrigger>
    );
  }

  return (
    <Tabs style={[styles.root, { backgroundColor: theme.canvas }]}>
      <TabSlot style={styles.slot} />
      <TabList
        style={[
          styles.tabList,
          {
            height: 61 + insets.bottom,
            paddingBottom: Math.max(5, insets.bottom),
          },
        ]}
      >
        {supportsGlass ? (
          <GlassView
            colorScheme="dark"
            glassEffectStyle="regular"
            style={styles.glassBackground}
            tintColor={mode === 'light' ? 'rgba(8,8,8,0.72)' : 'rgba(8,8,8,0.18)'}
          />
        ) : (
          <View style={[styles.glassBackground, { backgroundColor: 'rgba(26,26,25,0.96)' }]} />
        )}
        {item('today', 'Today')}
        {item('plan', 'Plan')}
        {item('progress', 'Progress')}
        {item('trainer', 'Trainer')}
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slot: { flex: 1 },
  tabList: { position: 'absolute', right: 0, bottom: 0, left: 0, zIndex: 20, elevation: 20, paddingHorizontal: 12, paddingTop: 5, overflow: 'hidden' },
  glassBackground: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  tab: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabLabel: { fontSize: 10, lineHeight: 13, fontWeight: '600' },
});
