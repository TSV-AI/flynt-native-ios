import ExpoModulesCore
import GoogleSignIn

// GoogleSignIn's public kGIDSignInErrorCodeCanceled constant is not imported
// into Swift, but its documented raw value is stable in the SDK header.
private let googleSignInCancelledErrorCode = -5

private final class GoogleSignInCancelledException: Exception, @unchecked Sendable {
  override var code: String {
    "ERR_REQUEST_CANCELED"
  }

  override var reason: String {
    "The Google sign-in request was cancelled."
  }
}

private final class GoogleSignInUnavailableException: Exception, @unchecked Sendable {
  override var reason: String {
    "Google sign-in could not find a view controller to present from."
  }
}

private final class GoogleIdentityTokenMissingException: Exception, @unchecked Sendable {
  override var reason: String {
    "Google did not return an identity token."
  }
}

public final class FlyntGoogleAuthModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FlyntGoogleAuth")

    AsyncFunction("configure") { (iosClientId: String, serverClientId: String) in
      GIDSignIn.sharedInstance.configuration = GIDConfiguration(
        clientID: iosClientId,
        serverClientID: serverClientId
      )
    }.runOnQueue(.main)

    AsyncFunction("signIn") { (hashedNonce: String, promise: Promise) in
      guard let presentingViewController = self.appContext?.utilities?.currentViewController() else {
        promise.reject(GoogleSignInUnavailableException())
        return
      }

      GIDSignIn.sharedInstance.signIn(
        withPresenting: presentingViewController,
        hint: nil,
        additionalScopes: nil,
        nonce: hashedNonce
      ) { result, error in
        if let error = error as NSError? {
          if error.domain == kGIDSignInErrorDomain && error.code == googleSignInCancelledErrorCode {
            promise.reject(GoogleSignInCancelledException())
          } else {
            promise.reject(error)
          }
          return
        }

        guard let idToken = result?.user.idToken?.tokenString else {
          promise.reject(GoogleIdentityTokenMissingException())
          return
        }

        promise.resolve(["idToken": idToken])
      }
    }.runOnQueue(.main)

    AsyncFunction("signOut") {
      GIDSignIn.sharedInstance.signOut()
    }.runOnQueue(.main)
  }
}
