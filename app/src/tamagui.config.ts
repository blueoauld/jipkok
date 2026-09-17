import { defaultConfig } from "@tamagui/config/v5";
import { animations } from "@tamagui/config/v5-reanimated";
import { createTamagui } from "tamagui";

// 테마 색 채움 위의 흰 글씨다.
const ON_FILL = "white";

// 토스 디자인 시스템(TDS)의 [라이트, 다크] 색이다. TDS 문서 사이트의 CSS 변수에서 옮겼다.
const TDS_COLORS = {
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
  dimmedBackground: ["rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.56)"],
  // 세그먼트 컨트롤의 선택 알약이다. 이름 붙은 CSS 변수가 없어 컴포넌트에서 잰 값이다.
  segmentedIndicator: ["#FFFFFF", "#4D4D59"],
} as const;

type TdsColors = Record<keyof typeof TDS_COLORS, string>;

type Level = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

type Twelve<T> = readonly [T, T, T, T, T, T, T, T, T, T, T, T];

type Slot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Tamagui 팔레트 12칸에 넣을 TDS 단계다. 앱은 1을 면, 3을 눌린 면, 8을 비활성, 10을 채움,
// 11을 채움 눌림이나 보조 글자, 12를 기본 글자로 쓴다.
const LEVELS: Twelve<Level> = [
  50, 50, 100, 100, 200, 200, 300, 400, 500, 500, 600, 900,
];

// 노랑은 앱에서 9를 채움, 10을 눌림으로 쓴다.
const YELLOW_LEVELS: Twelve<Level> = [
  50, 50, 100, 100, 200, 200, 300, 400, 500, 600, 700, 900,
];

function tdsColors(scheme: "light" | "dark") {
  const index = scheme === "light" ? 0 : 1;

  return Object.fromEntries(
    Object.entries(TDS_COLORS).map(([name, values]) => [name, values[index]]),
  ) as TdsColors;
}

function palette<P extends string>(
  prefix: P,
  hue: "grey" | "blue" | "red" | "green" | "yellow",
  colors: TdsColors,
  levels = LEVELS,
) {
  return Object.fromEntries(
    levels.map((level, index) => [
      `${prefix}${index + 1}`,
      colors[`${hue}${level}` as const],
    ]),
  ) as Record<`${P}${Slot}`, string>;
}

// 서브테마와 컴포넌트 테마는 만들어질 때 부모 테마의 키를 물려받으므로 루트 두 테마에만 넣는다.
function rootTheme(colors: TdsColors) {
  return {
    ...colors,
    ...palette("color", "grey", colors),
    ...palette("gray", "grey", colors),
    ...palette("blue", "blue", colors),
    ...palette("red", "red", colors),
    ...palette("green", "green", colors),
    ...palette("yellow", "yellow", colors, YELLOW_LEVELS),
    color: colors.grey900,
    color1: colors.layeredBackground,
    gray1: colors.layeredBackground,
    borderColor: colors.hairlineBorder,
    onFill: ON_FILL,
  };
}

function greyTheme(colors: TdsColors) {
  return {
    ...palette("color", "grey", colors),
    color: colors.grey900,
    color1: colors.layeredBackground,
    background: colors.background,
    borderColor: colors.hairlineBorder,
  };
}

// 색 서브테마 안의 글자도 기본 글자색을 쓴다.
function hueTheme(hue: "blue" | "red", colors: TdsColors) {
  return {
    ...palette("color", hue, colors),
    color: colors.grey900,
    color12: colors.grey900,
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
    // true는 크기를 안 준 글자의 기본값이라 $4와 같게 둔다.
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
    light_gray: {
      ...defaultConfig.themes.light_gray,
      ...greyTheme(lightColors),
    },
    dark_gray: { ...defaultConfig.themes.dark_gray, ...greyTheme(darkColors) },
    light_blue: {
      ...defaultConfig.themes.light_blue,
      ...hueTheme("blue", lightColors),
    },
    dark_blue: {
      ...defaultConfig.themes.dark_blue,
      ...hueTheme("blue", darkColors),
    },
    light_red: {
      ...defaultConfig.themes.light_red,
      ...hueTheme("red", lightColors),
    },
    dark_red: {
      ...defaultConfig.themes.dark_red,
      ...hueTheme("red", darkColors),
    },
  },
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
