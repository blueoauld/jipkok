import { GlassView } from "expo-glass-effect";
import type { ReactNode } from "react";
import { XStack } from "tamagui";

import { HEADER_GLASS_GAP, HEADER_GLASS_SIZE } from "@/lib/design";
import {
  GLASS_ENABLED,
  GlassGroupContext,
  useGlassColorScheme,
} from "@/lib/glass";

export function HeaderIconGroup({ children }: { children: ReactNode }) {
  const scheme = useGlassColorScheme();

  if (!GLASS_ENABLED) {
    return <XStack items="center">{children}</XStack>;
  }

  return (
    <GlassView
      style={{
        height: HEADER_GLASS_SIZE,
        borderRadius: HEADER_GLASS_SIZE / 2,
        flexDirection: "row",
        alignItems: "center",
        gap: HEADER_GLASS_GAP,
      }}
      colorScheme={scheme}
      isInteractive
    >
      <GlassGroupContext.Provider value={true}>
        {children}
      </GlassGroupContext.Provider>
    </GlassView>
  );
}
