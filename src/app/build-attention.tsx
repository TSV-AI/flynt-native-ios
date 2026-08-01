import { LifecyclePlaceholder } from '@/components/lifecycle-placeholder';

export default function BuildAttentionScreen() {
  return (
    <LifecyclePlaceholder
      eyebrow="PROGRAM NEEDS ATTENTION"
      title="We couldn&apos;t finish your plan."
      body="Your reviewed information is safe. Retry will reconnect to the authoritative build workflow in the program-building milestone."
    />
  );
}
