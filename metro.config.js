const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Firebase 10+ requiere soporte para .cjs y .mjs
config.resolver.sourceExts.push('cjs', 'mjs');
config.resolver.unstable_enablePackageExports = false;

// Forzar la resolución de dependencias problemáticas de Node.js polyfills
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'util': path.resolve(__dirname, 'node_modules/util'),
    'is-arguments': path.resolve(__dirname, 'node_modules/is-arguments'),
};

module.exports = config;
