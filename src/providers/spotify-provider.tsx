import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import FlyntSpotify, { type SpotifyState } from '../../modules/flynt-spotify';

const initialState: SpotifyState = {
  configured: false,
  connected: false,
  errorMessage: null,
  installed: false,
  player: null,
  status: 'unconfigured',
};

type SpotifyContextValue = {
  authorize: () => Promise<void>;
  connect: () => Promise<void>;
  next: () => Promise<void>;
  openSpotify: () => Promise<void>;
  pause: () => Promise<void>;
  play: (uri: string) => Promise<void>;
  previous: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setShuffle: (enabled: boolean) => Promise<void>;
  state: SpotifyState;
};

const SpotifyContext = createContext<SpotifyContextValue | null>(null);

export function SpotifyProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (!FlyntSpotify) return;
    const subscription = FlyntSpotify.addListener('onStateChange', setState);
    const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID?.trim();
    if (clientId) {
      void FlyntSpotify.configure(clientId, 'flynt://spotify-callback').then(setState);
    } else {
      void FlyntSpotify.getState().then(setState);
    }
    return () => subscription.remove();
  }, []);

  const value = useMemo<SpotifyContextValue>(() => ({
    authorize: async () => {
      if (!FlyntSpotify) return;
      await FlyntSpotify.authorize();
    },
    connect: async () => { await FlyntSpotify?.connect(); },
    next: async () => { await FlyntSpotify?.next(); },
    openSpotify: async () => { await FlyntSpotify?.openSpotify(); },
    pause: async () => { await FlyntSpotify?.pause(); },
    play: async (uri) => { await FlyntSpotify?.play(uri); },
    previous: async () => { await FlyntSpotify?.previous(); },
    resume: async () => { await FlyntSpotify?.resume(); },
    seek: async (positionMs) => { await FlyntSpotify?.seek(positionMs); },
    setShuffle: async (enabled) => { await FlyntSpotify?.setShuffle(enabled); },
    state,
  }), [state]);

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (!context) throw new Error('useSpotify must be used within SpotifyProvider');
  return context;
}
