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
  lifecycleStatusSchema,
  type AppState,
  type LifecycleStatus,
} from '@/contracts/app-state';
import { fetchAppState } from '@/lib/api-client';
import {
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

export function LifecycleNavigationProvider({
  children,
  lifecycle,
}: LifecycleNavigationProviderProps) {
  const overrideLifecycle = lifecycle ?? developmentPreviewLifecycle();
  const requestIdRef = useRef(0);
  const [phase, setPhase] = useState<LifecycleBootPhase>(overrideLifecycle ? 'ready' : 'loading');
  const [activeLifecycle, setActiveLifecycle] = useState<LifecycleStatus | undefined>(overrideLifecycle);
  const [appState, setAppState] = useState<AppState | null>(null);
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

  const value = useMemo<LifecycleNavigationValue>(
    () => ({
      appState,
      bootError,
      destination: activeLifecycle ? destinationForLifecycle(activeLifecycle) : 'signed-out',
      hasSession,
      phase,
      retry: () => {
        if (!overrideLifecycle) void runBoot();
      },
      signOut,
    }),
    [activeLifecycle, appState, bootError, hasSession, overrideLifecycle, phase, runBoot, signOut],
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
