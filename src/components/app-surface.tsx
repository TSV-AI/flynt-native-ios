import type { PropsWithChildren, ReactNode } from 'react';
import { router } from 'expo-router';
import {
  Group as NativeGroup,
  RNHostView,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonStyle,
  contentShape,
  frame,
  glassEffect,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { Pressable, ScrollView, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { appSurfaces, palette, radius, spacing, type } from '@/constants/theme';
import { GlassSymbolButton } from '@/components/native-symbol';
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
  contentExtendsUnderTopbar?: boolean;
}>;

type AppScreenTopbarProps = Pick<
  AppScreenProps,
  'contentExtendsUnderTopbar' | 'headerAccessory' | 'showsBackButton' | 'topbarTitle'
> & {
  centerAccessory?: ReactNode;
  edgeScrim?: string;
  leadingAccessory?: ReactNode;
};

export const appTopbarHeight = 58;
export const appTopbarHorizontalPadding = 20;

export function nativeHeaderGlassButtonModifiers(label: string) {
  return [
    buttonStyle('plain'),
    frame({ width: 44, height: 44 }),
    contentShape(shapes.circle()),
    glassEffect({ glass: { variant: 'regular', interactive: true }, shape: 'circle' }),
    accessibilityLabel(label),
  ];
}

export function NativeAppScreenTopbar({
  color,
  colorScheme,
  onBack,
  title,
}: {
  color: string;
  colorScheme: 'light' | 'dark';
  onBack: () => void;
  title: string;
}) {
  return (
    <NativeGroup modifiers={[frame({ height: appTopbarHeight, maxWidth: 1000 })]}>
      <RNHostView>
        <View style={styles.nativeHostTopbar}>
          <GlassSymbolButton
            accessibilityLabel="Back"
            color={color}
            colorScheme={colorScheme}
            name="chevron.left"
            onPress={onBack}
          />
          <Text numberOfLines={1} style={[styles.nativeHostTopbarTitle, { color }]}>{title}</Text>
          <View style={styles.topbarPlaceholder} />
        </View>
      </RNHostView>
    </NativeGroup>
  );
}

export function AppScreenHero({ eyebrow, intro, title }: Pick<AppScreenProps, 'eyebrow' | 'intro' | 'title'>) {
  const { theme } = useFlyntTheme();
  if (!title) return null;
  return (
    <View style={styles.hero}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: theme.muted }]}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{title}</Text>
      {intro ? <Text style={[styles.intro, { color: theme.muted }]}>{intro}</Text> : null}
    </View>
  );
}

export function AppScreenTopbar({
  centerAccessory,
  contentExtendsUnderTopbar = false,
  edgeScrim,
  headerAccessory,
  leadingAccessory,
  showsBackButton = false,
  topbarTitle,
}: AppScreenTopbarProps) {
  const { mode, theme } = useFlyntTheme();
  const insets = useSafeAreaInsets();

  function openSettings() {
    router.push('/settings');
  }

  return (
    <>
      <View style={[styles.topbar, contentExtendsUnderTopbar && styles.topbarOverlay, contentExtendsUnderTopbar && { top: insets.top }]}>
        {showsBackButton ? (
          <>
            <GlassSymbolButton
              accessibilityLabel="Back"
              color={theme.ink}
              colorScheme={mode}
              name="chevron.left"
              onPress={() => router.back()}
            />
            <Text style={[styles.topbarTitle, { color: theme.ink }]}>{topbarTitle}</Text>
            <View style={styles.backButton} />
          </>
        ) : (
          <>
            {leadingAccessory ?? <View style={styles.topbarPlaceholder} />}
            {centerAccessory ? <View pointerEvents="box-none" style={styles.topbarCenter}>{centerAccessory}</View> : null}
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
      {contentExtendsUnderTopbar ? (
        <View
          pointerEvents="none"
          style={[
            styles.statusBarScrim,
            {
              height: insets.top + spacing.sm,
              experimental_backgroundImage: `linear-gradient(180deg, ${edgeScrim ?? appSurfaces[mode].edgeScrim} 0%, ${edgeScrim ?? appSurfaces[mode].edgeScrim} 34%, transparent 100%)`,
            },
          ]}
        />
      ) : null}
    </>
  );
}

export function AppScreen({ eyebrow, title, intro, headerAccessory, topbarTitle, showsBackButton = false, children, testID, backgroundColor, footer, modalActive = false, scrollable = true, contentExtendsUnderTopbar = false }: AppScreenProps) {
  const { mode } = useFlyntTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: backgroundColor ?? appSurfaces[mode].primaryBackground }]} testID={testID}>
      <SafeAreaView
        accessibilityElementsHidden={modalActive}
        importantForAccessibility={modalActive ? 'no-hide-descendants' : 'auto'}
        style={styles.safeArea}
        edges={contentExtendsUnderTopbar ? [] : ['top']}
      >
        <AppScreenTopbar
          contentExtendsUnderTopbar={contentExtendsUnderTopbar}
          headerAccessory={headerAccessory}
          showsBackButton={showsBackButton}
          topbarTitle={topbarTitle}
        />
        {scrollable ? <ScrollView
          automaticallyAdjustContentInsets={!contentExtendsUnderTopbar}
          contentContainerStyle={[
            styles.content,
            contentExtendsUnderTopbar && { paddingTop: insets.top + appTopbarHeight },
          ]}
          contentInsetAdjustmentBehavior={contentExtendsUnderTopbar ? 'never' : 'automatic'}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <AppScreenHero eyebrow={eyebrow} intro={intro} title={title} />
          {children}
          <View style={styles.bottomSpace} />
        </ScrollView> : <View style={styles.staticContent}>
          <AppScreenHero eyebrow={eyebrow} intro={intro} title={title} />
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
  topbar: { height: appTopbarHeight, paddingHorizontal: appTopbarHorizontalPadding, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nativeHostTopbar: { height: appTopbarHeight, paddingHorizontal: appTopbarHorizontalPadding, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nativeHostTopbarTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 22, fontWeight: '600' },
  topbarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 },
  topbarCenter: { position: 'absolute', left: 72, right: 72, alignItems: 'center', justifyContent: 'center' },
  statusBarScrim: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
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
