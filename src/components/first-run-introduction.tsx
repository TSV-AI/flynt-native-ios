import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
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
import Svg, {
  Circle,
  Defs,
  FeGaussianBlur,
  Filter,
  G,
  LinearGradient,
  Pattern,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { appSurfaces, colors, spacing } from '@/constants/theme';
import { firstRunSlides, type FirstRunPreviewKind } from '@/features/first-run-content';
import { selection } from '@/lib/haptics';

type FirstRunIntroductionProps = {
  onFinish: () => void;
};

export function FirstRunIntroduction({ onFinish }: FirstRunIntroductionProps) {
  const { height, width } = useWindowDimensions();
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
      <StatusBar animated style="light" />
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
                <Text accessibilityRole="header" style={[styles.title, { color: colors.dark.ink }]}>
                  {slide.title}
                </Text>
                <Text style={[styles.body, { color: colors.dark.muted }]}>{slide.body}</Text>
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
                    { backgroundColor: page === index ? colors.dark.ink : colors.dark.line },
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
              <Text style={[styles.signInCopy, { color: colors.dark.muted }]}>Next</Text>
              <Text accessibilityElementsHidden style={[styles.chevron, { color: colors.dark.muted }]}>›</Text>
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
      <MarketingStageBackground kind={kind} />
      <View style={[styles.interfaceCardShadow, cardSizes[kind]]}>
        <BlurView intensity={36} style={styles.interfaceCard} tint="systemThinMaterialDark">
          <View style={styles.cardTint} />
          {kind === 'today' ? <WorkoutPreview /> : null}
          {kind === 'timer' ? <TimerPreview /> : null}
          {kind === 'guide' ? <GuidePreview /> : null}
          {kind === 'progress' ? <StatsPreview /> : null}
          {kind === 'trainer' ? <TrainerPreview /> : null}
          {kind === 'spotify' ? <SpotifyPreview width={width * 0.92} /> : null}
        </BlurView>
      </View>
    </View>
  );
}

const colorFieldTransforms: Record<FirstRunPreviewKind, { opacity: number; rotate: number; scale: number }> = {
  today: { opacity: 0.84, rotate: 0, scale: 1 },
  progress: { opacity: 0.84, rotate: 180, scale: 1.08 },
  trainer: { opacity: 0.72, rotate: 12, scale: 1.06 },
  spotify: { opacity: 0.76, rotate: -9, scale: 1.12 },
  guide: { opacity: 0.68, rotate: 142, scale: 1.08 },
  timer: { opacity: 0.66, rotate: 64, scale: 1.1 },
};

function MarketingStageBackground({ kind }: { kind: FirstRunPreviewKind }) {
  const field = colorFieldTransforms[kind];
  const fieldTransform = `translate(210 240) rotate(${field.rotate}) scale(${field.scale}) translate(-210 -240)`;

  return (
    <Svg
      accessibilityElementsHidden
      pointerEvents="none"
      preserveAspectRatio="none"
      style={styles.stageBackground}
      viewBox="0 0 420 480"
    >
      <Defs>
        <RadialGradient id="stageBloom" cx="50%" cy="105%" fx="50%" fy="105%" r="52%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.07} />
          <Stop offset="71%" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="sageCream" x1="0%" x2="100%" y1="0%" y2="0%">
          <Stop offset="3%" stopColor="#869D7F" stopOpacity={0} />
          <Stop offset="38%" stopColor="#869D7F" stopOpacity={0.84} />
          <Stop offset="63%" stopColor="#E7D8B1" stopOpacity={0.85} />
          <Stop offset="92%" stopColor="#E7D8B1" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="blueGrey" x1="0%" x2="100%" y1="0%" y2="0%">
          <Stop offset="3%" stopColor="#7A9DC6" stopOpacity={0} />
          <Stop offset="39%" stopColor="#7A9DC6" stopOpacity={0.88} />
          <Stop offset="62%" stopColor="#D7E0D9" stopOpacity={0.82} />
          <Stop offset="94%" stopColor="#D7E0D9" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="bronzeBlue" x1="0%" x2="100%" y1="0%" y2="0%">
          <Stop offset="4%" stopColor="#B79165" stopOpacity={0} />
          <Stop offset="36%" stopColor="#B79165" stopOpacity={0.5} />
          <Stop offset="66%" stopColor="#5B7A97" stopOpacity={0.78} />
          <Stop offset="94%" stopColor="#5B7A97" stopOpacity={0} />
        </LinearGradient>
        <Filter id="colorFieldBlur" x="-35%" y="-50%" width="170%" height="200%">
          <FeGaussianBlur stdDeviation="22" />
        </Filter>
        <Filter id="stageInsetBlur" x="-20%" y="-20%" width="140%" height="140%">
          <FeGaussianBlur stdDeviation="19" />
        </Filter>
        <Pattern id="stageGrain" width="4" height="4" patternUnits="userSpaceOnUse">
          <Circle cx="0.5" cy="0.5" fill="#FFFFFF" fillOpacity={0.13} r="0.45" />
          <Circle cx="1.35" cy="1.35" fill="#000000" fillOpacity={0.15} r="0.35" />
        </Pattern>
      </Defs>

      <Rect width="420" height="480" fill="#101110" />
      <Rect width="420" height="480" fill="url(#stageBloom)" />
      <G opacity={field.opacity} transform={fieldTransform}>
        <G filter="url(#colorFieldBlur)" transform="rotate(-25 34.5 104.5)">
          <Rect x="-322" y="46" width="713" height="117" rx="58.5" fill="url(#sageCream)" />
        </G>
        <G filter="url(#colorFieldBlur)" transform="rotate(-25 416.5 277.5)">
          <Rect x="60" y="219" width="713" height="117" rx="58.5" fill="url(#blueGrey)" />
        </G>
        <G filter="url(#colorFieldBlur)" transform="rotate(-25 95.5 485.5)">
          <Rect x="-261" y="427" width="713" height="117" rx="58.5" fill="url(#bronzeBlue)" />
        </G>
      </G>
      <Rect width="420" height="480" fill="url(#stageGrain)" opacity={0.22} />
      <Rect
        x="0"
        y="0"
        width="420"
        height="480"
        rx="30"
        fill="none"
        filter="url(#stageInsetBlur)"
        stroke="#FFFFFF"
        strokeOpacity={0.3}
        strokeWidth="28"
        transform="translate(-20 -20)"
      />
      <Rect
        x="0"
        y="0"
        width="420"
        height="480"
        rx="30"
        fill="none"
        filter="url(#stageInsetBlur)"
        stroke="#000000"
        strokeWidth="28"
        transform="translate(20 20)"
      />
    </Svg>
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
    <View style={styles.consultationPreview}>
      <View style={styles.consultationHeading}>
        <Text style={styles.kickerMuted}>FLYNT CONSULTATION</Text>
        <View style={styles.liveStatus}>
          <View style={styles.liveDot} />
          <Text style={styles.liveCopy}>LIVE</Text>
        </View>
      </View>
      <ConsultationOrbPreview />
      <View style={styles.consultationTranscript}>
        <Text style={styles.consultationLabel}>FLYNT</Text>
        <Text style={styles.consultationPrompt}>What would you love to be able to do that feels out of reach today?</Text>
      </View>
      <View style={styles.consultationControls}>
        <View style={styles.consultationMic}>
          <Svg height={18} viewBox="0 0 24 24" width={18}>
            <Path d="M8.5 11V7.5a3.5 3.5 0 0 1 7 0V11a3.5 3.5 0 0 1-7 0Z" fill="none" stroke="#171716" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.65} />
            <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" fill="none" stroke="#171716" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.65} />
          </Svg>
        </View>
        <View>
          <Text style={styles.listeningTitle}>FLYNT is listening</Text>
          <Text style={styles.listeningDetail}>Talk naturally. Nothing to prepare.</Text>
        </View>
      </View>
    </View>
  );
}

function ConsultationOrbPreview() {
  return (
    <Svg height={142} style={styles.consultationOrb} viewBox="0 0 142 142" width={142}>
      <Defs>
        <RadialGradient cx="36%" cy="30%" id="consultationOrbBase" r="76%">
          <Stop offset="0%" stopColor="#F2FFFF" />
          <Stop offset="20%" stopColor="#C7EEF1" />
          <Stop offset="57%" stopColor="#86B4C8" />
          <Stop offset="100%" stopColor="#334A5D" />
        </RadialGradient>
        <RadialGradient cx="40%" cy="27%" id="consultationOrbLight" r="66%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.78} />
          <Stop offset="48%" stopColor="#D6F8F9" stopOpacity={0.25} />
          <Stop offset="100%" stopColor="#6A9EB6" stopOpacity={0} />
        </RadialGradient>
        <Filter height="150%" id="consultationOrbGlow" width="150%" x="-25%" y="-25%">
          <FeGaussianBlur stdDeviation="5" />
        </Filter>
      </Defs>
      <Circle cx={71} cy={71} fill="#8FCBD8" filter="url(#consultationOrbGlow)" opacity={0.24} r={63} />
      <Circle cx={71} cy={71} fill="url(#consultationOrbBase)" r={61} />
      <Circle cx={71} cy={71} fill="url(#consultationOrbLight)" r={58} />
      <G fill="none" opacity={0.33} origin="71, 71" rotation={-18} stroke="#EDFFFF" strokeWidth={0.85}>
        <Circle cx={61} cy={69} r={39} />
        <Circle cx={80} cy={71} r={34} />
      </G>
      <G fill="none" opacity={0.2} origin="71, 71" rotation={31} stroke="#E3FCFF" strokeWidth={0.8}>
        <Circle cx={69} cy={61} r={43} />
        <Circle cx={75} cy={82} r={29} />
      </G>
      <Circle cx={71} cy={71} fill="none" opacity={0.24} r={58} stroke="#E9FDFF" strokeWidth={0.8} />
    </Svg>
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
  interfaceCardShadow: {
    position: 'relative',
    borderCurve: 'continuous',
    borderRadius: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.72,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 22 },
    transform: [{ scale: 0.82 }],
  },
  interfaceCard: {
    flex: 1,
    overflow: 'hidden',
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(30,30,29,0.58)',
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
  consultationPreview: { flex: 1, paddingHorizontal: 18, paddingTop: 19, paddingBottom: 16 },
  consultationHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kickerMuted: { color: '#858580', fontSize: 7, fontWeight: '700', letterSpacing: 1.25 },
  liveStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#B0E9E9', shadowColor: '#B0E9E9', shadowOpacity: 0.8, shadowRadius: 5 },
  liveCopy: { color: '#AAA9A4', fontSize: 6, fontWeight: '700', letterSpacing: 0.8 },
  consultationOrb: { alignSelf: 'center', marginTop: 17, marginBottom: 12 },
  consultationTranscript: { minHeight: 67, alignItems: 'center' },
  consultationLabel: { color: '#858580', fontSize: 6, fontWeight: '700', letterSpacing: 0.95 },
  consultationPrompt: { maxWidth: 264, marginTop: 7, color: '#D4D2CC', fontSize: 11, lineHeight: 15.7, letterSpacing: -0.1, textAlign: 'center' },
  consultationControls: { minHeight: 56, marginTop: 'auto', paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10, borderCurve: 'continuous', borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.04)' },
  consultationMic: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFEDE7' },
  listeningTitle: { color: '#D5D3CD', fontSize: 9, fontWeight: '700' },
  listeningDetail: { marginTop: 4, color: '#777772', fontSize: 7 },
  spotifyImage: { alignSelf: 'flex-start' },
});
