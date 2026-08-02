require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name             = 'FlyntSpotify'
  s.version          = package['version']
  s.summary          = package['description']
  s.description      = package['description']
  s.license          = { :type => 'Proprietary' }
  s.author           = 'FLYNT'
  s.homepage         = 'https://github.com/TSV-AI/flynt-native-ios'
  s.platforms        = { :ios => '16.4' }
  s.swift_version    = '5.9'
  s.source           = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # Keep the vendored Spotify SDK headers inside its own module. Including them
  # in this pod's source glob makes CocoaPods copy them into FlyntSpotify's
  # generated umbrella header, where their relative imports cannot resolve.
  s.source_files = '*.{h,m,swift}'
  s.vendored_frameworks = 'SpotifyiOS.xcframework'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
