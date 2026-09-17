import { defaultConfig } from "@tamagui/config/v5";
import { animations } from "@tamagui/config/v5-reanimated";
import { createTamagui } from "tamagui";

// 테마 색 채움 위의 흰 글씨다. useTheme()는 현재 서브테마의 키만 보므로 모든 테마에 넣는다.
const ON_FILL = "white";

const withOnFill = <T extends Record<string, object>>(themes: T) =>
  Object.fromEntries(
    Object.entries(themes).map(([name, theme]) => [
      name,
      { ...theme, onFill: ON_FILL },
    ]),
  ) as { [K in keyof T]: T[K] & { onFill: string } };

const baseThemes = withOnFill(defaultConfig.themes);

const DARK_INK = "hsla(0, 0%, 84%, 1)";
const DARK_INK_THEME = { color: DARK_INK, color12: DARK_INK };
// 스플래시의 다크 배경(app.json)과 같은 값이다. 표면은 배경보다 밝아야 떠 보인다.
const DARK_BACKGROUND = "#141414";
const DARK_SURFACE = "hsla(0, 0%, 12%, 1)";
const DARK_SURFACE_PRESS = "hsla(0, 0%, 16%, 1)";
const DARK_ACCENT = "hsla(212, 78%, 52%, 1)";
const DARK_ACCENT_PRESS = "hsla(212, 74%, 62%, 1)";
const DARK_HIGHLIGHT = "hsla(50, 82%, 52%, 1)";
const DARK_HIGHLIGHT_PRESS = "hsla(52, 80%, 62%, 1)";

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations,
  settings: {
    ...defaultConfig.settings,
    fastSchemeChange: false,
  },
  themes: {
    ...baseThemes,
    light: { ...baseThemes.light, background: "#FFFFFF" },
    dark: {
      ...baseThemes.dark,
      background: DARK_BACKGROUND,
      ...DARK_INK_THEME,
      gray12: DARK_INK,
      color1: DARK_SURFACE,
      color3: DARK_SURFACE_PRESS,
      blue10: DARK_ACCENT,
      yellow9: DARK_HIGHLIGHT,
      yellow10: DARK_HIGHLIGHT_PRESS,
    },
    dark_gray: {
      ...baseThemes.dark_gray,
      ...DARK_INK_THEME,
      color1: DARK_SURFACE,
      color3: DARK_SURFACE_PRESS,
    },
    dark_blue: {
      ...baseThemes.dark_blue,
      ...DARK_INK_THEME,
      color10: DARK_ACCENT,
      color11: DARK_ACCENT_PRESS,
    },
    dark_red: { ...baseThemes.dark_red, ...DARK_INK_THEME },
  },
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
