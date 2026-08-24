// NativeTabs를 쓰지 않는데도 expo-router가 안드로이드 번들에 Material Symbols 폰트(940KB)를 넣는다.
// 이 플래그를 켜면 Metro 리졸버가 md 아이콘 변환기를 빈 구현으로 바꿔 expo-symbols를 떨궈낸다.
process.env.EXPO_ROUTER_DISABLE_NATIVE_TABS_MD = "1";

const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
