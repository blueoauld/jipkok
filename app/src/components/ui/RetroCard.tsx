import { YStack, type YStackProps } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { RETRO_BORDER_WIDTH, RETRO_SHADOW_OFFSET } from "@/lib/design";

export function RetroCard({
  theme = "gray",
  shadow = "$gray8",
  pressBg = "$color3",
  flex,
  onPress,
  children,
  ...props
}: YStackProps & {
  shadow?: YStackProps["bg"];
  pressBg?: YStackProps["bg"];
}) {
  return (
    <YStack theme={theme} flex={flex}>
      <RetroShadow color={shadow} />
      <YStack
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$color12"
        bg="$color1"
        p="$3"
        onPress={onPress}
        pressStyle={
          onPress
            ? { x: RETRO_SHADOW_OFFSET, y: RETRO_SHADOW_OFFSET, bg: pressBg }
            : undefined
        }
        {...props}
      >
        {children}
      </YStack>
    </YStack>
  );
}
