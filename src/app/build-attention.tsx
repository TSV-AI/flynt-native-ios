import { useRef, useState } from 'react';

import { LifecyclePlaceholder } from '@/components/lifecycle-placeholder';
import { ApiError, recoverProgramBuild } from '@/lib/api-client';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

export default function BuildAttentionScreen() {
  const { refresh } = useLifecycleNavigation();
  const recoveryInFlight = useRef(false);
  const [recovering, setRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  async function retryBuild() {
    if (recoveryInFlight.current) return;
    recoveryInFlight.current = true;
    setRecovering(true);
    setRecoveryError(null);
    try {
      await recoverProgramBuild();
      await refresh();
    } catch (error) {
      setRecoveryError(error instanceof ApiError
        ? error.message
        : 'FLYNT could not restart your program. Your reviewed information is still safe.');
    } finally {
      recoveryInFlight.current = false;
      setRecovering(false);
    }
  }

  return (
    <LifecyclePlaceholder
      actionDisabled={recovering}
      actionLabel={recovering ? 'Trying Again…' : 'Try Again'}
      eyebrow="PROGRAM NEEDS ATTENTION"
      title="We couldn&apos;t finish your plan."
      body={recoveryError ?? 'Your reviewed information is safe. Try again to reconnect to the authoritative build workflow.'}
      onAction={retryBuild}
    />
  );
}
