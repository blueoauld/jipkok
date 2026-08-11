import { defaultConfig } from "@tamagui/config/v5";
import { animations } from "@tamagui/config/v5-reanimated";
import { createTamagui } from "tamagui";

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations,
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
