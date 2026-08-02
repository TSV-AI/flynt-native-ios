import Security
import SpotifyiOS
import UIKit
import CoreImage

final class FlyntSpotifyService: NSObject, SPTAppRemoteDelegate, SPTAppRemotePlayerStateDelegate {
  static let shared = FlyntSpotifyService()
  static let stateDidChange = Notification.Name("FlyntSpotifyStateDidChange")

  private let tokenAccount = "spotify-app-remote-access-token"
  private let tokenService = "com.threesixtyvue.flynt"
  private var appRemote: SPTAppRemote?
  private var artworkColorHex: String?
  private var artworkPaletteHex: [String] = []
  private var artworkDataUri: String?
  private var latestPlayerState: (any SPTAppRemotePlayerState)?
  private var status = "unconfigured"
  private var errorMessage: String?

  private override init() {
    super.init()
  }

  var state: [String: Any?] {
    [
      "configured": appRemote != nil,
      "connected": appRemote?.isConnected ?? false,
      "errorMessage": errorMessage,
      "installed": canOpenSpotify,
      "player": latestPlayerState.map(playerDictionary),
      "status": status,
    ]
  }

  func configure(clientId: String, redirectUri: String) {
    let cleanClientId = clientId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !cleanClientId.isEmpty else {
      fail("Spotify client ID is missing.")
      return
    }
    guard let redirectURL = URL(string: redirectUri), redirectURL.scheme != nil else {
      fail("Spotify redirect URI is invalid.")
      return
    }

    let configuration = SPTConfiguration(clientID: cleanClientId, redirectURL: redirectURL)
    let remote = SPTAppRemote(configuration: configuration, logLevel: .error)
    remote.delegate = self
    remote.connectionParameters.accessToken = readToken()
    appRemote = remote
    status = canOpenSpotify ? "disconnected" : "unavailable"
    errorMessage = nil
    publishState()
  }

  func authorize(completion: @escaping (Bool) -> Void) {
    guard let appRemote else {
      fail("Spotify has not been configured.")
      completion(false)
      return
    }
    status = "authorizing"
    errorMessage = nil
    publishState()
    appRemote.authorizeAndPlayURI("") { [weak self] installed in
      guard let self else { return }
      if !installed {
        self.status = "unavailable"
        self.errorMessage = "Install Spotify to control playback from FLYNT."
        self.publishState()
      }
      completion(installed)
    }
  }

  func connect() {
    guard let appRemote else {
      fail("Spotify has not been configured.")
      return
    }
    guard canOpenSpotify else {
      status = "unavailable"
      errorMessage = "Install Spotify to control playback from FLYNT."
      publishState()
      return
    }
    guard appRemote.connectionParameters.accessToken != nil else {
      authorize { _ in }
      return
    }
    status = "connecting"
    errorMessage = nil
    publishState()
    appRemote.connect()
  }

  func disconnect() {
    appRemote?.disconnect()
    latestPlayerState = nil
    artworkColorHex = nil
    artworkPaletteHex = []
    artworkDataUri = nil
    status = canOpenSpotify ? "disconnected" : "unavailable"
    publishState()
  }

  func handleAuthorizationCallback(_ url: URL) -> Bool {
    guard let appRemote,
          let parameters = appRemote.authorizationParameters(from: url) else {
      return false
    }

    if let token = parameters[SPTAppRemoteAccessTokenKey] {
      appRemote.connectionParameters.accessToken = token
      storeToken(token)
      status = "connecting"
      errorMessage = nil
      publishState()
      appRemote.connect()
    } else {
      status = "error"
      errorMessage = parameters[SPTAppRemoteErrorDescriptionKey] ?? "Spotify authorization failed."
      publishState()
    }
    return true
  }

  func applicationDidBecomeActive() {
    guard let appRemote, !appRemote.isConnected, appRemote.connectionParameters.accessToken != nil else { return }
    connect()
  }

  func applicationWillResignActive() {
    guard appRemote?.isConnected == true else { return }
    appRemote?.disconnect()
  }

  func openSpotify(completion: @escaping (Bool) -> Void) {
    guard let url = URL(string: "spotify:") else {
      completion(false)
      return
    }
    UIApplication.shared.open(url, options: [:], completionHandler: completion)
  }

  func play(uri: String) {
    playerAPI?.play(uri, callback: operationCallback)
  }

  func resume() {
    playerAPI?.resume(operationCallback)
  }

  func pause() {
    playerAPI?.pause(operationCallback)
  }

  func previous() {
    playerAPI?.skip(toPrevious: operationCallback)
  }

  func next() {
    playerAPI?.skip(toNext: operationCallback)
  }

  func seek(positionMs: Int) {
    playerAPI?.seek(toPosition: max(0, positionMs), callback: operationCallback)
  }

  func setShuffle(enabled: Bool) {
    playerAPI?.setShuffle(enabled, callback: operationCallback)
  }

  func appRemoteDidEstablishConnection(_ appRemote: SPTAppRemote) {
    status = "connected"
    errorMessage = nil
    appRemote.playerAPI?.delegate = self
    appRemote.playerAPI?.subscribe(toPlayerState: operationCallback)
    appRemote.playerAPI?.getPlayerState { [weak self] result, error in
      if let error {
        self?.fail(error.localizedDescription)
      } else if let playerState = result as? any SPTAppRemotePlayerState {
        self?.playerStateDidChange(playerState)
      }
    }
    publishState()
  }

  func appRemote(_ appRemote: SPTAppRemote, didFailConnectionAttemptWithError error: Error?) {
    fail(error?.localizedDescription ?? "Spotify could not connect.")
  }

  func appRemote(_ appRemote: SPTAppRemote, didDisconnectWithError error: Error?) {
    latestPlayerState = nil
    artworkColorHex = nil
    artworkPaletteHex = []
    artworkDataUri = nil
    status = error == nil ? "disconnected" : "error"
    errorMessage = error?.localizedDescription
    publishState()
  }

  func playerStateDidChange(_ playerState: any SPTAppRemotePlayerState) {
    let trackChanged = latestPlayerState?.track.uri != playerState.track.uri
    latestPlayerState = playerState
    if trackChanged {
      artworkColorHex = nil
      artworkPaletteHex = []
      artworkDataUri = nil
      fetchArtwork(for: playerState.track)
    }
    publishState()
  }

  private var canOpenSpotify: Bool {
    guard let url = URL(string: "spotify:") else { return false }
    return UIApplication.shared.canOpenURL(url)
  }

  private var playerAPI: (any SPTAppRemotePlayerAPI)? {
    guard let appRemote, appRemote.isConnected, let playerAPI = appRemote.playerAPI else {
      fail("Connect Spotify before using playback controls.")
      return nil
    }
    return playerAPI
  }

  private lazy var operationCallback: SPTAppRemoteCallback = { [weak self] _, error in
    if let error {
      self?.fail(error.localizedDescription)
    }
  }

  private func fetchArtwork(for track: any SPTAppRemoteTrack) {
    appRemote?.imageAPI?.fetchImage(forItem: track, with: CGSize(width: 600, height: 600)) { [weak self] result, _ in
      guard let self, let image = result as? UIImage, let data = image.jpegData(compressionQuality: 0.82) else { return }
      self.artworkColorHex = self.representativeColorHex(for: image)
      self.artworkPaletteHex = self.representativePaletteHex(for: image)
      self.artworkDataUri = "data:image/jpeg;base64,\(data.base64EncodedString())"
      self.publishState()
    }
  }

  private func representativeColorHex(for image: UIImage) -> String? {
    guard let input = CIImage(image: image) else { return nil }
    return averageColorHex(in: input.extent, from: input)
  }

  private func representativePaletteHex(for image: UIImage) -> [String] {
    guard let input = CIImage(image: image) else { return [] }
    let extent = input.extent
    let regions = [
      CGRect(x: extent.minX, y: extent.midY, width: extent.width * 0.58, height: extent.height * 0.5),
      CGRect(x: extent.minX + extent.width * 0.42, y: extent.minY + extent.height * 0.28, width: extent.width * 0.58, height: extent.height * 0.48),
      CGRect(x: extent.minX, y: extent.minY, width: extent.width, height: extent.height * 0.34),
    ]
    return regions.compactMap { averageColorHex(in: $0, from: input) }
  }

  private func averageColorHex(in extent: CGRect, from input: CIImage) -> String? {
    guard let filter = CIFilter(name: "CIAreaAverage") else { return nil }
    filter.setValue(input, forKey: kCIInputImageKey)
    filter.setValue(CIVector(cgRect: extent), forKey: kCIInputExtentKey)
    guard let output = filter.outputImage else { return nil }

    var rgba = [UInt8](repeating: 0, count: 4)
    CIContext(options: [.workingColorSpace: NSNull()]).render(
      output,
      toBitmap: &rgba,
      rowBytes: 4,
      bounds: CGRect(x: 0, y: 0, width: 1, height: 1),
      format: .RGBA8,
      colorSpace: CGColorSpaceCreateDeviceRGB()
    )
    return String(format: "#%02X%02X%02X", rgba[0], rgba[1], rgba[2])
  }

  private func playerDictionary(_ playerState: any SPTAppRemotePlayerState) -> [String: Any?] {
    let track = playerState.track
    return [
      "canSeek": playerState.playbackRestrictions.canSeek,
      "canSkipNext": playerState.playbackRestrictions.canSkipNext,
      "canSkipPrevious": playerState.playbackRestrictions.canSkipPrevious,
      "canToggleShuffle": playerState.playbackRestrictions.canToggleShuffle,
      "contextTitle": playerState.contextTitle,
      "contextUri": playerState.contextURI.absoluteString,
      "isPaused": playerState.isPaused,
      "isShuffling": playerState.playbackOptions.isShuffling,
      "playbackPositionMs": playerState.playbackPosition,
      "track": [
        "album": track.album.name,
        "artist": track.artist.name,
        "artworkColorHex": artworkColorHex,
        "artworkPaletteHex": artworkPaletteHex,
        "artworkDataUri": artworkDataUri,
        "durationMs": track.duration,
        "isAdvertisement": track.isAdvertisement,
        "isEpisode": track.isEpisode,
        "isPodcast": track.isPodcast,
        "isSaved": track.isSaved,
        "name": track.name,
        "uri": track.uri,
      ],
    ]
  }

  private func fail(_ message: String) {
    status = "error"
    errorMessage = message
    publishState()
  }

  private func publishState() {
    NotificationCenter.default.post(
      name: Self.stateDidChange,
      object: self,
      userInfo: ["state": state]
    )
  }

  private func readToken() -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: tokenService,
      kSecAttrAccount as String: tokenAccount,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne,
    ]
    var result: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
          let data = result as? Data else { return nil }
    return String(data: data, encoding: .utf8)
  }

  private func storeToken(_ token: String) {
    let key: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: tokenService,
      kSecAttrAccount as String: tokenAccount,
    ]
    SecItemDelete(key as CFDictionary)
    var item = key
    item[kSecValueData as String] = Data(token.utf8)
    item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
    SecItemAdd(item as CFDictionary, nil)
  }
}
