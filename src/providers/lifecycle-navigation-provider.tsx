import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

import type { LifecycleStatus } from '@/contracts/app-state';
import {
  destinationForLifecycle,
  type LifecycleDestination,
} from '@/navigation/lifecycle';

type LifecycleNavigationValue = {
  destination: LifecycleDestination;
  signOut: () => void;
};

const LifecycleNavigationContext = createContext<LifecycleNavigationValue | null>(null);

type LifecycleNavigationProviderProps = PropsWithChildren<{
  lifecycle?: LifecycleStatus;
}>;

export function LifecycleNavigationProvider({
  children,
  lifecycle,
}: LifecycleNavigationProviderProps) {
  const previewLifecycle = __DEV__ && process.env.EXPO_PUBLIC_FLYNT_PREVIEW === 'ready'
    ? 'ready'
    : undefined;
  const [signedOut, setSignedOut] = useState(false);
  const activeLifecycle = lifecycle ?? previewLifecycle;

  const value = useMemo<LifecycleNavigationValue>(
    () => ({
      destination: signedOut
        ? 'signed-out'
        : activeLifecycle
          ? destinationForLifecycle(activeLifecycle)
          : 'signed-out',
      signOut: () => setSignedOut(true),
    }),
    [activeLifecycle, signedOut],
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
