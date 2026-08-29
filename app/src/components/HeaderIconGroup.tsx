import type { ReactNode } from "react";
import { XStack } from "tamagui";

import { Glass } from "@/components/ui/Glass";
import { HEADER_GLASS_GAP, HEADER_GLASS_SIZE } from "@/lib/design";
import { GLASS_ENABLED, GlassGroupContext } from "@/lib/glass";

export function HeaderIconGroup({ children }: { children: ReactNode }) {
  if (!GLASS_ENABLED) {
    return <XStack items="center">{children}</XStack>;
  }

  return (
    <Glass
      style={{
        height: HEADER_GLASS_SIZE,
        borderRadius: HEADER_GLASS_SIZE / 2,
        flexDirection: "row",
        alignItems: "center",
        gap: HEADER_GLASS_GAP,
      }}
      isInteractive
    >
      <GlassGroupContext.Provider value={true}>
        {children}
      </GlassGroupContext.Provider>
    </Glass>
  );
}
