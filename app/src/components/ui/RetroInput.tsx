import { Input, type InputProps, YStack } from "tamagui";

import { RETRO_SHADOW_OFFSET } from "@/lib/design";

export function RetroInput({ theme = "gray", ...inputProps }: InputProps) {
  return (
    <YStack theme={theme}>
      <YStack
        position="absolute"
        t={RETRO_SHADOW_OFFSET}
        b={-RETRO_SHADOW_OFFSET}
        l={RETRO_SHADOW_OFFSET}
        r={-RETRO_SHADOW_OFFSET}
        bg="$gray8"
      />
      <Input
        size="$4"
        bg="$color1"
        borderWidth={2}
        borderColor="$color12"
        rounded={0}
        focusStyle={{ borderColor: "$color12" }}
        color="$color12"
        px="$3"
        {...inputProps}
      />
    </YStack>
  );
}
