require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name             = 'FlyntElevenLabsOrb'
  s.version          = package['version']
  s.summary          = package['description']
  s.description      = package['description']
  s.license          = { :type => 'Apache-2.0' }
  s.author           = 'FLYNT'
  s.homepage         = 'https://flynt.training'
  s.platforms        = { :ios => '16.4' }
  s.swift_version    = '5.9'
  s.source           = { :path => '.' }
  s.source_files     = '*.{h,m,swift}'
  s.resource_bundles = { 'FlyntElevenLabsOrbResources' => ['OrbShader.metal'] }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

end
