// Metro only sees files inside mobile/ by default. The app also reads
// ../contract (types.ts and fixtures.json), the single source of truth
// shared with the server and the admin panel, so Metro has to watch it.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.watchFolders = [path.resolve(__dirname, '../contract')];

module.exports = config;
