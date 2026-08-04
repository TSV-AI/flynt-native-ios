import type { PropsWithChildren, ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appSurfaces, palette, radius, spacing, type } from '@/constants/theme';
import { GlassSymbolButton, NativeSymbol } from '@/components/native-symbol';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';

type AppScreenProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  intro?: string;
  headerAccessory?: ReactNode;
  topbarTitle?: string;
  showsBackButton?: boolean;
  testID?: string;
  backgroundColor?: ColorValue;
  footer?: ReactNode;
  modalActive?: boolean;
  scrollable?: boolean;
}>;

export function AppScreen({ eyebrow, title, intro, headerAccessory, topbarTitle, showsBackButton = false, children, testID, backgroundColor, footer, modalActive = false, scrollable = true }: AppScreenProps) {
  const { mode, theme } = useFlyntTheme();
  function openSettings() {
    router.push('/settings');
  }
  return (
    <View style={[styles.screen, { backgroundColor: backgroundColor ?? appSurfaces[mode].primaryBackground }]} testID={testID}>
      <SafeAreaView
        accessibilityElementsHidden={modalActive}
        importantForAccessibility={modalActive ? 'no-hide-descendants' : 'auto'}
        style={styles.safeArea}
        edges={['top']}
      >
        <View style={styles.topbar}>
          {showsBackButton ? (
            <>
              <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
                <NativeSymbol color={theme.ink} name="chevron.left" size={18} />
              </Pressable>
              <Text style={[styles.topbarTitle, { color: theme.ink }]}>{topbarTitle}</Text>
              <View style={styles.backButton} />
            </>
          ) : (
            <>
              <View style={styles.topbarPlaceholder} />
              {headerAccessory ?? (
                <GlassSymbolButton
                  accessibilityLabel="Open menu and settings"
                  color={theme.ink}
                  colorScheme={mode}
                  name="ellipsis"
                  onPress={openSettings}
                />
              )}
            </>
          )}
        </View>
        {scrollable ? <ScrollView automaticallyAdjustContentInsets contentContainerStyle={styles.content} keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
          {title ? (
            <View style={styles.hero}>
              {eyebrow ? <Text style={[styles.eyebrow, { color: theme.muted }]}>{eyebrow}</Text> : null}
              <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{title}</Text>
              {intro ? <Text style={[styles.intro, { color: theme.muted }]}>{intro}</Text> : null}
            </View>
          ) : null}
          {children}
          <View style={styles.bottomSpace} />
        </ScrollView> : <View style={styles.staticContent}>
          {title ? (
            <View style={styles.hero}>
              {eyebrow ? <Text style={[styles.eyebrow, { color: theme.muted }]}>{eyebrow}</Text> : null}
              <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{title}</Text>
              {intro ? <Text style={[styles.intro, { color: theme.muted }]}>{intro}</Text> : null}
            </View>
          ) : null}
          {children}
        </View>}
        {footer}
      </SafeAreaView>
    </View>
  );
}

export function PreviewBadge() { return null; }

export function Card({ children }: PropsWithChildren) {
  const { mode } = useFlyntTheme();
  return <View style={[styles.card, { backgroundColor: appSurfaces[mode].itemBackground }]}>{children}</View>;
}

type ActionButtonProps = PropsWithChildren<{ onPress: () => void; secondary?: boolean; disabled?: boolean }>;

export function ActionButton({ children, onPress, secondary = false, disabled = false }: ActionButtonProps) {
  const { theme } = useFlyntTheme();
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, { backgroundColor: secondary ? theme.card : theme.primaryFill, opacity: disabled ? 0.4 : pressed ? 0.76 : 1 }]}>
      <Text style={[styles.actionText, { color: secondary ? theme.ink : theme.primaryText }]}>{children}</Text>
    </Pressable>
  );
}

export const appSurfaceStyles = StyleSheet.create({
  section: { gap: spacing.sm, marginTop: spacing.lg },
  sectionTitle: { ...type.label },
  cardTitle: { ...type.button },
  body: { ...type.body },
  meta: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  divider: { height: StyleSheet.hairlineWidth },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  topbar: { height: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topbarPlaceholder: { width: 44, height: 44 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  content: { paddingHorizontal: 18 },
  staticContent: { flex: 1, paddingHorizontal: 18 },
  hero: { paddingHorizontal: 4, paddingTop: 14, paddingBottom: 26 },
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.45 },
  title: { marginTop: 10, fontSize: 38, lineHeight: 38, fontWeight: '600', letterSpacing: -1.95 },
  intro: { marginTop: 12, fontSize: 15, lineHeight: 21, letterSpacing: -0.2, maxWidth: 360 },
  bottomSpace: { height: 32 },
  card: { borderRadius: 24, padding: 16, shadowColor: palette.black, shadowOpacity: 0.2, shadowRadius: 17, shadowOffset: { width: 0, height: 10 } },
  action: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  actionText: { ...type.button },
});
