import { Input, type InputProps, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { RETRO_BORDER_WIDTH } from "@/lib/design";

const SINGLE_LINE_FIX = {
  py: 0,
  textAlignVertical: "center",
  includeFontPadding: false,
} as const;

export function RetroInput({
  theme = "gray",
  multiline,
  ...inputProps
}: InputProps) {
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
        placeholderTextColor="$color11"
        px="$3"
        multiline={multiline}
        {...(multiline ? undefined : SINGLE_LINE_FIX)}
        {...inputProps}
      />
    </YStack>
  );
}
