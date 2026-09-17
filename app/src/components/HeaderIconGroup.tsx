import type { ReactNode } from "react";
import { XStack } from "tamagui";

import { HEADER_ICON_GAP } from "@/lib/design";

export function HeaderIconGroup({ children }: { children: ReactNode }) {
  return (
    <XStack items="center" gap={HEADER_ICON_GAP}>
      {children}
    </XStack>
  );
}
