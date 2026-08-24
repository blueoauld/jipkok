// 안 쓰는 Material Symbols 폰트 940KB를 안드로이드 번들에서 뺀다.
process.env.EXPO_ROUTER_DISABLE_NATIVE_TABS_MD = "1";

const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
