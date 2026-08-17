import { Text, XStack } from "tamagui";

import { formatFullDate } from "@/lib/date";
import { RETRO_BORDER_WIDTH } from "@/lib/design";

export function ChatDay({ date }: { date: Date }) {
  return (
    <XStack justify="center" py="$3">
      <XStack
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        bg="$color1"
        px="$3"
        py="$1"
      >
        <Text fontSize="$2" fontWeight="600" color="$color12">
          {formatFullDate(date)}
        </Text>
      </XStack>
    </XStack>
  );
}
