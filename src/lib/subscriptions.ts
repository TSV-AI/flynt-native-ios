import { z } from 'zod';

import type {
  FlyntStoreKitNativeModule,
  StoreKitErrorEvent,
  StoreKitProduct,
  StoreKitPurchaseResult,
  StoreKitTransaction,
} from 'flynt-storekit';

const productIdSchema = z.string()
  .trim()
  .min(3)
  .max(255)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]+$/);

const subscriptionPeriodSchema = z.object({
  unit: z.enum(['day', 'week', 'month', 'year', 'unknown']),
  value: z.number().int().positive(),
});

const storeKitProductSchema = z.object({
  description: z.string(),
  displayName: z.string().min(1),
  displayPrice: z.string().min(1),
  id: productIdSchema,
  isEligibleForIntroOffer: z.boolean(),
  subscription: z.object({
    introductoryOffer: z.object({
      displayPrice: z.string().min(1),
      paymentMode: z.enum(['free_trial', 'pay_as_you_go', 'pay_up_front', 'unknown']),
      period: subscriptionPeriodSchema,
    }).nullable(),
    period: subscriptionPeriodSchema,
  }).nullable(),
  type: z.enum(['auto_renewable', 'consumable', 'non_consumable', 'non_renewable', 'unknown']),
});

const storeKitTransactionSchema = z.object({
  appAccountToken: z.string().uuid().nullable(),
  expirationDate: z.string().datetime({ offset: true }).nullable(),
  id: z.string().regex(/^\d+$/),
  jwsRepresentation: z.string().regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/),
  originalId: z.string().regex(/^\d+$/),
  productId: productIdSchema,
  purchaseDate: z.string().datetime({ offset: true }),
  revocationDate: z.string().datetime({ offset: true }).nullable(),
});

const storeKitPurchaseResultSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('cancelled'), transaction: z.null() }),
  z.object({ state: z.literal('pending'), transaction: z.null() }),
  z.object({ state: z.literal('purchased'), transaction: storeKitTransactionSchema }),
]);

const storeKitErrorEventSchema = z.object({
  code: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
});

const appAccountTokenSchema = z.string().uuid();

type StoreKitEventSubscription = { remove(): void };

export type StoreKitBridge = Pick<FlyntStoreKitNativeModule,
  | 'canMakePayments'
  | 'currentEntitlements'
  | 'finishTransaction'
  | 'getProducts'
  | 'purchase'
  | 'showManageSubscriptions'
  | 'sync'
  | 'unfinishedTransactions'
> & {
  addListener(
    eventName: 'onTransactionError' | 'onTransactionUpdate',
    listener: (event: unknown) => void,
  ): StoreKitEventSubscription;
};

export type PersistStoreKitTransaction = (
  transaction: StoreKitTransaction,
) => Promise<{ accepted: true }>;

export class SubscriptionConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionConfigurationError';
  }
}

export class SubscriptionUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionUnavailableError';
  }
}

export function configuredMonthlySubscriptionProductId(
  value = process.env.EXPO_PUBLIC_STOREKIT_MONTHLY_PRODUCT_ID,
): string {
  const result = productIdSchema.safeParse(value);
  if (!result.success) {
    throw new SubscriptionConfigurationError(
      'The FLYNT monthly subscription product is not configured for this build.',
    );
  }
  return result.data;
}

export function createSubscriptionService(
  bridge: StoreKitBridge | null,
  monthlyProductId = configuredMonthlySubscriptionProductId(),
) {
  const productId = productIdSchema.parse(monthlyProductId);

  function requireBridge(): StoreKitBridge {
    if (!bridge) {
      throw new SubscriptionUnavailableError(
        'Subscriptions require the FLYNT iOS app with StoreKit support.',
      );
    }
    return bridge;
  }

  return {
    productId,

    async canMakePayments(): Promise<boolean> {
      return requireBridge().canMakePayments();
    },

    async loadProduct(): Promise<StoreKitProduct> {
      const products = z.array(storeKitProductSchema).parse(
        await requireBridge().getProducts([productId]),
      );
      const product = products.find((candidate) => candidate.id === productId);
      if (!product || product.type !== 'auto_renewable' || !product.subscription) {
        throw new SubscriptionUnavailableError(
          'The FLYNT monthly subscription is currently unavailable from the App Store.',
        );
      }
      return product;
    },

    async purchase(appAccountToken: string): Promise<StoreKitPurchaseResult> {
      const token = appAccountTokenSchema.parse(appAccountToken);
      return storeKitPurchaseResultSchema.parse(
        await requireBridge().purchase(productId, token),
      );
    },

    async currentEntitlements(): Promise<StoreKitTransaction[]> {
      return z.array(storeKitTransactionSchema).parse(
        await requireBridge().currentEntitlements([productId]),
      );
    },

    async unfinishedTransactions(): Promise<StoreKitTransaction[]> {
      return z.array(storeKitTransactionSchema).parse(
        await requireBridge().unfinishedTransactions([productId]),
      );
    },

    async restore(): Promise<{
      currentEntitlements: StoreKitTransaction[];
      unfinishedTransactions: StoreKitTransaction[];
    }> {
      const storeKit = requireBridge();
      await storeKit.sync();
      const [currentEntitlements, unfinishedTransactions] = await Promise.all([
        this.currentEntitlements(),
        this.unfinishedTransactions(),
      ]);
      return { currentEntitlements, unfinishedTransactions };
    },

    async persistAndFinish(
      transaction: StoreKitTransaction,
      persist: PersistStoreKitTransaction,
    ): Promise<void> {
      const verifiedTransaction = storeKitTransactionSchema.parse(transaction);
      const result = await persist(verifiedTransaction);
      if (result.accepted !== true) {
        throw new SubscriptionUnavailableError(
          'FLYNT could not confirm the subscription with the server.',
        );
      }
      await requireBridge().finishTransaction(verifiedTransaction.id);
    },

    async showManageSubscriptions(): Promise<void> {
      await requireBridge().showManageSubscriptions();
    },

    observeTransactions({
      onError,
      onTransaction,
    }: {
      onError: (error: StoreKitErrorEvent | Error) => void;
      onTransaction: (transaction: StoreKitTransaction) => void;
    }): StoreKitEventSubscription {
      const storeKit = requireBridge();
      const transactionSubscription = storeKit.addListener('onTransactionUpdate', (event) => {
        const result = storeKitTransactionSchema.safeParse(event);
        if (result.success) onTransaction(result.data);
        else onError(new Error('StoreKit returned an invalid transaction update.'));
      });
      const errorSubscription = storeKit.addListener('onTransactionError', (event) => {
        const result = storeKitErrorEventSchema.safeParse(event);
        onError(result.success ? result.data : new Error('StoreKit returned an invalid error update.'));
      });
      return {
        remove() {
          transactionSubscription.remove();
          errorSubscription.remove();
        },
      };
    },
  };
}

export type SubscriptionService = ReturnType<typeof createSubscriptionService>;
