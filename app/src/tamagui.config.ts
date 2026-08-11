import { defaultConfig } from "@tamagui/config/v5";
import { animations } from "@tamagui/config/v5-reanimated";
import { createTamagui } from "tamagui";

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations,
  settings: {
    ...defaultConfig.settings,
    // 앱 테마를 시스템 스킴과 무관하게 강제하므로 DynamicColorIOS 최적화를 꺼야 한다
    fastSchemeChange: false,
  },
  themes: {
    ...defaultConfig.themes,
    light: { ...defaultConfig.themes.light, background: "#EAF1FA" },
    dark: { ...defaultConfig.themes.dark, background: "#0C1424" },
  },
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
