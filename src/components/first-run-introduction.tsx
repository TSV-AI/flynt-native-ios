import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
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

import { appSurfaces, spacing } from '@/constants/theme';
import { firstRunSlides, type FirstRunPreviewKind } from '@/features/first-run-content';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { selection } from '@/lib/haptics';

type FirstRunIntroductionProps = {
  onFinish: () => void;
};

export function FirstRunIntroduction({ onFinish }: FirstRunIntroductionProps) {
  const { height, width } = useWindowDimensions();
  const { theme } = useFlyntTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [touching, setTouching] = useState(false);
  const stageHeight = Math.max(380, Math.min(480, height * 0.52));

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || touching || page >= firstRunSlides.length - 1) return;
    const timer = setTimeout(() => {
      const nextPage = page + 1;
      scrollRef.current?.scrollTo({ animated: true, x: nextPage * width });
      setPage(nextPage);
    }, 6_500);
    return () => clearTimeout(timer);
  }, [page, reduceMotion, touching, width]);

  function settle(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextPage = Math.max(
      0,
      Math.min(firstRunSlides.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)),
    );
    setTouching(false);
    if (nextPage !== page) {
      setPage(nextPage);
      void selection();
    }
  }

  function showPage(index: number) {
    scrollRef.current?.scrollTo({ animated: !reduceMotion, x: index * width });
    setPage(index);
    void selection();
  }

  return (
    <View style={[styles.screen, { backgroundColor: appSurfaces.dark.primaryBackground }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header} />

        <ScrollView
          ref={scrollRef}
          accessibilityLabel="FLYNT introduction"
          alwaysBounceHorizontal
          bounces
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={settle}
          onScrollBeginDrag={() => setTouching(true)}
          onScrollEndDrag={(event) => {
            if (!event.nativeEvent.velocity?.x) setTouching(false);
          }}
          pagingEnabled
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          {firstRunSlides.map((slide, index) => (
            <View
              accessibilityElementsHidden={page !== index}
              importantForAccessibility={page === index ? 'yes' : 'no-hide-descendants'}
              key={slide.kind}
              style={[styles.slide, { width }]}
            >
              <ProductPreview
                height={stageHeight}
                kind={slide.kind}
                width={Math.min(420, width - 44)}
              />
              <View style={styles.copy}>
                <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>
                  {slide.title}
                </Text>
                <Text style={[styles.body, { color: theme.muted }]}>{slide.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View accessibilityLabel={`Introduction ${page + 1} of ${firstRunSlides.length}`} style={styles.dots}>
            {firstRunSlides.map((slide, index) => (
              <Pressable
                accessibilityLabel={`Show introduction ${index + 1}`}
                accessibilityRole="button"
                accessibilityState={{ selected: page === index }}
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
          {page === firstRunSlides.length - 1 ? (
            <Pressable
              accessibilityRole="button"
              onPress={onFinish}
              style={({ pressed }) => [styles.signInButton, pressed && styles.pressed]}
            >
              <Text style={[styles.signInCopy, { color: theme.muted }]}>Sign in</Text>
              <Text accessibilityElementsHidden style={[styles.chevron, { color: theme.muted }]}>›</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function ProductPreview({
  height,
  kind,
  width,
}: {
  height: number;
  kind: FirstRunPreviewKind;
  width: number;
}) {
  return (
    <View style={[styles.productStage, { height }]}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityElementsHidden
        resizeMode="stretch"
        source={stageBackgrounds[kind]}
        style={styles.stageBackground}
      />
      <BlurView
        intensity={36}
        style={[
          styles.interfaceCard,
          cardSizes[kind],
        ]}
        tint="systemThinMaterialDark"
      >
        <View style={styles.cardTint} />
        {kind === 'today' ? <WorkoutPreview /> : null}
        {kind === 'timer' ? <TimerPreview /> : null}
        {kind === 'guide' ? <GuidePreview /> : null}
        {kind === 'progress' ? <StatsPreview /> : null}
        {kind === 'trainer' ? <TrainerPreview /> : null}
        {kind === 'spotify' ? <SpotifyPreview width={width * 0.92} /> : null}
      </BlurView>
    </View>
  );
}

function WorkoutPreview() {
  return (
    <View style={styles.workoutPreview}>
      <View style={styles.workoutHeading}>
        <Text style={styles.monoMuted}>02</Text>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Overhead Press</Text>
          <Text style={styles.cardMuted}>4 sets · 4–6 reps · 3:00 rest</Text>
        </View>
      </View>
      <View style={styles.workoutTools}>
        <Text style={styles.workoutTool}>↗  Stats</Text>
        <Text style={styles.workoutTool}>▱  Guide</Text>
      </View>
      <View style={styles.setGrid}>
        <View style={styles.setLabels}>
          <Text style={[styles.gridLabel, styles.setNumberLabel]}>SET</Text>
          <Text style={styles.gridValueLabel}>LB</Text>
          <Text style={styles.gridValueLabel}>REPS</Text>
          <View style={styles.setCheckLabel} />
        </View>
        {[1, 2, 3, 4].map((set) => (
          <View key={set} style={styles.setRow}>
            <Text style={styles.setNumber}>{set}</Text>
            <Text style={styles.setValue}>130</Text>
            <Text style={styles.setValue}>6</Text>
            <View style={[styles.setCheck, set === 1 && styles.setCheckDone]}>
              <Text style={set === 1 ? styles.checkDoneCopy : styles.checkCopy}>✓</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.recommendation}>Recommended today · 130 lb</Text>
    </View>
  );
}

function TimerPreview() {
  return (
    <View style={styles.timerPreview}>
      <SheetHandle />
      <Text style={styles.kicker}>NEXT SET IN</Text>
      <Text style={styles.timerValue}>0:56</Text>
      <Text style={styles.timerNext}>BULGARIAN SPLIT SQUAT · SET 2 OF 3</Text>
      <View style={styles.timerTrack}><View style={styles.timerTrackFill} /></View>
      <View style={styles.timerActions}>
        <Text style={styles.timerAdjustment}>−15</Text>
        <Text style={styles.timerSkip}>Skip</Text>
        <Text style={styles.timerAdjustment}>+15</Text>
      </View>
    </View>
  );
}

function GuidePreview() {
  return (
    <View style={styles.sheetPreview}>
      <SheetHandle />
      <View style={styles.sheetHeading}>
        <Text style={styles.kicker}>FLYNT GUIDE</Text>
        <Text numberOfLines={1} style={styles.sheetTitle}>Single-KB Bulgarian Split Squat</Text>
      </View>
      <View style={styles.guideFigure}>
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          resizeMode="contain"
          source={require('@/assets/images/marketing/kb-front-rack-bulgarian-split-squat-guide-v1.png')}
          style={styles.guideImage}
        />
        <View style={styles.guideCaption}>
          <Text style={styles.captionLabel}>FLYNT GUIDE</Text>
          <Text style={styles.captionMuted}>Start · Finish</Text>
        </View>
      </View>
      <View style={styles.execution}>
        <Text style={styles.kicker}>EXECUTION</Text>
        <GuideStep index="01" text="Set the rear foot on the bench and hold one kettlebell tight in the front rack." />
        <GuideStep index="02" text="Lower under control, keeping the front heel planted and knee tracking over the toes." />
      </View>
    </View>
  );
}

function GuideStep({ index, text }: { index: string; text: string }) {
  return (
    <View style={styles.guideStep}>
      <Text style={styles.guideIndex}>{index}</Text>
      <Text style={styles.guideCopy}>{text}</Text>
    </View>
  );
}

const chartPoints = [
  { label: '35', x: 18, y: 82 },
  { label: '44', x: 105, y: 68 },
  { label: '48', x: 192, y: 47 },
  { label: '53', x: 282, y: 25 },
] as const;

function StatsPreview() {
  return (
    <View style={styles.sheetPreview}>
      <SheetHandle />
      <View style={styles.sheetHeading}>
        <Text style={styles.kicker}>EXERCISE STATS</Text>
        <Text numberOfLines={1} style={styles.sheetTitle}>Single-KB Bulgarian Split Squat</Text>
      </View>
      <View style={styles.chartHeading}>
        <View style={styles.flex}>
          <Text style={styles.kicker}>TOP-SET LOAD</Text>
          <Text style={styles.chartDescription}>Your heaviest completed set in each workout</Text>
        </View>
        <Text style={styles.chartSessions}>4 sessions</Text>
      </View>
      <View style={styles.chart}>
        {[18, 55, 92].map((top) => <View key={top} style={[styles.chartGridLine, { top }]} />)}
        <ChartLine x1={18} x2={105} y1={82} y2={68} />
        <ChartLine x1={105} x2={192} y1={68} y2={47} />
        <ChartLine x1={192} x2={282} y1={47} y2={25} />
        {chartPoints.map((point, index) => (
          <View key={point.label} style={[styles.chartPointGroup, { left: point.x - 11, top: point.y - 20 }]}>
            <Text style={styles.chartPointLabel}>{point.label}</Text>
            <View style={[styles.chartPoint, index === chartPoints.length - 1 && styles.chartPointCurrent]} />
          </View>
        ))}
      </View>
      <View style={styles.chartDates}>
        {['JUL 08', 'JUL 15', 'JUL 22', 'TODAY'].map((date) => <Text key={date} style={styles.chartDate}>{date}</Text>)}
      </View>
      <View style={styles.statsMetrics}>
        <StatMetric detail="8 / side" label="TOP SET" value="53 LB" />
        <StatMetric detail="Strong effort" label="RPE" value="8" />
        <StatMetric detail="No discomfort" label="PAIN" value="0" />
      </View>
    </View>
  );
}

function ChartLine({ x1, x2, y1, y2 }: { x1: number; x2: number; y1: number; y2: number }) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return (
    <View
      style={[
        styles.chartLine,
        {
          left: x1,
          top: y1,
          width: length,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
}

function StatMetric({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <View style={styles.statMetric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function TrainerPreview() {
  return (
    <View style={styles.trainerPreview}>
      <Text style={styles.kickerMuted}>FLYNT TRAINER</Text>
      <Text style={styles.trainerTitle}>Today&apos;s session</Text>
      <Text style={styles.userMessage}>
        Hey, the shoulder press is kind of bugging my right shoulder. Is there something else I could do?
      </Text>
      <View style={styles.trainerMessage}>
        <Text style={styles.trainerLabel}>FLYNT</Text>
        <Text style={styles.trainerCopy}>Yeah, let&apos;s not push through that. I can swap it for a half-kneeling landmine press, which keeps the same strength focus without forcing you straight overhead. Are the rest of today&apos;s exercises feeling good so far?</Text>
      </View>
      <View style={styles.proposal}>
        <Text style={styles.trainerLabel}>WORKOUT CHANGE</Text>
        <Text style={styles.proposalTitle}>Overhead Press → Landmine Press</Text>
        <Text style={styles.proposalDetail}>Same 4 sets · shoulder-friendly angle</Text>
        <View style={styles.proposalActions}>
          <Text style={styles.keepCurrent}>Keep current</Text>
          <Text style={styles.approveChange}>Approve change</Text>
        </View>
      </View>
    </View>
  );
}

function SpotifyPreview({ width }: { width: number }) {
  const topCrop = width * (110 / 1206);

  return (
    <Image
      accessibilityIgnoresInvertColors
      accessible={false}
      resizeMode="stretch"
      source={require('@/assets/images/marketing/flynt-spotify-connected-sheet.png')}
      style={[
        styles.spotifyImage,
        {
          height: width * (2376 / 1206),
          transform: [{ translateY: -topCrop }],
          width,
        },
      ]}
    />
  );
}

function SheetHandle() {
  return <View style={styles.sheetHandle} />;
}

const stageBackgrounds = {
  today: require('../../assets/images/marketing/marketing-stage-today.png'),
  timer: require('../../assets/images/marketing/marketing-stage-today.png'),
  guide: require('../../assets/images/marketing/marketing-stage-guide.png'),
  progress: require('../../assets/images/marketing/marketing-stage-progress.png'),
  trainer: require('../../assets/images/marketing/marketing-stage-trainer.png'),
  spotify: require('../../assets/images/marketing/marketing-stage-spotify.png'),
} as const;

const cardSizes = StyleSheet.create({
  today: { width: '92%', height: '84%' },
  timer: { width: '92%', height: 260 },
  guide: { width: '92%', height: '84%' },
  progress: { width: '92%', height: '84%' },
  trainer: { width: '92%', height: 370 },
  spotify: { width: '92%', height: '92%' },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: { minHeight: 44, paddingHorizontal: 22, justifyContent: 'center' },
  slide: { paddingHorizontal: 22 },
  productStage: {
    position: 'relative',
    overflow: 'hidden',
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#101110',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageBackground: {
    ...StyleSheet.absoluteFill,
  },
  interfaceCard: {
    position: 'relative',
    overflow: 'hidden',
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(30,30,29,0.58)',
    shadowColor: '#000',
    shadowOpacity: 0.42,
    shadowRadius: 29,
    shadowOffset: { width: 0, height: 18 },
    transform: [{ scale: 0.82 }],
  },
  cardTint: { position: 'absolute', inset: 0, backgroundColor: 'rgba(17,18,17,0.1)' },
  copy: { paddingHorizontal: 7, paddingTop: 20, paddingBottom: 14, gap: spacing.md },
  title: { maxWidth: 430, fontSize: 44, lineHeight: 44, fontWeight: '600', letterSpacing: -2.5 },
  body: { maxWidth: 420, fontSize: 16, lineHeight: 23.5, letterSpacing: -0.2 },
  footer: { position: 'relative', minHeight: 44, marginHorizontal: 22, justifyContent: 'center' },
  dots: { height: 44, flexDirection: 'row', alignItems: 'center', alignSelf: 'center' },
  dotTarget: { width: 22, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 6 },
  activeDot: { width: 20 },
  signInButton: { position: 'absolute', right: 0, minWidth: 62, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  signInCopy: { fontSize: 13, fontWeight: '600' },
  chevron: { fontSize: 20, lineHeight: 22, marginLeft: 3 },
  pressed: { opacity: 0.68 },
  flex: { flex: 1, minWidth: 0 },
  workoutPreview: { flex: 1 },
  workoutHeading: { minHeight: 70, paddingHorizontal: 17, paddingVertical: 15, flexDirection: 'row', gap: 10 },
  monoMuted: { width: 25, paddingTop: 3, color: '#8D8D88', fontFamily: 'ui-monospace', fontSize: 9 },
  cardTitle: { color: '#F3F1EB', fontSize: 16, lineHeight: 19, fontWeight: '700', letterSpacing: -0.4 },
  cardMuted: { marginTop: 5, color: '#8E8E89', fontSize: 9 },
  workoutTools: { height: 42, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.09)' },
  workoutTool: { flex: 1, textAlign: 'center', paddingTop: 14, color: '#B8B7B2', fontSize: 9, fontWeight: '600' },
  setGrid: { paddingHorizontal: 17, paddingTop: 8, flex: 1 },
  setLabels: { minHeight: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  gridLabel: { color: '#8D8D88', fontSize: 7, fontWeight: '700', letterSpacing: 1.1 },
  setNumberLabel: { width: 21, textAlign: 'center' },
  gridValueLabel: { flex: 1, color: '#8D8D88', fontSize: 7, fontWeight: '700', letterSpacing: 1.1 },
  setCheckLabel: { width: 27 },
  setRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
  setNumber: { width: 21, color: '#979792', fontSize: 9, textAlign: 'center' },
  setValue: { flex: 1, height: 36, overflow: 'hidden', borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.07)', color: '#F3F1EB', fontFamily: 'ui-monospace', fontSize: 12, fontWeight: '600', textAlign: 'center', paddingTop: 10 },
  setCheck: { width: 27, height: 27, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  setCheckDone: { borderColor: '#F2F0EA', backgroundColor: '#F2F0EA' },
  checkCopy: { color: 'transparent' },
  checkDoneCopy: { color: '#171716', fontSize: 11, fontWeight: '700' },
  recommendation: { marginBottom: 14, color: '#858580', fontSize: 8, textAlign: 'center' },
  sheetHandle: { width: 40, height: 4, marginTop: 11, marginBottom: 15, alignSelf: 'center', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.26)' },
  kicker: { color: '#C3C2BD', fontSize: 7, lineHeight: 10, fontWeight: '700', letterSpacing: 1.25 },
  timerPreview: { flex: 1, paddingHorizontal: 20, paddingBottom: 16, alignItems: 'center' },
  timerValue: { marginTop: 13, color: '#F3F1EB', fontSize: 66, lineHeight: 66, fontWeight: '600', letterSpacing: -4.6 },
  timerNext: { marginTop: 12, color: '#7F7E79', fontSize: 7, fontWeight: '600', letterSpacing: 0.9 },
  timerTrack: { width: '100%', height: 3, marginTop: 25, marginBottom: 23, overflow: 'hidden', borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
  timerTrackFill: { width: '72%', height: '100%', backgroundColor: '#F3F1EB' },
  timerActions: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerAdjustment: { width: 70, color: '#F3F1EB', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  timerSkip: { flex: 1, minHeight: 52, borderRadius: 15, backgroundColor: '#F3F1EB', color: '#171716', fontSize: 14, fontWeight: '600', textAlign: 'center', paddingTop: 17 },
  sheetPreview: { flex: 1 },
  sheetHeading: { paddingHorizontal: 17 },
  sheetTitle: { marginTop: 7, color: '#F3F1EB', fontSize: 17, lineHeight: 20, fontWeight: '500', letterSpacing: -0.65 },
  guideFigure: { marginHorizontal: 17, marginTop: 14 },
  guideImage: { width: '100%', height: 164, transform: [{ scale: 1.08 }] },
  guideCaption: { minHeight: 31, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.075)' },
  captionLabel: { color: '#AAA9A4', fontSize: 7, letterSpacing: 1.1 },
  captionMuted: { color: '#777772', fontSize: 7 },
  execution: { paddingHorizontal: 17, paddingTop: 14, paddingBottom: 20 },
  guideStep: { paddingVertical: 7, flexDirection: 'row', gap: 7 },
  guideIndex: { width: 25, color: '#777772', fontFamily: 'ui-monospace', fontSize: 7 },
  guideCopy: { flex: 1, color: '#AAA9A4', fontSize: 8, lineHeight: 11.2 },
  chartHeading: { marginHorizontal: 17, marginTop: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  chartDescription: { maxWidth: 172, marginTop: 6, color: '#858580', fontSize: 8, lineHeight: 11 },
  chartSessions: { paddingTop: 2, color: '#858580', fontSize: 8 },
  chart: { position: 'relative', width: 300, height: 108, marginTop: 11, alignSelf: 'center' },
  chartGridLine: { position: 'absolute', left: 8, right: 8, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.075)' },
  chartLine: { position: 'absolute', height: 1.5, backgroundColor: '#D8D7D1', transformOrigin: 'left center' },
  chartPointGroup: { position: 'absolute', width: 22, alignItems: 'center', gap: 4 },
  chartPointLabel: { color: '#9C9B96', fontFamily: 'ui-monospace', fontSize: 7 },
  chartPoint: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: '#D8D7D1', backgroundColor: '#242423' },
  chartPointCurrent: { backgroundColor: '#D8D7D1' },
  chartDates: { marginHorizontal: 17, marginTop: -2, flexDirection: 'row' },
  chartDate: { flex: 1, color: '#696965', fontSize: 6, letterSpacing: 0.5, textAlign: 'center' },
  statsMetrics: { marginHorizontal: 17, marginTop: 15, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.075)' },
  statMetric: { flex: 1, minWidth: 0, paddingHorizontal: 8, paddingVertical: 12 },
  metricLabel: { color: '#858580', fontSize: 7, letterSpacing: 1 },
  metricValue: { marginTop: 12, color: '#F3F1EB', fontFamily: 'ui-monospace', fontSize: 15, fontWeight: '500' },
  metricDetail: { marginTop: 5, color: '#777772', fontSize: 6.5 },
  trainerPreview: { flex: 1, padding: 16 },
  kickerMuted: { color: '#858580', fontSize: 7, fontWeight: '700', letterSpacing: 1.25 },
  trainerTitle: { marginTop: 6, color: '#F3F1EB', fontSize: 20, lineHeight: 23, fontWeight: '700', letterSpacing: -0.9 },
  userMessage: { maxWidth: '88%', alignSelf: 'flex-end', marginTop: 15, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, borderBottomRightRadius: 5, backgroundColor: '#F2F0EA', color: '#171716', fontSize: 10, lineHeight: 14.8 },
  trainerMessage: { maxWidth: '88%', marginTop: 15 },
  trainerLabel: { color: '#73736E', fontSize: 6, fontWeight: '700', letterSpacing: 0.9 },
  trainerCopy: { marginTop: 5, color: '#BBB9B4', fontSize: 10, lineHeight: 14.8 },
  proposal: { marginTop: 14, padding: 12, borderCurve: 'continuous', borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.045)' },
  proposalTitle: { marginTop: 7, color: '#F3F1EB', fontSize: 10, fontWeight: '700' },
  proposalDetail: { marginTop: 4, color: '#797974', fontSize: 7 },
  proposalActions: { marginTop: 11, flexDirection: 'row', gap: 6 },
  keepCurrent: { flex: 1, minHeight: 31, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', color: '#9B9A95', fontSize: 7, textAlign: 'center', paddingTop: 11 },
  approveChange: { flex: 1.2, minHeight: 31, borderRadius: 10, backgroundColor: '#EFEDE7', color: '#171716', fontSize: 7, fontWeight: '700', textAlign: 'center', paddingTop: 11 },
  spotifyImage: { alignSelf: 'flex-start' },
});
