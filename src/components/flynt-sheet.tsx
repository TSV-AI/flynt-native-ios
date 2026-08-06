import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NativeMaterialSheet } from '@/components/native-material-sheet';
import { GlassSymbolButton, NativeSymbol } from '@/components/native-symbol';
import type { FlyntSheetPresentationOverride } from '@/constants/sheet';
import { appSurfaces, radius, spacing, themeFor, type ColorMode } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';

type FlyntSheetProps = PropsWithChildren<{
  closeAccessibilityLabel?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  eyebrow?: string;
  footer?: ReactNode;
  isPresented: boolean;
  mode?: ColorMode;
  onBack?: () => void;
  onDismiss: () => void;
  presentationOverride?: FlyntSheetPresentationOverride;
  scroll?: boolean;
  title: string;
}>;

export function FlyntSheet({
  children,
  closeAccessibilityLabel,
  contentContainerStyle,
  eyebrow,
  footer,
  isPresented,
  mode: requestedMode,
  onBack,
  onDismiss,
  presentationOverride,
  scroll = true,
  title,
}: FlyntSheetProps) {
  const { mode: appMode } = useFlyntTheme();
  const mode = requestedMode ?? appMode;
  const theme = themeFor(mode);
  const content = <View style={[styles.content, contentContainerStyle]}>{children}</View>;

  return (
    <NativeMaterialSheet
      colorScheme={mode}
      isPresented={isPresented}
      onDismiss={onDismiss}
      presentationOverride={presentationOverride}
    >
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          {onBack ? (
            <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={styles.backButton}>
              <NativeSymbol color={theme.ink} name="chevron.left" size={17} />
            </Pressable>
          ) : null}
          <View style={styles.headerCopy}>
            {eyebrow ? <Text style={[styles.eyebrow, { color: theme.muted }]}>{eyebrow}</Text> : null}
            <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{title}</Text>
          </View>
          <GlassSymbolButton
            accessibilityLabel={closeAccessibilityLabel ?? `Close ${title}`}
            color={theme.ink}
            colorScheme={mode}
            name="xmark"
            onPress={onDismiss}
          />
        </View>
        {scroll ? (
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : content}
        {footer}
      </SafeAreaView>
    </NativeMaterialSheet>
  );
}

export function FlyntSheetCard({ children, mode: requestedMode, style }: PropsWithChildren<{ mode?: ColorMode; style?: StyleProp<ViewStyle> }>) {
  const { mode: appMode } = useFlyntTheme();
  return <View style={[styles.card, { backgroundColor: appSurfaces[requestedMode ?? appMode].itemBackground }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: 18, paddingTop: spacing.md, paddingBottom: spacing.xs },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerCopy: { flex: 1, minWidth: 0, paddingBottom: spacing.xxs },
  eyebrow: { marginBottom: 5, fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.3 },
  title: { fontSize: 28, lineHeight: 33, fontWeight: '600', letterSpacing: -0.9 },
  scrollContent: { flexGrow: 1, width: '100%' },
  content: { alignSelf: 'stretch', width: '100%', paddingHorizontal: 18, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  card: { alignSelf: 'stretch', width: '100%', borderCurve: 'continuous', borderRadius: radius.lg, overflow: 'hidden' },
});
