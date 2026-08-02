import ExpoModulesCore

public final class FlyntSpotifyModule: Module {
  private var stateObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("FlyntSpotify")

    Events("onStateChange")

    OnStartObserving {
      self.stateObserver = NotificationCenter.default.addObserver(
        forName: FlyntSpotifyService.stateDidChange,
        object: FlyntSpotifyService.shared,
        queue: .main
      ) { [weak self] notification in
        guard let state = notification.userInfo?["state"] as? [String: Any?] else { return }
        self?.sendEvent("onStateChange", state)
      }
    }

    OnStopObserving {
      if let stateObserver = self.stateObserver {
        NotificationCenter.default.removeObserver(stateObserver)
        self.stateObserver = nil
      }
    }

    AsyncFunction("configure") { (clientId: String, redirectUri: String) in
      FlyntSpotifyService.shared.configure(clientId: clientId, redirectUri: redirectUri)
      return FlyntSpotifyService.shared.state
    }.runOnQueue(.main)

    AsyncFunction("getState") {
      FlyntSpotifyService.shared.state
    }.runOnQueue(.main)

    AsyncFunction("authorize") { (promise: Promise) in
      FlyntSpotifyService.shared.authorize { installed in
        promise.resolve(installed)
      }
    }.runOnQueue(.main)

    AsyncFunction("connect") {
      FlyntSpotifyService.shared.connect()
    }.runOnQueue(.main)

    AsyncFunction("disconnect") {
      FlyntSpotifyService.shared.disconnect()
    }.runOnQueue(.main)

    AsyncFunction("openSpotify") { (promise: Promise) in
      FlyntSpotifyService.shared.openSpotify { opened in
        promise.resolve(opened)
      }
    }.runOnQueue(.main)

    AsyncFunction("play") { (uri: String) in
      FlyntSpotifyService.shared.play(uri: uri)
    }.runOnQueue(.main)

    AsyncFunction("resume") {
      FlyntSpotifyService.shared.resume()
    }.runOnQueue(.main)

    AsyncFunction("pause") {
      FlyntSpotifyService.shared.pause()
    }.runOnQueue(.main)

    AsyncFunction("previous") {
      FlyntSpotifyService.shared.previous()
    }.runOnQueue(.main)

    AsyncFunction("next") {
      FlyntSpotifyService.shared.next()
    }.runOnQueue(.main)

    AsyncFunction("seek") { (positionMs: Int) in
      FlyntSpotifyService.shared.seek(positionMs: positionMs)
    }.runOnQueue(.main)

    AsyncFunction("setShuffle") { (enabled: Bool) in
      FlyntSpotifyService.shared.setShuffle(enabled: enabled)
    }.runOnQueue(.main)
  }
}
