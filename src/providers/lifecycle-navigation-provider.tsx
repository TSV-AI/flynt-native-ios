import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState as NativeAppState } from 'react-native';

import {
  appStateSchema,
  lifecycleStatusSchema,
  type AppState,
  type LifecycleStatus,
} from '@/contracts/app-state';
import { fetchAppState } from '@/lib/api-client';
import {
  accessTokenFromStoredSession,
  AuthoritativeBootError,
  resolveAuthoritativeBoot,
} from '@/lib/authoritative-boot';
import { clearSecureSession, readSecureSession } from '@/lib/secure-session';
import { signOutFromSupabase } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-client';
import {
  destinationForLifecycle,
  type LifecycleDestination,
} from '@/navigation/lifecycle';

export type LifecycleBootPhase = 'loading' | 'ready' | 'error';

type LifecycleNavigationValue = {
  appState: AppState | null;
  bootError: AuthoritativeBootError | null;
  destination: LifecycleDestination;
  hasSession: boolean;
  phase: LifecycleBootPhase;
  refresh: () => Promise<void>;
  retry: () => void;
  signOut: () => Promise<void>;
};

const LifecycleNavigationContext = createContext<LifecycleNavigationValue | null>(null);

type LifecycleNavigationProviderProps = PropsWithChildren<{
  lifecycle?: LifecycleStatus;
}>;

function developmentPreviewLifecycle(): LifecycleStatus | undefined {
  if (!__DEV__) return undefined;
  const parsed = lifecycleStatusSchema.safeParse(process.env.EXPO_PUBLIC_FLYNT_PREVIEW);
  return parsed.success ? parsed.data : undefined;
}

function developmentPreviewAppState(lifecycle: LifecycleStatus): AppState | null {
  if (!__DEV__ || (lifecycle !== 'consultation_required' && lifecycle !== 'consultation_in_progress')) return null;
  return appStateSchema.parse({
    lifecycle,
    profile: {
      fullName: '', age: null, heightInches: null, currentWeightLb: null,
      email: 'preview@flynt.local', avatarUrl: null, trainerReport: {}, consultationSnapshot: {},
    },
    preferences: { timeZone: 'America/Los_Angeles' },
    program: null,
    programMeta: null,
    build: null,
    conversation: {
      id: '00000000-0000-4000-8000-000000000001',
      kind: 'consultation',
      messages: [],
    },
    workoutState: { logs: {}, loads: {}, sessions: [], liftHistory: {}, workoutOverrides: {} },
  });
}

export function LifecycleNavigationProvider({
  children,
  lifecycle,
}: LifecycleNavigationProviderProps) {
  const overrideLifecycle = lifecycle ?? developmentPreviewLifecycle();
  const previewAppState = overrideLifecycle ? developmentPreviewAppState(overrideLifecycle) : null;
  const requestIdRef = useRef(0);
  const [phase, setPhase] = useState<LifecycleBootPhase>(overrideLifecycle ? 'ready' : 'loading');
  const [activeLifecycle, setActiveLifecycle] = useState<LifecycleStatus | undefined>(overrideLifecycle);
  const [appState, setAppState] = useState<AppState | null>(previewAppState);
  const [bootError, setBootError] = useState<AuthoritativeBootError | null>(null);
  const [hasSession, setHasSession] = useState(Boolean(overrideLifecycle));

  const runBoot = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setPhase('loading');
    setActiveLifecycle(undefined);
    setAppState(null);
    setBootError(null);
    setHasSession(false);

    try {
      const result = await resolveAuthoritativeBoot({
        clearSession: clearSecureSession,
        fetchState: fetchAppState,
        readSession: readSecureSession,
      });
      if (requestId !== requestIdRef.current) return;

      if (result.kind === 'signed-out') {
        setPhase('ready');
        return;
      }

      setAppState(result.appState);
      setActiveLifecycle(result.appState.lifecycle);
      setHasSession(true);
      setPhase('ready');
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setBootError(error instanceof AuthoritativeBootError
        ? error
        : new AuthoritativeBootError('unknown'));
      setHasSession(true);
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    if (overrideLifecycle) return;
    const timeout = setTimeout(() => {
      void runBoot();
    }, 0);
    return () => clearTimeout(timeout);
  }, [overrideLifecycle, runBoot]);

  useEffect(() => {
    if (overrideLifecycle || !isSupabaseConfigured()) return;
    const auth = getSupabaseClient().auth;

    if (NativeAppState.currentState === 'active') auth.startAutoRefresh();
    const subscription = NativeAppState.addEventListener('change', (state) => {
      if (state === 'active') auth.startAutoRefresh();
      else auth.stopAutoRefresh();
    });

    return () => {
      subscription.remove();
      auth.stopAutoRefresh();
    };
  }, [overrideLifecycle]);

  const signOut = useCallback(async () => {
    requestIdRef.current += 1;
    setActiveLifecycle(undefined);
    setAppState(null);
    setBootError(null);
    setHasSession(false);
    setPhase('ready');
    try {
      if (isSupabaseConfigured()) await signOutFromSupabase();
    } finally {
      await clearSecureSession();
    }
  }, []);

  const refresh = useCallback(async () => {
    if (overrideLifecycle) return;
    const session = await readSecureSession();
    if (!session) return;
    const nextState = await fetchAppState(accessTokenFromStoredSession(session));
    setAppState(nextState);
    setActiveLifecycle(nextState.lifecycle);
    setHasSession(true);
    setBootError(null);
  }, [overrideLifecycle]);

  const value = useMemo<LifecycleNavigationValue>(
    () => ({
      appState,
      bootError,
      destination: activeLifecycle ? destinationForLifecycle(activeLifecycle) : 'signed-out',
      hasSession,
      phase,
      refresh,
      retry: () => {
        if (!overrideLifecycle) void runBoot();
      },
      signOut,
    }),
    [activeLifecycle, appState, bootError, hasSession, overrideLifecycle, phase, refresh, runBoot, signOut],
  );

  return (
    <LifecycleNavigationContext.Provider value={value}>
      {children}
    </LifecycleNavigationContext.Provider>
  );
}

export function useLifecycleNavigation() {
  const value = useContext(LifecycleNavigationContext);
  if (!value) {
    throw new Error('useLifecycleNavigation must be used inside LifecycleNavigationProvider.');
  }
  return value;
}
