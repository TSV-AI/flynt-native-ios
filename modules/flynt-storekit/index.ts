import { NativeModule, requireOptionalNativeModule } from 'expo';

export type StoreKitPeriodUnit = 'day' | 'week' | 'month' | 'year' | 'unknown';
export type StoreKitPurchaseState = 'cancelled' | 'pending' | 'purchased';

export type StoreKitSubscriptionPeriod = {
  unit: StoreKitPeriodUnit;
  value: number;
};

export type StoreKitIntroductoryOffer = {
  displayPrice: string;
  paymentMode: 'free_trial' | 'pay_as_you_go' | 'pay_up_front' | 'unknown';
  period: StoreKitSubscriptionPeriod;
};

export type StoreKitProduct = {
  description: string;
  displayName: string;
  displayPrice: string;
  id: string;
  isEligibleForIntroOffer: boolean;
  subscription: {
    introductoryOffer: StoreKitIntroductoryOffer | null;
    period: StoreKitSubscriptionPeriod;
  } | null;
  type: 'auto_renewable' | 'consumable' | 'non_consumable' | 'non_renewable' | 'unknown';
};

export type StoreKitTransaction = {
  appAccountToken: string | null;
  expirationDate: string | null;
  id: string;
  jwsRepresentation: string;
  originalId: string;
  productId: string;
  purchaseDate: string;
  revocationDate: string | null;
};

export type StoreKitPurchaseResult = {
  state: StoreKitPurchaseState;
  transaction: StoreKitTransaction | null;
};

export type StoreKitErrorEvent = {
  code: string;
  message: string;
};

type StoreKitEvents = {
  onTransactionError(event: StoreKitErrorEvent): void;
  onTransactionUpdate(event: StoreKitTransaction): void;
};

export declare class FlyntStoreKitNativeModule extends NativeModule<StoreKitEvents> {
  canMakePayments(): Promise<boolean>;
  currentEntitlements(productIds: string[]): Promise<StoreKitTransaction[]>;
  finishTransaction(transactionId: string): Promise<void>;
  getProducts(productIds: string[]): Promise<StoreKitProduct[]>;
  purchase(productId: string, appAccountToken: string): Promise<StoreKitPurchaseResult>;
  showManageSubscriptions(): Promise<void>;
  sync(): Promise<void>;
  unfinishedTransactions(productIds: string[]): Promise<StoreKitTransaction[]>;
}

export default requireOptionalNativeModule<FlyntStoreKitNativeModule>('FlyntStoreKit');
