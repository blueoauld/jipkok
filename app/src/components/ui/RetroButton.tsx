import { Button, type ButtonProps, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { RETRO_SHADOW_OFFSET } from "@/lib/design";

export function RetroButton({
  theme = "blue",
  opacity,
  flex,
  ...buttonProps
}: ButtonProps) {
  return (
    <YStack theme={theme} opacity={opacity} flex={flex}>
      <RetroShadow color="$gray12" />
      <Button
        size="$4"
        bg="$color10"
        borderWidth={2}
        borderColor="$color12"
        rounded={0}
        color="white"
        fontWeight="700"
        pressStyle={{
          x: RETRO_SHADOW_OFFSET,
          y: RETRO_SHADOW_OFFSET,
          bg: "$color11",
          borderColor: "$color12",
        }}
        {...buttonProps}
      />
    </YStack>
  );
}
