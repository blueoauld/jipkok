import type { DayProps } from "react-native-gifted-chat";
import { Text, XStack } from "tamagui";

function formatDayLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function ChatDay({ createdAt }: DayProps) {
  return (
    <XStack justify="center" py="$3">
      <XStack
        borderWidth={2}
        borderColor="$color12"
        bg="$color1"
        px="$3"
        py="$1"
      >
        <Text fontSize="$2" fontWeight="600" color="$color12">
          {formatDayLabel(new Date(createdAt))}
        </Text>
      </XStack>
    </XStack>
  );
}
