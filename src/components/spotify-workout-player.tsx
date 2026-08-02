import { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { NativeSymbol } from '@/components/native-symbol';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { selection } from '@/lib/haptics';
import { useSpotify } from '@/providers/spotify-provider';

const spotifyIcon = require('../../assets/images/spotify-icon.png') as ImageSourcePropType;
const spotifyGreen = '#1ED760';
const spotifyBlack = '#191414';
const previewArtwork = 'https://i.scdn.co/image/ab67706f00000002f367481f06b565250cc7b139';

type VisualTrack = {
  album: string;
  artist: string;
  artworkColor: string | null;
  artworkPalette: string[];
  artwork: string | null;
  durationMs: number;
  name: string;
  uri: string;
};

const previewTracks: VisualTrack[] = [
  { album: 'Beast Mode', artist: 'Shakira, Burna Boy', artwork: previewArtwork, artworkColor: '#31584D', artworkPalette: ['#31584D', '#604B3B', '#183A36'], durationMs: 223_000, name: 'Dai Dai', uri: 'spotify:track:0V3wPSX9ygBnCm8psDIegu' },
  { album: 'Stateside', artist: 'PinkPantheress, Zara Larsson', artwork: null, artworkColor: '#594D64', artworkPalette: ['#594D64', '#775C63', '#303A53'], durationMs: 184_000, name: 'Stateside', uri: 'spotify:track:preview-stateside' },
  { album: 'Un Verano Sin Ti', artist: 'Bad Bunny', artwork: null, artworkColor: '#6B4F32', artworkPalette: ['#6B4F32', '#887044', '#443A31'], durationMs: 243_000, name: 'Tití Me Preguntó', uri: 'spotify:track:preview-titi' },
  { album: 'HIT ME HARD AND SOFT', artist: 'Billie Eilish', artwork: null, artworkColor: '#31465A', artworkPalette: ['#31465A', '#435B6C', '#202E41'], durationMs: 210_000, name: 'CHIHIRO', uri: 'spotify:track:preview-chihiro' },
  { album: 'UTOPIA', artist: 'Travis Scott', artwork: null, artworkColor: '#493C35', artworkPalette: ['#493C35', '#674E3D', '#292825'], durationMs: 191_000, name: 'FE!N', uri: 'spotify:track:preview-fein' },
];

type SpotifyLauncherProps = {
  onPress: () => void;
  variant: 'bar' | 'pill';
};

function SpotifyMark({ color, size = 42 }: { color?: string; size?: number }) {
  return (
    <Image
      accessibilityElementsHidden
      resizeMode="contain"
      source={spotifyIcon}
      style={{ height: size, tintColor: color, width: size }}
    />
  );
}

function ArtworkColorField({ color, colors, compact = false }: { color: string; colors: string[]; compact?: boolean }) {
  const primary = colors[0] ?? color;
  const secondary = colors[1] ?? primary;
  const tertiary = colors[2] ?? secondary;
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: primary, experimental_backgroundImage: `linear-gradient(110deg, ${primary} 0%, ${secondary} 48%, ${tertiary} 100%)` }]}
    >
      <View style={[StyleSheet.absoluteFill, compact ? styles.compactColorShade : styles.colorShade]} />
    </View>
  );
}

function PlaybackWave({ paused, variant = 'player' }: { paused: boolean; variant?: 'launcher' | 'pill' | 'player' }) {
  const reduceMotion = useReducedMotion();
  const [values] = useState(() => Array.from({ length: 5 }, () => new Animated.Value(1)));
  const heights = variant === 'pill' ? [10, 15, 19, 13, 8] : variant === 'launcher' ? [14, 21, 26, 18, 10] : [14, 21, 26, 18, 10];

  useEffect(() => {
    values.forEach((value) => value.setValue(1));
    if (paused || reduceMotion) return;
    const loops = values.map((value, index) => Animated.loop(Animated.sequence([
      Animated.delay(index * 68),
      Animated.timing(value, { duration: 400, easing: Easing.inOut(Easing.ease), toValue: 0.38, useNativeDriver: true }),
      Animated.timing(value, { duration: 400, easing: Easing.inOut(Easing.ease), toValue: 1, useNativeDriver: true }),
    ])));
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [paused, reduceMotion, values]);

  return (
    <View accessibilityElementsHidden style={[styles.wave, variant === 'pill' && styles.pillWave]}>
      {heights.map((height, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveBar,
            variant === 'pill' && styles.pillWaveBar,
            { height: paused ? variant === 'pill' ? 2.5 : 3 : height, transform: [{ scaleY: paused ? 1 : values[index] }] },
          ]}
        />
      ))}
    </View>
  );
}

function useLauncherEntrance() {
  const reduceMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [scale] = useState(() => new Animated.Value(reduceMotion ? 1 : 0.955));

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      scale.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { duration: 780, easing: Easing.bezier(0.2, 0.75, 0.25, 1), toValue: 1, useNativeDriver: true }),
      Animated.timing(scale, { duration: 780, easing: Easing.bezier(0.2, 0.75, 0.25, 1), toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [opacity, reduceMotion, scale]);

  return { opacity, transform: [{ scale }] };
}

function actualVisualTrack(player: ReturnType<typeof useSpotify>['state']['player']): VisualTrack | null {
  if (!player) return null;
  return {
    album: player.track.album,
    artist: player.track.artist,
    artworkColor: player.track.artworkColorHex,
    artworkPalette: player.track.artworkPaletteHex,
    artwork: player.track.artworkDataUri,
    durationMs: player.track.durationMs,
    name: player.track.name,
    uri: player.track.uri,
  };
}

function useVisualPlayer() {
  const spotify = useSpotify();
  const preview = __DEV__ && !spotify.state.installed;
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewPaused, setPreviewPaused] = useState(false);
  const track = preview ? previewTracks[previewIndex] : actualVisualTrack(spotify.state.player);
  const paused = preview ? previewPaused : spotify.state.player?.isPaused ?? true;
  const connected = preview || spotify.state.connected;

  return {
    connected,
    contextTitle: preview ? 'Beast Mode' : spotify.state.player?.contextTitle || 'This Spotify session',
    isPreview: preview,
    paused,
    player: spotify.state.player,
    queue: preview ? previewTracks : track ? [track] : [],
    spotify,
    track,
    next: async () => {
      if (preview) {
        setPreviewIndex((current) => Math.min(previewTracks.length - 1, current + 1));
        setPreviewPaused(false);
      } else {
        await spotify.next();
      }
    },
    previous: async () => {
      if (preview) {
        setPreviewIndex((current) => Math.max(0, current - 1));
        setPreviewPaused(false);
      } else {
        await spotify.previous();
      }
    },
    togglePlayback: async () => {
      if (preview) {
        setPreviewPaused((current) => !current);
      } else if (spotify.state.player?.isPaused) {
        await spotify.resume();
      } else {
        await spotify.pause();
      }
    },
    playTrack: async (nextTrack: VisualTrack) => {
      if (preview) {
        const index = previewTracks.findIndex((item) => item.uri === nextTrack.uri);
        if (index >= 0) setPreviewIndex(index);
        setPreviewPaused(false);
      } else {
        await spotify.play(nextTrack.uri);
      }
    },
  };
}

function usePlaybackClock(track: VisualTrack | null, paused: boolean, sourcePosition: number) {
  const trackUri = track?.uri ?? null;
  const durationMs = track?.durationMs ?? 0;
  const [clock, setClock] = useState(() => ({ position: sourcePosition, trackUri }));
  const position = clock.trackUri === trackUri ? clock.position : sourcePosition;
  const setPosition = useCallback((next: number | ((current: number) => number)) => {
    setClock((current) => {
      const base = current.trackUri === trackUri ? current.position : sourcePosition;
      return {
        position: typeof next === 'function' ? next(base) : next,
        trackUri,
      };
    });
  }, [sourcePosition, trackUri]);

  useEffect(() => {
    if (!durationMs || paused) return;
    const interval = setInterval(() => {
      setPosition((current) => Math.min(durationMs, current + 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [durationMs, paused, setPosition]);

  return [position, setPosition] as const;
}

export function SpotifyLauncher({ onPress, variant }: SpotifyLauncherProps) {
  const { width } = useWindowDimensions();
  const visual = useVisualPlayer();
  const entrance = useLauncherEntrance();
  const isPill = variant === 'pill';
  const title = visual.track?.name ?? (visual.connected ? 'Nothing playing' : 'Connect Spotify');
  const detail = visual.track?.artist ?? (visual.connected ? 'Tap to open player' : isPill ? 'Tap to connect' : 'Tap to open player');
  const launcherWidth = isPill ? Math.min(width * 0.48, 178) : Math.min(width - 48, 344);

  return (
    <Animated.View style={[isPill ? { height: 44, width: launcherWidth } : [styles.barFrame, { width: launcherWidth }], entrance]}>
      <Pressable
        accessibilityHint="Opens workout music controls"
        accessibilityLabel={`${title}. ${detail}`}
        accessibilityRole="button"
        onPress={() => {
          void selection();
          onPress();
        }}
        style={({ pressed }) => [
          styles.launcher,
          isPill ? styles.pillLauncher : styles.barLauncher,
          pressed && (isPill ? styles.pillPressed : styles.barPressed),
        ]}
      >
        {visual.track?.artworkColor ? <ArtworkColorField color={visual.track.artworkColor} colors={visual.track.artworkPalette} compact={isPill} /> : null}
        <View style={[styles.launcherContent, isPill && styles.pillLauncherContent]}>
          {visual.track?.artwork ? (
            <Image
              source={{ uri: visual.track.artwork }}
              style={isPill ? styles.pillArtwork : styles.barArtwork}
            />
          ) : (
            <SpotifyMark color={isPill ? '#FFFFFF' : undefined} size={isPill ? 32 : 42} />
          )}
          <View style={styles.launcherCopy}>
            {!isPill ? <Text style={styles.launcherEyebrow}>WORKOUT MUSIC</Text> : null}
            <Text numberOfLines={1} style={[styles.launcherTitle, isPill && styles.pillTitle]}>{title}</Text>
            <Text numberOfLines={1} style={[styles.launcherDetail, isPill && styles.pillDetail]}>{detail}</Text>
          </View>
          <PlaybackWave paused={!visual.track || visual.paused} variant={isPill ? 'pill' : 'launcher'} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function SpotifyPlayerContent() {
  const visual = useVisualPlayer();
  const { mode } = useFlyntTheme();

  return <SpotifySheetContent visual={visual} darkSheet={mode === 'dark'} />;
}

function SpotifySheetContent({
  darkSheet,
  visual,
}: {
  darkSheet: boolean;
  visual: ReturnType<typeof useVisualPlayer>;
}) {
  const initialPosition = visual.isPreview && visual.track?.uri === previewTracks[0].uri
    ? 74_000
    : visual.player?.playbackPositionMs ?? 0;
  const [position, setPosition] = usePlaybackClock(visual.track, visual.paused, initialPosition);
  const [progressWidth, setProgressWidth] = useState(1);
  const ink = darkSheet ? '#FFFFFF' : '#0B0B0B';
  const muted = darkSheet ? '#858580' : '#777773';
  const loading = !visual.isPreview && (visual.spotify.state.status === 'authorizing' || visual.spotify.state.status === 'connecting');

  return (
    <View style={styles.sheet}>
      {loading ? (
        <SpotifyLoadingState color={ink} />
      ) : visual.connected && visual.track ? (
        <View style={styles.connectedPlayer}>
          <View style={styles.nowPlayingCard}>
            {visual.track.artworkColor ? <ArtworkColorField color={visual.track.artworkColor} colors={visual.track.artworkPalette} /> : null}
            <View style={styles.nowPlayingSummary}>
              {visual.track.artwork ? (
                <Image
                  accessibilityLabel={`${visual.track.album} artwork`}
                  source={{ uri: visual.track.artwork }}
                  style={styles.playerArtwork}
                />
              ) : (
                <View style={[styles.playerArtwork, styles.artworkPlaceholder]}>
                  <SpotifyMark size={42} />
                </View>
              )}
              <View style={styles.nowPlayingCopy}>
                <Text numberOfLines={1} style={styles.nowPlayingTitle}>{visual.track.name}</Text>
                <Text numberOfLines={1} style={styles.nowPlayingArtist}>{visual.track.artist}</Text>
              </View>
              <PlaybackWave paused={visual.paused} />
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.progressTime}>{formatTime(position)}</Text>
              <Pressable
                accessibilityActions={[
                  { name: 'increment', label: 'Seek forward 15 seconds' },
                  { name: 'decrement', label: 'Seek backward 15 seconds' },
                ]}
                accessibilityLabel="Song progress"
                accessibilityRole="adjustable"
                accessibilityValue={{ max: visual.track.durationMs, min: 0, now: position, text: `${formatTime(position)} of ${formatTime(visual.track.durationMs)}` }}
                onAccessibilityAction={(event) => {
                  const change = event.nativeEvent.actionName === 'increment' ? 15_000 : -15_000;
                  const next = Math.max(0, Math.min(visual.track?.durationMs ?? 0, position + change));
                  setPosition(next);
                  if (!visual.isPreview) void visual.spotify.seek(next);
                }}
                onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
                onPress={(event) => {
                  const next = Math.round(visual.track!.durationMs * Math.max(0, Math.min(1, event.nativeEvent.locationX / progressWidth)));
                  setPosition(next);
                  if (!visual.isPreview) void visual.spotify.seek(next);
                }}
                style={styles.progressTrack}
              >
                <View style={[styles.progressFill, { width: `${visual.track.durationMs ? Math.min(100, position / visual.track.durationMs * 100) : 0}%` }]} />
              </Pressable>
              <Text style={[styles.progressTime, styles.remainingTime]}>−{formatTime(Math.max(0, visual.track.durationMs - position))}</Text>
            </View>

            <View style={styles.playerControls}>
              <PlayerControl
                disabled={!visual.isPreview && !visual.player?.canSkipPrevious}
                label="Previous song"
                name="backward.fill"
                onPress={visual.previous}
              />
              <PlayerControl
                label={visual.paused ? 'Play' : 'Pause'}
                name={visual.paused ? 'play.fill' : 'pause.fill'}
                onPress={visual.togglePlayback}
                primary
              />
              <PlayerControl
                disabled={!visual.isPreview && !visual.player?.canSkipNext}
                label="Next song"
                name="forward.fill"
                onPress={visual.next}
              />
            </View>

            <View accessibilityLabel="Playback provided by Spotify" style={styles.attribution}>
              <SpotifyMark color="#FFFFFF" size={16} />
            </View>
          </View>

          <View style={styles.queueHeading}>
            <Text numberOfLines={1} style={[styles.queueEyebrow, { color: muted }]}>FROM {visual.contextTitle.toUpperCase()}</Text>
            <Pressable
              accessibilityLabel="Open Spotify"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => void visual.spotify.openSpotify()}
              style={({ pressed }) => [styles.openSpotify, !darkSheet && styles.openSpotifyLight, pressed && styles.controlPressed]}
            >
              <Text style={[styles.openSpotifyText, !darkSheet && styles.openSpotifyTextLight]}>OPEN SPOTIFY</Text>
            </Pressable>
          </View>

          <ScrollView
            alwaysBounceVertical={false}
            contentContainerStyle={styles.queueContent}
            showsVerticalScrollIndicator={false}
            style={styles.queue}
          >
            {visual.queue.map((track) => {
              const current = track.uri === visual.track?.uri;
              return (
                <Pressable
                  accessibilityLabel={`${track.name}. ${track.artist}. ${formatTime(track.durationMs)}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: current }}
                  key={track.uri}
                  onPress={() => void visual.playTrack(track)}
                  style={({ pressed }) => [
                    styles.queueRow,
                    current && styles.currentQueueRow,
                    current && !darkSheet && styles.currentQueueRowLight,
                    pressed && styles.queueRowPressed,
                  ]}
                >
                  {current ? <View style={styles.currentDot} /> : null}
                  <View style={[styles.queueCopy, current && styles.currentQueueCopy]}>
                    <Text numberOfLines={1} style={[styles.queueTitle, { color: current ? darkSheet ? spotifyGreen : spotifyBlack : ink }]}>{track.name}</Text>
                    <Text numberOfLines={1} style={[styles.queueArtist, { color: muted }]}>{track.artist}</Text>
                  </View>
                  <Text style={[styles.queueTime, { color: muted }]}>{formatTime(track.durationMs)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : visual.connected ? (
        <SpotifyNothingPlaying darkSheet={darkSheet} />
      ) : (
        <SpotifyConnectState darkSheet={darkSheet} />
      )}
      {visual.spotify.state.errorMessage && !visual.isPreview ? (
        <Text accessibilityRole="alert" style={styles.errorMessage}>{visual.spotify.state.errorMessage}</Text>
      ) : null}
    </View>
  );
}

function PlayerControl({
  disabled = false,
  label,
  name,
  onPress,
  primary = false,
}: {
  disabled?: boolean;
  label: string;
  name: 'backward.fill' | 'forward.fill' | 'pause.fill' | 'play.fill';
  onPress: () => Promise<void>;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => void onPress()}
      style={({ pressed }) => [styles.playerControl, disabled && styles.disabled, pressed && styles.controlPressed]}
    >
      <NativeSymbol color="rgba(255,255,255,0.94)" name={name} size={primary ? 51 : 37} />
    </Pressable>
  );
}

function SpotifyLoadingState({ color }: { color: string }) {
  return (
    <View style={styles.centeredState}>
      <SpotifyMark color={color} size={58} />
      <View style={styles.loadingDots}>
        <View style={[styles.loadingDot, { backgroundColor: color }]} />
        <View style={[styles.loadingDot, { backgroundColor: color }]} />
        <View style={[styles.loadingDot, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.stateTitle, { color }]}>Finding your Spotify session…</Text>
    </View>
  );
}

function SpotifyNothingPlaying({ darkSheet }: { darkSheet: boolean }) {
  const spotify = useSpotify();
  const ink = darkSheet ? '#FFFFFF' : '#0B0B0B';
  const muted = darkSheet ? '#94948F' : '#686761';
  return (
    <View style={styles.centeredState}>
      <SpotifyMark color={ink} size={58} />
      <Text style={[styles.stateTitle, { color: ink }]}>Nothing is playing yet.</Text>
      <Text style={[styles.stateDetail, { color: muted }]}>Start something in the Spotify app. FLYNT will mirror it here and control the same phone, headphones, or speaker.</Text>
      <Pressable accessibilityRole="button" onPress={() => void spotify.connect()} style={({ pressed }) => [styles.greenButton, pressed && styles.controlPressed]}>
        <Text style={styles.greenButtonText}>Check Spotify</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => void spotify.openSpotify()} style={({ pressed }) => [styles.secondaryButton, { borderColor: darkSheet ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)' }, pressed && styles.controlPressed]}>
        <Text style={[styles.secondaryButtonText, { color: ink }]}>Open Spotify</Text>
      </Pressable>
    </View>
  );
}

function SpotifyConnectState({ darkSheet }: { darkSheet: boolean }) {
  const spotify = useSpotify();
  const ink = darkSheet ? '#FFFFFF' : '#0B0B0B';
  const muted = darkSheet ? 'rgba(255,255,255,0.58)' : 'rgba(17,17,16,0.58)';
  const unavailable = spotify.state.status === 'unavailable';
  const title = unavailable ? 'Spotify isn’t installed.' : 'Connect your Spotify.';
  const detail = unavailable
    ? 'Install Spotify to control workout music from FLYNT.'
    : 'Sign in with Spotify to mirror and control the music already playing on your phone, headphones, or speaker.';
  return (
    <View style={styles.centeredState}>
      <SpotifyMark color={ink} size={58} />
      <Text style={[styles.stateTitle, { color: ink }]}>{title}</Text>
      <Text style={[styles.stateDetail, { color: muted }]}>{detail}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void (unavailable ? spotify.openSpotify() : spotify.authorize())}
        style={({ pressed }) => [styles.greenButton, styles.connectButton, pressed && styles.controlPressed]}
      >
        <SpotifyMark color="#0B0B0B" size={20} />
        <Text style={styles.greenButtonText}>{unavailable ? 'Open Spotify' : 'Connect Spotify'}</Text>
      </Pressable>
    </View>
  );
}

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  colorShade: { backgroundColor: 'rgba(8,8,8,0.34)' },
  compactColorShade: { backgroundColor: 'rgba(8,8,8,0.18)' },
  launcher: { color: '#FFFFFF', overflow: 'hidden' },
  pillLauncher: { backgroundColor: 'rgba(19,19,18,0.68)', borderCurve: 'continuous', borderRadius: 999, height: 44, shadowColor: '#000000', shadowOffset: { height: 9, width: 0 }, shadowOpacity: 0.18, shadowRadius: 13 },
  barFrame: { alignSelf: 'center', height: 72 },
  barLauncher: { backgroundColor: 'rgba(23,23,22,0.90)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 21, borderWidth: 1, height: 72, shadowColor: '#000000', shadowOffset: { height: 12, width: 0 }, shadowOpacity: 0.12, shadowRadius: 15 },
  launcherContent: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12, paddingHorizontal: 12 },
  pillLauncherContent: { gap: 7, paddingHorizontal: 7 },
  launcherCopy: { flex: 1, minWidth: 0 },
  launcherEyebrow: { color: '#95958F', fontSize: 10, fontWeight: '700', letterSpacing: 1.3, lineHeight: 12 },
  launcherTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', lineHeight: 17, marginTop: 3 },
  launcherDetail: { color: '#92928D', fontSize: 10, lineHeight: 12, marginTop: 3 },
  pillTitle: { fontSize: 11, fontWeight: '700', letterSpacing: -0.15, lineHeight: 13, marginTop: 0 },
  pillDetail: { color: 'rgba(255,255,255,0.62)', fontSize: 9, lineHeight: 11, marginTop: 2 },
  barArtwork: { borderRadius: 7, height: 42, width: 42 },
  pillArtwork: { borderRadius: 16, height: 32, shadowColor: '#000000', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.26, shadowRadius: 5, width: 32 },
  pillPressed: { transform: [{ scale: 0.985 }] },
  barPressed: { transform: [{ scale: 0.992 }] },
  wave: { alignItems: 'center', flexDirection: 'row', gap: 2, height: 38, justifyContent: 'center', width: 38 },
  pillWave: { gap: 1.5, height: 28, width: 28 },
  waveBar: { backgroundColor: 'rgba(255,255,255,0.48)', borderRadius: 999, width: 3 },
  pillWaveBar: { backgroundColor: 'rgba(255,255,255,0.72)', width: 2.5 },
  sheet: { flex: 1 },
  connectedPlayer: { flex: 1, paddingTop: 14 },
  nowPlayingCard: { borderCurve: 'continuous', borderRadius: 28, height: 210, marginHorizontal: 14, overflow: 'hidden', paddingHorizontal: 18, paddingTop: 20 },
  nowPlayingSummary: { alignItems: 'center', flexDirection: 'row', gap: 13 },
  playerArtwork: { borderRadius: 8, height: 78, shadowColor: '#000000', shadowOffset: { height: 9, width: 0 }, shadowOpacity: 0.3, shadowRadius: 11, width: 78 },
  artworkPlaceholder: { alignItems: 'center', backgroundColor: '#262624', justifyContent: 'center' },
  nowPlayingCopy: { flex: 1, minWidth: 0 },
  nowPlayingTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '700', letterSpacing: -0.72, lineHeight: 23 },
  nowPlayingArtist: { color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 16, marginTop: 6 },
  progressRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginHorizontal: 3, marginTop: 19 },
  progressTrack: { backgroundColor: '#464643', borderRadius: 999, flex: 1, height: 5, overflow: 'hidden' },
  progressFill: { backgroundColor: '#FFFFFF', borderRadius: 999, height: 5 },
  progressTime: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontVariant: ['tabular-nums'], minWidth: 30 },
  remainingTime: { textAlign: 'right' },
  playerControls: { alignItems: 'center', flexDirection: 'row', height: 54, justifyContent: 'space-around', marginHorizontal: '6%', marginTop: 14 },
  playerControl: { alignItems: 'center', flex: 1, height: 54, justifyContent: 'center', minWidth: 54 },
  attribution: { bottom: 15, height: 16, position: 'absolute', right: 16, width: 16 },
  disabled: { opacity: 0.46 },
  controlPressed: { opacity: 0.72, transform: [{ scale: 0.94 }] },
  queueHeading: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', height: 44, justifyContent: 'space-between', paddingHorizontal: 8, width: '90%' },
  queueEyebrow: { flex: 1, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, lineHeight: 12 },
  openSpotify: { alignItems: 'center', backgroundColor: spotifyGreen, borderRadius: 999, justifyContent: 'center', minHeight: 26, paddingHorizontal: 9 },
  openSpotifyLight: { backgroundColor: spotifyBlack },
  openSpotifyText: { color: spotifyBlack, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  openSpotifyTextLight: { color: '#FFFFFF' },
  queue: { alignSelf: 'center', flex: 1, width: '90%' },
  queueContent: { paddingBottom: 22 },
  queueRow: { alignItems: 'center', flexDirection: 'row', gap: 9, minHeight: 58, paddingHorizontal: 6, paddingVertical: 8 },
  currentQueueRow: { backgroundColor: 'rgba(255,255,255,0.055)', borderCurve: 'continuous', borderRadius: 14, marginVertical: 5, minHeight: 48, paddingHorizontal: 14, paddingVertical: 4 },
  currentQueueRowLight: { backgroundColor: 'rgba(255,255,255,0.42)', shadowColor: '#111110', shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.08, shadowRadius: 11 },
  queueRowPressed: { opacity: 0.66 },
  currentDot: { backgroundColor: spotifyGreen, borderRadius: 3, height: 6, marginLeft: -4, width: 6 },
  queueCopy: { flex: 1, minWidth: 0 },
  currentQueueCopy: { paddingLeft: 4 },
  queueTitle: { fontSize: 13, fontWeight: '600', lineHeight: 16 },
  queueArtist: { fontSize: 11, lineHeight: 13, marginTop: 3 },
  queueTime: { fontSize: 11, fontVariant: ['tabular-nums'], lineHeight: 14, paddingLeft: 8 },
  centeredState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  loadingDots: { alignItems: 'center', flexDirection: 'row', gap: 7, height: 32, marginBottom: 15, marginTop: 26 },
  loadingDot: { borderRadius: 4, height: 7, opacity: 0.55, width: 7 },
  stateTitle: { fontSize: 23, fontWeight: '700', letterSpacing: -0.8, lineHeight: 28, marginTop: 20, textAlign: 'center' },
  stateDetail: { fontSize: 12, lineHeight: 19, marginTop: 10, maxWidth: 300, textAlign: 'center' },
  greenButton: { alignItems: 'center', backgroundColor: spotifyGreen, borderRadius: 999, justifyContent: 'center', marginTop: 22, minHeight: 51, minWidth: 170, paddingHorizontal: 24 },
  connectButton: { flexDirection: 'row', gap: 9, marginTop: 28, minWidth: 210, paddingHorizontal: 27 },
  greenButtonText: { color: '#0C0C0C', fontSize: 14, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', borderRadius: 999, borderWidth: 1, justifyContent: 'center', marginTop: 8, minHeight: 46, paddingHorizontal: 19 },
  secondaryButtonText: { fontSize: 12, fontWeight: '700' },
  errorMessage: { backgroundColor: 'rgba(255,90,78,0.12)', borderRadius: 12, bottom: 14, color: '#FFAAA3', fontSize: 11, left: 18, lineHeight: 15, padding: 11, position: 'absolute', right: 18 },
});
