import { Text, XStack } from "tamagui";

import { RETRO_BORDER_WIDTH } from "@/lib/design";

function formatDayLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function ChatDay({ date }: { date: Date }) {
  return (
    <XStack justify="center" py="$3">
      <XStack
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$color12"
        bg="$color1"
        px="$3"
        py="$1"
      >
        <Text fontSize="$2" fontWeight="600" color="$color12">
          {formatDayLabel(date)}
        </Text>
      </XStack>
    </XStack>
  );
}
