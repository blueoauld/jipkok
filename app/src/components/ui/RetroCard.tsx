import { YStack, type YStackProps } from "tamagui";

const SHADOW_OFFSET = 4;

export function RetroCard({
  theme = "gray",
  children,
  ...props
}: YStackProps) {
  return (
    <YStack theme={theme}>
      <YStack
        position="absolute"
        t={SHADOW_OFFSET}
        b={-SHADOW_OFFSET}
        l={SHADOW_OFFSET}
        r={-SHADOW_OFFSET}
        bg="$color12"
      />
      <YStack
        borderWidth={2}
        borderColor="$color12"
        bg="$color1"
        p="$3"
        pressStyle={{ x: SHADOW_OFFSET, y: SHADOW_OFFSET }}
        {...props}
      >
        {children}
      </YStack>
    </YStack>
  );
}
