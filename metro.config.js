// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .wasm to asset extensions so expo-sqlite web worker can resolve wa-sqlite.wasm
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'wasm'];

module.exports = config;
