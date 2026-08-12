import type { ReactNode } from "react";
import { XStack, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
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
      <RetroShadow color="$gray12" />
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
