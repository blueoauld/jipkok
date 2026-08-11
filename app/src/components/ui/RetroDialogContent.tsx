import type { ReactNode } from "react";
import { Dialog, YStack } from "tamagui";

import { OVERLAY_BG } from "@/lib/design";

const SHADOW_OFFSET = 4;

export function RetroDialogContent({
  y,
  children,
}: {
  y?: number;
  children: ReactNode;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay bg={OVERLAY_BG} />

      <Dialog.Content
        width="85%"
        maxW={400}
        p={0}
        bg="transparent"
        rounded={0}
        borderWidth={0}
        elevation={0}
        shadowOpacity={0}
        y={y}
      >
        <YStack>
          <YStack
            position="absolute"
            t={SHADOW_OFFSET}
            b={-SHADOW_OFFSET}
            l={SHADOW_OFFSET}
            r={-SHADOW_OFFSET}
            bg="$gray12"
          />
          <YStack
            borderWidth={2}
            borderColor="$color12"
            bg="$color1"
            p="$4"
            gap="$4"
          >
            {children}
          </YStack>
        </YStack>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
