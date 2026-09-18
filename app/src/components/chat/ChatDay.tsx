import { XStack } from "tamagui";

import { Text } from "@/components/ui/Text";
import { formatFullDate } from "@/lib/date";
import { PILL_RADIUS } from "@/lib/design";

const PADDING_Y = 16;
const PILL_PADDING_X = 12;
const PILL_PADDING_Y = 4;

export function ChatDay({ date }: { date: Date }) {
  return (
    <XStack justify="center" py={PADDING_Y}>
      <XStack
        rounded={PILL_RADIUS}
        bg="$greyOpacity100"
        px={PILL_PADDING_X}
        py={PILL_PADDING_Y}
      >
        <Text preset="note" color="$grey600">
          {formatFullDate(date)}
        </Text>
      </XStack>
    </XStack>
  );
}
