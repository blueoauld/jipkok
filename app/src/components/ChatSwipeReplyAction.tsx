import { ArrowBendUpLeftIcon } from "phosphor-react-native/src/icons/ArrowBendUpLeft";
import { useTheme, XStack, YStack } from "tamagui";

const SIZE = 32;
const ICON_SIZE = 18;

// 행 아래 간격 2 + (버블 36 - 아이콘 32) / 2 = 버블 세로 중앙.
const BOTTOM_OFFSET = 4;

export function ChatSwipeReplyAction() {
  const theme = useTheme();

  return (
    <YStack self="stretch" justify="flex-end" pb={BOTTOM_OFFSET} px="$3">
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
  );
}
