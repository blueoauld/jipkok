import { Input, type InputProps, YStack } from "tamagui";

const SHADOW_OFFSET = 4;

export function RetroInput({ theme = "gray", ...inputProps }: InputProps) {
  return (
    <YStack theme={theme}>
      <YStack
        position="absolute"
        t={SHADOW_OFFSET}
        b={-SHADOW_OFFSET}
        l={SHADOW_OFFSET}
        r={-SHADOW_OFFSET}
        bg="$color8"
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
