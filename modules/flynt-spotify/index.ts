import { NativeModule, requireOptionalNativeModule } from 'expo';

export type SpotifyConnectionStatus =
  | 'unconfigured'
  | 'disconnected'
  | 'authorizing'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'error';

export type SpotifyTrack = {
  album: string;
  artist: string;
  artworkColorHex: string | null;
  artworkPaletteHex: string[];
  artworkDataUri: string | null;
  durationMs: number;
  isAdvertisement: boolean;
  isEpisode: boolean;
  isPodcast: boolean;
  isSaved: boolean;
  name: string;
  uri: string;
};

export type SpotifyPlayerState = {
  canSeek: boolean;
  canSkipNext: boolean;
  canSkipPrevious: boolean;
  canToggleShuffle: boolean;
  contextTitle: string;
  contextUri: string;
  isPaused: boolean;
  isShuffling: boolean;
  playbackPositionMs: number;
  track: SpotifyTrack;
};

export type SpotifyState = {
  configured: boolean;
  connected: boolean;
  errorMessage: string | null;
  installed: boolean;
  player: SpotifyPlayerState | null;
  status: SpotifyConnectionStatus;
};

type SpotifyEvents = {
  onStateChange(event: SpotifyState): void;
};

declare class FlyntSpotifyNativeModule extends NativeModule<SpotifyEvents> {
  authorize(): Promise<boolean>;
  configure(clientId: string, redirectUri: string): Promise<SpotifyState>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getState(): Promise<SpotifyState>;
  next(): Promise<void>;
  openSpotify(): Promise<boolean>;
  pause(): Promise<void>;
  play(uri: string): Promise<void>;
  previous(): Promise<void>;
  resume(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  setShuffle(enabled: boolean): Promise<void>;
}

export default requireOptionalNativeModule<FlyntSpotifyNativeModule>('FlyntSpotify');
