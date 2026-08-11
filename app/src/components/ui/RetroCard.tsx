import { YStack, type YStackProps } from "tamagui";

export const RETRO_SHADOW_OFFSET = 4;

const SHADOW_OFFSET = RETRO_SHADOW_OFFSET;

export function RetroCard({
  theme = "gray",
  shadow = "$gray8",
  flex,
  onPress,
  children,
  ...props
}: YStackProps & { shadow?: YStackProps["bg"] }) {
  return (
    <YStack theme={theme} flex={flex}>
      <YStack
        position="absolute"
        t={SHADOW_OFFSET}
        b={-SHADOW_OFFSET}
        l={SHADOW_OFFSET}
        r={-SHADOW_OFFSET}
        bg={shadow}
      />
      <YStack
        borderWidth={2}
        borderColor="$color12"
        bg="$color1"
        p="$3"
        onPress={onPress}
        pressStyle={
          onPress
            ? { x: SHADOW_OFFSET, y: SHADOW_OFFSET, bg: "$color3" }
            : undefined
        }
        {...props}
      >
        {children}
      </YStack>
    </YStack>
  );
}
