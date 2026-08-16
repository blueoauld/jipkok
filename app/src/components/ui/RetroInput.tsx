import { Input, type InputProps, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { RETRO_BORDER_WIDTH } from "@/lib/design";

export function RetroInput({ theme = "gray", ...inputProps }: InputProps) {
  return (
    <YStack theme={theme}>
      <RetroShadow color="$gray8" />
      <Input
        size="$4"
        bg="$color1"
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        rounded={0}
        focusStyle={{ borderColor: "$gray12" }}
        color="$color12"
        px="$3"
        {...inputProps}
      />
    </YStack>
  );
}
