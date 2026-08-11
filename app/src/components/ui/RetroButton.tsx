import { Button, type ButtonProps, YStack } from "tamagui";

import { RETRO_SHADOW_OFFSET } from "@/lib/design";

export function RetroButton({
  theme = "blue",
  opacity,
  flex,
  ...buttonProps
}: ButtonProps) {
  return (
    <YStack theme={theme} opacity={opacity} flex={flex}>
      <YStack
        position="absolute"
        t={RETRO_SHADOW_OFFSET}
        b={-RETRO_SHADOW_OFFSET}
        l={RETRO_SHADOW_OFFSET}
        r={-RETRO_SHADOW_OFFSET}
        bg="$gray12"
      />
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
