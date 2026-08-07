import FlyntStoreKit from 'flynt-storekit';

import {
  configuredMonthlySubscriptionProductId,
  createSubscriptionService,
  type StoreKitBridge,
} from '@/lib/subscriptions';

export function nativeSubscriptionService() {
  return createSubscriptionService(
    FlyntStoreKit as StoreKitBridge | null,
    configuredMonthlySubscriptionProductId(),
  );
}
