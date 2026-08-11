import { Button, type ButtonProps, YStack } from "tamagui";

const SHADOW_OFFSET = 4;

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
        t={SHADOW_OFFSET}
        b={-SHADOW_OFFSET}
        l={SHADOW_OFFSET}
        r={-SHADOW_OFFSET}
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
          x: SHADOW_OFFSET,
          y: SHADOW_OFFSET,
          bg: "$color11",
          borderColor: "$color12",
        }}
        {...buttonProps}
      />
    </YStack>
  );
}
