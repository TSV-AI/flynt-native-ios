import { LifecyclePlaceholder } from '@/components/lifecycle-placeholder';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

export default function BuildAttentionScreen() {
  const { retry } = useLifecycleNavigation();
  return (
    <LifecyclePlaceholder
      actionLabel="Try Again"
      eyebrow="PROGRAM NEEDS ATTENTION"
      title="We couldn&apos;t finish your plan."
      body="Your reviewed information is safe. Try again to reconnect to the authoritative build workflow."
      onAction={retry}
    />
  );
}
