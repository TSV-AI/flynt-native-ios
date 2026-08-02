import ExpoModulesCore
import UIKit

public final class FlyntSpotifyAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    FlyntSpotifyService.shared.handleAuthorizationCallback(url)
  }

  public func applicationDidBecomeActive(_ application: UIApplication) {
    FlyntSpotifyService.shared.applicationDidBecomeActive()
  }

  public func applicationWillResignActive(_ application: UIApplication) {
    FlyntSpotifyService.shared.applicationWillResignActive()
  }
}
