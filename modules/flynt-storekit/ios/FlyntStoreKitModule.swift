import ExpoModulesCore
import StoreKit
import UIKit

private final class StoreKitConfigurationException: Exception, @unchecked Sendable {
  override var code: String { "ERR_STOREKIT_CONFIGURATION" }
}

private final class StoreKitPurchaseUnavailableException: Exception, @unchecked Sendable {
  override var code: String { "ERR_STOREKIT_PURCHASE_UNAVAILABLE" }
}

private final class StoreKitProductNotFoundException: Exception, @unchecked Sendable {
  override var code: String { "ERR_STOREKIT_PRODUCT_NOT_FOUND" }
}

private final class StoreKitTransactionNotFoundException: Exception, @unchecked Sendable {
  override var code: String { "ERR_STOREKIT_TRANSACTION_NOT_FOUND" }
}

private final class StoreKitUnverifiedTransactionException: Exception, @unchecked Sendable {
  override var code: String { "ERR_STOREKIT_UNVERIFIED_TRANSACTION" }
}

private final class StoreKitPresentationException: Exception, @unchecked Sendable {
  override var code: String { "ERR_STOREKIT_PRESENTATION" }
}

private actor FlyntStoreKitTransactionCache {
  private var transactions: [UInt64: StoreKit.Transaction] = [:]

  func store(_ transaction: StoreKit.Transaction) {
    transactions[transaction.id] = transaction
  }

  func transaction(id: UInt64) -> StoreKit.Transaction? {
    transactions[id]
  }

  func remove(id: UInt64) {
    transactions.removeValue(forKey: id)
  }
}

public final class FlyntStoreKitModule: Module {
  private let transactionCache = FlyntStoreKitTransactionCache()
  private var transactionUpdatesTask: Task<Void, Never>?

  public func definition() -> ModuleDefinition {
    Name("FlyntStoreKit")

    Events("onTransactionUpdate", "onTransactionError")

    OnStartObserving("onTransactionUpdate") {
      self.startTransactionUpdates()
    }

    OnStopObserving("onTransactionUpdate") {
      self.stopTransactionUpdates()
    }

    AsyncFunction("canMakePayments") {
      AppStore.canMakePayments
    }

    AsyncFunction("getProducts") { (productIds: [String]) in
      let requestedProductIds = Set(productIds.filter { !$0.isEmpty })
      guard !requestedProductIds.isEmpty else {
        throw StoreKitConfigurationException(
          name: "StoreKitConfigurationException",
          description: "At least one StoreKit product identifier is required."
        )
      }

      let products = try await Product.products(for: requestedProductIds)
      return await products.asyncMap { product in
        await self.productPayload(product)
      }
    }

    AsyncFunction("purchase") { (productId: String, appAccountToken: String) in
      guard AppStore.canMakePayments else {
        throw StoreKitPurchaseUnavailableException(
          name: "StoreKitPurchaseUnavailableException",
          description: "This Apple Account cannot make purchases."
        )
      }
      guard let accountToken = UUID(uuidString: appAccountToken) else {
        throw StoreKitConfigurationException(
          name: "StoreKitConfigurationException",
          description: "The app account token must be a UUID."
        )
      }
      guard let product = try await Product.products(for: [productId]).first else {
        throw StoreKitProductNotFoundException(
          name: "StoreKitProductNotFoundException",
          description: "The requested StoreKit product is unavailable."
        )
      }

      let result = try await product.purchase(options: [.appAccountToken(accountToken)])
      switch result {
      case .success(let verificationResult):
        let transaction = try await self.transactionPayload(verificationResult)
        return ["state": "purchased", "transaction": transaction]
      case .pending:
        return ["state": "pending", "transaction": NSNull()]
      case .userCancelled:
        return ["state": "cancelled", "transaction": NSNull()]
      @unknown default:
        return ["state": "pending", "transaction": NSNull()]
      }
    }

    AsyncFunction("currentEntitlements") { (productIds: [String]) in
      try await self.transactions(from: StoreKit.Transaction.currentEntitlements, productIds: Set(productIds))
    }

    AsyncFunction("unfinishedTransactions") { (productIds: [String]) in
      try await self.transactions(from: StoreKit.Transaction.unfinished, productIds: Set(productIds))
    }

    AsyncFunction("finishTransaction") { (transactionId: String) in
      guard let id = UInt64(transactionId) else {
        throw StoreKitConfigurationException(
          name: "StoreKitConfigurationException",
          description: "The transaction identifier is invalid."
        )
      }

      if let cachedTransaction = await self.transactionCache.transaction(id: id) {
        await cachedTransaction.finish()
        await self.transactionCache.remove(id: id)
        return
      }

      for await verificationResult in StoreKit.Transaction.unfinished {
        guard case .verified(let transaction) = verificationResult, transaction.id == id else { continue }
        await transaction.finish()
        return
      }
      throw StoreKitTransactionNotFoundException(
        name: "StoreKitTransactionNotFoundException",
        description: "The unfinished StoreKit transaction was not found."
      )
    }

    AsyncFunction("sync") {
      try await AppStore.sync()
    }

    AsyncFunction("showManageSubscriptions") {
      try await self.showManageSubscriptions()
    }
  }

  private func startTransactionUpdates() {
    guard transactionUpdatesTask == nil else { return }
    transactionUpdatesTask = Task { [weak self] in
      for await verificationResult in StoreKit.Transaction.updates {
        guard !Task.isCancelled, let self else { return }
        do {
          let payload = try await self.transactionPayload(verificationResult)
          self.sendEvent("onTransactionUpdate", payload)
        } catch {
          self.sendEvent("onTransactionError", [
            "code": "ERR_STOREKIT_TRANSACTION_UPDATE",
            "message": "A StoreKit transaction update could not be verified."
          ])
        }
      }
    }
  }

  private func stopTransactionUpdates() {
    transactionUpdatesTask?.cancel()
    transactionUpdatesTask = nil
  }

  private func transactions(
    from sequence: StoreKit.Transaction.Transactions,
    productIds: Set<String>
  ) async throws -> [[String: Any?]] {
    var payloads: [[String: Any?]] = []
    for await verificationResult in sequence {
      let transaction = try verifiedTransaction(verificationResult)
      guard productIds.isEmpty || productIds.contains(transaction.productID) else { continue }
      payloads.append(try await transactionPayload(verificationResult))
    }
    return payloads
  }

  private func verifiedTransaction(
    _ verificationResult: VerificationResult<StoreKit.Transaction>
  ) throws -> StoreKit.Transaction {
    switch verificationResult {
    case .verified(let transaction):
      return transaction
    case .unverified:
      throw StoreKitUnverifiedTransactionException(
        name: "StoreKitUnverifiedTransactionException",
        description: "StoreKit could not verify this transaction on the device."
      )
    }
  }

  private func transactionPayload(
    _ verificationResult: VerificationResult<StoreKit.Transaction>
  ) async throws -> [String: Any?] {
    let transaction = try verifiedTransaction(verificationResult)
    await transactionCache.store(transaction)
    return [
      "appAccountToken": transaction.appAccountToken?.uuidString,
      "expirationDate": transaction.expirationDate.map(Self.iso8601String),
      "id": String(transaction.id),
      "jwsRepresentation": verificationResult.jwsRepresentation,
      "originalId": String(transaction.originalID),
      "productId": transaction.productID,
      "purchaseDate": Self.iso8601String(transaction.purchaseDate),
      "revocationDate": transaction.revocationDate.map(Self.iso8601String)
    ]
  }

  private func productPayload(_ product: Product) async -> [String: Any?] {
    let subscription = product.subscription
    let introductoryOffer = subscription?.introductoryOffer
    return [
      "description": product.description,
      "displayName": product.displayName,
      "displayPrice": product.displayPrice,
      "id": product.id,
      "isEligibleForIntroOffer": await subscription?.isEligibleForIntroOffer ?? false,
      "subscription": subscription.map { subscription in
        [
          "introductoryOffer": introductoryOffer.map { offer in
            [
              "displayPrice": offer.displayPrice,
              "paymentMode": Self.paymentMode(offer.paymentMode),
              "period": Self.period(offer.period)
            ]
          },
          "period": Self.period(subscription.subscriptionPeriod)
        ]
      },
      "type": Self.productType(product.type)
    ]
  }

  @MainActor
  private func showManageSubscriptions() async throws {
    guard !ProcessInfo.processInfo.isiOSAppOnMac else {
      throw StoreKitPresentationException(
        name: "StoreKitPresentationException",
        description: "Subscription management is unavailable on this device."
      )
    }
    guard let scene = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene })
      .first(where: { $0.activationState == .foregroundActive }) else {
      throw StoreKitPresentationException(
        name: "StoreKitPresentationException",
        description: "FLYNT could not find an active window for subscription management."
      )
    }
    try await AppStore.showManageSubscriptions(in: scene)
  }

  private static func iso8601String(_ date: Date) -> String {
    ISO8601DateFormatter().string(from: date)
  }

  private static func paymentMode(_ mode: Product.SubscriptionOffer.PaymentMode) -> String {
    switch mode {
    case .freeTrial: "free_trial"
    case .payAsYouGo: "pay_as_you_go"
    case .payUpFront: "pay_up_front"
    default: "unknown"
    }
  }

  private static func period(_ period: Product.SubscriptionPeriod) -> [String: Any] {
    ["unit": periodUnit(period.unit), "value": period.value]
  }

  private static func periodUnit(_ unit: Product.SubscriptionPeriod.Unit) -> String {
    switch unit {
    case .day: "day"
    case .week: "week"
    case .month: "month"
    case .year: "year"
    @unknown default: "unknown"
    }
  }

  private static func productType(_ type: Product.ProductType) -> String {
    switch type {
    case .autoRenewable: "auto_renewable"
    case .consumable: "consumable"
    case .nonConsumable: "non_consumable"
    case .nonRenewable: "non_renewable"
    default: "unknown"
    }
  }
}

private extension Array {
  func asyncMap<T>(_ transform: (Element) async -> T) async -> [T] {
    var values: [T] = []
    values.reserveCapacity(count)
    for element in self {
      values.append(await transform(element))
    }
    return values
  }
}
