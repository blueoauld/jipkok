import { YStack, type YStackProps } from "tamagui";

import { RETRO_SHADOW_OFFSET } from "@/lib/design";

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
        t={RETRO_SHADOW_OFFSET}
        b={-RETRO_SHADOW_OFFSET}
        l={RETRO_SHADOW_OFFSET}
        r={-RETRO_SHADOW_OFFSET}
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
            ? { x: RETRO_SHADOW_OFFSET, y: RETRO_SHADOW_OFFSET, bg: "$color3" }
            : undefined
        }
        {...props}
      >
        {children}
      </YStack>
    </YStack>
  );
}
