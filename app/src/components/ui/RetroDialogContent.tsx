import type { ReactNode } from "react";
import { Dialog, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { OVERLAY_BG } from "@/lib/design";

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
          <RetroShadow color="$gray12" />
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
