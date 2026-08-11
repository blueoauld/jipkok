import type { ReactNode } from "react";
import { XStack, YStack } from "tamagui";

import { FLOATING_BUTTON_SIZE, RETRO_SHADOW_OFFSET } from "@/lib/design";

export function RetroFloatingButton({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress: () => void;
}) {
  return (
    <YStack theme="blue">
      <YStack
        position="absolute"
        t={RETRO_SHADOW_OFFSET}
        b={-RETRO_SHADOW_OFFSET}
        l={RETRO_SHADOW_OFFSET}
        r={-RETRO_SHADOW_OFFSET}
        bg="$gray12"
      />
      <XStack
        width={FLOATING_BUTTON_SIZE}
        height={FLOATING_BUTTON_SIZE}
        borderWidth={2}
        borderColor="$gray12"
        bg="$color10"
        items="center"
        justify="center"
        pressStyle={{
          x: RETRO_SHADOW_OFFSET,
          y: RETRO_SHADOW_OFFSET,
          bg: "$color11",
        }}
        onPress={onPress}
      >
        {children}
      </XStack>
    </YStack>
  );
}
