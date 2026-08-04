import { useCallback, useMemo } from 'react';
import { Linking, type ViewStyle } from 'react-native';
import { EnrichedMarkdownText, type MarkdownStyle } from 'react-native-enriched-markdown';

import { appSurfaces, radius } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';

export function TrainerMarkdownMessage({ markdown, containerStyle }: { markdown: string; containerStyle?: ViewStyle }) {
  const { mode, theme } = useFlyntTheme();
  const linkColor = mode === 'dark' ? '#0A84FF' : '#007AFF';
  const markdownStyle = useMemo<MarkdownStyle>(() => ({
    paragraph: {
      color: theme.ink,
      fontSize: 17,
      lineHeight: 25,
      marginBottom: 10,
    },
    h1: {
      color: theme.ink,
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 34,
      marginBottom: 12,
      marginTop: 4,
    },
    h2: {
      color: theme.ink,
      fontSize: 23,
      fontWeight: '600',
      lineHeight: 29,
      marginBottom: 10,
      marginTop: 4,
    },
    h3: {
      color: theme.ink,
      fontSize: 19,
      fontWeight: '600',
      lineHeight: 25,
      marginBottom: 8,
      marginTop: 2,
    },
    h4: { color: theme.ink, fontSize: 17, fontWeight: '600', lineHeight: 24, marginBottom: 8 },
    h5: { color: theme.ink, fontSize: 17, fontWeight: '600', lineHeight: 24, marginBottom: 8 },
    h6: { color: theme.muted, fontSize: 15, fontWeight: '600', lineHeight: 21, marginBottom: 8 },
    list: {
      color: theme.ink,
      fontSize: 17,
      lineHeight: 25,
      bulletColor: theme.ink,
      bulletSize: 5,
      gapWidth: 10,
      marginBottom: 10,
      marginLeft: 18,
      markerColor: theme.ink,
    },
    blockquote: {
      backgroundColor: 'transparent',
      borderColor: theme.line,
      borderWidth: 2,
      color: theme.muted,
      fontSize: 17,
      gapWidth: 12,
      lineHeight: 25,
      marginBottom: 10,
    },
    strong: { color: theme.ink },
    em: { color: theme.ink },
    link: { color: linkColor, underline: true },
    code: {
      backgroundColor: appSurfaces[mode].itemBackground,
      borderColor: theme.line,
      color: theme.ink,
      fontSize: 15,
    },
    codeBlock: {
      backgroundColor: appSurfaces[mode].itemBackground,
      borderColor: theme.line,
      borderRadius: radius.sm,
      borderWidth: 1,
      color: theme.ink,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 12,
      padding: 12,
    },
    thematicBreak: { color: theme.line, height: 1, marginBottom: 12, marginTop: 12 },
    table: {
      borderColor: theme.line,
      borderRadius: radius.sm,
      borderWidth: 1,
      color: theme.ink,
      fontSize: 15,
      headerBackgroundColor: appSurfaces[mode].itemBackground,
      headerTextColor: theme.ink,
      rowEvenBackgroundColor: 'transparent',
      rowOddBackgroundColor: appSurfaces[mode].itemBackground,
    },
  }), [linkColor, mode, theme]);

  const openLink = useCallback(({ url }: { url: string }) => {
    if (!/^(https?:|mailto:)/i.test(url.trim())) return;
    void Linking.openURL(url);
  }, []);

  return (
    <EnrichedMarkdownText
      accessibilityLabel="Trainer response"
      allowFontScaling
      containerStyle={containerStyle}
      flavor="github"
      lineBreakStrategyIOS="standard"
      markdown={markdown}
      markdownStyle={markdownStyle}
      onLinkPress={openLink}
      selectable
      selectionColor={linkColor}
    />
  );
}
