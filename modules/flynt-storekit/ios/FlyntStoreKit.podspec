require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name             = 'FlyntStoreKit'
  s.version          = package['version']
  s.summary          = package['description']
  s.description      = package['description']
  s.license          = { :type => 'Proprietary' }
  s.author           = 'FLYNT'
  s.homepage         = 'https://flynt.training'
  s.platforms        = { :ios => '16.4' }
  s.swift_version    = '5.9'
  s.source           = { :path => '.' }
  s.source_files     = '*.{h,m,swift}'
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
end
