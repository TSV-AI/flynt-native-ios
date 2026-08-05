'use strict';

const { IOSConfig, createRunOncePlugin, withInfoPlist } = require('expo/config-plugins');
const packageJson = require('./package.json');

function withFlyntGoogleAuth(config, options) {
  const scheme = options?.iosUrlScheme;
  if (!scheme || !scheme.startsWith('com.googleusercontent.apps.')) {
    throw new Error('flynt-google-auth requires a valid Google iOS URL scheme.');
  }

  return withInfoPlist(config, (nextConfig) => {
    if (!IOSConfig.Scheme.hasScheme(scheme, nextConfig.modResults)) {
      nextConfig.modResults = IOSConfig.Scheme.appendScheme(scheme, nextConfig.modResults);
    }
    return nextConfig;
  });
}

module.exports = createRunOncePlugin(
  withFlyntGoogleAuth,
  packageJson.name,
  packageJson.version,
);
