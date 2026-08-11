import { ArrowBendUpLeftIcon } from "phosphor-react-native/src/icons/ArrowBendUpLeft";
import { useTheme, XStack, YStack } from "tamagui";

import { RETRO_SHADOW_OFFSET_SM } from "@/lib/design";

const SIZE = 32;
const ICON_SIZE = 18;

export function ChatSwipeReplyAction() {
  const theme = useTheme();

  return (
    <YStack justify="center" px="$3">
      <YStack>
        <YStack
          position="absolute"
          t={RETRO_SHADOW_OFFSET_SM}
          b={-RETRO_SHADOW_OFFSET_SM}
          l={RETRO_SHADOW_OFFSET_SM}
          r={-RETRO_SHADOW_OFFSET_SM}
          bg="$gray12"
        />
        <XStack
          width={SIZE}
          height={SIZE}
          borderWidth={2}
          borderColor="$gray12"
          bg="$color1"
          items="center"
          justify="center"
        >
          <ArrowBendUpLeftIcon size={ICON_SIZE} color={theme.color12.val} />
        </XStack>
      </YStack>
    </YStack>
  );
}
