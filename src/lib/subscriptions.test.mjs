import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SubscriptionConfigurationError,
  SubscriptionUnavailableError,
  configuredMonthlySubscriptionProductId,
  createSubscriptionService,
} from './subscriptions.ts';

const productId = 'com.threesixtyvue.flynt.subscription.monthly';
const appAccountToken = 'eaa3fa7e-8f44-47bf-9ea7-d56356c43013';
const transaction = {
  appAccountToken,
  expirationDate: '2026-09-06T19:00:00Z',
  id: '2000000123456789',
  jwsRepresentation: 'eyJhbGciOiJFUzI1NiJ9.eyJ0cmFuc2FjdGlvbklkIjoiMSJ9.signature',
  originalId: '2000000123456000',
  productId,
  purchaseDate: '2026-08-06T19:00:00Z',
  revocationDate: null,
};

function mockBridge(overrides = {}) {
  return {
    addListener() { return { remove() {} }; },
    async canMakePayments() { return true; },
    async currentEntitlements() { return [transaction]; },
    async finishTransaction() {},
    async getProducts() {
      return [{
        description: 'Personalized strength training.',
        displayName: 'FLYNT Monthly',
        displayPrice: '$19.99',
        id: productId,
        isEligibleForIntroOffer: true,
        subscription: {
          introductoryOffer: {
            displayPrice: '$0.00',
            paymentMode: 'free_trial',
            period: { unit: 'day', value: 7 },
          },
          period: { unit: 'month', value: 1 },
        },
        type: 'auto_renewable',
      }];
    },
    async purchase() { return { state: 'purchased', transaction }; },
    async showManageSubscriptions() {},
    async sync() {},
    async unfinishedTransactions() { return [transaction]; },
    ...overrides,
  };
}

test('monthly product configuration is explicit and validated', () => {
  assert.equal(configuredMonthlySubscriptionProductId(productId), productId);
  assert.throws(
    () => configuredMonthlySubscriptionProductId(''),
    SubscriptionConfigurationError,
  );
  assert.throws(
    () => configuredMonthlySubscriptionProductId('monthly product'),
    SubscriptionConfigurationError,
  );
});

test('product loading retains App Store price and trial eligibility', async () => {
  const service = createSubscriptionService(mockBridge(), productId);
  const product = await service.loadProduct();
  assert.equal(product.displayPrice, '$19.99');
  assert.equal(product.isEligibleForIntroOffer, true);
  assert.deepEqual(product.subscription?.introductoryOffer?.period, { unit: 'day', value: 7 });
});

test('purchase uses the server-issued account token and does not finish early', async () => {
  const calls = [];
  const service = createSubscriptionService(mockBridge({
    async purchase(receivedProductId, receivedToken) {
      calls.push(['purchase', receivedProductId, receivedToken]);
      return { state: 'purchased', transaction };
    },
    async finishTransaction(id) { calls.push(['finish', id]); },
  }), productId);

  const result = await service.purchase(appAccountToken);
  assert.equal(result.state, 'purchased');
  assert.deepEqual(calls, [['purchase', productId, appAccountToken]]);
});

test('a transaction finishes only after the server accepts its signed JWS', async () => {
  const calls = [];
  const service = createSubscriptionService(mockBridge({
    async finishTransaction(id) { calls.push(['finish', id]); },
  }), productId);

  await service.persistAndFinish(transaction, async (received) => {
    calls.push(['persist', received.jwsRepresentation]);
    return { accepted: true };
  });
  assert.deepEqual(calls, [
    ['persist', transaction.jwsRepresentation],
    ['finish', transaction.id],
  ]);

  await assert.rejects(
    service.persistAndFinish(transaction, async () => {
      throw new Error('server unavailable');
    }),
  );
  assert.equal(calls.filter(([name]) => name === 'finish').length, 1);
});

test('restore syncs Apple before reading current and unfinished transactions', async () => {
  const calls = [];
  const service = createSubscriptionService(mockBridge({
    async sync() { calls.push('sync'); },
    async currentEntitlements() { calls.push('current'); return [transaction]; },
    async unfinishedTransactions() { calls.push('unfinished'); return [transaction]; },
  }), productId);
  const restored = await service.restore();
  assert.equal(calls[0], 'sync');
  assert.equal(restored.currentEntitlements.length, 1);
  assert.equal(restored.unfinishedTransactions.length, 1);
});

test('service reports unavailable when the StoreKit native bridge is absent', async () => {
  const service = createSubscriptionService(null, productId);
  await assert.rejects(service.loadProduct(), SubscriptionUnavailableError);
});
