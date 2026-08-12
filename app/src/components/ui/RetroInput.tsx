import { Input, type InputProps, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";

export function RetroInput({ theme = "gray", ...inputProps }: InputProps) {
  return (
    <YStack theme={theme}>
      <RetroShadow color="$gray8" />
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
