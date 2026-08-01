import { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, type } from '@/constants/theme';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { selection } from '@/lib/haptics';

type SlideKind = 'today' | 'timer' | 'guide' | 'progress' | 'trainer' | 'spotify';

const slides: readonly { body: string; kind: SlideKind; title: string }[] = [
  {
    kind: 'today',
    title: 'Your training, in focus.',
    body: 'See the day, open the current movement, and move through every set without losing your place.',
  },
  {
    kind: 'timer',
    title: 'The right rest is already built in.',
    body: 'Every exercise brings its programmed rest with it, keeping the session at the pace your plan calls for.',
  },
  {
    kind: 'guide',
    title: 'A custom guide for every exercise.',
    body: 'Each movement gets visual and step-by-step guidance shaped around your program and equipment.',
  },
  {
    kind: 'progress',
    title: 'Progress you can actually use.',
    body: 'Every completed set builds a clear history of load, effort, and how the movement felt.',
  },
  {
    kind: 'trainer',
    title: 'A trainer that knows your plan.',
    body: 'Talk through pain, schedule changes, or a hard session and review every adjustment before it happens.',
  },
  {
    kind: 'spotify',
    title: 'Your music stays in the workout.',
    body: 'See what is playing on Spotify and control it without leaving your session.',
  },
] as const;

type FirstRunIntroductionProps = {
  onFinish: () => void;
};

export function FirstRunIntroduction({ onFinish }: FirstRunIntroductionProps) {
  const { height, width } = useWindowDimensions();
  const { mode, theme } = useFlyntTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const stageHeight = Math.max(280, Math.min(360, height * 0.4));

  function settle(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextPage = Math.max(0, Math.min(slides.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
    if (nextPage !== page) {
      setPage(nextPage);
      void selection();
    }
  }

  function showPage(index: number) {
    scrollRef.current?.scrollTo({ animated: true, x: index * width });
    setPage(index);
    void selection();
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.canvas }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Image
            accessibilityIgnoresInvertColors
            source={mode === 'dark'
              ? require('@/assets/images/flynt-mark-light.png')
              : require('@/assets/images/flynt-mark-ink.png')}
            style={styles.mark}
          />
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={onFinish}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
          >
            <Text style={[styles.skipCopy, { color: theme.muted }]}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          accessibilityLabel="FLYNT introduction"
          bounces
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={settle}
          pagingEnabled
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          {slides.map((slide, index) => (
            <View
              accessibilityElementsHidden={page !== index}
              importantForAccessibility={page === index ? 'yes' : 'no-hide-descendants'}
              key={slide.kind}
              style={[styles.slide, { width }]}
            >
              <ProductPreview height={stageHeight} kind={slide.kind} />
              <View style={styles.copy}>
                <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{slide.title}</Text>
                <Text style={[styles.body, { color: theme.muted }]}>{slide.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View accessibilityLabel={`Introduction ${page + 1} of ${slides.length}`} style={styles.dots}>
            {slides.map((slide, index) => (
              <Pressable
                accessibilityLabel={`Show introduction ${index + 1}`}
                accessibilityRole="button"
                accessibilityState={{ selected: page === index }}
                hitSlop={8}
                key={slide.kind}
                onPress={() => showPage(index)}
                style={styles.dotTarget}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: page === index ? theme.ink : theme.line },
                    page === index && styles.activeDot,
                  ]}
                />
              </Pressable>
            ))}
          </View>
          {page === slides.length - 1 ? (
            <Pressable
              accessibilityRole="button"
              onPress={onFinish}
              style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
            >
              <Text style={[styles.continueCopy, { color: theme.ink }]}>Continue</Text>
              <Text accessibilityElementsHidden style={[styles.chevron, { color: theme.ink }]}>›</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function ProductPreview({ height, kind }: { height: number; kind: SlideKind }) {
  const { mode, theme } = useFlyntTheme();
  const fields = {
    today: ['#166B89', '#2B9276', '#92B59D'],
    timer: ['#762923', '#C55B3F', '#E4A66C'],
    guide: ['#47415F', '#817B9C', '#C3A9A1'],
    progress: ['#214C40', '#4D876D', '#ABC093'],
    trainer: ['#174B5A', '#477B85', '#8EB0A5'],
    spotify: ['#10271B', '#1DB954', '#4E6654'],
  }[kind];

  return (
    <View style={[styles.stage, { height, backgroundColor: fields[0], borderColor: theme.line }]}>
      <View style={[styles.colorOrb, styles.orbOne, { backgroundColor: fields[1] }]} />
      <View style={[styles.colorOrb, styles.orbTwo, { backgroundColor: fields[2] }]} />
      <View style={[styles.previewCard, { backgroundColor: mode === 'dark' ? '#20201F' : '#FBFBF9' }]}>
        {kind === 'today' ? <TodayPreview /> : null}
        {kind === 'timer' ? <TimerPreview /> : null}
        {kind === 'guide' ? <GuidePreview /> : null}
        {kind === 'progress' ? <ProgressPreview /> : null}
        {kind === 'trainer' ? <TrainerPreview /> : null}
        {kind === 'spotify' ? <SpotifyPreview /> : null}
      </View>
    </View>
  );
}

function PreviewHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  const { theme } = useFlyntTheme();
  return (
    <View style={styles.previewHeading}>
      <Text style={[styles.previewEyebrow, { color: theme.muted }]}>{eyebrow}</Text>
      <Text numberOfLines={2} style={[styles.previewTitle, { color: theme.ink }]}>{title}</Text>
    </View>
  );
}

function TodayPreview() {
  const { theme } = useFlyntTheme();
  return (
    <View style={styles.previewContent}>
      <View style={styles.exerciseHeading}>
        <Text style={[styles.exerciseNumber, { color: theme.muted }]}>02</Text>
        <PreviewHeading eyebrow="4 SETS · 4–6 REPS · 3:00 REST" title="Overhead Press" />
      </View>
      <View style={styles.previewTools}>
        <Text style={[styles.tool, { borderColor: theme.line, color: theme.ink }]}>Stats</Text>
        <Text style={[styles.tool, { borderColor: theme.line, color: theme.ink }]}>Guide</Text>
      </View>
      <View style={styles.setLabels}>
        <Text style={[styles.cellLabel, { color: theme.muted }]}>SET</Text>
        <Text style={[styles.cellLabel, { color: theme.muted }]}>LB</Text>
        <Text style={[styles.cellLabel, { color: theme.muted }]}>REPS</Text>
      </View>
      {[1, 2, 3, 4].map((set) => (
        <View key={set} style={styles.setRow}>
          <Text style={[styles.setNumber, { color: theme.muted }]}>{set}</Text>
          <Text style={[styles.setValue, { backgroundColor: theme.canvas, color: theme.ink }]}>130</Text>
          <Text style={[styles.setValue, { backgroundColor: theme.canvas, color: theme.ink }]}>6</Text>
          <View style={[styles.check, { backgroundColor: set === 1 ? theme.ink : 'transparent', borderColor: theme.line }]}>
            <Text style={{ color: set === 1 ? theme.primaryText : 'transparent', fontWeight: '700' }}>✓</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function TimerPreview() {
  const { theme } = useFlyntTheme();
  return (
    <View style={[styles.centerPreview, styles.previewContent]}>
      <View style={[styles.handle, { backgroundColor: theme.line }]} />
      <Text style={[styles.previewEyebrow, { color: theme.muted }]}>NEXT SET IN</Text>
      <Text style={[styles.timer, { color: theme.ink }]}>0:56</Text>
      <Text style={[styles.timerNext, { color: theme.muted }]}>BULGARIAN SPLIT SQUAT · SET 2 OF 3</Text>
      <View style={[styles.timerTrack, { backgroundColor: theme.line }]}><View style={[styles.timerFill, { backgroundColor: theme.ink }]} /></View>
      <View style={styles.timerActions}>
        <Text style={[styles.timerAction, { borderColor: theme.line, color: theme.ink }]}>−15</Text>
        <Text style={[styles.timerSkip, { backgroundColor: theme.ink, color: theme.primaryText }]}>Skip</Text>
        <Text style={[styles.timerAction, { borderColor: theme.line, color: theme.ink }]}>+15</Text>
      </View>
    </View>
  );
}

function GuidePreview() {
  const { theme } = useFlyntTheme();
  return (
    <View style={styles.previewContent}>
      <View style={[styles.handle, { backgroundColor: theme.line }]} />
      <PreviewHeading eyebrow="FLYNT GUIDE" title="Single-KB Bulgarian Split Squat" />
      <View style={[styles.guideVisual, { backgroundColor: theme.canvas, borderColor: theme.line }]}>
        <View style={[styles.figureHead, { borderColor: theme.muted }]} />
        <View style={[styles.figureBody, { backgroundColor: theme.muted }]} />
        <View style={[styles.figureLeg, styles.figureLegOne, { backgroundColor: theme.muted }]} />
        <View style={[styles.figureLeg, styles.figureLegTwo, { backgroundColor: theme.muted }]} />
        <View style={[styles.guideBench, { backgroundColor: theme.line }]} />
      </View>
      <Text style={[styles.previewEyebrow, { color: theme.muted }]}>EXECUTION</Text>
      <View style={styles.guideStep}><Text style={{ color: theme.muted }}>01</Text><Text style={[styles.guideCopy, { color: theme.ink }]}>Set the rear foot on the bench and hold the kettlebell tight.</Text></View>
      <View style={styles.guideStep}><Text style={{ color: theme.muted }}>02</Text><Text style={[styles.guideCopy, { color: theme.ink }]}>Lower under control with the front heel planted.</Text></View>
    </View>
  );
}

function ProgressPreview() {
  const { theme } = useFlyntTheme();
  const values = [35, 44, 48, 53];
  return (
    <View style={styles.previewContent}>
      <View style={[styles.handle, { backgroundColor: theme.line }]} />
      <PreviewHeading eyebrow="EXERCISE STATS" title="Bulgarian Split Squat" />
      <Text style={[styles.chartTitle, { color: theme.muted }]}>TOP-SET LOAD · 4 SESSIONS</Text>
      <View style={styles.chart}>
        {values.map((value, index) => (
          <View key={value} style={styles.barColumn}>
            <Text style={[styles.barValue, { color: theme.ink }]}>{value}</Text>
            <View style={[styles.bar, { backgroundColor: theme.ink, height: 26 + index * 14 }]} />
          </View>
        ))}
      </View>
      <View style={styles.metrics}>
        <Metric label="TOP SET" value="53 LB" />
        <Metric label="RPE" value="8" />
        <Metric label="PAIN" value="0" />
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { theme } = useFlyntTheme();
  return <View style={[styles.metric, { backgroundColor: theme.canvas }]}><Text style={[styles.previewEyebrow, { color: theme.muted }]}>{label}</Text><Text style={[styles.metricValue, { color: theme.ink }]}>{value}</Text></View>;
}

function TrainerPreview() {
  const { theme } = useFlyntTheme();
  return (
    <View style={styles.previewContent}>
      <PreviewHeading eyebrow="FLYNT TRAINER" title="Today’s session" />
      <View style={[styles.chatBubble, styles.userBubble, { backgroundColor: theme.ink }]}><Text style={{ color: theme.primaryText, fontSize: 12, lineHeight: 17 }}>The shoulder press is bugging my right shoulder. Is there another option?</Text></View>
      <View style={[styles.chatBubble, { backgroundColor: theme.canvas }]}><Text style={[styles.previewEyebrow, { color: theme.muted }]}>FLYNT</Text><Text style={{ color: theme.ink, fontSize: 12, lineHeight: 17 }}>Let’s not push through that. I can swap it for a landmine press.</Text></View>
      <View style={[styles.proposal, { borderColor: theme.line }]}>
        <Text style={[styles.previewEyebrow, { color: theme.muted }]}>WORKOUT CHANGE</Text>
        <Text style={[styles.proposalTitle, { color: theme.ink }]}>Overhead Press → Landmine Press</Text>
        <Text style={[styles.proposalButton, { backgroundColor: theme.ink, color: theme.primaryText }]}>Review change</Text>
      </View>
    </View>
  );
}

function SpotifyPreview() {
  const { theme } = useFlyntTheme();
  return (
    <View style={[styles.centerPreview, styles.previewContent]}>
      <Text style={[styles.previewEyebrow, { color: '#1DB954' }]}>SPOTIFY</Text>
      <View style={[styles.album, { backgroundColor: theme.line }]}><Text style={[styles.albumMark, { color: theme.ink }]}>F</Text></View>
      <Text style={[styles.spotifyTitle, { color: theme.ink }]}>Workout mix</Text>
      <Text style={[styles.spotifyArtist, { color: theme.muted }]}>Playing in FLYNT</Text>
      <View style={styles.spotifyControls}><Text style={[styles.spotifyControl, { color: theme.ink }]}>‹‹</Text><Text style={[styles.spotifyPlay, { backgroundColor: theme.ink, color: theme.primaryText }]}>▶</Text><Text style={[styles.spotifyControl, { color: theme.ink }]}>››</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: { minHeight: 52, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mark: { width: 20, height: 31, resizeMode: 'contain' },
  skip: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  skipCopy: { fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.68 },
  slide: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  stage: { overflow: 'hidden', borderRadius: 32, borderWidth: StyleSheet.hairlineWidth, padding: 16, justifyContent: 'flex-end' },
  colorOrb: { position: 'absolute', width: 260, height: 260, borderRadius: 130, opacity: 0.72 },
  orbOne: { right: -80, top: -95 },
  orbTwo: { left: -100, bottom: -120 },
  previewCard: { width: '100%', maxWidth: 370, minHeight: 260, alignSelf: 'center', borderRadius: radius.lg, padding: spacing.md, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 22, shadowOffset: { width: 0, height: 12 } },
  copy: { gap: spacing.sm, paddingHorizontal: spacing.xs },
  title: { ...type.display, fontSize: 39, lineHeight: 40, letterSpacing: -1.8 },
  body: { ...type.body, maxWidth: 430 },
  footer: { position: 'relative', minHeight: 54, marginHorizontal: spacing.lg, justifyContent: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center' },
  dotTarget: { width: 22, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 6 },
  activeDot: { width: 18 },
  continueButton: { position: 'absolute', right: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2 },
  continueCopy: { fontSize: 15, fontWeight: '600' },
  chevron: { fontSize: 23, lineHeight: 24 },
  previewContent: { flex: 1, gap: 9 },
  previewHeading: { flex: 1, gap: 2 },
  previewEyebrow: { fontSize: 9, lineHeight: 12, fontWeight: '700', letterSpacing: 1.2 },
  previewTitle: { fontSize: 18, lineHeight: 21, fontWeight: '700', letterSpacing: -0.4 },
  exerciseHeading: { minHeight: 43, flexDirection: 'row', gap: 10 },
  exerciseNumber: { fontSize: 12, fontWeight: '600', paddingTop: 3 },
  previewTools: { flexDirection: 'row', gap: 8 },
  tool: { flex: 1, minHeight: 31, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, textAlign: 'center', textAlignVertical: 'center', fontSize: 11, fontWeight: '600', paddingTop: 8 },
  setLabels: { flexDirection: 'row', paddingLeft: 4 },
  cellLabel: { width: '26%', fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  setRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7 },
  setNumber: { width: 18, fontSize: 10 },
  setValue: { flex: 1, overflow: 'hidden', borderRadius: 9, textAlign: 'center', paddingVertical: 7, fontSize: 12, fontWeight: '600' },
  check: { width: 25, height: 25, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  centerPreview: { alignItems: 'center' },
  handle: { width: 38, height: 4, borderRadius: 3, alignSelf: 'center', marginBottom: 5 },
  timer: { fontSize: 66, lineHeight: 72, fontWeight: '300', letterSpacing: -2.5 },
  timerNext: { fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  timerTrack: { width: '100%', height: 4, borderRadius: 3, overflow: 'hidden', marginTop: 14 },
  timerFill: { width: '61%', height: '100%' },
  timerActions: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 18 },
  timerAction: { width: 42, height: 42, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, textAlign: 'center', paddingTop: 12, fontWeight: '600' },
  timerSkip: { minWidth: 70, height: 42, borderRadius: 21, textAlign: 'center', paddingTop: 12, fontWeight: '700' },
  guideVisual: { height: 83, overflow: 'hidden', borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth },
  figureHead: { position: 'absolute', left: '47%', top: 12, width: 15, height: 15, borderRadius: 8, borderWidth: 2 },
  figureBody: { position: 'absolute', left: '49%', top: 28, width: 4, height: 31, borderRadius: 2, transform: [{ rotate: '-8deg' }] },
  figureLeg: { position: 'absolute', left: '49%', top: 54, width: 39, height: 4, borderRadius: 2, transformOrigin: 'left center' },
  figureLegOne: { transform: [{ rotate: '31deg' }] },
  figureLegTwo: { transform: [{ rotate: '151deg' }] },
  guideBench: { position: 'absolute', right: 35, top: 55, width: 62, height: 5, borderRadius: 3 },
  guideStep: { flexDirection: 'row', gap: 10 },
  guideCopy: { flex: 1, fontSize: 10, lineHeight: 13 },
  chartTitle: { fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  chart: { height: 84, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#8F8F89' },
  barColumn: { height: '100%', flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  barValue: { fontSize: 9, fontWeight: '700' },
  bar: { width: 19, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  metrics: { flexDirection: 'row', gap: 7 },
  metric: { flex: 1, borderRadius: 10, padding: 8, gap: 4 },
  metricValue: { fontSize: 16, fontWeight: '700' },
  chatBubble: { maxWidth: '88%', borderRadius: 14, padding: 10, gap: 4 },
  userBubble: { alignSelf: 'flex-end' },
  proposal: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 10, gap: 6 },
  proposalTitle: { fontSize: 12, lineHeight: 15, fontWeight: '700' },
  proposalButton: { minHeight: 30, borderRadius: 15, textAlign: 'center', paddingTop: 7, fontSize: 10, fontWeight: '700' },
  album: { width: 104, height: 104, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  albumMark: { fontSize: 52, fontWeight: '700', letterSpacing: -4 },
  spotifyTitle: { fontSize: 19, fontWeight: '700', marginTop: 4 },
  spotifyArtist: { fontSize: 12 },
  spotifyControls: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 24 },
  spotifyControl: { fontSize: 24, fontWeight: '700' },
  spotifyPlay: { width: 46, height: 46, borderRadius: 23, textAlign: 'center', paddingTop: 13, paddingLeft: 2 },
});
