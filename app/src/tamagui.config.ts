import { defaultConfig } from "@tamagui/config/v5";
import { animations } from "@tamagui/config/v5-reanimated";
import { createTamagui } from "tamagui";

// 테마 색 채움 위의 흰 글씨다.
const ON_FILL = "white";

// 토스 디자인 시스템(TDS)의 [라이트, 다크] 색이다. TDS 문서 사이트의 CSS 변수에서 옮겼다.
export const TDS_COLORS = {
  grey50: ["#F9FAFB", "#202027"],
  grey100: ["#F2F4F6", "#2C2C35"],
  grey200: ["#E5E8EB", "#3C3C47"],
  grey300: ["#D1D6DB", "#4D4D59"],
  grey400: ["#B0B8C1", "#62626D"],
  grey500: ["#8B95A1", "#7E7E87"],
  grey600: ["#6B7684", "#9E9EA4"],
  grey700: ["#4E5968", "#C3C3C6"],
  grey800: ["#333D4B", "#E4E4E5"],
  grey900: ["#191F28", "#FFFFFF"],
  greyOpacity50: ["rgba(0, 23, 51, 0.02)", "rgba(209, 209, 253, 0.05)"],
  greyOpacity100: ["rgba(2, 32, 71, 0.05)", "rgba(217, 217, 255, 0.11)"],
  greyOpacity200: ["rgba(0, 27, 55, 0.1)", "rgba(222, 222, 255, 0.19)"],
  greyOpacity300: ["rgba(0, 29, 58, 0.18)", "rgba(224, 224, 255, 0.27)"],
  greyOpacity400: ["rgba(0, 25, 54, 0.31)", "rgba(232, 232, 253, 0.36)"],
  greyOpacity500: ["rgba(3, 24, 50, 0.46)", "rgba(242, 242, 255, 0.47)"],
  greyOpacity600: ["rgba(0, 19, 43, 0.58)", "rgba(248, 248, 255, 0.6)"],
  greyOpacity700: ["rgba(3, 18, 40, 0.7)", "rgba(253, 253, 255, 0.75)"],
  greyOpacity800: ["rgba(0, 12, 30, 0.8)", "rgba(253, 253, 254, 0.89)"],
  greyOpacity900: ["rgba(2, 9, 19, 0.91)", "#FFFFFF"],
  blue50: ["#E8F3FF", "#202C4D"],
  blue100: ["#C9E2FF", "#23386A"],
  blue200: ["#90C2FF", "#25478C"],
  blue300: ["#64A8FF", "#265AB3"],
  blue400: ["#4593FC", "#2970D9"],
  blue500: ["#3182F6", "#3485FA"],
  blue600: ["#2272EB", "#449BFF"],
  blue700: ["#1B64DA", "#61B0FF"],
  blue800: ["#1957C2", "#8FCDFF"],
  blue900: ["#194AA6", "#C8E7FF"],
  red50: ["#FFEEEE", "#3C2020"],
  red100: ["#FFD4D6", "#562025"],
  red200: ["#FEAFB4", "#7A242D"],
  red300: ["#FB8890", "#9E2733"],
  red400: ["#F66570", "#CA2F3D"],
  red500: ["#F04452", "#F04251"],
  red600: ["#E42939", "#FA616D"],
  red700: ["#D22030", "#FE818B"],
  red800: ["#BC1B2A", "#FFA8AD"],
  red900: ["#A51926", "#FFD1D3"],
  green50: ["#F0FAF6", "#153729"],
  green100: ["#AEEFD5", "#135338"],
  green200: ["#76E4B8", "#136D47"],
  green300: ["#3FD599", "#138A59"],
  green400: ["#15C47E", "#13A065"],
  green500: ["#03B26C", "#16BB76"],
  green600: ["#02A262", "#26CF88"],
  green700: ["#029359", "#4EE4A6"],
  green800: ["#028450", "#82F6C5"],
  green900: ["#027648", "#CCFFEA"],
  yellow50: ["#FFF9E7", "#3D2D1A"],
  yellow100: ["#FFEFBF", "#724C1E"],
  yellow200: ["#FFE69B", "#B56F1D"],
  yellow300: ["#FFDD78", "#EB8B1E"],
  yellow400: ["#FFD158", "#FFA126"],
  yellow500: ["#FFC342", "#FFB134"],
  yellow600: ["#FFB331", "#FFC259"],
  yellow700: ["#FAA131", "#FFD68A"],
  yellow800: ["#EE8F11", "#FFE5B2"],
  yellow900: ["#DD7D02", "#FFF1D4"],
  // app.json의 스플래시 배경과 같은 값이어야 앱이 켜질 때 색이 튀지 않는다.
  background: ["#FFFFFF", "#17171C"],
  greyBackground: ["#F2F4F6", "#101013"],
  layeredBackground: ["#FFFFFF", "#202027"],
  floatBackground: ["#FFFFFF", "#2C2C35"],
  hairlineBorder: ["#E5E8EB", "#3C3C47"],
  // 목록 행 구분선과 탭 밑줄의 옅은 선이다. TDS 소스의 tHairlineBackground에서 옮겼다.
  hairline: ["rgba(0, 0, 33, 0.07)", "rgba(222, 222, 255, 0.14)"],
  dimmedBackground: ["rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.56)"],
  // 세그먼트 컨트롤의 선택 알약이다. 이름 붙은 CSS 변수가 없어 컴포넌트에서 잰 값이다.
  segmentedIndicator: ["#FFFFFF", "#4D4D59"],
  // TDS 약한 elephant 배지의 면(grey700의 16%)이다. 소스의 tElephantBadgeBackground에서 옮겼다.
  elephantBadgeBackground: [
    "rgba(78, 89, 104, 0.16)",
    "rgba(195, 195, 198, 0.16)",
  ],
  // 눌렀을 때 면 위에 덮는 막이다. 어두운 화면에서는 검정이 안 보이므로 흰 막을 덮는다.
  pressDim: ["rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.12)"],
  blue500Translucent: ["rgba(49, 130, 246, 0.85)", "rgba(52, 133, 250, 0.85)"],
  blue600Translucent: ["rgba(34, 114, 235, 0.85)", "rgba(68, 155, 255, 0.85)"],
} as const;

type TdsColors = Record<keyof typeof TDS_COLORS, string>;

function tdsColors(scheme: "light" | "dark") {
  const index = scheme === "light" ? 0 : 1;

  return Object.fromEntries(
    Object.entries(TDS_COLORS).map(([name, values]) => [name, values[index]]),
  ) as TdsColors;
}

// 서브테마와 컴포넌트 테마는 만들어질 때 부모 테마의 키를 물려받으므로 루트 두 테마에만 넣는다.
function rootTheme(colors: TdsColors) {
  return {
    ...colors,
    color: colors.grey900,
    borderColor: colors.hairlineBorder,
    onFill: ON_FILL,
  };
}

const lightColors = tdsColors("light");
const darkColors = tdsColors("dark");

const bodyFont = defaultConfig.fonts.body;

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations,
  fonts: {
    ...defaultConfig.fonts,
    // $1, $2, $4, $6, $8은 TDS Typography 7, 6, 5, 4, 2다.
    // true는 Tamagui 부품이 크기를 안 받았을 때 쓰는 기본값이라 $4와 같게 둔다.
    body: {
      ...bodyFont,
      size: { ...bodyFont.size, 1: 13, 2: 15, 4: 17, 6: 20, 8: 26, true: 17 },
      lineHeight: {
        ...bodyFont.lineHeight,
        1: 20,
        2: 23,
        4: 26,
        6: 29,
        8: 35,
        true: 26,
      },
    },
  },
  settings: {
    ...defaultConfig.settings,
    fastSchemeChange: false,
  },
  themes: {
    ...defaultConfig.themes,
    light: { ...defaultConfig.themes.light, ...rootTheme(lightColors) },
    dark: { ...defaultConfig.themes.dark, ...rootTheme(darkColors) },
  },
});

export default tamaguiConfig;

type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
