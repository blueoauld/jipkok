import { defaultConfig } from "@tamagui/config/v5";
import { animations } from "@tamagui/config/v5-reanimated";
import { createTamagui } from "tamagui";

const DARK_INK = "hsla(0, 0%, 84%, 1)";
const DARK_INK_THEME = { color: DARK_INK, color12: DARK_INK };
const DARK_SURFACE = "hsla(218, 22%, 15%, 1)";
const DARK_SURFACE_PRESS = "hsla(218, 20%, 21%, 1)";
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
    ...defaultConfig.themes,
    light: { ...defaultConfig.themes.light, background: "#EAF1FA" },
    dark: {
      ...defaultConfig.themes.dark,
      background: "#0C1424",
      ...DARK_INK_THEME,
      gray12: DARK_INK,
      color1: DARK_SURFACE,
      color3: DARK_SURFACE_PRESS,
      blue10: DARK_ACCENT,
      yellow9: DARK_HIGHLIGHT,
      yellow10: DARK_HIGHLIGHT_PRESS,
    },
    dark_gray: {
      ...defaultConfig.themes.dark_gray,
      ...DARK_INK_THEME,
      color1: DARK_SURFACE,
      color3: DARK_SURFACE_PRESS,
    },
    dark_blue: {
      ...defaultConfig.themes.dark_blue,
      ...DARK_INK_THEME,
      color10: DARK_ACCENT,
      color11: DARK_ACCENT_PRESS,
    },
    dark_red: { ...defaultConfig.themes.dark_red, ...DARK_INK_THEME },
  },
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
